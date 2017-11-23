const path = require("path");
const webpack = require("webpack");
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
            entry,
        ];
    }
    return [
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
        new webpack.DefinePlugin({ "process.env": { NODE_ENV: '"production"' } }),
        new webpack.optimize.ModuleConcatenationPlugin(),
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
            modules: ["node_modules", directory],
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
};
