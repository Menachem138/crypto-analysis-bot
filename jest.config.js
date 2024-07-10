module.exports = {
  transform: {
    "^.+\\.(js|jsx|ts|tsx)$": "babel-jest"
  },
  transformIgnorePatterns: [
    "/node_modules/(?!(chartjs-adapter-date-fns)/)"
  ],
  moduleNameMapper: {
    "\\.(css|less)$": "identity-obj-proxy"
  }
};
