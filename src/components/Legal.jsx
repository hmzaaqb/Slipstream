// Legal + compliance surface: financial disclaimer, Terms of Service, and
// Privacy Policy, plus a reusable modal to display them and a one-line footer.
//
// ⚠️ IMPORTANT: the text below is a good-faith STARTING TEMPLATE, not legal
// advice. Before public launch, have a qualified attorney review and adapt it —
// especially the financial disclaimer, since Slipstream surfaces trade data and
// an automated "copy trades" feature. Fill in the COMPANY/CONTACT placeholders.

import { useState } from 'react';
import { FONT, COLOR, glass } from '../ui/styles';

const COMPANY = 'Slipstream';
const CONTACT_EMAIL = 'support@slipstream.app'; // TODO: replace with a real inbox
const EFFECTIVE = 'June 2026';

/* ------------------------------------------------------------------ */
/* the short, always-visible disclaimer (used in banners + Copy tab)   */
/* ------------------------------------------------------------------ */

export const DISCLAIMER_SHORT =
  'Slipstream is for information and education only. Nothing here is investment, ' +
  'financial, legal, or tax advice, and nothing is a recommendation to buy or ' +
  'sell any security. Congressional trade data may be delayed or incomplete. ' +
  'Past performance does not predict future results. You trade entirely at your ' +
  'own risk. Consult a licensed financial adviser before investing.';

/* ------------------------------------------------------------------ */
/* long-form documents                                                 */
/* ------------------------------------------------------------------ */

const DISCLAIMER = [
  ['Not investment advice',
    `${COMPANY} is an information and education tool. It aggregates publicly disclosed ` +
    `congressional stock-trade filings and presents derived metrics (ROI, win rate, ` +
    `alpha, etc.). None of this constitutes investment, financial, legal, accounting, ` +
    `or tax advice, an offer or solicitation, or a recommendation to buy, sell, or hold ` +
    `any security or to pursue any strategy.`],
  ['No fiduciary relationship',
    `Using ${COMPANY} does not create an advisory or fiduciary relationship between you ` +
    `and ${COMPANY}. We are not a registered broker-dealer or investment adviser.`],
  ['Data may be wrong or delayed',
    `Trade data is sourced from third parties and from filings that legislators may ` +
    `submit late or incompletely. Prices, ROI, and rankings may be inaccurate, stale, ` +
    `or incomplete. Verify independently before acting.`],
  ['Copy trading risk',
    `The optional "copy" feature can place orders in your connected brokerage account. ` +
    `Mirroring another person's trades can lose money, including more than you expect. ` +
    `Past performance never guarantees future results. You are solely responsible for ` +
    `every order placed from your account.`],
  ['Your responsibility',
    `You make your own decisions and bear all risk. Consult a licensed professional ` +
    `before investing. To the maximum extent permitted by law, ${COMPANY} is not liable ` +
    `for any losses arising from your use of the app.`],
];

const TERMS = [
  ['1. Acceptance',
    `By creating an account or using ${COMPANY} ("the Service") you agree to these Terms. ` +
    `If you do not agree, do not use the Service.`],
  ['2. Eligibility',
    `You must be at least 18 years old and able to form a binding contract. The Service ` +
    `is not directed to anyone for whom its use would be unlawful.`],
  ['3. The Service is informational',
    `The Service provides information and tools only and is not investment advice. See the ` +
    `Disclaimer, which is incorporated into these Terms.`],
  ['4. Brokerage connections',
    `If you connect a third-party brokerage (e.g. Alpaca), you authorize the Service to ` +
    `transmit instructions you initiate. Your brokerage relationship is governed by that ` +
    `provider's own terms. You are responsible for all activity in your account.`],
  ['5. Accounts & security',
    `You are responsible for safeguarding your credentials and for all activity under your ` +
    `account. Notify us promptly of any unauthorized use.`],
  ['6. Acceptable use',
    `Do not misuse the Service: no scraping at scale, reverse engineering, attempts to ` +
    `breach security, or use that violates applicable law or securities regulations.`],
  ['7. No warranty',
    `The Service is provided "as is" and "as available" without warranties of any kind, ` +
    `express or implied, including accuracy, merchantability, or fitness for a purpose.`],
  ['8. Limitation of liability',
    `To the maximum extent permitted by law, ${COMPANY} and its operators are not liable ` +
    `for any indirect, incidental, or consequential damages, or for any trading losses, ` +
    `arising from your use of the Service.`],
  ['9. Changes',
    `We may update these Terms. Material changes will be notified in-app or by email. ` +
    `Continued use after changes means you accept them.`],
  ['10. Contact',
    `Questions about these Terms: ${CONTACT_EMAIL}.`],
];

