const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Force Metro to reset transformer cache
config.resetCache = true;
config.transformer = {
  ...config.transformer,
  minifierPath: require.resolve('metro-minify-terser'),
};

module.exports = config;
