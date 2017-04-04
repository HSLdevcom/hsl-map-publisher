const createServer = require("./server.base");
const config = require("./webpack.config.src");

module.exports = createServer({ config, port: 3000 });
