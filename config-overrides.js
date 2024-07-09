const path = require('path');
const { override } = require('customize-cra');

module.exports = override(
  (config) => {
    config.resolve.fallback = {
      "process": require.resolve("process/browser"),
      "path": require.resolve("path-browserify"),
      "os": require.resolve("os-browserify/browser"),
      "crypto": require.resolve("crypto-browserify"),
      "buffer": require.resolve("buffer/"),
      "stream": require.resolve("stream-browserify"),
      "vm": require.resolve("vm-browserify")
    };
    return config;
  }
);
