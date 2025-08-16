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
// Capture cold-start time as a fallback when no stats posted yet
const startTime = Date.now();

const handler = async () => {
  const WEBSITE_VERSION = process.env.WEBSITE_VERSION || 'v2.1.5';
  const env = process.env.NODE_ENV || 'production';
  const stats = getStats();
  // Prefer bot-provided uptime (in seconds). Fallback to function uptime.
  const uptimeSec = Number.isFinite(stats.uptime) ? Math.floor(stats.uptime) : Math.max(0, Math.floor((Date.now() - startTime) / 1000));
  const uptimeFormatted = `${Math.floor(uptimeSec / 3600)}h ${Math.floor((uptimeSec % 3600) / 60)}m ${uptimeSec % 60}s`;

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
      version: WEBSITE_VERSION,
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
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  };
};

exports.handler = allowCors(handler);
