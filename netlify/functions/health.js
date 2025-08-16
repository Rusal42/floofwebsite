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

const handler = async () => {
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'ok', timestamp: Date.now() })
  };
};

exports.handler = allowCors(handler);
