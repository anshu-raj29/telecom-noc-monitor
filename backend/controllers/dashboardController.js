const { buildThroughputBaselines, networkTypeHealth, scoreMetric } = require('../services/healthEngine');
const { getPlaybackSnapshot } = require('../services/metricsDataService');

function round(value, digits = 2) {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  const factor = 10 ** digits;
  return Math.round(n * factor) / factor;
}

function mapMetricToKpi(m, baselines) {
  const rsrp = m.signalStrength;
  const signal_quality = m.signalQuality;
  const throughput_mbps = m.dataThroughput;
  const latency_ms = m.latency;

  const score = scoreMetric(m, baselines);
  const severity = score.riskLabel === 'Critical' ? 'Critical' : score.riskLabel === 'Warning' ? 'Warning' : 'Normal';

  return {
    tower_id: m._id ? String(m._id) : null,
    tower_code: m.locality, // Dataset may not have tower_code; use locality as stable identifier.
    name: m.locality,
    region: m.locality,
    latitude: m.latitude,
    longitude: m.longitude,
    vendor: m.networkType,
    sample_time: m.timestamp,

    rsrp: round(rsrp),
    signal_quality: round(signal_quality),
    throughput_mbps: round(throughput_mbps),
    latency_ms: round(latency_ms),
    network_type: m.networkType,
    bb60c: round(m.bb60c),
    srsRAN: round(m.srsRAN),
    bladeRFxA9: round(m.bladeRFxA9),

    health_score: score.healthScore,
    health_label: score.riskLabel,
    risk_score: score.riskScore,
    signal_risk: score.signalRisk,
    throughput_risk: score.throughputRisk,
    latency_risk: score.latencyRisk,
    status: score.status,
    is_anomaly: m.isAnomaly,
    anomaly_score: m.anomalyScore,
    severity,
    root_cause: m.anomalyType || 'Nominal'
  };
}

async function latestLocalityKpis() {
  const { rows } = await getPlaybackSnapshot();
  const latest = [...rows].reverse();
  const baselines = buildThroughputBaselines(latest);
  const seen = new Set();
  const kpis = [];
  for (const m of latest) {
    if (seen.has(m.locality)) continue;
    seen.add(m.locality);
    kpis.push(mapMetricToKpi(m, baselines));
  }
  return kpis;
}

async function getDashboard(req, res) {
  const snapshot = await getPlaybackSnapshot({ advance: req.query.advance === '1' });
  const latest = [...snapshot.rows].reverse();
  const total = snapshot.rows.length;
  const latestTs = snapshot.timestamp;
  const kpis = await latestLocalityKpis();
  const history = snapshot.rows;
  const baselines = buildThroughputBaselines(history);
  const every = Math.max(1, Math.floor(history.length / 80));
  const signalTrend = history
    .filter((_, index) => index % every === 0)
    .slice(-80)
    .map((item) => ({
      sample_time: item.timestamp,
      rsrp: round(item.signalStrength),
      throughput_mbps: round(item.dataThroughput),
      latency_ms: round(item.latency)
    }));

  const active = kpis.filter((x) => x.status !== 'DOWN').length;
  const down = kpis.filter((x) => x.status === 'DOWN').length;
  const critical = kpis.filter((x) => x.severity === 'Critical').length;
  const degraded = kpis.filter((x) => x.status === 'DEGRADED').length;

  const avgScore = kpis.length ? kpis.reduce((acc, x) => acc + Number(x.health_score || 0), 0) / kpis.length : 0;
  const slaCompliance = kpis.length ? (kpis.filter((x) => x.risk_score < 40).length / kpis.length) * 100 : 0;

  res.json({
    total_towers: new Set(latest.map((item) => item.locality)).size,
    total_samples: total,
    dataset_samples: snapshot.totalSamples,
    playback_step: snapshot.pointer + 1,
    playback_steps: snapshot.totalTimestamps,
    active_towers: active,
    down_towers: down,
    critical_alerts: critical,
    network_health_score: Math.round(avgScore * 10) / 10,
    sla_compliance: Math.round(slaCompliance * 10) / 10,
    degraded_towers: degraded,
    last_refreshed: latestTs || new Date().toISOString(),
    signal_trend: signalTrend,
    network_type_health: networkTypeHealth(history, baselines)
  });
}

async function getKpis(req, res) {
  res.json(await latestLocalityKpis());
}

async function getNetworkHealth(req, res) {
  const kpis = await latestLocalityKpis();
  const regions = kpis.map((item) => ({ region: item.region, health_score: Math.round(Number(item.health_score || 0)) }));

  regions.sort((a, b) => b.health_score - a.health_score);

  const critical = kpis.filter((r) => r.risk_score >= 70).length;
  const warning = kpis.filter((r) => r.risk_score >= 40 && r.risk_score < 70).length;
  const healthy = Math.max(0, regions.length - critical - warning);

  res.json({ healthy, warning, critical, regions: regions.slice(0, 12) });
}

module.exports = {
  getDashboard,
  getKpis,
  getNetworkHealth
};

