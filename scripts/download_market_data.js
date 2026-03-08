const fs = require('fs/promises');
const path = require('path');

const DATA_DIR = path.join(process.cwd(), 'data', 'market');
const PAIRS = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT'];
const TIMEFRAMES = ['1m', '5m', '15m'];

function syntheticCandles(count = 1200) {
  let price = 20000;
  return Array.from({ length: count }).map((_, i) => {
    const drift = Math.sin(i / 90) * 20 + (Math.random() - 0.5) * 50;
    const open = price;
    const close = Math.max(100, open + drift);
    const high = Math.max(open, close) + Math.random() * 25;
    const low = Math.min(open, close) - Math.random() * 25;
    price = close;
    return {
      time: Math.floor(Date.now() / 1000) - (count - i) * 60,
      open,
      high,
      low,
      close,
      volume: 100 + Math.random() * 400
    };
  });
}

async function run() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  for (const pair of PAIRS) {
    for (const interval of TIMEFRAMES) {
      const file = path.join(DATA_DIR, `${pair.slice(0, 3).toLowerCase()}_${interval}.json`);
      try {
        const url = `https://api.binance.com/api/v3/klines?symbol=${pair}&interval=${interval}&limit=1000`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const candles = data.map((r) => ({
          time: Math.floor(Number(r[0]) / 1000),
          open: Number(r[1]),
          high: Number(r[2]),
          low: Number(r[3]),
          close: Number(r[4]),
          volume: Number(r[5])
        }));
        await fs.writeFile(file, JSON.stringify(candles, null, 2), 'utf-8');
      } catch {
        await fs.writeFile(file, JSON.stringify(syntheticCandles(), null, 2), 'utf-8');
      }
    }
  }
  console.log('Market data ready');
}

run();
