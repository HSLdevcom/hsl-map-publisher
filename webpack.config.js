const path = require("path");
const webpack = require("webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = {
    devtool: "source-map",
    entry: "./src/index.js",
    plugins: [
        new webpack.DefinePlugin({ "process.env": { NODE_ENV: '"development"' } }),
        new webpack.optimize.ModuleConcatenationPlugin(),
        new HtmlWebpackPlugin({ template: "index.ejs" }),
    ],
    resolve: {
        modules: ["node_modules", "src"],
    },
    output: {
        publicPath: "",
        path: path.join(__dirname, "dist"),
        filename: "bundle.js",
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                loader: "eslint-loader",
                enforce: "pre",
                exclude: /node_modules/,
            },
            {
                test: /\.js$/,
                loader: "babel-loader",
                exclude: /node_modules/,
            },
            {
                test: /\.worker\.js$/,
                use: ["babel-loader", "worker-loader"],
                exclude: /node_modules/,
            },
            {
                test: /\.css$/,
                use: [
                    "style-loader",
                    {
                        loader: "css-loader",
                        options: {
                            modules: true,
                            localIdentName: "[name]_[local]_[hash:base64:5]",
                        },
                    },
                ],
            },
            {
                test: /\.svg$/,
                loader: "raw-loader",
            },
        ],
    },
};
