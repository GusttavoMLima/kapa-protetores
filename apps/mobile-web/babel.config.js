module.exports = function (api) {
  const expoGoAndroid = api.cache.using(() => process.env.KAPA_EXPO_GO_ANDROID === '1');
  const nativewind = expoGoAndroid
    ? () => {
        const config = require('nativewind/babel')();
        return {
          ...config,
          plugins: config.plugins.map((plugin) =>
            plugin === 'react-native-reanimated/plugin'
              ? require.resolve('react-native-worklets/plugin')
              : plugin,
          ),
        };
      }
    : 'nativewind/babel';

  return {
    presets: [
      ['babel-preset-expo', {
        jsxImportSource: 'nativewind',
        ...(expoGoAndroid && { worklets: false, reanimated: false }),
      }],
      nativewind,
    ],
  };
};

