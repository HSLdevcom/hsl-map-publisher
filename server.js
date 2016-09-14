var webpack = require("webpack");
var WebpackDevServer = require("webpack-dev-server");

var config = require("./webpack.config");

var options = {
    hot: process.env.NODE_ENV === "development",
    historyApiFallback: true,
    stats: {
        colors: true
    }
};

new WebpackDevServer(webpack(config), options).listen(3000, "localhost", function (err) {
    if (err) {
        console.log(err);
    }
    console.log("Listening at localhost:3000");
});
