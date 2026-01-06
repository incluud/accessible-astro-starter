import { existsSync, lstatSync } from 'fs'
import { resolve } from 'path'
import { watch } from 'fs'

/**
 * Workspace Configuration for Development
 *
 * This utility detects if Accessible Astro packages are symlinked (via npm link or workspace setup)
 * and enhances the Vite config to support live reloading of package changes during development.
 *
 * For end users: You can safely ignore this file - it's only used during development of the
 * Accessible Astro ecosystem itself.
 */

/**
 * Checks if a specific package is symlinked
 * @param {string} packageName - Name of the package to check
 * @returns {boolean} True if the package is symlinked
 */
function checkSymlink(packageName) {
  const packagePath = resolve(`./node_modules/${packageName}`)
  return existsSync(packagePath) && lstatSync(packagePath).isSymbolicLink()
}

/**
 * Helper to invalidate modules and trigger reload
 * @param {object} server - Vite dev server instance
 * @param {string} packageName - Name of the package to invalidate
 */
function invalidateAndReload(server, packageName) {
  Array.from(server.moduleGraph.urlToModuleMap.keys()).forEach((url) => {
    if (url.includes(packageName)) {
      const mod = server.moduleGraph.urlToModuleMap.get(url)
      if (mod) server.moduleGraph.invalidateModule(mod)
    }
  })
  server.ws.send({ type: 'full-reload', path: '*' })
}

/**
 * Enhances Vite config for workspace development
 * Adds symlink support, filesystem access, and auto-reload for package changes
 *
 * @param {object} baseConfig - Base Vite configuration object
 * @returns {object} Enhanced Vite configuration
 */
export function enhanceConfigForWorkspace(baseConfig) {
  const isComponentsLinked = checkSymlink('accessible-astro-components')
  const isLauncherLinked = checkSymlink('accessible-astro-launcher')
  const hasLinkedPackages = isComponentsLinked || isLauncherLinked

  if (!hasLinkedPackages) {
    return baseConfig
  }

  const linkedPackages = []
  if (isComponentsLinked) linkedPackages.push('accessible-astro-components')
  if (isLauncherLinked) linkedPackages.push('accessible-astro-launcher')

  console.log(`Workspace detected - enabling auto-reload for: ${linkedPackages.join(', ')}`)

  // Essential config for symlinked packages
  baseConfig.resolve.preserveSymlinks = true
  baseConfig.server = {
    fs: {
      allow: ['..', '../..'],
    },
  }
  baseConfig.optimizeDeps = {
    exclude: linkedPackages,
  }
  // SSR: Tell Vite to process .astro files from symlinked packages
  baseConfig.ssr = {
    noExternal: linkedPackages,
  }

  // Custom watcher for linked packages - triggers reload on changes
  baseConfig.plugins.push({
    name: 'reload-on-linked-packages-change',
    configureServer(server) {
      const watchers = []

      if (isComponentsLinked) {
        const componentsPath = resolve('../accessible-astro-components/src/components')
        const watcher = watch(componentsPath, { recursive: true }, (eventType, filename) => {
          if (filename?.endsWith('.astro') || filename?.endsWith('.css')) {
            console.log('Components changed:', filename, ' - reloading...')
            invalidateAndReload(server, 'accessible-astro-components')
          }
        })
        watchers.push(watcher)
      }

      if (isLauncherLinked) {
        const launcherPath = resolve('../accessible-astro-launcher/src')
        const watcher = watch(launcherPath, { recursive: true }, (eventType, filename) => {
          if (filename?.endsWith('.astro') || filename?.endsWith('.css')) {
            console.log('Launcher changed:', filename, ' - reloading...')
            invalidateAndReload(server, 'accessible-astro-launcher')
          }
        })
        watchers.push(watcher)
      }

      server.httpServer?.on('close', () => watchers.forEach((w) => w.close()))
    },
  })

  return baseConfig
}