const PRIVACY = [
  ['What we collect',
    `Account details you provide (name, email), authentication data, app usage, and — if ` +
    `you connect a brokerage — the API credentials you enter and the orders you initiate.`],
  ['How brokerage keys are handled',
    `Your brokerage API keys are used only to carry out actions you initiate. They are ` +
    `transmitted over encrypted connections and are never sold or shared for advertising.`],
  ['How we use data',
    `To operate and secure the Service, provide features you request, communicate with ` +
    `you, and comply with legal obligations. We do not sell your personal information.`],
  ['Third parties',
    `We rely on service providers (e.g. authentication and hosting via Supabase, market ` +
    `price data via public market-data services, brokerage via Alpaca). Congressional ` +
    `disclosure data is collected from official public sources (the House Clerk and ` +
    `Senate eFD systems). Third parties' handling of data is governed by their own ` +
    `privacy policies.`],
  ['Your rights',
    `You may request access to, correction of, or deletion of your personal data, and you ` +
    `can delete your account at any time. Contact ${CONTACT_EMAIL}.`],
  ['Security',
    `We use reasonable technical and organizational measures to protect your data, but no ` +
    `method of transmission or storage is perfectly secure.`],
  ['Contact',
    `Privacy questions: ${CONTACT_EMAIL}.`],
];

const DOCS = {
  disclaimer: { title: 'Disclaimer', sub: 'Not investment advice', body: DISCLAIMER },
  terms: { title: 'Terms of Service', sub: `Effective ${EFFECTIVE}`, body: TERMS },
  privacy: { title: 'Privacy Policy', sub: `Effective ${EFFECTIVE}`, body: PRIVACY },
};

/* ------------------------------------------------------------------ */
/* modal                                                               */
/* ------------------------------------------------------------------ */

// <LegalModal doc="terms" onClose={...} />  — doc: 'disclaimer'|'terms'|'privacy'|null
export function LegalModal({ doc, onClose }) {
  if (!doc || !DOCS[doc]) return null;
  const { title, sub, body } = DOCS[doc];
  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', background: 'rgba(4,4,9,0.6)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ width: 430, maxWidth: '100%', maxHeight: '86vh', overflowY: 'auto', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: '22px 24px 34px', ...glass('strong', { borderTopLeftRadius: 28, borderTopRightRadius: 28, border: '1px solid rgba(255,255,255,0.16)' }) }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
          <div style={{ width: 42, height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.18)' }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <h2 style={{ margin: 0, fontFamily: FONT.black, fontSize: 24, letterSpacing: '-0.6px' }}>{title}</h2>
            <div style={{ fontFamily: FONT.mono, fontSize: 11, letterSpacing: '1.5px', color: 'rgba(247,247,245,0.4)', marginTop: 6 }}>{sub.toUpperCase()}</div>
          </div>
          <button onClick={onClose} aria-label="Close" style={{ flex: 'none', width: 34, height: 34, borderRadius: 12, cursor: 'pointer', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.06)', color: '#F7F7F5', fontSize: 18, lineHeight: 1 }}>×</button>
        </div>

        <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 18 }}>
          {body.map(([h, p]) => (
            <div key={h}>
              <div style={{ fontFamily: FONT.black, fontSize: 14, color: COLOR.goldSoft, letterSpacing: '-0.2px' }}>{h}</div>
              <p style={{ margin: '6px 0 0', fontFamily: FONT.archivo, fontWeight: 500, fontSize: 13.5, lineHeight: 1.6, color: 'rgba(247,247,245,0.72)' }}>{p}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Reusable clickable text link that opens a legal doc.
export function LegalLink({ doc, onOpen, children }) {
  return (
    <span onClick={() => onOpen(doc)} style={{ color: 'rgba(255,143,206,0.85)', cursor: 'pointer', fontWeight: 700 }}>
      {children}
    </span>
  );
}

// A small footer line linking to all three docs. Manages its own modal.
export function LegalFooter({ align = 'center', style }) {
  const [doc, setDoc] = useState(null);
  return (
    <>
      <div style={{ textAlign: align, fontFamily: FONT.mono, fontSize: 10, letterSpacing: '0.5px', color: 'rgba(247,247,245,0.35)', ...style }}>
        <LegalLink doc="disclaimer" onOpen={setDoc}>Disclaimer</LegalLink>
        {'  ·  '}
        <LegalLink doc="terms" onOpen={setDoc}>Terms</LegalLink>
        {'  ·  '}
        <LegalLink doc="privacy" onOpen={setDoc}>Privacy</LegalLink>
      </div>
      <LegalModal doc={doc} onClose={() => setDoc(null)} />
    </>
  );
}
