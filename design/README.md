# Design reference — Slipstream.html

`Slipstream.html` (the design-comp export) is the source of truth for the
black/gold visual language now implemented in `src/`.

The comp shipped as a self-contained bundle with ~1.5 MB of base64-embedded
webfonts (Archivo, Archivo Black, Space Mono). Those fonts are already loaded
in the app via `index.html`, so only the parts that matter for implementation
are recorded here:

## Palette

| Token        | Value                      | Used for                          |
| ------------ | -------------------------- | --------------------------------- |
| bg           | `#050505`                  | page background                   |
| surface      | `#101010`                  | cards, rows                       |
| surfaceAlt   | `#111111`                  | icon buttons, chips               |
| elevated     | `#171717`                  | avatars, inner tiles              |
| text         | `#F7F7F5`                  | primary text                      |
| muted        | `#B5B5B1`                  | secondary text                    |
| dim          | `#747474`                  | labels, captions                  |
| gold         | `#D4AF37`                  | accent, active nav                |
| goldLight    | `#F2D675`                  | gradient top stop                 |
| goldSoft     | `#E8CA72`                  | links, initials                   |
| green        | `#42C989`                  | gains, BUY                        |
| red          | `#F0646E`                  | losses, SELL, sign-out            |
| hairline     | `rgba(255,255,255,0.08)`   | card borders                      |
| goldEdge     | `rgba(212,175,55,0.28–.45)`| emphasized card borders           |

## Screens

Five tabs, in nav order: **Home · Politicians · Copy · Portfolio · Profile**.

- **Home** — portfolio hero card (value, day change, sparkline, period chips,
  buying power / cash), quick actions, active copy strategies, latest
  disclosures.
- **Politicians** — search, filter chips (All / Senate / House / Followed /
  Copying), politician cards with est. portfolio, est. return, sparkline and a
  Follow toggle.
- **Copy** — master automation toggle, allocated / deployed / return tiles,
  an "awaiting confirmation" order card, and the list of copy strategies.
- **Portfolio** — total value hero and the holdings list.
- **Profile** — user card, Alpaca connection status, settings rows, sign out.

## Type

- Headings: Archivo 800, `-0.5px` tracking.
- Labels: Archivo 600, `10.5–11px`, `0.8–1.5px` letter-spacing, uppercase.
- Numerals: tabular (`font-variant-numeric: tabular-nums` on the root).

## Deviations in the implementation

The comp's numbers were placeholders. Everything is now bound to real data:

| Comp placeholder                  | Real source                                    |
| --------------------------------- | ---------------------------------------------- |
| `$24,613.48` portfolio            | `alpaca.getAccount().portfolio_value`          |
| Holdings list                     | `alpaca.getPositions()`                        |
| `politicians` array               | `api.buildPoliticians(trades, priceMap)`       |
| `disclosures` array               | `api.buildFeed(...)`                           |
| `strategies` array                | followed politicians + `orderState`            |
| Follow buttons                    | `localStorage` `slipstream.followed`           |
| `environment` prop (paper/live)   | Alpaca is paper-only; badge is hardcoded PAPER |
