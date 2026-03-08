import fs from 'fs/promises';
import path from 'path';
import { Scenario } from '../../lib/types';
import { ensureMarketData, loadMarketCandles } from '../data/marketData';
import { classifyPattern, difficultyFromPattern, explanationFor, moduleFromTags } from './patternEngine';

const TRAINING_DIR = path.join(process.cwd(), 'data', 'training');
const PAIRS = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT'];
const TIMEFRAMES = ['1m', '5m', '15m'];

const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1) + min);

export async function generateScenarios(perSeries = 120): Promise<Scenario[]> {
  await fs.mkdir(TRAINING_DIR, { recursive: true });
  await ensureMarketData();

  const scenarios: Scenario[] = [];

  for (const pair of PAIRS) {
    for (const timeframe of TIMEFRAMES) {
      const candles = await loadMarketCandles(pair, timeframe);
      if (candles.length < 150) continue;
      for (let i = 0; i < perSeries; i++) {
        const pivot = randomInt(85, candles.length - 45);
        const before = candles.slice(pivot - 80, pivot);
        const after = candles.slice(pivot, pivot + 40);
        const details = classifyPattern(before, after);
        const pattern = details.pattern;
        const tags = details.tags;
        const scenario: Scenario = {
          id: `${pair}-${timeframe}-${pivot}-${i}`,
          pair,
          timeframe,
          pattern,
          before,
          after,
          tags,
          metadata: {
            ...details.metadata,
            structure: tags.includes('range_breakout') ? 'range compression' : 'mixed structure',
            trend: before[before.length - 1].close > before[0].close ? 'bullish' : 'bearish'
          },
          explanation: explanationFor(pattern, details),
          difficulty: difficultyFromPattern(pattern, tags),
          module: moduleFromTags(tags)
        };
        scenarios.push(scenario);
      }
    }
  }

  await fs.writeFile(path.join(TRAINING_DIR, 'scenarios.json'), JSON.stringify(scenarios, null, 2), 'utf-8');
  return scenarios;
}

export async function loadScenarios() {
  const p = path.join(TRAINING_DIR, 'scenarios.json');
  const raw = await fs.readFile(p, 'utf-8');
  const parsed = JSON.parse(raw);
  return Array.isArray(parsed) ? (parsed as Scenario[]) : [];
}

export async function ensureTrainingData() {
  try {
    const scenarios = await loadScenarios();
    if (scenarios.length > 0) return scenarios;
  } catch {
    // generate below
  }

  const generated = await generateScenarios();
  if (generated.length > 0) return generated;

  return generateScenarios(40);
}
