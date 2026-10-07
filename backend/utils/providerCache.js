// Bounded in-process caching and single-flight deduplication of public USDA data.
function createProviderCache({ maxEntries = 256, ttlMs = 600000, concurrency = 6, hourlyLimit = 800 } = {}) {
  const entries = new Map();
  let active = 0;
  let used = 0;
  let windowStart = Date.now();
  const queue = [];
  const unavailable = () => Object.assign(new Error("Nutrition service is busy. Please try again later."), { statusCode: 503, expose: true });

  async function run(load) {
    if (active >= concurrency) {
      if (queue.length >= 6) throw unavailable();
      await new Promise((resolve) => queue.push(resolve));
    } else active += 1;
    try {
      if (Date.now() - windowStart >= 3600000) { windowStart = Date.now(); used = 0; }
      if (used >= hourlyLimit) throw unavailable();
      used += 1;
      return await load();
    } finally {
      const next = queue.shift();
      if (next) next(); else active -= 1;
    }
  }

  return async (key, load) => {
    const existing = entries.get(key);
    if (existing && existing.expires > Date.now()) {
      entries.delete(key); entries.set(key, existing);
      return existing.promise;
    }
    if (entries.size >= maxEntries) entries.delete(entries.keys().next().value);
    const entry = { expires: Date.now() + ttlMs };
    entry.promise = run(load).catch((error) => {
      if (entries.get(key) === entry) entries.delete(key);
      throw error;
    });
    entries.set(key, entry);
    return entry.promise;
  };
}

module.exports = { createProviderCache };
