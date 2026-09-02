# @kapa/eslint-config

Shared ESLint 9 Flat Configurations for Kapa monorepo projects.

## Presets

- **Base / TypeScript**: `@kapa/eslint-config` or `@kapa/eslint-config/base`
- **Node.js & Express API**: `@kapa/eslint-config/node`
- **Expo & React Native App**: `@kapa/eslint-config/expo`

## Usage

### In an Expo / React Native App (`apps/mobile-web/eslint.config.js`):

```javascript
module.exports = require('@kapa/eslint-config/expo');
```

### In a Node.js / Express App (`apps/server/eslint.config.js`):

```javascript
module.exports = require('@kapa/eslint-config/node');
```
