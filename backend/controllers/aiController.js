const { getCachedMlOverview } = require('../services/aiCacheService');

async function getMlOverview(req, res) {
  try {
    res.json(await getCachedMlOverview());
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

module.exports = {
  getMlOverview
};
