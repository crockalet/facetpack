/**
 * Example Metro configuration with Facetpack HMR
 * 
 * This example shows how to enable HMR (Hot Module Reloading) with Facetpack
 * in a React Native or Expo application.
 */

// For Expo projects
const { getDefaultConfig } = require('expo/metro-config')
const { withFacetpackHmr } = require('@ecrindigital/facetpack')

const config = getDefaultConfig(__dirname)

// Basic HMR setup (enabled by default in development)
module.exports = withFacetpackHmr(config)

// Or with explicit options
/*
module.exports = withFacetpackHmr(config, {
  // HMR options
  hmr: true,           // Enable HMR (default: true in dev, false in production)
  debug: true,         // Enable debug logging
  
  // Standard Facetpack options (all supported)
  jsx: true,
  jsxRuntime: 'automatic',
  jsxImportSource: 'react',
  typescript: true,
  sourceExts: ['ts', 'tsx', 'js', 'jsx', 'mjs', 'cjs'],
  
  // Note: treeShake is automatically disabled in dev/HMR mode
  treeShake: false,
})
*/

// For React Native CLI projects
/*
const { getDefaultConfig } = require('@react-native/metro-config')
const { withFacetpackHmr } = require('@ecrindigital/facetpack')

module.exports = withFacetpackHmr(getDefaultConfig(__dirname))
*/

// To disable HMR (use regular Facetpack)
/*
module.exports = withFacetpackHmr(config, {
  hmr: false,
})
*/

// Or use withFacetpack instead for no HMR
/*
const { withFacetpack } = require('@ecrindigital/facetpack')
module.exports = withFacetpack(config)
*/
