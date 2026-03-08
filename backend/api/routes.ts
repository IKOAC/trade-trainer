import { Router } from 'express';
import { ensureTrainingData, loadScenarios } from '../dataset/generator';
import { getDb } from '../data/db';

const router = Router();

router.get('/health', (_, res) => res.json({ ok: true }));

router.get('/scenario', async (req, res) => {
  const difficulty = String(req.query.difficulty || 'all');
  const moduleName = String(req.query.module || 'mixed');
  const scenarios = await ensureTrainingData();
  const filtered = scenarios.filter((s) =>
    (difficulty === 'all' || s.difficulty === difficulty) &&
    (moduleName === 'mixed' || s.module === moduleName)
  );
  const pick = filtered[Math.floor(Math.random() * filtered.length)] || scenarios[0];
  res.json(pick);
});

router.post('/attempt', async (req, res) => {
  const { scenarioId, pattern, userAnswer, difficulty, module, responseMs, score } = req.body;
  const correct = pattern === userAnswer ? 1 : 0;
  const db = await getDb();
  await db.run(
    `INSERT INTO attempts (scenarioId, pattern, userAnswer, correct, difficulty, module, responseMs, score)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [scenarioId, pattern, userAnswer, correct, difficulty, module, responseMs, score]
  );
  res.json({ correct: Boolean(correct) });
});

router.get('/stats', async (_, res) => {
  const db = await getDb();
  const total = (await db.get<{ c: number }>('SELECT COUNT(*) as c FROM attempts'))?.c || 0;
  const correct = (await db.get<{ c: number }>('SELECT COUNT(*) as c FROM attempts WHERE correct = 1'))?.c || 0;
  const byPattern = await db.all<{ pattern: string; acc: number }[]>(`
    SELECT pattern, ROUND(AVG(correct) * 100, 2) as acc FROM attempts GROUP BY pattern
  `);
  const streakRows = await db.all<{ correct: number }[]>('SELECT correct FROM attempts ORDER BY id');

  let currentStreak = 0;
  let longestStreak = 0;
  for (const row of streakRows) {
    if (row.correct) {
      currentStreak += 1;
      longestStreak = Math.max(longestStreak, currentStreak);
    } else {
      currentStreak = 0;
    }
  }

  const today = await db.get<{ total: number; acc: number }>(`
    SELECT COUNT(*) as total, ROUND(AVG(correct) * 100, 2) as acc
    FROM attempts WHERE date(createdAt)=date('now')
  `);

  const score = await db.get<{ totalScore: number }>('SELECT COALESCE(SUM(score), 0) as totalScore FROM attempts');

  res.json({
    totalCharts: total,
    accuracy: total ? Number(((correct / total) * 100).toFixed(2)) : 0,
    byPattern,
    longestStreak,
    currentStreak,
    dailyTotal: today?.total || 0,
    dailyAccuracy: today?.acc || 0,
    score: score?.totalScore || 0
  });
});

router.get('/scenarios/count', async (_, res) => {
  const scenarios = await loadScenarios();
  res.json({ count: scenarios.length });
});

export default router;
