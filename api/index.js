// Vercel serverless-хендлер.
// Vercel сам раздаёт статику (index.html, assets) и проксирует /api/* сюда.
const { handler } = require("../server.js");

module.exports = async (req, res) => {
  // Устанавливаем корректный путь статики на Vercel не требуется:
  // до функции доходят только /api/* благодаря vercel.json rewrites.
  await handler(req, res);
};