const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// Alias react-native-maps to avoid bundling it on web, as it's a native dependency
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  "react-native-maps": "react-native-web", // This acts as a mock for web
};

module.exports = withNativeWind(config, {
  input: "./global.css",
  // Force write CSS to file system instead of virtual modules
  // This fixes iOS styling issues in development mode
  forceWriteFileSystem: true,
});
