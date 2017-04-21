const createConfig = require("./webpack.config.base");

module.exports = createConfig({
    directory: "ui",
    entry: "./ui/index.js",
    port: 5000,
});
