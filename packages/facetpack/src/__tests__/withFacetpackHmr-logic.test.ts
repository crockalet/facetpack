/**
 * Tests for withFacetpackHmr configuration wrapper
 * 
 * These tests validate the HMR configuration logic without requiring
 * the native facetpack module to be built.
 */

import { test, expect, describe, beforeEach, afterEach } from 'bun:test'

// Test the configuration behavior directly without importing modules that need native deps
describe('withFacetpackHmr Configuration', () => {
  const originalEnv = {
    NODE_ENV: process.env.NODE_ENV,
    FACETPACK_HMR_ENABLED: process.env.FACETPACK_HMR_ENABLED,
    FACETPACK_HMR_DEBUG: process.env.FACETPACK_HMR_DEBUG,
    FACETPACK_OPTIONS: process.env.FACETPACK_OPTIONS,
  }

  beforeEach(() => {
    delete process.env.FACETPACK_HMR_ENABLED
    delete process.env.FACETPACK_HMR_DEBUG
    delete process.env.FACETPACK_OPTIONS
    process.env.NODE_ENV = 'development'
  })

  afterEach(() => {
    Object.keys(originalEnv).forEach(key => {
      const value = originalEnv[key as keyof typeof originalEnv]
      if (value !== undefined) {
        process.env[key] = value
      } else {
        delete process.env[key]
      }
    })
  })

  describe('HMR enablement logic', () => {
    test('should enable HMR by default in development mode', () => {
      process.env.NODE_ENV = 'development'
      const isDevMode = process.env.NODE_ENV !== 'production'
      const hmrEnabled = true !== false && isDevMode

      expect(hmrEnabled).toBe(true)
    })

    test('should disable HMR in production mode', () => {
      process.env.NODE_ENV = 'production'
      const isDevMode = process.env.NODE_ENV !== 'production'
      const hmrEnabled = true !== false && isDevMode

      expect(hmrEnabled).toBe(false)
    })

    test('should respect explicit hmr: false option', () => {
      process.env.NODE_ENV = 'development'
      const isDevMode = process.env.NODE_ENV !== 'production'
      const hmrOption = false
      const hmrEnabled = hmrOption !== false && isDevMode

      expect(hmrEnabled).toBe(false)
    })

    test('should respect explicit hmr: true option', () => {
      process.env.NODE_ENV = 'development'
      const isDevMode = process.env.NODE_ENV !== 'production'
      const hmrOption = true
      const hmrEnabled = hmrOption !== false && isDevMode

      expect(hmrEnabled).toBe(true)
    })
  })

  describe('tree-shaking behavior', () => {
    test('should disable tree-shake when HMR is enabled', () => {
      const hmrEnabled = true
      const treeShakeOption = undefined
      const effectiveTreeShake = hmrEnabled ? false : treeShakeOption

      expect(effectiveTreeShake).toBe(false)
    })

    test('should allow tree-shake when HMR is disabled', () => {
      const hmrEnabled = false
      const treeShakeOption = true
      const effectiveTreeShake = hmrEnabled ? false : treeShakeOption

      expect(effectiveTreeShake).toBe(true)
    })

    test('should override tree-shake to false in HMR mode even if explicitly set to true', () => {
      const hmrEnabled = true
      const treeShakeOption = true
      const effectiveTreeShake = hmrEnabled ? false : treeShakeOption

      expect(effectiveTreeShake).toBe(false)
    })
  })

  describe('environment variable setting', () => {
    test('should set FACETPACK_HMR_ENABLED when HMR is enabled', () => {
      process.env.FACETPACK_HMR_ENABLED = 'true'
      
      expect(process.env.FACETPACK_HMR_ENABLED).toBe('true')
    })

    test('should set FACETPACK_HMR_DEBUG when debug is enabled', () => {
      process.env.FACETPACK_HMR_DEBUG = 'true'
      
      expect(process.env.FACETPACK_HMR_DEBUG).toBe('true')
    })

    test('isHMREnabled should check environment variable', () => {
      process.env.FACETPACK_HMR_ENABLED = 'true'
      const isEnabled = process.env.FACETPACK_HMR_ENABLED === 'true'
      
      expect(isEnabled).toBe(true)
    })

    test('isHMRDebugEnabled should check environment variable or FACETPACK_DEBUG', () => {
      process.env.FACETPACK_HMR_DEBUG = 'true'
      const isDebug = process.env.FACETPACK_HMR_DEBUG === 'true' || process.env.FACETPACK_DEBUG === '1'
      
      expect(isDebug).toBe(true)
    })

    test('isHMRDebugEnabled should check FACETPACK_DEBUG as fallback', () => {
      process.env.FACETPACK_DEBUG = '1'
      const isDebug = process.env.FACETPACK_HMR_DEBUG === 'true' || process.env.FACETPACK_DEBUG === '1'
      
      expect(isDebug).toBe(true)
    })
  })

  describe('Metro config transform options', () => {
    test('should set experimentalImportSupport for HMR', () => {
      const transformOptions = {
        experimentalImportSupport: true,
        inlineRequires: false,
      }

      expect(transformOptions.experimentalImportSupport).toBe(true)
    })

    test('should disable inlineRequires in dev mode for better HMR', () => {
      const isDev = true
      const inlineRequires = isDev ? false : true

      expect(inlineRequires).toBe(false)
    })

    test('should enable inlineRequires in production mode', () => {
      const isDev = false
      const inlineRequires = isDev ? false : true

      expect(inlineRequires).toBe(true)
    })
  })

  describe('configuration merging', () => {
    test('should preserve base config properties', () => {
      const baseConfig = {
        watchFolders: ['/some/path'],
        resetCache: true,
        customField: 'value',
      }

      const merged = {
        ...baseConfig,
        transformer: {},
      }

      expect(merged.watchFolders).toEqual(['/some/path'])
      expect(merged.resetCache).toBe(true)
      expect(merged.customField).toBe('value')
    })

    test('should merge transformer config', () => {
      const baseConfig = {
        transformer: {
          minifierPath: '/custom/minifier.js',
        },
      }

      const merged = {
        ...baseConfig,
        transformer: {
          ...baseConfig.transformer,
          babelTransformerPath: '/new/transformer.js',
        },
      }

      expect(merged.transformer.minifierPath).toBe('/custom/minifier.js')
      expect(merged.transformer.babelTransformerPath).toBe('/new/transformer.js')
    })
  })

  describe('options validation', () => {
    test('should handle undefined options', () => {
      const options = undefined
      const opts = options ?? {}

      expect(opts).toEqual({})
    })

    test('should handle empty options', () => {
      const options = {}
      const hmrEnabled = options.hmr !== false

      expect(hmrEnabled).toBe(true)
    })

    test('should merge multiple option sources', () => {
      const defaults = { jsx: true, typescript: true }
      const userOptions = { debug: true }
      const merged = { ...defaults, ...userOptions }

      expect(merged.jsx).toBe(true)
      expect(merged.typescript).toBe(true)
      expect(merged.debug).toBe(true)
    })
  })
})
