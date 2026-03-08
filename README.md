# Trading Strategy Trainer

Local breakout/reversal trainer built with Next.js 14, Express, SQLite, Tailwind, and lightweight-charts.

## Run

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
