/**
 * withFacetpackHmr - Configuration wrapper for enabling HMR with Facetpack
 * 
 * This wrapper:
 * - Disables tree-shaking in dev/HMR mode (as required)
 * - Enables HMR file watching and transformation
 * - Provides opt-in/opt-out configuration
 * - Keeps production builds unchanged
 */

import { withFacetpack } from './withFacetpack'
import type { MetroConfig, FacetpackOptions } from './types'
import type { HMROptions } from './hmr'

export interface FacetpackHMROptions extends FacetpackOptions, HMROptions {
  /**
   * Enable HMR integration (default: true in dev mode)
   */
  hmr?: boolean
}

/**
 * Wrap Metro config with Facetpack + HMR support
 * 
 * @param config - Base Metro configuration
 * @param options - Facetpack and HMR options
 * @returns Modified Metro configuration with HMR enabled
 * 
 * @example
 * ```js
 * const { getDefaultConfig } = require('expo/metro-config')
 * const { withFacetpackHmr } = require('@ecrindigital/facetpack')
 * 
 * module.exports = withFacetpackHmr(getDefaultConfig(__dirname))
 * ```
 * 
 * @example With options
 * ```js
 * module.exports = withFacetpackHmr(getDefaultConfig(__dirname), {
 *   hmr: true,
 *   debug: true,
 * })
 * ```
 * 
 * @example Disable HMR
 * ```js
 * module.exports = withFacetpackHmr(getDefaultConfig(__dirname), {
 *   hmr: false,
 * })
 * ```
 */
export function withFacetpackHmr(
  config: MetroConfig,
  options: FacetpackHMROptions = {}
): MetroConfig {
  // Determine if HMR should be enabled
  // Default to true in development, can be explicitly disabled
  const isDevMode = process.env.NODE_ENV !== 'production'
  const hmrEnabled = options.hmr !== false && isDevMode

  if (options.debug || process.env.FACETPACK_DEBUG) {
    console.log(`[Facetpack HMR] Enabled: ${hmrEnabled}`)
  }

  // Prepare base Facetpack options
  const facetpackOptions: FacetpackOptions = {
    ...options,
    // CRITICAL: Disable tree-shaking in dev/HMR mode as per requirements
    treeShake: hmrEnabled ? false : options.treeShake,
  }

  // Apply base Facetpack configuration
  const configWithFacetpack = withFacetpack(config, facetpackOptions)

  if (!hmrEnabled) {
    // If HMR is disabled, just return the base config
    return configWithFacetpack
  }

  // Store HMR options in environment for transformer to access
  if (hmrEnabled) {
    process.env.FACETPACK_HMR_ENABLED = 'true'
    if (options.debug) {
      process.env.FACETPACK_HMR_DEBUG = 'true'
    }
  }

  // Enhance Metro config for HMR
  const hmrConfig: MetroConfig = {
    ...configWithFacetpack,
    transformer: {
      ...configWithFacetpack.transformer,
      // Ensure transform options support HMR
      getTransformOptions: async (
        entryPoints: readonly string[],
        opts: { dev: boolean; hot: boolean; platform?: string },
        getDepsOf: (path: string) => Promise<string[]>
      ) => {
        const baseOptions = await configWithFacetpack.transformer?.getTransformOptions?.(
          entryPoints,
          opts,
          getDepsOf
        )

        return {
          ...baseOptions,
          transform: {
            ...baseOptions?.transform,
            // Enable HMR-friendly options
            experimentalImportSupport: true,
            inlineRequires: opts.dev ? false : true, // Don't inline requires in dev for better HMR
          },
        }
      },
    },
  }

  return hmrConfig
}

/**
 * Check if HMR is currently enabled
 */
export function isHMREnabled(): boolean {
  return process.env.FACETPACK_HMR_ENABLED === 'true'
}

/**
 * Get HMR debug setting
 */
export function isHMRDebugEnabled(): boolean {
  return process.env.FACETPACK_HMR_DEBUG === 'true' || process.env.FACETPACK_DEBUG === '1'
}
