# Facetpack HMR - Hot Module Reloading Integration

This document describes the MVP (Minimum Viable Product) implementation of Hot Module Reloading (HMR) for Facetpack with Metro bundler.

## Overview

The Facetpack HMR integration provides fast, incremental transforms for changed files during development, leveraging the high-performance facetpack-native transformer while integrating seamlessly with Metro's existing HMR infrastructure.

## Features

- ⚡ **Fast Incremental Transforms**: Uses facetpack-native for transforming only changed files
- 🔄 **Metro Protocol Compatible**: Works with Metro's existing WebSocket HMR protocol
- 🗺️ **Source Maps**: Full source map support for debugging in dev mode
- 🌲 **Smart Tree-shaking**: Automatically disabled in dev/HMR for faster reload times
- 🛡️ **Error Handling**: Falls back to full reload on transform errors
- 🎯 **Opt-in/Opt-out**: Easy to enable or disable as needed

## Installation

HMR is included in the `@ecrindigital/facetpack` package. No additional installation required.

```bash
npm install @ecrindigital/facetpack
# or
yarn add @ecrindigital/facetpack
# or
pnpm add @ecrindigital/facetpack
```

## Usage

### Basic Setup (Expo)

```javascript
// metro.config.js
const { getDefaultConfig } = require('expo/metro-config')
const { withFacetpackHmr } = require('@ecrindigital/facetpack')

module.exports = withFacetpackHmr(getDefaultConfig(__dirname))
```

### Basic Setup (React Native CLI)

```javascript
// metro.config.js
const { getDefaultConfig } = require('@react-native/metro-config')
const { withFacetpackHmr } = require('@ecrindigital/facetpack')

module.exports = withFacetpackHmr(getDefaultConfig(__dirname))
```

### With Options

```javascript
const { withFacetpackHmr } = require('@ecrindigital/facetpack')

module.exports = withFacetpackHmr(getDefaultConfig(__dirname), {
  // HMR configuration
  hmr: true,              // Enable HMR (default: true in dev)
  debug: true,            // Enable debug logging
  
  // All standard Facetpack options are supported
  jsx: true,
  jsxRuntime: 'automatic',
  jsxImportSource: 'react',
  typescript: true,
  sourceExts: ['ts', 'tsx', 'js', 'jsx', 'mjs', 'cjs'],
})
```

### Disabling HMR

```javascript
// Option 1: Explicitly disable HMR
module.exports = withFacetpackHmr(getDefaultConfig(__dirname), {
  hmr: false,
})

// Option 2: Use regular withFacetpack instead
const { withFacetpack } = require('@ecrindigital/facetpack')
module.exports = withFacetpack(getDefaultConfig(__dirname))
```

## Configuration Options

### HMR-Specific Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `hmr` | `boolean` | `true` (dev), `false` (prod) | Enable/disable HMR integration |
| `debug` | `boolean` | `false` | Enable debug logging for HMR operations |

### Standard Facetpack Options

All standard Facetpack options are supported. See the main [README](../README.md) for full options.

**Note**: The `treeShake` option is automatically set to `false` when HMR is enabled in development mode, regardless of the value you provide.

## How It Works

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Metro Dev Server                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  File Watcher → HMR Middleware → facetpack-native          │
│       │              │                    │                 │
│       │              │                    ▼                 │
│       │              │            Transform (dev mode)      │
│       │              │            - No minification         │
│       │              │            - Source maps enabled     │
│       │              │            - Fast incremental        │
│       │              ▼                                      │
│       │        Package HMR Delta                            │
│       │              │                                      │
│       │              ▼                                      │
│       └────────► WebSocket ──────────────► Client          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Workflow

1. **File Change Detection**: Metro's file watcher detects changes to source files
2. **Incremental Transform**: Facetpack HMR transforms only the changed files using facetpack-native
3. **Delta Creation**: Creates an HMR delta containing added/modified/deleted modules
4. **Package Update**: Packages the delta into Metro's HMR update format
5. **WebSocket Push**: Sends update to connected clients via Metro's WebSocket
6. **Hot Reload**: Client applies changes without full page reload (or triggers full reload if needed)

## Behavior by Environment

| Environment | HMR | Tree-shaking | Minification | Source Maps |
|-------------|-----|--------------|--------------|-------------|
| Development (default) | ✅ Enabled | ❌ Disabled | ❌ Disabled | ✅ Enabled |
| Production | ❌ Disabled | ✅ Enabled | ✅ Enabled | ❌ Disabled |
| Development (hmr: false) | ❌ Disabled | Configurable | Configurable | Configurable |

## Debugging

### Enable Debug Logging

```javascript
// In metro.config.js
module.exports = withFacetpackHmr(getDefaultConfig(__dirname), {
  debug: true,
})

// Or via environment variable
// FACETPACK_DEBUG=1 npx expo start
```

## Limitations & Known Issues

### Current Limitations

1. **MVP Status**: This is a prototype implementation and may have edge cases
2. **File Deletions**: Trigger a full page reload instead of hot update
3. **Transform Errors**: Fall back to full reload on any transform error
4. **Metro Dependency**: Requires Metro's dev server and WebSocket infrastructure
5. **Tree-shaking**: Disabled in dev/HMR mode (only enabled in production)

### Compatibility

- ✅ Works with Expo and React Native CLI
- ✅ Compatible with Metro 0.80+
- ✅ Supports all file types that facetpack-native can transform
- ⚠️ Flow packages still use Babel fallback (same as non-HMR mode)

## API Reference

### `withFacetpackHmr(config, options?)`

Wraps a Metro configuration with Facetpack HMR support.

**Parameters:**
- `config: MetroConfig` - Base Metro configuration
- `options?: FacetpackHMROptions` - Configuration options

**Returns:** Modified Metro configuration with HMR enabled

### `isHMREnabled(): boolean`

Check if HMR is currently enabled.

**Returns:** `true` if HMR is enabled, `false` otherwise

### `isHMRDebugEnabled(): boolean`

Check if HMR debug logging is enabled.

**Returns:** `true` if debug logging is enabled, `false` otherwise

## Examples

See the [metro.config.hmr.example.js](../examples/expo-facetpack/metro.config.hmr.example.js) file for complete examples.

## License

MIT - see [LICENSE](../LICENSE) for details.
