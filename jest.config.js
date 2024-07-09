module.exports = {
  transformIgnorePatterns: [
    "/node_modules/(?!(chartjs-adapter-date-fns)/)"
  ],
  moduleNameMapper: {
    "\\.(css|less)$": "identity-obj-proxy"
  }
};
