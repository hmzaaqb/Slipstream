// Push notifications client.
//
// Android-only (Capacitor). No-ops entirely on web — `register()` resolves to
// null there, so calling code never has to branch on platform. Requires:
//   - android/app/google-services.json (Firebase project config, committed)
//   - Supabase connected (device_tokens table) so the server-side ingest job
//     knows which tokens to notify for which followed politicians.
//
// Registration is intentionally re-run whenever the followed list changes,
// not just once at login — see App.jsx. The row it upserts always carries the
// CURRENT follow list, so the ingest job's fan-out query stays correct without
// needing its own follows table until Supabase auth lands.

import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { supabase, hasSupabase } from './supabase';

const isNative = () => Capacitor.getPlatform() === 'android';

let _token = null;

/**
 * Request permission, obtain the FCM token, and sync it (with the current
 * followed-politician list) to Supabase. Safe to call repeatedly — Capacitor
 * dedupes the OS-level registration, and this dedupes the network call.
 */
export async function syncPushToken(followedNames) {
  if (!isNative()) return null;

  try {
    let perm = await PushNotifications.checkPermissions();
    if (perm.receive === 'prompt') perm = await PushNotifications.requestPermissions();
    if (perm.receive !== 'granted') return null;

    if (!_token) {
      _token = await new Promise((resolve, reject) => {
        const done = PushNotifications.addListener('registration', (t) => {
          done.remove();
          resolve(t.value);
        });
        const failed = PushNotifications.addListener('registrationError', (e) => {
          failed.remove();
          reject(new Error(e.error || 'push registration failed'));
        });
        PushNotifications.register();
      });
    }

    if (hasSupabase && _token) {
      await supabase.from('device_tokens').upsert(
        {
          token: _token,
          platform: 'android',
          followed: followedNames || [],
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'token' },
      );
    }
    return _token;
  } catch {
    // Registration can legitimately fail (permission denied, no Play
    // services, emulator without Google APIs) — never block the app on it.
    return null;
  }
}

/** Foreground notification tap -> caller decides where to navigate. */
export function onNotificationTap(handler) {
  if (!isNative()) return () => {};
  const sub = PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
    handler(action.notification?.data || {});
  });
  return () => sub.remove();
}
