const path = require("path");
const webpack = require("webpack");
const autoprefixer = require("autoprefixer");
const modulesValues = require("postcss-modules-values");
const HtmlWebpackPlugin = require("html-webpack-plugin");

function getDevtool() {
    return (process.env.NODE_ENV === "development") ? "eval" : "cheap-module-source-map";
}

function getEntry(entry, port) {
    if (process.env.NODE_ENV === "development") {
        return [
            `webpack-dev-server/client?http://localhost:${port}`,
            "webpack/hot/only-dev-server",
            "react-hot-loader/patch",
            "babel-polyfill",
            "whatwg-fetch",
            entry,
        ];
    }
    return [
        "babel-polyfill",
        "whatwg-fetch",
        entry,
    ];
}

function getPlugins() {
    if (process.env.NODE_ENV === "development") {
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

module.exports = (options) => {
    const { directory, entry, port } = options;

    return {
        devtool: getDevtool(),
        entry: getEntry(entry, port),
        plugins: getPlugins(),
        resolve: {
            modulesDirectories: ["node_modules", directory],
        },
        output: {
            publicPath: "",
            path: path.join(__dirname, "dist"),
            filename: "bundle.js",
        },
        module: {
            preLoaders: [
                {
                    test: /\.js$/,
                    loader: "eslint",
                    exclude: /node_modules/,
                },
            ],
            loaders: [
                {
                    test: /\.js$/,
                    loader: "babel",
                    exclude: /node_modules/,
                },
                {
                    test: /\.css$/,
                    loaders: [
                        "style",
                        "css?modules&importLoaders=1&localIdentName=[name]_[local]_[hash:base64:5]",
                        "postcss",
                    ],
                },
                {
                    test: /\.svg$/,
                    loaders: ["svg-inline?classPrefix&idPrefix", "svgo"],
                },
                {
                    test: /\.json$/,
                    loader: "json",
                },
            ],
        },
        postcss: [modulesValues, autoprefixer],
    };
};
