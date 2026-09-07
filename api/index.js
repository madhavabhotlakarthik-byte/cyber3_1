const serverModule = require("../dist/server/server.js");

module.exports = (req, res) => {
  const handler = serverModule.default || serverModule;
  return handler.fetch(req, res, {});
};
