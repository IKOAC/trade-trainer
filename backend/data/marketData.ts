import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';
import { Candle } from '../../lib/types';

const DATA_DIR = path.join(process.cwd(), 'data', 'market');
const PAIRS = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT'];
const TIMEFRAMES = ['1m', '5m', '15m'];

const symbolFile = (symbol: string, interval: string) =>
  path.join(DATA_DIR, `${symbol.slice(0, 3).toLowerCase()}_${interval}.json`);

const isValidCandle = (value: Partial<Candle>): value is Candle =>
  Number.isFinite(value.time) &&
  Number.isFinite(value.open) &&
  Number.isFinite(value.high) &&
  Number.isFinite(value.low) &&
  Number.isFinite(value.close) &&
  Number.isFinite(value.volume);

const sanitizeCandles = (candles: Partial<Candle>[]) => candles.filter(isValidCandle).sort((a, b) => a.time - b.time);

const toCandle = (row: any[]): Candle => ({
  time: Math.floor(Number(row[0]) / 1000),
  open: Number(row[1]),
  high: Number(row[2]),
  low: Number(row[3]),
  close: Number(row[4]),
  volume: Number(row[5])
});

const syntheticCandles = (count = 3000): Candle[] => {
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
};

async function fetchBinance(symbol: string, interval: string, limit = 1000): Promise<Candle[]> {
  const url = 'https://api.binance.com/api/v3/klines';
  const { data } = await axios.get(url, { params: { symbol, interval, limit }, timeout: 15000 });
  return sanitizeCandles(data.map(toCandle));
}

async function readExistingCandles(file: string): Promise<Candle[] | null> {
  try {
    const raw = await fs.readFile(file, 'utf-8');
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    const candles = sanitizeCandles(parsed);
    return candles.length >= 150 ? candles : null;
  } catch {
    return null;
  }
}

export async function ensureMarketData(force = false) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  for (const pair of PAIRS) {
    for (const timeframe of TIMEFRAMES) {
      const file = symbolFile(pair, timeframe);
      if (!force) {
        const existing = await readExistingCandles(file);
        if (existing) {
          continue;
        }
      }

      try {
        const candles = await fetchBinance(pair, timeframe, 1000);
        if (candles.length < 150) throw new Error('Insufficient candles from Binance');
        await fs.writeFile(file, JSON.stringify(candles, null, 2), 'utf-8');
      } catch {
        const candles = syntheticCandles(1200);
        await fs.writeFile(file, JSON.stringify(candles, null, 2), 'utf-8');
      }
    }
  }
}

export async function loadMarketCandles(symbol: string, timeframe: string): Promise<Candle[]> {
  const file = symbolFile(symbol, timeframe);
  const candles = await readExistingCandles(file);
  if (candles && candles.length) return candles;

  await ensureMarketData(true);
  const refreshed = await readExistingCandles(file);
  if (refreshed && refreshed.length) return refreshed;

  const fallback = syntheticCandles(1200);
  await fs.writeFile(file, JSON.stringify(fallback, null, 2), 'utf-8');
  return fallback;
}

export function scheduleDailyRefresh() {
  setInterval(() => {
    ensureMarketData(true).catch((err) => {
      console.error('Daily refresh failed', err);
    });
  }, 24 * 60 * 60 * 1000);
}
