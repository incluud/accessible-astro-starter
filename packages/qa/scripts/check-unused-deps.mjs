// Fails when package.json lists a dependency that no source or config file references.
// Usage: node packages/qa/scripts/check-unused-deps.mjs [projectDir]
import { readdir, readFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'

// Used without ever being named in a file. Keep this list as short as possible.
const ALLOWLIST = new Map([
  ['astro', 'CLI behind every npm script'],
  ['sass', 'compiles .scss imports implicitly'],
  ['prettier', 'formatter CLI, configured in .prettierrc'],
  ['eslint', 'linter CLI, configured in eslint.config.js'],
])

const IGNORED_DIRS = new Set(['node_modules', 'dist', '.astro', '.git', 'packages'])
const IGNORED_FILES = new Set(['package.json', 'package-lock.json'])
const SCANNED_EXTENSIONS = /\.(astro|[cm]?[jt]s|mdx?|s?css|json)$|^\.[a-z]+rc$/

const projectDir = resolve(process.argv[2] ?? '.')

async function readSources() {
  const entries = await readdir(projectDir, { withFileTypes: true, recursive: true })
  const files = entries.filter((entry) => {
    if (!entry.isFile() || IGNORED_FILES.has(entry.name) || !SCANNED_EXTENSIONS.test(entry.name)) return false
    const relativeDir = entry.parentPath.slice(projectDir.length + 1)
    return !relativeDir.split(/[\\/]/).some((part) => IGNORED_DIRS.has(part))
  })

  return (await Promise.all(files.map((entry) => readFile(join(entry.parentPath, entry.name), 'utf8')))).join('\n')
}

function isReferenced(name, sources) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(`['"\`]${escaped}(/[^'"\`]*)?['"\`]`).test(sources)
}

function isUsed(name, sources) {
  if (ALLOWLIST.has(name)) return true
  // @types/foo is used when foo is (@types/scope__pkg maps to @scope/pkg).
  if (name.startsWith('@types/')) {
    const typed = name.slice('@types/'.length)
    return isUsed(typed.includes('__') ? `@${typed.replace('__', '/')}` : typed, sources)
  }
  // @iconify-json/<set> is used through icon names like "lucide:github".
  if (name.startsWith('@iconify-json/')) return new RegExp(`['"]${name.slice('@iconify-json/'.length)}:`).test(sources)
  return isReferenced(name, sources)
}

const packageJson = JSON.parse(await readFile(join(projectDir, 'package.json'), 'utf8'))
const dependencies = Object.keys({ ...packageJson.dependencies, ...packageJson.devDependencies })
const sources = await readSources()
const unused = dependencies.filter((name) => !isUsed(name, sources))

if (unused.length > 0) {
  console.error(
    `✖ Unused dependencies in ${projectDir}/package.json:\n${unused.map((name) => `  - ${name}`).join('\n')}`,
  )
  process.exitCode = 1
} else {
  console.log(`✔ All ${dependencies.length} dependencies are referenced`)
}
