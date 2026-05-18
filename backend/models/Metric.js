const mongoose = require('mongoose');

const MetricSchema = new mongoose.Schema({
  timestamp: { type: Date, required: true },
  locality: { type: String, required: true },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  signalStrength: { type: Number, required: true }, // dBm
  signalQuality: { type: Number, required: true }, // %
  dataThroughput: { type: Number, required: true }, // Mbps
  latency: { type: Number, required: true }, // ms
  networkType: { type: String, required: true }, // 3G, 4G, LTE, 5G
  bb60c: { type: Number },
  srsRAN: { type: Number },
  bladeRFxA9: { type: Number },
  signalStrengthNorm: { type: Number },
  signalQualityNorm: { type: Number },
  throughputNorm: { type: Number },
  latencyNorm: { type: Number },
  isAnomaly: { type: Boolean, default: false },
  anomalyType: { type: String, default: null },
  anomalyScore: { type: Number, default: 0 },
  healthScore: { type: Number, default: 60 },
  healthLabel: { type: String, default: 'Moderate' },
});

MetricSchema.index({ locality: 1, timestamp: -1 });
MetricSchema.index({ isAnomaly: 1, timestamp: -1 });

module.exports = mongoose.model('Metric', MetricSchema);
