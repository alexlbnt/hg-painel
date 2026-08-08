const { createRequestHandler } = require("@expo/server/adapter/vercel");

// Força o Vercel a empacotar o Prisma
require("@prisma/client");

module.exports = createRequestHandler({
  build: require("path").join(__dirname, "../dist/server"),
});
