const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

function normHeader(h) {
  return String(h || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
}

function inferField(row, candidates) {
  for (const c of candidates) {
    if (row[c] != null && row[c] !== '') return row[c];
  }
  return null;
}

function parseRow(row) {
  const normalized = {};
  for (const [k, v] of Object.entries(row)) {
    normalized[normHeader(k)] = v;
  }

  const timestampRaw = inferField(normalized, ['timestamp', 'time', 'sample_time', 'sampletime', 'datetime']);
  const locality = inferField(normalized, ['locality', 'city', 'area', 'region']);
  const latitude = inferField(normalized, ['latitude', 'lat']);
  const longitude = inferField(normalized, ['longitude', 'lon', 'lng']);
  const networkType = inferField(normalized, ['network_type', 'networktype', 'rat', 'rat_type']);
  const signalStrength = inferField(normalized, ['signal_strength', 'signal_strength_dbm', 'rsrp', 'rsrp_dbm', 'rsrp_db']);
  const signalQuality = inferField(normalized, ['signal_quality', 'rsrq', 'rsrq_db']);
  const dataThroughput = inferField(normalized, ['data_throughput', 'data_throughput_mbps', 'throughput_mbps', 'throughput']);
  const latency = inferField(normalized, ['latency', 'latency_ms']);

  const bb60c = inferField(normalized, ['bb60c', 'bb60c_measurement', 'bb60c_measurement_dbm']);
  const srsRAN = inferField(normalized, ['srsran', 'srsran_measurement', 'srsran_measurement_dbm', 'srs_ran', 'srs_ran_metric']);
  const bladeRFxA9 = inferField(normalized, ['bladerfxa9', 'blade_rfxa9', 'blade_rfx_a9', 'bladerfxa9_measurement', 'bladerfxa9_measurement_dbm']);

  function toNum(x) {
    const n = x == null ? null : Number(String(x).trim());
    return Number.isFinite(n) ? n : null;
  }

  const ts = timestampRaw ? new Date(String(timestampRaw).trim()) : null;
  if (!ts || !locality || latitude == null || longitude == null || networkType == null) {
    return null;
  }

  const lat = toNum(latitude);
  const lon = toNum(longitude);
  const ss = toNum(signalStrength);
  const sq = toNum(signalQuality);
  const thr = toNum(dataThroughput);
  const latMs = toNum(latency);

  if ([lat, lon].some((v) => v == null)) return null;

  return {
    timestamp: ts,
    locality: String(locality).trim(),
    latitude: lat,
    longitude: lon,
    networkType: String(networkType).trim(),
    signalStrength: ss === 0 ? null : ss,
    signalQuality: sq === 0 ? null : sq,
    dataThroughput: thr === 0 ? null : thr,
    latency: latMs === 0 ? null : latMs,
    bb60c: toNum(bb60c) === 0 ? null : toNum(bb60c),
    srsRAN: toNum(srsRAN) === 0 ? null : toNum(srsRAN),
    bladeRFxA9: toNum(bladeRFxA9) === 0 ? null : toNum(bladeRFxA9)
  };
}

function derivedSignalQuality(signalStrength) {
  const signal = Number(signalStrength);
  if (!Number.isFinite(signal)) return null;
  if (signal > -80) return Math.max(85, Math.min(100, 85 + ((signal + 80) / 20) * 15));
  if (signal >= -90) return 65 + ((signal + 90) / 10) * 20;
  if (signal >= -100) return 40 + ((signal + 100) / 10) * 25;
  return Math.max(5, Math.min(40, 40 - ((-100 - signal) / 25) * 35));
}

function median(values, fallback = 0) {
  const sorted = values.filter(Number.isFinite).sort((a, b) => a - b);
  if (!sorted.length) return fallback;
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function normalize(records, field, normField, inverse = false) {
  const values = records.map((r) => r[field]).filter(Number.isFinite);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  for (const record of records) {
    const scaled = (record[field] - min) / span;
    record[normField] = Math.max(0, Math.min(1, inverse ? 1 - scaled : scaled));
  }
}

function cleanAndNormalize(records) {
  const numericFields = ['signalStrength', 'signalQuality', 'dataThroughput', 'latency', 'bb60c', 'srsRAN', 'bladeRFxA9'];
  const fallbacks = {
    signalStrength: -95,
    signalQuality: 75,
    dataThroughput: 5,
    latency: 80,
    bb60c: null,
    srsRAN: null,
    bladeRFxA9: null
  };
  const medians = Object.fromEntries(numericFields.map((field) => [field, median(records.map((r) => r[field]), fallbacks[field])]));

  const cleaned = records.map((record) => {
    const next = { ...record };
    for (const field of numericFields) {
      if (!Number.isFinite(next[field])) next[field] = medians[field];
    }
    if (!Number.isFinite(record.signalQuality) || Number(record.signalQuality) === 0) {
      next.signalQuality = derivedSignalQuality(next.signalStrength);
    }
    next.networkType = String(next.networkType || 'Unknown').trim().toUpperCase();
    return next;
  });

  normalize(cleaned, 'signalStrength', 'signalStrengthNorm');
  normalize(cleaned, 'signalQuality', 'signalQualityNorm');
  normalize(cleaned, 'dataThroughput', 'throughputNorm');
  normalize(cleaned, 'latency', 'latencyNorm', true);
  return cleaned;
}

async function readSignalMetricsCsv(filePath) {
  const abs = path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), filePath);
  const absNorm = abs;
  if (!fs.existsSync(absNorm)) {
    // eslint-disable-next-line no-console
    console.log('csvParser abs=', abs);
    // eslint-disable-next-line no-console
    console.log('csvParser absNorm=', absNorm);
    // eslint-disable-next-line no-console
    console.log('cwd=', process.cwd());
    // Try resolving from project root explicitly
    const projectCsv = path.join(process.cwd(), '..', 'signal_metrics.csv');
    if (fs.existsSync(projectCsv)) return readCsvAt(projectCsv);
    const projectCsv2 = path.join(process.cwd(), '..', 'signal_metrics.csv');
    if (fs.existsSync(projectCsv2)) return readCsvAt(projectCsv2);
    const projectCsv3 = path.join(process.cwd(), 'backend', 'signal_metrics.csv');
    if (fs.existsSync(projectCsv3)) return readCsvAt(projectCsv3);
    const projectCsv4 = path.join(process.cwd(), 'signal_metrics.csv');
    if (fs.existsSync(projectCsv4)) return readCsvAt(projectCsv4);
    // Helpful diagnostics during dev
    const alt = path.join(process.cwd(), '..', filePath);
    if (fs.existsSync(alt)) return readCsvAt(alt);
    throw new Error(`CSV not found: ${abs}`);
  }

  return readCsvAt(abs);

  function readCsvAt(p) {
    const rows = [];
    return new Promise((resolve, reject) => {
      fs.createReadStream(p)
        .pipe(csv())
        .on('data', (row) => {
          const parsed = parseRow(row);
          if (parsed) rows.push(parsed);
        })
        .on('end', () => {
          const cleaned = cleanAndNormalize(rows);
          writeProcessedDataset(cleaned, path.join(path.dirname(p), 'processed_dataset.csv'));
          resolve(cleaned);
        })
        .on('error', reject);
    });
  }
}

function writeProcessedDataset(records, filePath) {
  const headers = [
    'timestamp', 'locality', 'latitude', 'longitude', 'signalStrength', 'signalQuality',
    'dataThroughput', 'latency', 'networkType', 'bb60c', 'srsRAN', 'bladeRFxA9',
    'signalStrengthNorm', 'signalQualityNorm', 'throughputNorm', 'latencyNorm'
  ];
  const lines = [headers.join(',')];
  for (const record of records) {
    lines.push(headers.map((field) => {
      const value = record[field] instanceof Date ? record[field].toISOString() : record[field];
      return `"${String(value ?? '').replace(/"/g, '""')}"`;
    }).join(','));
  }
  fs.writeFileSync(filePath, lines.join('\n'));
}

module.exports = {
  readSignalMetricsCsv
};

