const createServer = require("./server.base");
const config = require("./webpack.config.ui");

module.exports = createServer({ config, port: 5000 });
