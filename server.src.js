const createServer = require("./server.base");
const config = require("./webpack.config.src");

module.exports = createServer(config, 3000);
