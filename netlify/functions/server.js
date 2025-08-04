const { createServer } = require('http');
const { app } = require('../../dist/index.js');

exports.handler = async (event, context) => {
  const { httpMethod, path, headers, body, queryStringParameters } = event;
  
  const req = {
    method: httpMethod,
    url: path,
    headers: headers,
    body: body ? JSON.parse(body) : undefined,
    query: queryStringParameters || {}
  };
  
  const res = await app.fetch(req);
  const resBody = await res.text();
  
  return {
    statusCode: res.status,
    headers: Object.fromEntries(res.headers.entries()),
    body: resBody
  };
}; 