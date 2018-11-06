module.exports = {
  extends: '../.eslintrc',
  settings: {
    'import/resolver': {
      webpack: {
        config: 'webpack.dev.js',
      },
    },
  },
};
