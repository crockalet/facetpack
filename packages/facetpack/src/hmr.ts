/**
 * HMR (Hot Module Reloading) integration for Metro
 * 
 * This module provides an MVP implementation of HMR that:
 * - Watches for file changes via Metro's watcher
 * - Performs incremental transforms using facetpack-native (dev mode, no minify)
 * - Packages HMR delta payloads for Metro's WebSocket protocol
 * - Falls back to full reload on transform errors
 */

import { transformSync, JsxRuntime } from '@ecrindigital/facetpack-native'
import type { FacetpackOptions } from './types'
import { setCachedResolutions } from './cache'
import { existsSync, readFileSync, statSync } from 'fs'

export interface HMROptions {
  enabled?: boolean
  debug?: boolean
}

export interface HMRDelta {
  added: Map<string, HMRModule>
  modified: Map<string, HMRModule>
  deleted: Set<string>
}

export interface HMRModule {
  code: string
  map?: string
  type: 'module' | 'asset'
}

export interface FileChangeEvent {
  eventsQueue: Array<{
    type: 'change' | 'delete' | 'add'
    filePath: string
    metadata?: {
      modifiedTime?: number
      size?: number
      type?: 'f' | 'd' | 'l'
    }
  }>
}

/**
 * Transform a file for HMR using facetpack-native in dev mode
 * Returns null on error (triggers full reload)
 */
export function transformFileForHMR(
  filename: string,
  code: string,
  options: FacetpackOptions
): HMRModule | null {
  try {
    const opts = {
      jsx: options.jsx ?? true,
      jsxRuntime: options.jsxRuntime === 'classic' ? JsxRuntime.Classic : JsxRuntime.Automatic,
      jsxImportSource: options.jsxImportSource ?? 'react',
      jsxPragma: options.jsxPragma ?? 'React.createElement',
      jsxPragmaFrag: options.jsxPragmaFrag ?? 'React.Fragment',
      typescript: options.typescript ?? true,
      sourcemap: true, // Always enable source maps for HMR
    }

    const result = transformSync(filename, code, opts)

    if (result.errors.length > 0) {
      if (options.debug || process.env.FACETPACK_DEBUG) {
        console.error(`[Facetpack HMR] Transform errors in ${filename}:`, result.errors)
      }
      return null
    }

    return {
      code: result.code,
      map: result.map,
      type: 'module',
    }
  } catch (error) {
    if (options.debug || process.env.FACETPACK_DEBUG) {
      console.error(`[Facetpack HMR] Failed to transform ${filename}:`, error)
    }
    return null
  }
}

/**
 * Process file changes and create HMR delta
 */
export function createHMRDelta(
  events: FileChangeEvent,
  options: FacetpackOptions
): HMRDelta {
  const delta: HMRDelta = {
    added: new Map(),
    modified: new Map(),
    deleted: new Set(),
  }

  for (const event of events.eventsQueue) {
    const { type, filePath } = event

    if (type === 'delete') {
      delta.deleted.add(filePath)
      continue
    }

    // Skip non-transformable files
    const lastDotIndex = filePath.lastIndexOf('.')
    if (lastDotIndex === -1) {
      continue
    }
    const ext = filePath.slice(lastDotIndex + 1).toLowerCase()
    const sourceExts = options.sourceExts ?? ['ts', 'tsx', 'js', 'jsx', 'mjs', 'cjs']
    if (!sourceExts.includes(ext)) {
      continue
    }

    // Read file content
    if (!existsSync(filePath)) {
      continue
    }

    const code = readFileSync(filePath, 'utf8')
    const transformed = transformFileForHMR(filePath, code, options)

    if (!transformed) {
      // Transform failed, skip this file (Metro will trigger full reload)
      if (options.debug || process.env.FACETPACK_DEBUG) {
        console.warn(`[Facetpack HMR] Skipping ${filePath} due to transform error`)
      }
      continue
    }

    if (type === 'add') {
      delta.added.set(filePath, transformed)
    } else if (type === 'change') {
      delta.modified.set(filePath, transformed)
    }
  }

  return delta
}

/**
 * Package HMR delta into Metro's expected format
 * This creates the payload that will be sent over Metro's WebSocket
 */
export function packageHMRUpdate(delta: HMRDelta): {
  type: 'update' | 'full-reload'
  modules: Array<{ id: string; code: string; map?: string }>
} {
  const modules: Array<{ id: string; code: string; map?: string }> = []

  // If we have any deletions, trigger full reload
  if (delta.deleted.size > 0) {
    return { type: 'full-reload', modules: [] }
  }

  // Add modified modules
  for (const [filePath, module] of delta.modified.entries()) {
    modules.push({
      id: filePath,
      code: module.code,
      map: module.map,
    })
  }

  // Add new modules
  for (const [filePath, module] of delta.added.entries()) {
    modules.push({
      id: filePath,
      code: module.code,
      map: module.map,
    })
  }

  return {
    type: modules.length > 0 ? 'update' : 'full-reload',
    modules,
  }
}
