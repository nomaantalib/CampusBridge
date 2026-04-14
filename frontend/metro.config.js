const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Ensure 'web' is a recognized platform so .web.js files are resolved correctly
// on web while native files (.ios.js, .android.js, .native.js) work on their
// respective platforms. Metro handles this automatically via resolver.platforms.
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

module.exports = config;

