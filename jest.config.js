module.exports = {
  transform: {},
  moduleNameMapper: {
    "\\.(css|less)$": "identity-obj-proxy"
  },
  globals: {
    "babel-jest": {
      useESModules: true
    }
  }
};
