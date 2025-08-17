const { updateStats, getStats } = require('./_statsStore');
let getStore;
try { ({ getStore } = require('@netlify/blobs')); } catch (_) { getStore = null; }

const BOT_API_TOKEN = process.env.BOT_API_TOKEN;

const allowCors = (handler) => async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, x-bot-token',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
      },
      body: ''
    };
  }
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

const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const token = event.headers['x-bot-token'] || event.headers['X-Bot-Token'];
  // If a BOT_API_TOKEN is configured, enforce it. If not configured, allow updates (no-auth mode).
  if (BOT_API_TOKEN && token !== BOT_API_TOKEN) {
    return {
      statusCode: 401,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Unauthorized' })
    };
  }

  let payload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch (e) {
    return { statusCode: 400, body: 'Invalid JSON' };
  }

  const allowed = ['serverCount', 'userCount', 'commandsUsed', 'uptime', 'ping', 'version'];
  const updates = {};
  for (const key of allowed) {
    if (payload[key] !== undefined) updates[key] = payload[key];
  }
  updates.lastUpdated = new Date().toISOString();

  const updated = updateStats(updates);

  // Persist to Netlify Blobs (if available) so other function instances can read the latest stats
  try {
    if (getStore) {
      const store = getStore({ name: 'floof-stats', consistency: 'strong' });
      await store.set('stats.json', JSON.stringify(updated));
    }
  } catch (_) {
    // ignore blob write errors to avoid breaking the endpoint
  }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ success: true, stats: updated })
  };
};

exports.handler = allowCors(handler);
