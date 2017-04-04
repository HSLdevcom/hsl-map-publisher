const createConfig = require("./webpack.config.base");

module.exports = createConfig({
    directory: "src",
    entry: "./src/index.js",
});
