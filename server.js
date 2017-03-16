const webpack = require("webpack");
const WebpackDevServer = require("webpack-dev-server");

const config = require("./webpack.config");

const options = {
    hot: process.env.NODE_ENV === "development",
    historyApiFallback: true,
    stats: {
        colors: true,
    },
};

new WebpackDevServer(webpack(config), options).listen(3000, "localhost", (err) => {
    if (err) {
        console.log(err);
    }
    console.log("Listening at localhost:3000");
});
