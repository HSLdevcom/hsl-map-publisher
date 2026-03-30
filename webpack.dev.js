const { merge } = require('webpack-merge');
const webpackCommon = require('./webpack.common');

const PORT = process.env.PORT || 5000;

module.exports = merge(webpackCommon, {
  mode: 'development',
  devtool: 'cheap-module-source-map',
  devServer: {
    port: PORT,
    hot: true,
  },
});
