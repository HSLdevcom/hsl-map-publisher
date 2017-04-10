const createServer = require("./server.base");
const config = require("./webpack.config.ui");

const options = {
    proxy: {
        "/api/**": {
            target: "http://localhost:4000",
            pathRewrite: { "^/api": "" },
            secure: false,
        },
    },
};

module.exports = createServer(config, 5000, options);
