const merge = require('webpack-merge');
const webpackCommon = require('./webpack.common');

const PORT = process.env.PORT || 5000;

module.exports = merge.smart(webpackCommon, {
  mode: 'development',
  devtool: 'eval-cheap-module-source-map',

  devServer: {
    port: PORT,
    hot: true,
  },
});
