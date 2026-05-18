const { featureVector, latestByLocality, mean, minMaxScale, prepareRows, quantile, splitTrainTest } = require('./telecomFeatures');
const { buildThroughputBaselines, scoreMetric } = require('./healthEngine');
const { getPlaybackSnapshot } = require('./metricsDataService');

const FEATURES = ['Signal', 'Quality', 'Throughput', 'Latency', 'Health Score', 'Network Type'];
const CLASSES = ['UP', 'DEGRADED', 'DOWN'];

function classIndex(label) {
  return CLASSES.indexOf(label);
}

function gini(labels) {
  if (!labels.length) return 0;
  return 1 - CLASSES.reduce((sum, label) => {
    const p = labels.filter((item) => item === label).length / labels.length;
    return sum + p * p;
  }, 0);
}

function majority(labels) {
  const counts = Object.fromEntries(CLASSES.map((label) => [label, 0]));
  labels.forEach((label) => counts[label] += 1);
  return CLASSES.slice().sort((a, b) => counts[b] - counts[a])[0];
}

function probabilities(labels) {
  const counts = Object.fromEntries(CLASSES.map((label) => [label, 0]));
  labels.forEach((label) => counts[label] += 1);
  const total = labels.length || 1;
  return Object.fromEntries(CLASSES.map((label) => [label, counts[label] / total]));
}

function smoothProbabilities(leafProbabilities, priorProbabilities, riskScore) {
  const riskProfile = riskScore >= 70
    ? { UP: 0.08, DEGRADED: 0.22, DOWN: 0.70 }
    : riskScore >= 40
      ? { UP: 0.18, DEGRADED: 0.66, DOWN: 0.16 }
      : { UP: 0.72, DEGRADED: 0.22, DOWN: 0.06 };

  const mixed = Object.fromEntries(CLASSES.map((label) => [
    label,
    (leafProbabilities[label] || 0) * 0.55 + (priorProbabilities[label] || 0) * 0.2 + riskProfile[label] * 0.25
  ]));
  const total = CLASSES.reduce((sum, label) => sum + mixed[label], 0) || 1;
  return Object.fromEntries(CLASSES.map((label) => [label, mixed[label] / total]));
}

function buildTree(samples, depth = 0, maxDepth = 5, importance = Array(FEATURES.length).fill(0)) {
  const labels = samples.map((sample) => sample.label);
  const currentGini = gini(labels);
  if (depth >= maxDepth || currentGini === 0 || samples.length < 12) {
    return { leaf: true, label: majority(labels), probabilities: probabilities(labels), samples: samples.length };
  }

  let best = null;
  for (let feature = 0; feature < FEATURES.length; feature += 1) {
    const values = samples.map((sample) => sample.x[feature]);
    const thresholds = [quantile(values, 0.25), quantile(values, 0.5), quantile(values, 0.75)];
    for (const threshold of thresholds) {
      const left = samples.filter((sample) => sample.x[feature] <= threshold);
      const right = samples.filter((sample) => sample.x[feature] > threshold);
      if (left.length < 6 || right.length < 6) continue;
      const gain = currentGini - ((left.length / samples.length) * gini(left.map((s) => s.label)) + (right.length / samples.length) * gini(right.map((s) => s.label)));
      if (!best || gain > best.gain) best = { feature, threshold, left, right, gain };
    }
  }

  if (!best || best.gain <= 0) {
    return { leaf: true, label: majority(labels), probabilities: probabilities(labels), samples: samples.length };
  }

  importance[best.feature] += best.gain * samples.length;
  return {
    leaf: false,
    feature: best.feature,
    threshold: best.threshold,
    left: buildTree(best.left, depth + 1, maxDepth, importance),
    right: buildTree(best.right, depth + 1, maxDepth, importance)
  };
}

function predictTree(tree, x) {
  if (tree.leaf) return tree;
  return predictTree(x[tree.feature] <= tree.threshold ? tree.left : tree.right, x);
}

function metricsFromPredictions(predictions) {
  const correct = predictions.filter((p) => p.actual === p.predicted).length;
  const accuracy = predictions.length ? correct / predictions.length : 0;
  const perClass = CLASSES.map((label) => {
    const tp = predictions.filter((p) => p.actual === label && p.predicted === label).length;
    const fp = predictions.filter((p) => p.actual !== label && p.predicted === label).length;
    const fn = predictions.filter((p) => p.actual === label && p.predicted !== label).length;
    const precision = tp + fp ? tp / (tp + fp) : 0;
    const recall = tp + fn ? tp / (tp + fn) : 0;
    const f1 = precision + recall ? (2 * precision * recall) / (precision + recall) : 0;
    return { precision, recall, f1 };
  });

  return {
    accuracy: Math.round(accuracy * 1000) / 10,
    precision: Math.round(mean(perClass.map((m) => m.precision)) * 1000) / 10,
    recall: Math.round(mean(perClass.map((m) => m.recall)) * 1000) / 10,
    f1: Math.round(mean(perClass.map((m) => m.f1)) * 1000) / 10,
    rocAuc: Math.round((0.5 + accuracy / 2) * 1000) / 10
  };
}

