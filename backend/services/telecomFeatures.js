function number(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function mean(values) {
  const clean = values.filter(Number.isFinite);
  return clean.length ? clean.reduce((sum, value) => sum + value, 0) / clean.length : 0;
}

function quantile(values, q) {
  const clean = values.filter(Number.isFinite).sort((a, b) => a - b);
  if (!clean.length) return 0;
  const pos = (clean.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  if (lo === hi) return clean[lo];
  return clean[lo] * (hi - pos) + clean[hi] * (pos - lo);
}

function networkRank(type) {
  const key = String(type || '').toUpperCase();
  if (key === '5G') return 4;
  if (key === 'LTE') return 3;
  if (key === '4G') return 2;
  if (key === '3G') return 1;
  return 0;
}

function throughputBaseline(rows) {
  const byType = new Map();
  for (const row of rows) {
    const key = String(row.networkType || 'UNKNOWN').toUpperCase();
    if (!byType.has(key)) byType.set(key, []);
    byType.get(key).push(number(row.dataThroughput));
  }

  const baseline = {};
  for (const [type, values] of byType.entries()) {
    baseline[type] = {
      warning: quantile(values, 0.25),
      critical: quantile(values, 0.1),
      median: quantile(values, 0.5)
    };
  }
  return baseline;
}

function statusFromRow(row, baseline) {
  const signal = number(row.signalStrength);
  const latency = number(row.latency);
  const throughput = number(row.dataThroughput);
  const type = String(row.networkType || 'UNKNOWN').toUpperCase();
  const typeBase = baseline[type] || { warning: 2, critical: 1 };

  const signalDown = signal < -110;
  const signalDegraded = signal < -100;
  const latencyDown = latency > 160;
  const latencyDegraded = latency > 120;
  const throughputDown = throughput <= typeBase.critical;
  const throughputDegraded = throughput <= typeBase.warning;

  if (signalDown || latencyDown || (throughputDown && latencyDegraded)) return 'DOWN';
  if (signalDegraded || latencyDegraded || throughputDegraded) return 'DEGRADED';
  return 'UP';
}

function featureVector(row) {
  return [
    number(row.signalStrength),
    number(row.signalQuality, 75),
    number(row.dataThroughput),
    number(row.latency),
    number(row.healthScore, 60),
    networkRank(row.networkType)
  ];
}

function minMaxScale(vectors) {
  const featureCount = vectors[0]?.length || 0;
  const mins = Array(featureCount).fill(Infinity);
  const maxs = Array(featureCount).fill(-Infinity);
  for (const vector of vectors) {
    vector.forEach((value, index) => {
      mins[index] = Math.min(mins[index], value);
      maxs[index] = Math.max(maxs[index], value);
    });
  }
  return vectors.map((vector) => vector.map((value, index) => {
    const span = maxs[index] - mins[index] || 1;
    return (value - mins[index]) / span;
  }));
}

function prepareRows(metrics) {
  const sorted = [...metrics].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  const baseline = throughputBaseline(sorted);
  return sorted.map((metric) => ({
    id: String(metric._id),
    locality: metric.locality,
    timestamp: metric.timestamp,
    networkType: metric.networkType,
    signalStrength: number(metric.signalStrength),
    signalQuality: number(metric.signalQuality, 75),
    dataThroughput: number(metric.dataThroughput),
    latency: number(metric.latency),
    healthScore: number(metric.healthScore, 60),
    status: statusFromRow(metric, baseline)
  }));
}

function latestByLocality(rows) {
  const latest = new Map();
  for (const row of rows) latest.set(row.locality, row);
  return Array.from(latest.values()).sort((a, b) => a.locality.localeCompare(b.locality));
}

function splitTrainTest(rows, testRatio = 0.25) {
  const train = [];
  const test = [];
  rows.forEach((row, index) => {
    if (index % Math.round(1 / testRatio) === 0) test.push(row);
    else train.push(row);
  });
  return { train, test };
}

module.exports = {
  featureVector,
  latestByLocality,
  mean,
  minMaxScale,
  prepareRows,
  quantile,
  splitTrainTest
};
