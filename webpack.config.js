var path = require("path");
var webpack = require("webpack");
var autoprefixer = require("autoprefixer");
var HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = {
    devtool: "eval",
    entry: [
        "webpack-dev-server/client?http://localhost:3000",
        "webpack/hot/only-dev-server",
        "react-hot-loader/patch",
        "babel-polyfill",
        "whatwg-fetch",
        "./src/index"
    ],
    resolve: {
        modulesDirectories: ["node_modules", "src"]
    },
    output: {
        path: path.join(__dirname, "dist"),
        filename: "bundle.js"
    },
    module: {
        preLoaders: [
            {
                test: /\.js$/,
                loader: "eslint-loader",
                exclude: /node_modules/
            }
        ],
        loaders: [
            {
                test: /\.js$/,
                loaders: ["babel"],
                exclude: /node_modules/
            },
            {
                test: /\.css$/,
                loaders: ["style", "css?modules&importLoaders=1&localIdentName=[name]_[local]_[hash:base64:5]", "postcss"]
            },
            {
                test: /\.svg$/,
                loader: "url-loader?mimetype=image/svg+xml"
            }
        ]
    },
    postcss: [autoprefixer],
    plugins: [
        new webpack.DefinePlugin({
            "process.env": {
                NODE_ENV: '"development"'
            }
        }),
        new webpack.HotModuleReplacementPlugin(),
        new HtmlWebpackPlugin({template: "index.ejs"})
    ]
};
