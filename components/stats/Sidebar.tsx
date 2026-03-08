'use client';

type Stats = {
  totalCharts: number;
  accuracy: number;
  byPattern: { pattern: string; acc: number }[];
  longestStreak: number;
  currentStreak: number;
  dailyTotal: number;
  dailyAccuracy: number;
  score: number;
};

type Props = {
  stats: Stats;
  difficulty: string;
  setDifficulty: (v: 'easy' | 'medium' | 'hard' | 'all') => void;
  module: string;
  setModule: (v: string) => void;
  elapsedSec: number;
};

const modules = [
  { value: 'mixed', label: 'Mixed' },
  { value: 'liquidity_sweeps', label: 'Liquidity Sweeps' },
  { value: 'false_breakouts', label: 'False Breakouts' },
  { value: 'range_breakouts', label: 'Range Breakouts' },
  { value: 'trend_exhaustion', label: 'Trend Exhaustion' }
];

export default function Sidebar({ stats, difficulty, setDifficulty, module, setModule, elapsedSec }: Props) {
  const dailyPct = Math.min((stats.dailyTotal / 50) * 100, 100);
  return (
    <aside className="panel p-4 h-full space-y-4">
      <h2 className="text-lg font-semibold">Training Desk</h2>
      <div className="space-y-1 text-sm">
        <div>Total analyzed: {stats.totalCharts}</div>
        <div>Accuracy: {stats.accuracy}%</div>
        <div>Current streak: {stats.currentStreak}</div>
        <div>Longest streak: {stats.longestStreak}</div>
        <div>Score: {stats.score}</div>
      </div>

      <div>
        <label className="text-xs text-slate-300">Difficulty</label>
        <select value={difficulty} onChange={(e) => setDifficulty(e.target.value as any)} className="mt-1 w-full bg-slate-900 border border-slate-700 rounded p-2">
          <option value="all">All</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
      </div>

      <div>
        <label className="text-xs text-slate-300">Module</label>
        <select value={module} onChange={(e) => setModule(e.target.value)} className="mt-1 w-full bg-slate-900 border border-slate-700 rounded p-2">
          {modules.map((m) => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>
      </div>

      <div>
        <div className="text-xs mb-1">Daily goal: {stats.dailyTotal}/50</div>
        <div className="w-full h-2 bg-slate-700 rounded"><div className="h-2 bg-cyan-400 rounded" style={{ width: `${dailyPct}%` }} /></div>
        <div className="text-xs mt-1">Daily accuracy: {stats.dailyAccuracy || 0}%</div>
      </div>

      <div className="text-xs">Session timer: {Math.floor(elapsedSec / 60)}m {elapsedSec % 60}s</div>

      <div className="text-xs space-y-1">
        {stats.byPattern.map((p) => (
          <div key={p.pattern}>{p.pattern}: {p.acc}%</div>
        ))}
      </div>
    </aside>
  );
}
