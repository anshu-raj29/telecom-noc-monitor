const Metric = require('../models/Metric');

const CACHE_MS = 5000;
let allCache = { expiresAt: 0, pending: null, rows: null, timestamps: null };
let pointer = null;
let snapshot = { expiresAt: 0, rows: null, timestamp: null };

async function loadAllMetrics() {
  const now = Date.now();
  if (allCache.rows && allCache.expiresAt > now) return allCache;
  if (allCache.pending) return allCache.pending;

  allCache.pending = Metric.find({}).sort({ timestamp: 1 }).lean()
    .then((rows) => {
      const timestamps = Array.from(new Set(rows.map((row) => new Date(row.timestamp).getTime()))).sort((a, b) => a - b);
      allCache = {
        expiresAt: Date.now() + 60000,
        pending: null,
        rows,
        timestamps
      };
      if (pointer == null || pointer >= timestamps.length) pointer = firstCompleteLocalityIndex(rows, timestamps);
      return allCache;
    })
    .catch((error) => {
      allCache.pending = null;
      throw error;
    });

  return allCache.pending;
}

async function getMetricCount() {
  const { rows } = await loadAllMetrics();
  return rows.length;
}

async function getPlaybackSnapshot({ advance = false } = {}) {
  const loaded = await loadAllMetrics();
  if (!loaded.timestamps.length) return { rows: [], timestamp: null, totalSamples: 0, totalTimestamps: 0, pointer: 0 };

  if (advance || !snapshot.rows) {
    pointer = (pointer + 1) % loaded.timestamps.length;
    snapshot.rows = null;
  }

  const now = Date.now();
  if (snapshot.rows && snapshot.expiresAt > now) {
    return {
      rows: snapshot.rows,
      timestamp: snapshot.timestamp,
      totalSamples: loaded.rows.length,
      totalTimestamps: loaded.timestamps.length,
      pointer
    };
  }

  const timestamp = loaded.timestamps[pointer];
  const rows = loaded.rows.filter((row) => new Date(row.timestamp).getTime() <= timestamp);
  snapshot = {
    expiresAt: now + CACHE_MS,
    rows,
    timestamp: new Date(timestamp).toISOString()
  };

  return {
    rows,
    timestamp: snapshot.timestamp,
    totalSamples: loaded.rows.length,
    totalTimestamps: loaded.timestamps.length,
    pointer
  };
}

function clearMetricCache() {
  allCache = { expiresAt: 0, pending: null, rows: null, timestamps: null };
  snapshot = { expiresAt: 0, rows: null, timestamp: null };
  pointer = null;
}

function firstCompleteLocalityIndex(rows, timestamps) {
  const localityCount = new Set(rows.map((row) => row.locality)).size;
  const seen = new Set();
  let rowIndex = 0;
  for (let i = 0; i < timestamps.length; i += 1) {
    while (rowIndex < rows.length && new Date(rows[rowIndex].timestamp).getTime() <= timestamps[i]) {
      seen.add(rows[rowIndex].locality);
      rowIndex += 1;
    }
    if (seen.size >= localityCount) return i;
  }
  return Math.max(0, Math.min(240, timestamps.length - 1));
}

module.exports = {
  clearMetricCache,
  getMetricCount,
  getPlaybackSnapshot
};
