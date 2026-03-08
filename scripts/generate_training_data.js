const fs = require('fs/promises');
const path = require('path');

const MARKET_DIR = path.join(process.cwd(), 'data', 'market');
const TRAINING_DIR = path.join(process.cwd(), 'data', 'training');
const PAIRS = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT'];
const TIMEFRAMES = ['1m', '5m', '15m'];

const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1) + min);
const avg = (arr) => arr.reduce((a, b) => a + b, 0) / Math.max(arr.length, 1);

function classify(before, after) {
  const highs = before.slice(-20).map((c) => c.high);
  const lows = before.slice(-20).map((c) => c.low);
  const resistance = Math.max(...highs);
  const support = Math.min(...lows);
  const range = resistance - support;
  const firstAfter = after.slice(0, 6);
  const maxAfter = Math.max(...firstAfter.map((c) => c.high));

  let pattern = 'no_trade';
  let tags = ['consolidation'];
  if (maxAfter > resistance + range * 0.15 && firstAfter[0].close > resistance) {
    const returnsInside = firstAfter.slice(1, 4).some((c) => c.close < resistance);
    pattern = returnsInside ? 'fake_breakout' : 'strong_breakout';
    tags = returnsInside ? ['false_breakout', 'liquidity_grab'] : ['range_breakout', 'resistance_break'];
  }

  if (pattern === 'no_trade') {
    const trend = before[before.length - 1].close - before[0].close;
    const afterClose = after[Math.min(5, after.length - 1)].close;
    if (Math.abs(afterClose - before[before.length - 1].close) > range * 0.2 && Math.abs(trend) > range * 0.15) {
      pattern = 'reversal';
      tags = ['trend_exhaustion'];
    }
  }

  const vol = before.slice(-20).map((c) => Math.abs(c.close - c.open));
  const metadata = { trend: before.at(-1).close > before[0].close ? 'bullish' : 'bearish', volatility: avg(vol.slice(0, 10)) > avg(vol.slice(10)) ? 'contracting' : 'expanding' };
  return { pattern, tags, metadata };
}

(async () => {
  await fs.mkdir(TRAINING_DIR, { recursive: true });
  const scenarios = [];
  for (const pair of PAIRS) {
    for (const timeframe of TIMEFRAMES) {
      const p = path.join(MARKET_DIR, `${pair.slice(0, 3).toLowerCase()}_${timeframe}.json`);
      const candles = JSON.parse(await fs.readFile(p, 'utf-8'));
      for (let i = 0; i < 120; i++) {
        const pivot = randomInt(85, candles.length - 45);
        const before = candles.slice(pivot - 80, pivot);
        const after = candles.slice(pivot, pivot + 40);
        const info = classify(before, after);
        scenarios.push({ id: `${pair}-${timeframe}-${pivot}-${i}`, pair, timeframe, before, after, ...info });
      }
    }
  }

  await fs.writeFile(path.join(TRAINING_DIR, 'scenarios.json'), JSON.stringify(scenarios, null, 2), 'utf-8');
  console.log(`Generated ${scenarios.length} scenarios`);
})();
