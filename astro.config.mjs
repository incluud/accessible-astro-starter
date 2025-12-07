import { defineConfig } from 'astro/config'
import { fileURLToPath } from 'url'
import { existsSync, lstatSync } from 'fs'
import { resolve } from 'path'
import compress from 'astro-compress'
import icon from 'astro-icon'
import mdx from '@astrojs/mdx'
import sitemap from '@astrojs/sitemap'
import tailwindcss from '@tailwindcss/vite'
import { watch } from 'fs'

// Check if we're using a symlinked/workspace setup
const componentsPath = resolve('./node_modules/accessible-astro-components')
const isLinked = existsSync(componentsPath) && lstatSync(componentsPath).isSymbolicLink()

// Base Vite config
const viteConfig = {
  css: {
    preprocessorOptions: {
      scss: {
        logger: {
          warn: () => {},
        },
      },
    },
  },
  plugins: [tailwindcss()],
  resolve: {
    alias: {
      '@components': fileURLToPath(new URL('./src/components', import.meta.url)),
      '@layouts': fileURLToPath(new URL('./src/layouts', import.meta.url)),
      '@assets': fileURLToPath(new URL('./src/assets', import.meta.url)),
      '@content': fileURLToPath(new URL('./src/content', import.meta.url)),
      '@pages': fileURLToPath(new URL('./src/pages', import.meta.url)),
      '@public': fileURLToPath(new URL('./public', import.meta.url)),
      '@post-images': fileURLToPath(new URL('./public/posts', import.meta.url)),
      '@project-images': fileURLToPath(new URL('./public/projects', import.meta.url)),
    },
  },
}

// Add workspace-specific config only when using symlinks
if (isLinked) {
  console.log('Workspace detected - enabling auto-reload for locally linked components')

  const componentsRealPath = resolve('../accessible-astro-components')

  // Essential config for symlinked packages
  viteConfig.resolve.preserveSymlinks = true
  viteConfig.server = {
    fs: {
      allow: ['..', '../..'],
    },
  }
  viteConfig.optimizeDeps = {
    exclude: ['accessible-astro-components'],
  }

  // Custom watcher for linked components - triggers reload on changes
  viteConfig.plugins.push({
    name: 'reload-on-components-change',
    configureServer(server) {
      const componentsWatchPath = resolve(componentsRealPath, 'src/components')

      const watcher = watch(componentsWatchPath, { recursive: true }, (eventType, filename) => {
        if (filename?.endsWith('.astro')) {
          console.log('Component changed:', filename, ' - reloading...')

          // Invalidate all modules from the components package
          Array.from(server.moduleGraph.urlToModuleMap.keys()).forEach((url) => {
            if (url.includes('accessible-astro-components')) {
              const mod = server.moduleGraph.urlToModuleMap.get(url)
              if (mod) server.moduleGraph.invalidateModule(mod)
            }
          })

          // Trigger full page reload
          server.ws.send({ type: 'full-reload', path: '*' })
        }
      })

      server.httpServer?.on('close', () => watcher.close())
    },
  })
}

// https://astro.build/config
export default defineConfig({
  compressHTML: true,
  site: 'https://accessible-astro-starter.incluud.dev',
  integrations: [compress(), icon(), mdx(), sitemap()],
  vite: viteConfig,
})
