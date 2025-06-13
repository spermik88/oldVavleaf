const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Ensure HTML files are treated as assets
config.resolver.assetExts.push('html');

config.server = {
  ...config.server,
  enhanceMiddleware: (middleware) => {
    return (req, res, next) => {
      if (req.url === '/opencv.html') {
        req.url = '/assets/opencv.html';
      } else if (req.url === '/opencv.js') {
        req.url = '/assets/opencv.js';
      }
      return middleware(req, res, next);
    };
  },
};

module.exports = config;
