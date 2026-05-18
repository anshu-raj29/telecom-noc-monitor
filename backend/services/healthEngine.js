const { mean, quantile } = require('./telecomFeatures');

function round(value, digits = 1) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  const factor = 10 ** digits;
  return Math.round(n * factor) / factor;
}

function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function buildThroughputBaselines(metrics) {
  const groups = new Map();
  for (const metric of metrics) {
    const type = String(metric.networkType || 'UNKNOWN').toUpperCase();
    if (!groups.has(type)) groups.set(type, []);
    groups.get(type).push(Number(metric.dataThroughput));
  }

  const baselines = {};
  for (const [type, values] of groups.entries()) {
    baselines[type] = {
      critical: quantile(values, 0.15),
      warning: quantile(values, 0.35),
      median: quantile(values, 0.5),
      strong: quantile(values, 0.8)
    };
  }
  return baselines;
}

function signalRisk(signal) {
  const value = Number(signal);
  if (!Number.isFinite(value)) return 50;
  if (value > -85) return 10;
  if (value >= -100) return clamp(25 + ((-85 - value) / 15) * 35);
  return clamp(65 + ((-100 - value) / 20) * 35);
}

function latencyRisk(latency) {
  const value = Number(latency);
  if (!Number.isFinite(value)) return 50;
  if (value < 60) return 10;
  if (value <= 120) return clamp(30 + ((value - 60) / 60) * 40);
  return clamp(72 + ((value - 120) / 80) * 28);
}

function throughputRisk(throughput, networkType, baselines) {
  const value = Number(throughput);
  if (!Number.isFinite(value)) return 50;
  const base = baselines[String(networkType || 'UNKNOWN').toUpperCase()] || { critical: 3, warning: 8, median: 15, strong: 30 };
  if (value <= base.critical) return 90;
  if (value <= base.warning) return 70 - ((value - base.critical) / Math.max(1, base.warning - base.critical)) * 15;
  if (value <= base.median) return 50 - ((value - base.warning) / Math.max(1, base.median - base.warning)) * 20;
  if (value <= base.strong) return 25 - ((value - base.median) / Math.max(1, base.strong - base.median)) * 15;
  return 8;
}

function scoreMetric(metric, baselines) {
  const signal = signalRisk(metric.signalStrength);
  const throughput = throughputRisk(metric.dataThroughput, metric.networkType, baselines);
  const latency = latencyRisk(metric.latency);
  const redCount = [signal, throughput, latency].filter((value) => value >= 70).length;
  let riskScore = signal * 0.3 + throughput * 0.35 + latency * 0.35;
  if (redCount >= 2) riskScore = Math.max(riskScore, 70);
  riskScore = clamp(riskScore);
  const healthScore = clamp(100 - riskScore);
  const riskLabel = riskScore >= 70 ? 'Critical' : riskScore >= 40 ? 'Warning' : 'Healthy';
  const status = riskScore >= 70 ? 'DOWN' : riskScore >= 40 ? 'DEGRADED' : 'UP';

  return {
    signalRisk: round(signal),
    throughputRisk: round(throughput),
    latencyRisk: round(latency),
    riskScore: round(riskScore),
    healthScore: round(healthScore),
    riskLabel,
    status
  };
}

function networkTypeHealth(metrics, baselines) {
  const groups = new Map();
  for (const metric of metrics) {
    const type = String(metric.networkType || 'Unknown').toUpperCase();
    if (!groups.has(type)) groups.set(type, []);
    groups.get(type).push(metric);
  }

  return Array.from(groups.entries()).map(([network_type, rows]) => {
    const scored = rows.map((row) => scoreMetric(row, baselines));
    return {
      network_type,
      avg_throughput: round(mean(rows.map((row) => Number(row.dataThroughput)))),
      avg_latency: round(mean(rows.map((row) => Number(row.latency)))),
      avg_signal: round(mean(rows.map((row) => Number(row.signalStrength)))),
      health_score: round(mean(scored.map((item) => item.healthScore)))
    };
  }).sort((a, b) => a.network_type.localeCompare(b.network_type));
}

module.exports = {
  buildThroughputBaselines,
  networkTypeHealth,
  scoreMetric
};
