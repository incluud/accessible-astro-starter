// Scans every built HTML page with axe in light and dark mode and fails on any WCAG A/AA violation.
// Usage: node packages/qa/scripts/a11y-scan.mjs [distDir]
import { createServer } from 'node:http'
import { readdir, readFile, stat } from 'node:fs/promises'
import { extname, isAbsolute, join, relative, resolve, sep } from 'node:path'
import { chromium } from 'playwright'
import { AxeBuilder } from '@axe-core/playwright'

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22a', 'wcag22aa']
// Intentionally failing content. Keep this list as short as possible and explain every entry.
const EXCLUDE = [
  // Color contrast checker swatches render palette colors in the tested text color on purpose:
  // an unreadable swatch is the demo showing that combination is not good enough.
  '.color-contrast .color-item',
]
const COLOR_SCHEMES = ['light', 'dark']
const CONCURRENCY = 4
// Pages can render platform-specific content (e.g. "Ctrl K" vs "⌘ K" shortcut hints).
// Pin one platform so local runs on macOS find the same issues as CI on Linux.
const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36'

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.woff2': 'font/woff2',
  '.xml': 'application/xml',
}

const distDir = resolve(process.argv[2] ?? 'dist')

async function listHtmlFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true, recursive: true })
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.html'))
    .map((entry) => join(entry.parentPath, entry.name))
}

function toUrlPath(htmlFile) {
  const path = '/' + relative(distDir, htmlFile).split(sep).join('/')
  return path.endsWith('/index.html') ? path.slice(0, -'index.html'.length) : path
}

async function resolveFile(urlPath) {
  const filePath = join(distDir, decodeURIComponent(urlPath))
  // Only serve files inside distDir. A prefix check would also accept siblings like dist-backup/.
  const relativePath = relative(distDir, filePath)
  if (relativePath === '..' || relativePath.startsWith(`..${sep}`) || isAbsolute(relativePath)) return null

  for (const candidate of [filePath, join(filePath, 'index.html'), `${filePath}.html`]) {
    try {
      if ((await stat(candidate)).isFile()) return candidate
    } catch {
      // Not found, try the next candidate.
    }
  }

  return null
}

function startServer() {
  const server = createServer(async (request, response) => {
    const { pathname } = new URL(request.url, 'http://localhost')
    const file = (await resolveFile(pathname)) ?? (await resolveFile('/404.html'))
    response.writeHead(file?.endsWith('404.html') && !pathname.startsWith('/404') ? 404 : 200, {
      'content-type': MIME_TYPES[extname(file ?? '')] ?? 'application/octet-stream',
    })
    response.end(file ? await readFile(file) : '')
  })

  return new Promise((resolveServer) => server.listen(0, '127.0.0.1', () => resolveServer(server)))
}

async function scanPage(context, url, colorScheme) {
  const page = await context.newPage()
  try {
    await page.goto(url, { waitUntil: 'load' })

    // Guards the dark mode mechanism itself: if it silently breaks, the dark scan would test light mode twice.
    if (colorScheme === 'dark') {
      const isDark = await page.evaluate(() => document.documentElement.classList.contains('darkmode'))
      if (!isDark) {
        return [{ id: 'darkmode-not-applied', impact: 'critical', help: 'Dark mode class not applied', nodes: [] }]
      }
    }

    // Let finite transitions settle first: dark mode is applied after first render and links animate
    // their color, so axe could otherwise measure contrast mid-transition (flaky results).
    await page.evaluate(() =>
      Promise.all(
        document
          .getAnimations()
          .filter((animation) => animation.effect?.getComputedTiming().endTime !== Infinity)
          .map((animation) => animation.finished.catch(() => {})),
      ),
    )

    const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).exclude(EXCLUDE).analyze()
    return results.violations
  } finally {
    await page.close()
  }
}

async function launchBrowser() {
  try {
    return await chromium.launch()
  } catch (error) {
    throw new Error('Could not start Chromium. Install it with: npx playwright install chromium', { cause: error })
  }
}

async function main() {
  const htmlFiles = await listHtmlFiles(distDir)
  if (htmlFiles.length === 0) throw new Error(`No HTML files found in ${distDir}`)

  const server = await startServer()
  const baseUrl = `http://127.0.0.1:${server.address().port}`
  const failures = []

  // The server must close on every path, including a failed browser launch, or the process never exits.
  try {
    const browser = await launchBrowser()
    try {
      for (const colorScheme of COLOR_SCHEMES) {
        const context = await browser.newContext({ colorScheme, reducedMotion: 'reduce', userAgent: USER_AGENT })
        const queue = htmlFiles.map(toUrlPath)

        await Promise.all(
          Array.from({ length: CONCURRENCY }, async () => {
            while (queue.length > 0) {
              const path = queue.shift()
              const violations = await scanPage(context, baseUrl + path, colorScheme)
              for (const violation of violations) failures.push({ path, colorScheme, violation })
            }
          }),
        )

        await context.close()
      }
    } finally {
      await browser.close()
    }
  } finally {
    server.close()
  }

  const scanned = htmlFiles.length * COLOR_SCHEMES.length
  if (failures.length === 0) {
    console.log(`✔ axe: ${scanned} page scans (${htmlFiles.length} pages × light/dark), no WCAG A/AA violations`)
    return
  }

  // Group by rule so one broken shared component reads as one problem, not 135.
  const byRule = new Map()
  for (const { path, colorScheme, violation } of failures) {
    const entry = byRule.get(violation.id) ?? { violation, pages: [] }
    entry.pages.push({
      page: `${path} (${colorScheme})`,
      targets: violation.nodes.map((node) => node.target.join(' ')),
    })
    byRule.set(violation.id, entry)
  }

  for (const [id, { violation, pages }] of byRule) {
    console.error(`\n✖ ${id} [${violation.impact}] ${violation.help} — ${pages.length} page scan(s)`)
    if (violation.helpUrl) console.error(`  ${violation.helpUrl}`)
    for (const { page, targets } of pages.slice(0, 10)) {
      const more = targets.length > 3 ? ` (+${targets.length - 3} more)` : ''
      console.error(`  ${page}: ${targets.slice(0, 3).join(' | ')}${more}`)
    }
    if (pages.length > 10) console.error(`  … and ${pages.length - 10} more page scan(s)`)
  }

  console.error(`\n✖ axe: ${byRule.size} rule(s) violated across ${failures.length} page scan(s)`)
  process.exitCode = 1
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
