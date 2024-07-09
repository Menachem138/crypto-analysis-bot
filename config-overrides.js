const path = require('path');
const { override } = require('customize-cra');

module.exports = override(
  (config) => {
    config.resolve.fallback = {
      "path": require.resolve("path-browserify"),
      "os": require.resolve("os-browserify/browser"),
      "crypto": require.resolve("crypto-browserify")
    };
    return config;
  }
);
