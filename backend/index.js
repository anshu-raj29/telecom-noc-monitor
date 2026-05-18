const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

const connectDB = require('./config/db');
const Metric = require('./models/Metric');
const { readSignalMetricsCsv } = require('./utils/csvParser');
const { replaceMetrics } = require('./services/ingestionService');

const dashboardRoutes = require('./routes/dashboardRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const alertRoutes = require('./routes/alertRoutes');
const aiRoutes = require('./routes/aiRoutes');

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.get('/health', (req, res) => res.json({ ok: true }));

app.use('/', dashboardRoutes);
app.use('/', analyticsRoutes);
app.use('/', alertRoutes);
app.use('/', aiRoutes);
app.use('/api', dashboardRoutes);
app.use('/api', analyticsRoutes);
app.use('/api', alertRoutes);
app.use('/api', aiRoutes);

const PORT = process.env.PORT || 8000;
const CSV_PATH = path.join(process.cwd(), '..', 'signal_metrics.csv');
const RAW_CSV_PATH = path.join(process.cwd(), '..', 'raw_dataset.csv');
const PROCESSED_CSV_PATH = path.join(process.cwd(), '..', 'processed_dataset.csv');

function ensureRawDatasetCopy() {
  if (!fs.existsSync(RAW_CSV_PATH) && fs.existsSync(CSV_PATH)) {
    fs.copyFileSync(CSV_PATH, RAW_CSV_PATH);
  }
}

async function seedCsvIfEmpty() {
  ensureRawDatasetCopy();
  const count = await Metric.estimatedDocumentCount();
  if (count && fs.existsSync(PROCESSED_CSV_PATH)) return;
  const records = await readSignalMetricsCsv(CSV_PATH);
  if (records.length) await replaceMetrics(records);
}

connectDB()
  .then(async () => {
    await seedCsvIfEmpty();
    app.listen(PORT, () => {
      // eslint-disable-next-line no-console
      console.log(`Backend listening on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error('Failed to connect to MongoDB:', err);
    process.exit(1);
  });

