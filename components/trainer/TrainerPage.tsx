'use client';

import { useEffect, useMemo, useState } from 'react';
import CandleChart from '@/components/chart/CandleChart';
import Sidebar from '@/components/stats/Sidebar';
import { Candle, PatternType, Scenario } from '@/lib/types';

const decisionLabels: { key: PatternType; label: string }[] = [
  { key: 'strong_breakout', label: 'Strong Breakout' },
  { key: 'reversal', label: 'Reversal' },
  { key: 'fake_breakout', label: 'Fake Breakout' },
  { key: 'no_trade', label: 'No Trade' }
];

const difficultyBonus: Record<string, number> = { easy: 1, medium: 2, hard: 3, all: 1 };

export default function TrainerPage() {
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [visibleAfter, setVisibleAfter] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(500);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard' | 'all'>('all');
  const [module, setModule] = useState('mixed');
  const [feedback, setFeedback] = useState<{ correct: boolean; answer: PatternType } | null>(null);
  const [decisionStartedAt, setDecisionStartedAt] = useState(Date.now());
  const [stats, setStats] = useState<any>({ totalCharts: 0, accuracy: 0, byPattern: [], longestStreak: 0, currentStreak: 0, dailyTotal: 0, dailyAccuracy: 0, score: 0 });
  const [elapsedSec, setElapsedSec] = useState(0);
  const [trade, setTrade] = useState<{ side: 'buy' | 'sell' | 'skip'; pnl: number; rr: number } | null>(null);
  const [isLoadingScenario, setIsLoadingScenario] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const candles = useMemo<Candle[]>(() => {
    if (!scenario) return [];
    return [...scenario.before, ...scenario.after.slice(0, visibleAfter)];
  }, [scenario, visibleAfter]);

  const fetchScenario = async () => {
    setIsLoadingScenario(true);
    setError(null);
    try {
      const q = new URLSearchParams({ difficulty, module }).toString();
      const res = await fetch(`/api/scenario?${q}`);
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload.error || 'Could not fetch a training scenario.');
      }
      const data = (await res.json()) as Scenario;
      if (!data || !Array.isArray(data.before) || data.before.length === 0) {
        throw new Error('Scenario data is empty.');
      }
      setScenario(data);
      setVisibleAfter(0);
      setFeedback(null);
      setTrade(null);
      setIsPlaying(false);
      setDecisionStartedAt(Date.now());
    } catch (err) {
      setScenario(null);
      setError(err instanceof Error ? err.message : 'Unable to load scenario.');
    } finally {
      setIsLoadingScenario(false);
    }
  };

  const fetchStats = async () => {
    const res = await fetch('/api/stats');
    if (res.ok) {
      setStats(await res.json());
    }
  };

  useEffect(() => {
    fetchScenario();
    fetchStats();
  }, [difficulty, module]);

  useEffect(() => {
    const t = setInterval(() => setElapsedSec((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!isPlaying || !scenario) return;
    const t = setInterval(() => {
      setVisibleAfter((v) => {
        if (v >= scenario.after.length) {
          setIsPlaying(false);
          return v;
        }
        return v + 1;
      });
    }, speed);
    return () => clearInterval(t);
  }, [isPlaying, scenario, speed]);

  const submitDecision = async (answer: PatternType) => {
    if (!scenario || feedback || isLoadingScenario) return;
    const responseMs = Date.now() - decisionStartedAt;
    const baseScore = answer === scenario.pattern ? 10 : 0;
    const speedBonus = Math.max(0, 5 - Math.floor(responseMs / 4000));
    const score = (baseScore + speedBonus) * difficultyBonus[difficulty];
    const res = await fetch('/api/attempt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        scenarioId: scenario.id,
        pattern: scenario.pattern,
        userAnswer: answer,
        difficulty: scenario.difficulty,
        module: scenario.module,
        responseMs,
        score
      })
    });
    const result = await res.json();
    setFeedback({ correct: result.correct, answer });
    setVisibleAfter(scenario.after.length);
    fetchStats();
  };

  const simulateTrade = (side: 'buy' | 'sell' | 'skip') => {
    if (!scenario || side === 'skip') return setTrade({ side, pnl: 0, rr: 0 });
    const entry = scenario.after[0]?.close ?? scenario.before.at(-1)?.close ?? 0;
    const stop = side === 'buy' ? entry * 0.995 : entry * 1.005;
    const target = side === 'buy' ? entry * 1.01 : entry * 0.99;
    const final = scenario.after.at(-1)?.close ?? entry;
    const pnl = side === 'buy' ? final - entry : entry - final;
    const risk = Math.abs(entry - stop);
    const reward = Math.abs(target - entry);
    setTrade({ side, pnl: Number(pnl.toFixed(2)), rr: Number((reward / risk).toFixed(2)) });
  };

  const controlsDisabled = !scenario || isLoadingScenario;

  return (
    <main className="min-h-screen p-4">
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-3">
          <Sidebar stats={stats} difficulty={difficulty} setDifficulty={setDifficulty} module={module} setModule={setModule} elapsedSec={elapsedSec} />
        </div>
        <div className="col-span-9 space-y-4">
          {error && (
            <div className="panel p-3 text-amber-300 text-sm">
              {error}
              <button onClick={fetchScenario} className="ml-3 px-3 py-1 rounded bg-cyan-700 text-white">Retry</button>
            </div>
          )}

          <CandleChart candles={candles} />

          <div className="panel p-4 flex flex-wrap gap-2 items-center">
            {decisionLabels.map((d) => (
              <button
                key={d.key}
                onClick={() => submitDecision(d.key)}
                className="px-3 py-2 rounded bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50"
                disabled={!!feedback || controlsDisabled}
              >
                {d.label}
              </button>
            ))}

            <div className="ml-auto flex gap-2">
              <button onClick={() => setIsPlaying(true)} className="px-3 py-2 rounded bg-slate-700" disabled={controlsDisabled}>Play</button>
              <button onClick={() => setIsPlaying(false)} className="px-3 py-2 rounded bg-slate-700" disabled={controlsDisabled}>Pause</button>
              <button onClick={() => setVisibleAfter((v) => Math.min(v + 1, scenario?.after.length || 0))} className="px-3 py-2 rounded bg-slate-700" disabled={controlsDisabled}>Step</button>
              <button onClick={() => setVisibleAfter(0)} className="px-3 py-2 rounded bg-slate-700" disabled={controlsDisabled}>Restart</button>
              <select value={speed} onChange={(e) => setSpeed(Number(e.target.value))} className="bg-slate-900 border border-slate-700 rounded px-2" disabled={controlsDisabled}>
                <option value={800}>0.5x</option>
                <option value={500}>1x</option>
                <option value={250}>2x</option>
                <option value={100}>5x</option>
              </select>
            </div>
          </div>

          {feedback && scenario && (
            <div className="panel p-4 space-y-2">
              <div className={feedback.correct ? 'text-green-400' : 'text-red-400'}>{feedback.correct ? 'Correct' : 'Incorrect'} — Pattern: {scenario.pattern}</div>
              <div className="text-sm text-slate-300">{scenario.explanation}</div>
              <div className="text-xs text-slate-400">Tags: {scenario.tags.join(', ')}</div>
              <div className="flex gap-2 pt-2">
                <button onClick={() => simulateTrade('buy')} className="px-3 py-2 rounded bg-emerald-700">Buy</button>
                <button onClick={() => simulateTrade('sell')} className="px-3 py-2 rounded bg-rose-700">Sell</button>
                <button onClick={() => simulateTrade('skip')} className="px-3 py-2 rounded bg-slate-700">Skip</button>
              </div>
              {trade && <div className="text-sm">Trade: {trade.side} | P/L: {trade.pnl} | R:R {trade.rr}</div>}
              <button onClick={fetchScenario} className="px-4 py-2 rounded bg-cyan-600 mt-2">Next Chart</button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
