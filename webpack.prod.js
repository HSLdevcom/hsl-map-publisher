const merge = require('webpack-merge');
const ESLintPlugin = require('eslint-webpack-plugin');
const { DefinePlugin } = require('webpack');

const webpackCommon = require('./webpack.common');

module.exports = merge.smart(webpackCommon, {
  mode: 'production',
  devtool: 'source-map',
  plugins: [
    new ESLintPlugin({ cache: true, fix: true }),
    new DefinePlugin({
      'globalThis.__DEV__': false,
    }),
  ],
});
