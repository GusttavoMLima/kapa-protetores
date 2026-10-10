// Prevent debugging/serialization tools (such as react-native-css-interop in DEV mode)
// from crashing when traversing Fiber nodes that contain React Navigation's default context.
// In React Navigation, NavigationStateContext has property getters (get getKey()) on its default value
// that throw immediately when accessed via Object.entries/JSON.stringify.
// Converting these to functions prevents inspection crashes while preserving the intended error
// if the method is actually called outside a NavigationContainer.

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mod = require('expo-router/build/react-navigation/core/NavigationStateContext');
  const context = mod?.NavigationStateContext;

  if (context && typeof context === 'object' && '_currentValue' in context) {
    const current = context._currentValue as Record<string, unknown> | null;
    if (current && current.isDefault) {
      const MISSING_CONTEXT_ERROR =
        "Couldn't find a navigation context. Have you wrapped your app with 'NavigationContainer'? See https://reactnavigation.org/docs/getting-started for setup instructions.";

      const throwMissingContext = () => {
        throw new Error(MISSING_CONTEXT_ERROR);
      };

      const safeDefault = {
        isDefault: true,
        getKey: throwMissingContext,
        setKey: throwMissingContext,
        getState: throwMissingContext,
        setState: throwMissingContext,
        getIsInitial: throwMissingContext,
      };

      context._currentValue = safeDefault;
      if ('_currentValue2' in context) {
        context._currentValue2 = safeDefault;
      }
    }
  }
} catch {
  // Ignore in environments where expo-router internals are bundled differently
}
