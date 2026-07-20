// Push fan-out: notifies devices following a politician who just filed.
//
// Requires two things neither of which exist yet in this repo — both no-ops
// gracefully absent so the ingest job keeps working without them:
//
//   SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY   (device_tokens table)
//   FIREBASE_SERVICE_ACCOUNT_KEY                (a Firebase service-account
//     JSON, base64-encoded into one env var — Project settings > Service
//     accounts > Generate new private key, in the SAME Firebase project as
//     android/app/google-services.json)
//
// Sends via the FCM HTTP v1 API directly (no firebase-admin dependency) —
// mint a short-lived OAuth2 token from the service account, POST one message
// per device token. Invalid/unregistered tokens are pruned from
// device_tokens so the table doesn't grow stale forever.

import { GoogleAuth } from 'google-auth-library';
import { createClient } from '@supabase/supabase-js';

const FCM_SCOPE = 'https://www.googleapis.com/auth/firebase.messaging';

function readServiceAccount() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!raw) return null;
  try {
    // Accept either raw JSON or base64-of-JSON (base64 survives GitHub
    // Secrets round-tripping more reliably than a multi-line JSON blob).
    const text = raw.trim().startsWith('{') ? raw : Buffer.from(raw, 'base64').toString('utf8');
    return JSON.parse(text);
  } catch {
    console.error('[push] FIREBASE_SERVICE_ACCOUNT_KEY is set but not valid JSON/base64-JSON — skipping push.');
    return null;
  }
}

async function fcmAccessToken(serviceAccount) {
  const auth = new GoogleAuth({ credentials: serviceAccount, scopes: [FCM_SCOPE] });
  const client = await auth.getClient();
  const { token } = await client.getAccessToken();
  return token;
}

/**
 * @param {Set<string>} newlyFiledBy politician display names with a
 *   newly-parsed filing THIS run (never re-notify on a cache re-touch).
 */
export async function sendPushForNewFilings(newlyFiledBy) {
  const names = [...newlyFiledBy];
  if (!names.length) {
    console.log('[push] no new filings this run — nothing to notify');
    return;
  }

  const serviceAccount = readServiceAccount();
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceAccount || !supabaseUrl || !serviceKey) {
    console.log(
      '[push] skipped — needs FIREBASE_SERVICE_ACCOUNT_KEY + SUPABASE_URL + ' +
        'SUPABASE_SERVICE_ROLE_KEY repo secrets. New filings this run: ' +
        names.join(', '),
    );
    return;
  }

  const db = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
  const { data: devices, error } = await db.from('device_tokens').select('token, followed');
  if (error) {
    console.error('[push] reading device_tokens failed:', error.message);
    return;
  }

  // token -> politicians on this device that just filed
  const toNotify = new Map();
  for (const d of devices || []) {
    const hit = (d.followed || []).filter((n) => newlyFiledBy.has(n));
    if (hit.length) toNotify.set(d.token, hit);
  }
  if (!toNotify.size) {
    console.log(`[push] ${names.length} politician(s) filed, but no device follows any of them`);
    return;
  }

  const accessToken = await fcmAccessToken(serviceAccount);
  const projectId = serviceAccount.project_id;
  const stale = [];
  let sent = 0;

  for (const [token, politicians] of toNotify) {
    const title = politicians.length === 1 ? `${politicians[0]} just filed` : `${politicians.length} politicians you follow just filed`;
    const body = politicians.length === 1
      ? 'New disclosure — tap to see what they traded.'
      : politicians.slice(0, 3).join(', ') + (politicians.length > 3 ? ', …' : '');

    const res = await fetch(`https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: {
          token,
          notification: { title, body },
          data: { politician: politicians[0] },
        },
      }),
    });

    if (res.ok) {
      sent++;
    } else if (res.status === 404 || res.status === 400) {
      // UNREGISTERED / invalid token — the app was uninstalled or the token
      // rotated. Prune it so device_tokens doesn't grow unbounded with dead
      // rows we'd otherwise keep paying to query forever.
      stale.push(token);
    } else {
      console.error(`[push] send failed (${res.status}) for one device:`, await res.text().catch(() => ''));
    }
  }

  if (stale.length) {
    await db.from('device_tokens').delete().in('token', stale);
  }
  console.log(`[push] sent ${sent}/${toNotify.size} notifications, pruned ${stale.length} stale tokens`);
}
