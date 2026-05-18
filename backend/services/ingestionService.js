const Metric = require('../models/Metric');
const { analyzeMetrics } = require('./anomalyService');
const { clearMetricCache } = require('./metricsDataService');

async function runAnalysis() {
  const metrics = await Metric.find({}).limit(75000);
  if (!metrics.length) return 0;

  const resultsById = await analyzeMetrics(metrics);
  const bulk = metrics.map((m) => {
    const r = resultsById.get(String(m._id));
    return {
      updateOne: {
        filter: { _id: m._id },
        update: {
          $set: {
            isAnomaly: r?.isAnomaly ?? false,
            anomalyType: r?.anomalyType ?? null,
            anomalyScore: r?.anomalyScore ?? 0,
            healthScore: r?.healthScore ?? 60,
            healthLabel: r?.healthLabel ?? 'Moderate'
          }
        }
      }
    };
  });

  await Metric.bulkWrite(bulk);
  return bulk.length;
}

async function replaceMetrics(records) {
  await Metric.deleteMany({});
  clearMetricCache();

  const batchSize = 1000;
  for (let i = 0; i < records.length; i += batchSize) {
    await Metric.insertMany(records.slice(i, i + batchSize), { ordered: false });
  }

  const analyzed = await runAnalysis();
  clearMetricCache();
  return analyzed;
}

module.exports = {
  replaceMetrics,
  runAnalysis
};
