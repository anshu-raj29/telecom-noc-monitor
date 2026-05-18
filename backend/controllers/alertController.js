const { buildThroughputBaselines, scoreMetric } = require('../services/healthEngine');
const { getPlaybackSnapshot } = require('../services/metricsDataService');

function alertPriority(score) {
  return Math.round(Math.min(100, score.riskScore + score.latencyRisk * 0.15 + score.throughputRisk * 0.15));
}

function alertCopy(metric, score) {
  if (score.latencyRisk >= 70) {
    return {
      title: `${metric.locality} latency threshold exceeded`,
      message: 'Latency is above the operational service threshold.'
    };
  }
  if (score.throughputRisk >= 70) {
    return {
      title: `${metric.locality} throughput degradation`,
      message: 'Throughput is below expected performance for this network type.'
    };
  }
  if (score.signalRisk >= 70) {
    return {
      title: `${metric.locality} signal instability`,
      message: 'Signal strength is below the operating range for reliable service.'
    };
  }
  return {
    title: `${metric.locality} KPI risk warning`,
    message: 'Combined KPI score requires operations review.'
  };
}

async function getAlerts(req, res) {
  const snapshot = await getPlaybackSnapshot();
  const latest = [...snapshot.rows].reverse();

  const baselines = buildThroughputBaselines(latest);
  const uniqueLatest = [];
  const seen = new Set();
  for (const metric of latest) {
    if (seen.has(metric.locality)) continue;
    seen.add(metric.locality);
    const score = scoreMetric(metric, baselines);
    if (score.riskScore >= 40) uniqueLatest.push({ metric, score });
  }

  const alerts = uniqueLatest.map(({ metric: m, score }, idx) => {
    const copy = alertCopy(m, score);
    return {
      id: idx + 1,
      tower_id: String(m._id),
      tower_code: m.locality,
      title: copy.title,
      message: copy.message,
      severity: score.riskLabel === 'Critical' ? 'Critical' : 'Warning',
      priority_score: alertPriority(score),
      status: 'ACTIVE',
      created_at: m.timestamp
    };
  }).sort((a, b) => b.priority_score - a.priority_score);

  res.json(alerts);
}

module.exports = {
  getAlerts
};

