const webpack = require("webpack");
const WebpackDevServer = require("webpack-dev-server");
const HtmlWebpackPlugin = require("html-webpack-plugin");

const PORT = 3000;

const defaultOptions = {
    hot: process.env.HMR,
    historyApiFallback: true,
    stats: { colors: true },
    disableHostCheck: false,
};

function createServer(config, port, options = {}) {
    const opts = Object.assign({}, defaultOptions, options);

    const compiler = webpack(config);
    const server = new WebpackDevServer(compiler, opts);

    server.listen(port, (err) => {
        if (err) console.log(err);
        console.log(`Listening at ${port}`);
    });
}

const config = require("./webpack.config");

module.exports = createServer({
    ...config,
    devtool: "eval",
    entry: [
        `webpack-dev-server/client?http://localhost:${PORT}`,
        "webpack/hot/only-dev-server",
        "./src/index.js",
    ],
    plugins: [
        new webpack.DefinePlugin({ "process.env": { NODE_ENV: '"development"' } }),
        new webpack.HotModuleReplacementPlugin(),
        new HtmlWebpackPlugin({ template: "index.ejs" }),
    ],
}, 3000);
