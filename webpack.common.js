const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ESLintPlugin = require('eslint-webpack-plugin');
const Dotenv = require('dotenv-webpack');

module.exports = {
  plugins: [
    new HtmlWebpackPlugin({
      title: 'Stop poster',
    }),
    new ESLintPlugin({ cache: true }),
    new Dotenv({ systemvars: true }),
  ],
  resolve: {
    modules: ['node_modules', 'src'],
  },
  output: {
    path: path.join(__dirname, 'dist'),
    clean: true,
    filename: 'bundle.js',
    globalObject: 'this',
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        loader: 'babel-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.worker\.js$/,
        use: ['babel-loader', 'worker-loader'],
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: [
          'style-loader',
          {
            loader: 'css-loader',
            options: {
              modules: {
                localIdentName: '[name]_[local]_[hash:base64:5]',
              },
              importLoaders: 1,
            },
          },
        ],
      },
      {
        test: /\.svg$/,
        type: 'asset/source',
      },
    ],
  },
};
