import { access, cp, mkdir, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises'
import { execFileSync } from 'node:child_process'
import { constants } from 'node:fs'
import { basename, dirname, resolve } from 'node:path'

export function slugifySiteName(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function deriveSiteNameFromDirectory(targetDir: string): string {
  const name = basename(resolve(targetDir))
  return name
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ')
}

export function formatPresetLabel(value: string): string {
  return value === 'barebones' ? 'Barebones' : value.charAt(0).toUpperCase() + value.slice(1)
}

export function escapeForSingleQuotedString(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")
}

export function escapeForHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export async function pathExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath, constants.F_OK)
    return true
  } catch {
    return false
  }
}

export async function ensureDirectoryIsReady(targetDir: string): Promise<void> {
  if (!(await pathExists(targetDir))) {
    await mkdir(targetDir, { recursive: true })
    return
  }

  const entries = await readdir(targetDir)
  if (entries.length > 0) {
    throw new Error(`Target directory "${targetDir}" already exists and is not empty.`)
  }
}

export async function removePath(pathToRemove: string): Promise<void> {
  await rm(pathToRemove, { force: true, recursive: true })
}

export async function removePaths(rootDir: string, relativePaths: string[]): Promise<void> {
  await Promise.all(relativePaths.map((relativePath) => removePath(resolve(rootDir, relativePath))))
}

export async function readJson<T>(filePath: string): Promise<T> {
  return JSON.parse(await readFile(filePath, 'utf8')) as T
}

export async function writeJson(filePath: string, value: unknown): Promise<void> {
  await mkdir(dirname(filePath), { recursive: true })
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
}

export async function writeText(filePath: string, value: string): Promise<void> {
  await mkdir(dirname(filePath), { recursive: true })
  await writeFile(filePath, value, 'utf8')
}

function listGitFiles(sourceDir: string): string[] | null {
  try {
    const output = execFileSync('git', ['ls-files', '-z', '--cached', '--others', '--exclude-standard'], {
      cwd: sourceDir,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    })
    return output.split('\0').filter(Boolean)
  } catch {
    return null
  }
}

// Mirror what giget downloads: only files git would publish, so ignored local files
// (.env, .cursor, build output) never end up in a local scaffold.
export async function copyLocalTemplate(sourceDir: string, targetDir: string): Promise<void> {
  const gitFiles = listGitFiles(sourceDir)

  // An empty listing means git can't see the template (e.g. it sits in an ignored folder of
  // another repo), so fall back to a plain copy instead of scaffolding an empty project.
  if (gitFiles && gitFiles.length > 0) {
    await mkdir(targetDir, { recursive: true })
    for (const relativePath of gitFiles) {
      const sourcePath = resolve(sourceDir, relativePath)
      if (await pathExists(sourcePath)) {
        await mkdir(dirname(resolve(targetDir, relativePath)), { recursive: true })
        // recursive: submodules are listed as a single directory entry
        await cp(sourcePath, resolve(targetDir, relativePath), {
          recursive: true,
          verbatimSymlinks: true,
        })
      }
    }
    return
  }

  await cp(sourceDir, targetDir, {
    recursive: true,
    filter(source) {
      const name = basename(source)
      return !['.git', 'node_modules'].includes(name)
    },
  })
}

export async function removeNamedFiles(rootDir: string, fileName: string): Promise<void> {
  if (!(await pathExists(rootDir))) {
    return
  }

  const entries = await readdir(rootDir, { withFileTypes: true })

  await Promise.all(
    entries.map(async (entry) => {
      const entryPath = resolve(rootDir, entry.name)

      if (entry.isDirectory()) {
        await removeNamedFiles(entryPath, fileName)
        return
      }

      if (entry.name === fileName) {
        await removePath(entryPath)
      }
    }),
  )
}

export async function removeEmptyDirectories(rootDir: string): Promise<boolean> {
  if (!(await pathExists(rootDir))) {
    return true
  }

  const metadata = await stat(rootDir)
  if (!metadata.isDirectory()) {
    return false
  }

  const entries = await readdir(rootDir, { withFileTypes: true })

  await Promise.all(
    entries
      .filter((entry) => entry.isDirectory())
      .map((entry) => removeEmptyDirectories(resolve(rootDir, entry.name))),
  )

  const remainingEntries = await readdir(rootDir)

  if (remainingEntries.length === 0) {
    await rm(rootDir, { recursive: true, force: true })
    return true
  }

  return false
}
