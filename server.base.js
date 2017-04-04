const webpack = require("webpack");
const WebpackDevServer = require("webpack-dev-server");

const options = {
    hot: process.env.NODE_ENV === "development",
    historyApiFallback: true,
    stats: { colors: true },
};

module.exports = (opts) => {
    const { config, port } = opts;
    new WebpackDevServer(webpack(config), options).listen(port, "localhost", (err) => {
        if (err) console.log(err);
        console.log(`Listening at localhost:${port}`);
    });
};
