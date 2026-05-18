const { buildMlOverview } = require('./mlEngine');

const CACHE_MS = 5000;
const cache = {
  ml: { value: null, expiresAt: 0, pending: null }
};

async function cached(key, builder) {
  const now = Date.now();
  if (cache[key].value && cache[key].expiresAt > now) return cache[key].value;
  if (cache[key].pending) return cache[key].pending;

  cache[key].pending = builder()
    .then((value) => {
      cache[key].value = value;
      cache[key].expiresAt = Date.now() + CACHE_MS;
      cache[key].pending = null;
      return value;
    })
    .catch((error) => {
      cache[key].pending = null;
      throw error;
    });

  return cache[key].pending;
}

function getCachedMlOverview() {
  return cached('ml', buildMlOverview);
}

module.exports = {
  getCachedMlOverview
};
