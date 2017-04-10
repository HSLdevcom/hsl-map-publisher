const webpack = require("webpack");
const WebpackDevServer = require("webpack-dev-server");

const defaultOptions = {
    hot: process.env.NODE_ENV === "development",
    historyApiFallback: true,
    stats: { colors: true },
};

module.exports = (config, port, options = {}) => {
    const opts = Object.assign({}, defaultOptions, options);

    const compiler = webpack(config);
    const server = new WebpackDevServer(compiler, opts);

    server.listen(port, (err) => {
        if (err) console.log(err);
        console.log(`Listening at ${port}`);
    });
};