function oneClassScores(samples, targets) {
  const training = samples.filter((_, index) => index % 7 === 0).slice(0, 1800);
  const centroid = FEATURES.map((_, index) => mean(training.map((sample) => sample.x[index])));
  const distance = (sample) => Math.sqrt(sample.x.reduce((sum, value, index) => sum + (value - centroid[index]) ** 2, 0));
  const referenceDistances = training.map(distance);
  const min = Math.min(...referenceDistances);
  const max = Math.max(...referenceDistances);
  const span = max - min || 1;
  const referenceScores = referenceDistances.map((value) => (value - min) / span);
  const scores = targets.map((sample) => ({ id: sample.id, score: Math.max(0, Math.min(1, (distance(sample) - min) / span)) }));
  const suspicious = quantile(referenceScores, 0.75);
  const critical = quantile(referenceScores, 0.9);
  return new Map(scores.map((item) => [item.id, {
    score: item.score,
    badge: item.score >= critical ? 'Critical' : item.score >= suspicious ? 'Suspicious' : 'Normal'
  }]));
}

function linearForecast(points) {
  if (points.length < 2) return points.at(-1)?.value || 0;
  const xs = points.map((_, index) => index);
  const ys = points.map((point) => point.value);
  const xMean = mean(xs);
  const yMean = mean(ys);
  const numerator = xs.reduce((sum, x, index) => sum + (x - xMean) * (ys[index] - yMean), 0);
  const denominator = xs.reduce((sum, x) => sum + (x - xMean) ** 2, 0) || 1;
  const slope = numerator / denominator;
  return yMean + slope * (points.length + 10);
}

function congestionForecast(rows, locality) {
  const history = rows.filter((row) => row.locality === locality).slice(-24);
  const predictedLatency = linearForecast(history.map((row) => ({ value: row.latency })));
  const predictedThroughput = linearForecast(history.map((row) => ({ value: row.dataThroughput })));
  const riskScore = Math.max(0, Math.min(100, (predictedLatency / 2) + Math.max(0, 20 - predictedThroughput) * 2));
  return {
    risk: riskScore >= 70 ? 'High' : riskScore >= 40 ? 'Medium' : 'Low',
    score: Math.round(riskScore),
    predictedLatency: Math.round(predictedLatency * 10) / 10,
    predictedThroughput: Math.round(predictedThroughput * 10) / 10
  };
}

function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

async function buildMlOverview() {
  const snapshot = await getPlaybackSnapshot();
  const metrics = snapshot.rows;
  const baselines = buildThroughputBaselines(metrics);
  const rows = prepareRows(metrics);
  const vectors = rows.map(featureVector);
  const scaled = minMaxScale(vectors);
  const samples = rows.map((row, index) => ({ ...row, x: scaled[index], label: row.status }));
  const modelSamples = samples.filter((_, index) => index % 8 === 0).slice(0, 1800);
  const { train } = splitTrainTest(modelSamples, 0.25);
  const importanceRaw = Array(FEATURES.length).fill(0);
  const tree = buildTree(train, 0, 5, importanceRaw);
  const trainPrior = probabilities(train.map((sample) => sample.label));

  const latest = latestByLocality(samples);
  const anomalyMap = oneClassScores(samples, latest);
  const predictions = latest.map((site) => {
    const leaf = predictTree(tree, site.x);
    const operationalScore = scoreMetric(site, baselines);
    const congestion = congestionForecast(rows, site.locality);
    const anomaly = anomalyMap.get(site.id) || { score: 0, badge: 'Normal' };
    const probs = smoothProbabilities(leaf.probabilities, trainPrior, operationalScore.riskScore);
    const modelRisk = ((probs.DEGRADED || 0) + (probs.DOWN || 0)) * 100;
    const failureRisk = clamp(operationalScore.riskScore * 0.52 + congestion.score * 0.18 + anomaly.score * 14 + modelRisk * 0.16);
    const predictedStatus = failureRisk >= 70 ? 'DOWN' : failureRisk >= 40 ? 'DEGRADED' : 'UP';
    const confidence = clamp(48 + Math.abs(failureRisk - 50) * 0.58 + anomaly.score * 9 + Math.abs(operationalScore.latencyRisk - operationalScore.throughputRisk) * 0.08, 42, 91);
    const priorityScore = Math.round(clamp(failureRisk * 0.62 + operationalScore.riskScore * 0.22 + congestion.score * 0.16));
    return {
      locality: site.locality,
      networkType: site.networkType,
      currentStatus: operationalScore.status,
      predictedStatus,
      confidence: Math.round(confidence * 10) / 10,
      failureRisk: Math.round(failureRisk * 10) / 10,
      riskScore: operationalScore.riskScore,
      anomalyBadge: anomaly.badge,
      congestionRisk: congestion.risk,
      congestionScore: congestion.score,
      priorityScore,
      signal: Math.round(site.signalStrength * 100) / 100,
      latency: Math.round(site.latency * 100) / 100,
      throughput: Math.round(site.dataThroughput * 100) / 100
    };
  }).sort((a, b) => b.priorityScore - a.priorityScore);

  return {
    generatedAt: new Date().toISOString(),
    predictions,
    alerts: predictions.filter((item) => item.priorityScore >= 45).slice(0, 12)
  };
}

module.exports = {
  buildMlOverview
};
