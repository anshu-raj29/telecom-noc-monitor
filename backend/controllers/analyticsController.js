const Metric = require('../models/Metric');

function mapTowerMetricToHistoryPoint(m) {
  return {
    sample_time: m.timestamp,
    rsrp: m.signalStrength,
    signal_quality: m.signalQuality,
    throughput_mbps: m.dataThroughput,
    latency_ms: m.latency,
    health_score: m.healthScore,
    anomaly_score: m.anomalyScore
  };
}

function inferTowerStatus(m) {
  if (!m) return 'UP';
  if (m.isAnomaly && (m.anomalyType === 'Weak Signal' || m.anomalyType === 'High Latency')) return 'DEGRADED';
  return 'UP';
}

async function getTower(req, res) {
  const { towerId } = req.params;

  // towerId corresponds to locality/tower_code used by frontend.
  const latest = await Metric.find({ locality: towerId }).sort({ timestamp: -1 }).limit(1).lean();
  const towerMetric = latest[0];
  if (!towerMetric) return res.status(404).json({ message: 'Tower not found' });

  const history = await Metric.find({ locality: towerId }).sort({ timestamp: 1 }).limit(36).lean();

  const tower = {
    tower_code: towerMetric.locality,
    name: towerMetric.locality,
    region: towerMetric.locality,
    vendor: towerMetric.networkType,
    latitude: towerMetric.latitude,
    longitude: towerMetric.longitude,
    sample_time: towerMetric.timestamp,
    health_score: towerMetric.healthScore,
    health_label: towerMetric.healthLabel,
    severity: towerMetric.isAnomaly ? (towerMetric.anomalyType === 'Throughput Degradation' ? 'Warning' : 'Critical') : 'Normal',
    status: inferTowerStatus(towerMetric)
  };

  const mappedHistory = history.map(mapTowerMetricToHistoryPoint);

  res.json({ tower, history: mappedHistory });
}

module.exports = {
  getTower
};

