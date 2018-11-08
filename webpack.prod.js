const merge = require('webpack-merge');
const webpackCommon = require('./webpack.common');

module.exports = merge.smart(webpackCommon, {
  mode: 'production',
  devtool: 'source-map',
  module: {
    rules: [
      {
        test: /\.js$/,
        loader: 'eslint-loader',
        enforce: 'pre',
        exclude: /node_modules/,
        options: {
          fix: true,
          cache: true,
        },
      },
    ],
  },
});
