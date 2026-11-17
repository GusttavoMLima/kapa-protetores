const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const projectRoot = __dirname;

const config = getDefaultConfig(projectRoot);

// Configure SVG transformer
const { transformer, resolver } = config;
config.transformer = {
  ...transformer,
  babelTransformerPath: require.resolve('react-native-svg-transformer'),
};
config.resolver = {
  ...resolver,
  assetExts: resolver.assetExts.filter((ext) => ext !== 'svg'),
  sourceExts: [...resolver.sourceExts, 'svg'],
};

if (process.env.KAPA_EXPO_GO_ANDROID === '1') {
  const path = require('node:path');
  const localNativePackages = new Set(['react-native-reanimated', 'react-native-worklets']);
  config.resolver.resolveRequest = (context, moduleName, platform) => {
    if (platform === 'android' && localNativePackages.has(moduleName)) {
      return context.resolveRequest({
        ...context,
        disableHierarchicalLookup: true,
        nodeModulesPaths: [path.join(projectRoot, 'node_modules')],
      }, moduleName, platform);
    }
    return context.resolveRequest(context, moduleName, platform);
  };
}

module.exports = withNativeWind(config, { input: './global.css' });

