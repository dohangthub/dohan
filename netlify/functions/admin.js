// Point d'entrée Netlify pour le back-office admin (/admin).
const { handle } = require('../../admin.js');

exports.handler = async (event) => {
  const r = await handle(event.httpMethod, event.queryStringParameters || {}, event.body);
  return { statusCode: r.status, headers: r.headers, body: r.body };
};
