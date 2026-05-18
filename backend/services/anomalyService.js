function toNumber(v) {
  const n = typeof v === 'number' ? v : Number(String(v).trim());
  return Number.isFinite(n) ? n : null;
}

function percentile(sorted, p) {
  if (!sorted.length) return null;
  const idx = (sorted.length - 1) * p;
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo];
  const w = idx - lo;
  return sorted[lo] * (1 - w) + sorted[hi] * w;
}

function computeHealthScore({ rsrp, signalQuality, throughput, latency }) {
  const rsrpScore = (() => {
    if (rsrp == null) return 50;
    if (rsrp >= -85) return 95;
    if (rsrp >= -95) return 78;
    if (rsrp >= -105) return 60;
    return 35;
  })();

  const qualityScore = (() => {
    if (signalQuality == null) return 75;
    if (signalQuality >= 80) return 92;
    if (signalQuality >= 65) return 78;
    if (signalQuality >= 50) return 62;
    return 38;
  })();

  const throughputScore = (() => {
    if (throughput == null) return 50;
    if (throughput >= 20) return 95;
    if (throughput >= 10) return 80;
    if (throughput >= 4) return 62;
    return 40;
  })();

  const latencyScore = (() => {
    if (latency == null) return 50;
    if (latency <= 40) return 95;
    if (latency <= 70) return 80;
    if (latency <= 110) return 62;
    return 40;
  })();

  const composite = (rsrpScore + qualityScore + throughputScore + latencyScore) / 4;
  const score = Math.round(composite);

  if (score >= 85) return { healthScore: score, healthLabel: 'Excellent' };
  if (score >= 70) return { healthScore: score, healthLabel: 'Good' };
  if (score >= 55) return { healthScore: score, healthLabel: 'Moderate' };
  return { healthScore: score, healthLabel: 'Poor' };
}

function anomalyLabel({ rsrp, latency, throughput, rsrpThreshold, latencyThreshold, throughputDropThreshold }) {
  if (rsrp != null && rsrp <= Math.min(rsrpThreshold, -105)) {
    return { isAnomaly: true, anomalyType: 'Weak Signal', anomalyScore: 0.92 };
  }
  if (latency != null && latency >= Math.max(latencyThreshold, 110)) {
    return { isAnomaly: true, anomalyType: 'High Latency', anomalyScore: 0.88 };
  }
  if (throughput != null && throughput <= throughputDropThreshold && throughput <= 4) {
    return { isAnomaly: true, anomalyType: 'Throughput Degradation', anomalyScore: 0.8 };
  }
  return { isAnomaly: false, anomalyType: null, anomalyScore: 0.08 };
}

function groupBy(arr, keyFn) {
  const m = new Map();
  for (const item of arr) {
    const k = keyFn(item);
    if (!m.has(k)) m.set(k, []);
    m.get(k).push(item);
  }
  return m;
}

async function analyzeMetrics(metrics) {
  // Lightweight robust stats thresholds (percentile-based).
  // We compute per networkType if possible; fallback to global.
  const enriched = metrics.map((m) => ({
    _id: m._id,
    locality: m.locality,
    networkType: m.networkType,
    timestamp: m.timestamp,
    rsrp: toNumber(m.signalStrength),
    rsrq: toNumber(m.signalQuality),
    throughput: toNumber(m.dataThroughput),
    latency: toNumber(m.latency)
  }));

  const networkGroups = groupBy(enriched, (x) => x.networkType || 'Unknown');

  const resultsById = new Map();

  for (const [netType, group] of networkGroups.entries()) {
    const rsrpVals = group.map((g) => g.rsrp).filter((v) => Number.isFinite(v)).sort((a, b) => a - b);
    const latVals = group.map((g) => g.latency).filter((v) => Number.isFinite(v)).sort((a, b) => a - b);
    const thrVals = group.map((g) => g.throughput).filter((v) => Number.isFinite(v)).sort((a, b) => a - b);

    const rsrpThreshold = rsrpVals.length ? percentile(rsrpVals, 0.05) : null; // 5th percentile (weak)
    const latencyThreshold = latVals.length ? percentile(latVals, 0.95) : null; // 95th (high)
    const throughputDropThreshold = thrVals.length ? percentile(thrVals, 0.10) : null; // 10th (low)

    for (const g of group) {
      const { healthScore, healthLabel } = computeHealthScore({
        rsrp: g.rsrp,
        signalQuality: g.rsrq,
        throughput: g.throughput,
        latency: g.latency
      });

      const anom = anomalyLabel({
        rsrp: g.rsrp,
        latency: g.latency,
        throughput: g.throughput,
        rsrpThreshold,
        latencyThreshold,
        throughputDropThreshold
      });

      resultsById.set(String(g._id), {
        isAnomaly: anom.isAnomaly,
        anomalyType: anom.anomalyType,
        healthScore,
        healthLabel,
        anomalyScore: anom.anomalyScore
      });
    }
  }

  return resultsById;
}

module.exports = {
  analyzeMetrics
};

