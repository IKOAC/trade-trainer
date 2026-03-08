import { Candle, PatternType } from '../../lib/types';

const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / Math.max(arr.length, 1);

export function classifyPattern(before: Candle[], after: Candle[]) {
  const highs = before.slice(-20).map((c) => c.high);
  const lows = before.slice(-20).map((c) => c.low);
  const resistance = Math.max(...highs);
  const support = Math.min(...lows);
  const range = resistance - support;
  const bodySizes = before.slice(-20).map((c) => Math.abs(c.close - c.open));
  const volatilityContracting = avg(bodySizes.slice(0, 10)) > avg(bodySizes.slice(10));

  const firstAfter = after.slice(0, 6);
  const maxAfter = Math.max(...firstAfter.map((c) => c.high));
  const minAfter = Math.min(...firstAfter.map((c) => c.low));

  let pattern: PatternType = 'no_trade';
  const tags: string[] = [];
  const metadata: Record<string, string> = {
    resistance: resistance.toFixed(2),
    support: support.toFixed(2),
    volatility: volatilityContracting ? 'contracting' : 'expanding'
  };

  if (maxAfter > resistance + range * 0.15 && firstAfter[0].close > resistance) {
    const returnsInside = firstAfter.slice(1, 4).some((c) => c.close < resistance);
    if (returnsInside) {
      pattern = 'fake_breakout';
      tags.push('liquidity_grab', 'false_breakout', 'stop_hunt');
    } else {
      pattern = 'strong_breakout';
      tags.push('range_breakout', 'resistance_break', 'momentum_expansion');
    }
  } else if (minAfter < support - range * 0.1 && firstAfter.slice(0, 3).some((c) => c.close > support)) {
    pattern = 'fake_breakout';
    tags.push('support_break', 'false_breakout');
  } else {
    const last30 = before.slice(-30);
    const trend = last30[last30.length - 1].close - last30[0].close;
    const swingHigh = Math.max(...last30.map((c) => c.high));
    const swingLow = Math.min(...last30.map((c) => c.low));
    const afterClose = after[Math.min(5, after.length - 1)].close;
    if (trend > 0 && afterClose < before[before.length - 1].close - range * 0.2 && swingHigh - resistance < range * 0.2) {
      pattern = 'reversal';
      tags.push('double_top', 'trend_exhaustion');
    } else if (trend < 0 && afterClose > before[before.length - 1].close + range * 0.2 && support - swingLow < range * 0.2) {
      pattern = 'reversal';
      tags.push('double_bottom', 'trend_exhaustion');
    } else {
      pattern = 'no_trade';
      tags.push('consolidation', 'no_clear_edge');
    }
  }

  return { pattern, tags, metadata, resistance, support, range, volatilityContracting };
}

export function explanationFor(pattern: PatternType, details: ReturnType<typeof classifyPattern>) {
  if (pattern === 'strong_breakout') {
    return `Price consolidated near ${details.metadata.resistance} with ${details.metadata.volatility} volatility before expanding through resistance with momentum.`;
  }
  if (pattern === 'reversal') {
    return 'Trend momentum weakened into exhaustion structure and then shifted direction, confirming reversal behavior.';
  }
  if (pattern === 'fake_breakout') {
    return 'Price swept a key level to collect liquidity, then quickly failed back inside structure indicating a stop-hunt style fakeout.';
  }
  return 'Market stayed in consolidation without validated breakout or reversal confirmation, making this a no-trade condition.';
}

export function difficultyFromPattern(pattern: PatternType, tags: string[]) {
  if (pattern === 'strong_breakout') return 'easy';
  if (pattern === 'reversal') return 'medium';
  if (tags.includes('stop_hunt') || tags.includes('liquidity_grab')) return 'hard';
  return 'medium';
}

export function moduleFromTags(tags: string[]) {
  if (tags.includes('liquidity_grab')) return 'liquidity_sweeps';
  if (tags.includes('false_breakout')) return 'false_breakouts';
  if (tags.includes('range_breakout')) return 'range_breakouts';
  if (tags.includes('trend_exhaustion')) return 'trend_exhaustion';
  return 'mixed';
}
