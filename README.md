<p align="center">
  <img src="https://raw.githubusercontent.com/ecrindigital/facetpack/main/assets/social-preview.jpg" alt="Facetpack" width="100%" />
</p>

<p align="center">
  <b>⚡ 36x faster Metro transforms for React Native</b><br/>
  <sub>Rust-powered. Drop-in Babel replacement.</sub>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@ecrindigital/facetpack">
    <img src="https://img.shields.io/npm/v/@ecrindigital/facetpack.svg" alt="npm version" />
  </a>
  <a href="https://www.npmjs.com/package/@ecrindigital/facetpack">
    <img src="https://img.shields.io/npm/dm/@ecrindigital/facetpack.svg" alt="npm downloads" />
  </a>
  <a href="https://discord.gg/kX7xzknGmv">
    <img src="https://img.shields.io/discord/1457120530409980069?color=7289da&label=Discord&logo=discord&logoColor=white" alt="Discord" />
  </a>
  <a href="https://github.com/ecrindigital/facetpack/stargazers">
    <img src="https://img.shields.io/github/stars/ecrindigital/facetpack.svg?style=social" alt="GitHub stars" />
  </a>
</p>

---

## Performance

| Benchmark | Babel | Facetpack | Speedup |
|-----------|-------|-----------|---------|
| Transform (small) | 244 µs | 7.8 µs | **31x** |
| Transform (large) | 2.47 ms | 64 µs | **38x** |
| Resolve (cold) | 31.6 ms | 10.8 ms | **3x** |

<sub>Tested on Apple M3 Max</sub>

## Quick Start

```bash
npm install @ecrindigital/facetpack
```

```js
// metro.config.js
const { getDefaultConfig } = require('expo/metro-config')
const { withFacetpack } = require('@ecrindigital/facetpack')

module.exports = withFacetpack(getDefaultConfig(__dirname))
```

**That's it.** ⚡

---

## Hot Module Reloading (HMR) - MVP

**NEW**: Experimental HMR integration that piggybacks on Metro's dev server.

```js
// metro.config.js
const { getDefaultConfig } = require('expo/metro-config')
const { withFacetpackHmr } = require('@ecrindigital/facetpack')

module.exports = withFacetpackHmr(getDefaultConfig(__dirname))
```

### HMR Features

- ⚡ **Fast Incremental Transforms** - Uses facetpack-native for changed files
- 🔄 **Metro Protocol Compatible** - Works with Metro's existing WebSocket
- 🗺️ **Source Maps** - Full source map support in dev mode
- 🌲 **Tree-shaking Disabled** - Automatically disabled in dev/HMR for faster reloads
- 🛡️ **Fallback Support** - Falls back to full reload on transform errors

### HMR Configuration

```js
// Enable HMR (default in development)
module.exports = withFacetpackHmr(getDefaultConfig(__dirname), {
  hmr: true,
  debug: true, // Enable HMR debug logging
})

// Disable HMR
module.exports = withFacetpackHmr(getDefaultConfig(__dirname), {
  hmr: false,
})

// Production builds automatically disable HMR
```

### HMR Limitations

- **MVP Status**: This is a prototype implementation
- **Tree-shaking**: Disabled in dev/HMR mode (enabled in production)
- **File Deletions**: Trigger full reload
- **Transform Errors**: Fall back to full reload
- **Metro Protocol**: Uses Metro's existing HMR infrastructure

---

## Part of the Facet Ecosystem

Facetpack is the foundation of **Facet**, the modern toolchain for React Native.

| Coming Soon | Description |
|-------------|-------------|
| 🌳 Tree-shaking | 30% smaller bundles |
| 🩺 Facet Doctor | Diagnose & auto-fix issues |
| ⚡ Facet CLI | Faster dev server |
| 🤖 f0 | AI component generation |
| more tools    | coming soon |

**[⭐ Star this repo](https://github.com/ecrindigital/facetpack)** to follow along!

---

## How it works

```
┌─────────────────────────────────────────────────────────────┐
│                        Metro Build                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  User Code (.ts, .tsx)                                      │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │   Parse     │ -> │  Transform  │ -> │  Codegen    │     │
│  │   (OXC)     │    │   (OXC)     │    │   (OXC)     │     │
│  └─────────────┘    └─────────────┘    └─────────────┘     │
│                                                             │
│  Node Modules (Flow packages)                               │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │   Parse     │ -> │  Transform  │ -> │  Codegen    │     │
│  │  (Babel)    │    │  (Babel)    │    │  (Babel)    │     │
│  └─────────────┘    └─────────────┘    └─────────────┘     │
│                                                             │
│  Resolution                                                 │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Batch Resolve (OXC Resolver via NAPI)              │   │
│  │  Single FFI call for all imports in a file          │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Architecture

```
packages/
├── facetpack/           # Metro integration (TypeScript)
│   ├── withFacetpack    # Config wrapper
│   ├── transformer      # OXC transformer + Babel fallback
│   └── resolver         # Cached batch resolver
│
└── facetpack-native/    # Native bindings (Rust + NAPI)
    ├── oxc_parser       # Parsing
    ├── oxc_transformer  # TS/JSX transformation
    ├── oxc_codegen      # Code generation
    └── oxc_resolver     # Module resolution
```

## Options

```js
module.exports = withFacetpack(config, {
  // JSX runtime: 'automatic' (default) or 'classic'
  jsxRuntime: 'automatic',

  // JSX import source for automatic runtime
  jsxImportSource: 'react',

  // JSX pragma for classic runtime
  jsxPragma: 'React.createElement',
  jsxPragmaFrag: 'React.Fragment',

  // File extensions to transform
  sourceExts: ['ts', 'tsx', 'js', 'jsx', 'mjs', 'cjs'],
})
```

## Debug Mode

Enable debug logging:

```bash
FACETPACK_DEBUG=1 npx expo start
```

## Limitations

- Flow packages (react-native core, reanimated, gesture-handler, etc.) use Babel fallback
- OXC doesn't support ES5 class transformation yet (not needed for Hermes)

## Run Benchmarks

```bash
cd examples/benchmark
bun run.ts                    # Full benchmark with Metro build
bun run.ts --transformer-only # Skip Metro build benchmark
```

## Development

```bash
# Install dependencies
bun install

# Build native bindings
cd packages/facetpack-native
bun run build

# Build TypeScript package
cd packages/facetpack
bun run build

# Run tests
bun test
```

## Community

Join our Discord to get help, share feedback, and connect with other developers using Facetpack:

[![Discord](https://img.shields.io/discord/1457120530409980069?color=7289da&label=Join%20our%20Discord&logo=discord&logoColor=white&style=for-the-badge)](https://discord.gg/kX7xzknGmv)

## License

MIT - [Ecrin Digital](https://ecrin.digital)