// Simple in-memory stats store for Netlify Functions.
// Note: This resets when functions cold-start. For persistence, use Netlify KV/Blobs/Redis later.

const store = {
  serverCount: 8,
  userCount: 30,
  commandsUsed: 150,
  uptime: 50.0,
  ping: 42,
  lastUpdated: new Date().toISOString()
};

function getStats() {
  return store;
}

function updateStats(partial) {
  Object.assign(store, partial);
  if (!store.lastUpdated) store.lastUpdated = new Date().toISOString();
  return store;
}

module.exports = { getStats, updateStats };
