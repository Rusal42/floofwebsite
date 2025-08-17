const allowCors = (handler) => async (event) => {
  const res = await handler(event);
  return {
    ...res,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, x-bot-token',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      ...(res.headers || {})
    }
  };
};

// Access in-memory stats (updated via /api/update-stats)
const { getStats } = require('./_statsStore');
let getStore;
try { ({ getStore } = require('@netlify/blobs')); } catch (_) { getStore = null; }
// Capture cold-start time as a fallback when no stats posted yet
const startTime = Date.now();

const handler = async () => {
  const WEBSITE_VERSION = process.env.WEBSITE_VERSION || 'v2.1.5';
  const env = process.env.NODE_ENV || 'production';
  // Prefer durable blob store if available
  let stats;
  try {
    if (getStore) {
      const store = getStore({ name: 'floof-stats', consistency: 'strong' });
      const blob = await store.get('stats.json', { type: 'json' });
      if (blob && typeof blob === 'object') stats = blob;
    }
  } catch (_) { /* ignore */ }
  if (!stats) stats = getStats();
  // Use bot-provided uptime if available; otherwise fallback to function uptime
  const fnUptimeSec = Math.max(0, Math.floor((Date.now() - startTime) / 1000));
  const statsUptimeSec = Number.isFinite(stats.uptime) ? Math.floor(stats.uptime) : 0;
  const uptimeSec = statsUptimeSec > 0 ? statsUptimeSec : fnUptimeSec;
  // Humanize to days/hours/minutes/seconds
  const days = Math.floor(uptimeSec / 86400);
  const hours = Math.floor((uptimeSec % 86400) / 3600);
  const minutes = Math.floor((uptimeSec % 3600) / 60);
  const seconds = uptimeSec % 60;
  const uptimeFormatted = days > 0
    ? `${days}d ${hours}h ${minutes}m ${seconds}s`
    : `${hours}h ${minutes}m ${seconds}s`;

  // Synthetic single-shard snapshot; real metrics can be wired via a stats endpoint later
  const shardSnapshot = [{
    id: 0,
    status: 'operational',
    uptime: uptimeFormatted,
    latencyMs: stats.ping || 0,
    servers: stats.serverCount || 0,
    users: stats.userCount || 0,
    updatedAt: new Date().toISOString()
  }];

  const payload = {
    success: true,
    status: 'healthy',
    message: '🐾 Floofs Den API is purring along nicely! (Netlify)',
    server: {
      name: 'Floofs Den API',
      // Show explicit placeholder when version is not available from stats
      version: (stats && stats.version) ? stats.version : '---',
      uptime: uptimeFormatted,
      environment: env
    },
    endpoints: {
      stats: '/api/stats',
      auth: '/api/auth/discord',
      health: '/api/health'
    },
    shards: shardSnapshot,
    timestamp: new Date().toISOString(),
    cute_message: '✨ All systems floofy! ✨'
  };

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
      'Pragma': 'no-cache',
      'Expires': '0'
    },
    body: JSON.stringify(payload)
  };
};

exports.handler = allowCors(handler);
