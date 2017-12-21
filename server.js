/* eslint-disable import/no-extraneous-dependencies */
const webpack = require("webpack");
const WebpackDevServer = require("webpack-dev-server");
const config = require("./webpack.config");

const PORT = 5000;

config.devtool = "eval";

if (process.env.HMR === "true") {
    config.entry = [
        `webpack-dev-server/client?http://localhost:${PORT}`,
        "webpack/hot/dev-server",
        ...config.entry,
    ];
    config.plugins = [
        new webpack.HotModuleReplacementPlugin(),
        ...config.plugins,
    ];
}

const options = {
    hot: process.env.HMR === "true",
    historyApiFallback: true,
    stats: { colors: true },
};

const server = new WebpackDevServer(webpack(config), options);

server.listen(PORT);
