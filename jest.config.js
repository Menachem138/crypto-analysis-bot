module.exports = {
  transform: {
    "^.+\\.(js|jsx|ts|tsx)$": "babel-jest"
  },
  moduleNameMapper: {
    "\\.(css|less)$": "identity-obj-proxy"
  },
  globals: {}
};
