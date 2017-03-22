const path = require("path");
const webpack = require("webpack");
const autoprefixer = require("autoprefixer");
const modulesValues = require("postcss-modules-values");
const HtmlWebpackPlugin = require("html-webpack-plugin");

function getDevtool(env) {
    return (env === "development") ? "eval" : "cheap-module-source-map";
}

function getEntry(env) {
    if (env === "development") {
        return [
            "webpack-dev-server/client?http://localhost:3000",
            "webpack/hot/only-dev-server",
            "react-hot-loader/patch",
            "babel-polyfill",
            "whatwg-fetch",
            "./src/index",
        ];
    }
    return [
        "babel-polyfill",
        "whatwg-fetch",
        "./src/index",
    ];
}

function getPlugins(env) {
    if (env === "development") {
        return [
            new webpack.DefinePlugin({ "process.env": { NODE_ENV: '"development"' } }),
            new webpack.HotModuleReplacementPlugin(),
            new HtmlWebpackPlugin({ template: "index.ejs" }),
        ];
    }
    return [
        new webpack.optimize.OccurenceOrderPlugin(),
        new webpack.DefinePlugin({ "process.env": { NODE_ENV: '"production"' } }),
        new HtmlWebpackPlugin({ template: "index.ejs" }),
    ];
}

module.exports = {
    devtool: getDevtool(process.env.NODE_ENV),
    entry: getEntry(process.env.NODE_ENV),
    plugins: getPlugins(process.env.NODE_ENV),
    resolve: {
        modulesDirectories: ["node_modules", "src"],
    },
    output: {
        path: path.join(__dirname, "dist"),
        filename: "bundle.js",
    },
    module: {
        preLoaders: [
            {
                test: /\.js$/,
                loader: "eslint-loader",
                exclude: /node_modules/,
            },
        ],
        loaders: [
            {
                test: /\.js$/,
                loaders: ["babel"],
                exclude: /node_modules/,
            },
            {
                test: /\.css$/,
                loaders: ["style", "css?modules&importLoaders=1&localIdentName=[name]_[local]_[hash:base64:5]", "postcss"],
            },
            {
                test: /\.svg$/,
                loader: "url-loader?mimetype=image/svg+xml",
            },
        ],
    },
    postcss: [modulesValues, autoprefixer],
};
