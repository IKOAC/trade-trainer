export type Candle = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

export type PatternType = 'strong_breakout' | 'reversal' | 'fake_breakout' | 'no_trade';

export type Scenario = {
  id: string;
  pair: string;
  timeframe: string;
  pattern: PatternType;
  difficulty: 'easy' | 'medium' | 'hard';
  module: 'liquidity_sweeps' | 'false_breakouts' | 'range_breakouts' | 'trend_exhaustion' | 'mixed';
  tags: string[];
  before: Candle[];
  after: Candle[];
  metadata: Record<string, string>;
  explanation: string;
};
