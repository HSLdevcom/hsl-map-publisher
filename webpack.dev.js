const merge = require('webpack-merge');
const webpackCommon = require('./webpack.common');

const PORT = process.env.PORT || 5000;

module.exports = merge.smart(webpackCommon, {
  mode: 'development',
  devtool: 'cheap-module-eval-source-map',
  serve: {
    port: PORT,
    hot: {
      hmr: true,
    },
  },
});
