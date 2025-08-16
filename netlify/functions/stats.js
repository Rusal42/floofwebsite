const { getStats } = require('./_statsStore');

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
  const stats = getStats();
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(stats)
  };
};

exports.handler = allowCors(handler);
