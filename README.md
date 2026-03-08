# Trading Strategy Trainer

Local breakout/reversal trainer built with Next.js 14, Express, SQLite, Tailwind, and lightweight-charts.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000.

On first run the app automatically:
- Downloads Binance OHLC data for BTCUSDT/ETHUSDT/SOLUSDT (1m/5m/15m) into `data/market`.
- Generates training scenarios into `data/training/scenarios.json`.

If Binance is unreachable, synthetic candles are generated so the trainer still works offline.

## Scripts

- `npm run download:data`
- `npm run generate:dataset`

## Super-easy release options

### Option A (recommended): Docker release (cross-platform, simplest)

Build image:

```bash
npm run release:docker:build
```

Run container:

```bash
npm run release:docker:run
```

Or with compose:

```bash
docker compose up --build
```

Open http://localhost:3000.

### Option B: Windows `.exe` installer (desktop wrapper)

If you want a real installer-style `.exe`, the easiest production route is to wrap this web app in Electron (or Tauri) and ship with `electron-builder`/NSIS.

Suggested approach:
1. Keep this repo as the core web app.
2. Add a small Electron shell that starts the local server and opens a desktop window.
3. Build installer via `electron-builder --win nsis`.

I can implement this in the next pass if you want a true clickable Windows installer output.
