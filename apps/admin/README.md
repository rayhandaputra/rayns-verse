# @rayeen/tdash

Trading Dashboard — personal trading journal dengan tactical monochrome UI.

## Dev

```bash
npm run dev --workspace=apps/tdash
# atau dari root monorepo
npm run dev:tdash
```

## Struktur

```
app/
├── routes/            → pages (auth, dashboard, journal, history, stats)
├── components/        → UI components (Card, Badge, Button, widgets)
├── constants/         → brand constants
├── lib/               → api, session, trading utils
└── store/             → Zustand trade store (localStorage persist)
```

## Design System

- Color palette **Tactical Monochrome Journal**: bg `#050505`, panel `#121212`, border `#222222`, radius tajam `2px`
- Tanpa gradient, drop shadow, atau glow
- Monospace (`JetBrains Mono`) untuk semua data angka
- Profit `#16A34A`, Loss `#DC2626`

## Fitur

- **Dashboard** — Net PnL (MTD), Win Rate, execution history, Economic Calendar (tradays.com)
- **Jurnal** — log trade (ticker, side, PnL, notes) disimpan di localStorage
- **History** — kalender 30 hari, daily PnL hijau/merah
- **Statistik** — win rate, profit factor, breakdown per ticker
- **Auth** — login/register via api.rayeen.web.id, cookie session

## Deploy

Vercel — `tdash.rayeen.web.id`
