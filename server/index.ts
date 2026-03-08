import express from 'express';
import next from 'next';
import apiRoutes from '../backend/api/routes';
import { ensureMarketData, scheduleDailyRefresh } from '../backend/data/marketData';
import { ensureTrainingData } from '../backend/dataset/generator';

const dev = process.env.NODE_ENV !== 'production';
const port = Number(process.env.PORT || 3000);

async function start() {
  await ensureMarketData();
  await ensureTrainingData();
  scheduleDailyRefresh();

  const nextApp = next({ dev });
  const handle = nextApp.getRequestHandler();
  await nextApp.prepare();

  const app = express();
  app.use(express.json({ limit: '1mb' }));
  app.use('/api', apiRoutes);
  app.all('*', (req, res) => handle(req, res));

  app.listen(port, () => {
    console.log(`Trading trainer ready at http://localhost:${port}`);
  });
}

start().catch((err) => {
  console.error(err);
  process.exit(1);
});
