const { getStats } = require('./_statsStore');
let getStore;
try { ({ getStore } = require('@netlify/blobs')); } catch (_) { getStore = null; }

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

const handler = async () => {
  // Prefer durable blob store if available to avoid per-instance memory divergence
  let stats;
  try {
    if (getStore) {
      const store = getStore({ name: 'floof-stats', consistency: 'strong' });
      const blob = await store.get('stats.json', { type: 'json' });
      if (blob && typeof blob === 'object') {
        stats = blob;
      }
    }
  } catch (_) {
    // ignore blob read errors
  }
  if (!stats) stats = getStats();
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
      'Pragma': 'no-cache',
      'Expires': '0'
    },
    body: JSON.stringify(stats)
  };
};

exports.handler = allowCors(handler);
