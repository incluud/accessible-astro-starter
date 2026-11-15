import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { downloadTemplate } from 'giget'
import { buildManifest } from './presets.js'
import {
  copyLocalTemplate,
  ensureDirectoryIsReady,
  pathExists,
  readJson,
  removeEmptyDirectories,
  removeNamedFiles,
  removePath,
  removePaths,
  writeJson,
  writeText,
} from './utils.js'
import {
  createAboutPage,
  createAstroConfig,
  createContactPage,
  createFooter,
  createHeader,
  createHero,
  createIndexPage,
  createLauncherConfig,
  createNavigation,
  createNavigationItems,
  createReadme,
  createThankYouPage,
  createThemeConfig,
} from './templates.js'
import type { ProjectManifest, ResolvedOptions } from './types.js'

type PackageJson = {
  name: string
  version: string
  description?: string
  private?: boolean
  scripts?: Record<string, string>
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
  workspaces?: string[]
  repository?: unknown
  bugs?: unknown
  homepage?: string
}

async function getPublishedTemplateRef(): Promise<string> {
  const packageJsonPath = fileURLToPath(new URL('../../package.json', import.meta.url))
  const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf8')) as { version: string }
  return `v${packageJson.version}`
}

async function materializeTemplate(targetDir: string): Promise<void> {
  const localTemplateDir = process.env.ACCESSIBLE_ASTRO_STARTER_TEMPLATE_DIR

  if (localTemplateDir) {
    await copyLocalTemplate(localTemplateDir, targetDir)
    return
  }

  const templateRef = await getPublishedTemplateRef()
  await downloadTemplate(`gh:incluud/accessible-astro-starter#${templateRef}`, {
    dir: targetDir,
    force: true,
  })
}

async function rewritePackageJson(targetDir: string, options: ResolvedOptions, manifest: ProjectManifest): Promise<void> {
  const packageJsonPath = resolve(targetDir, 'package.json')
  const packageJson = await readJson<PackageJson>(packageJsonPath)

  packageJson.name = options.siteId
  packageJson.version = '0.0.1'
  packageJson.private = true
  packageJson.description = `${options.siteName} website built with Accessible Astro Starter.`
  packageJson.scripts = {
    dev: 'astro dev',
    start: 'astro dev',
    build: 'astro build',
    preview: 'astro preview',
  }

  delete packageJson.workspaces
  delete packageJson.repository
  delete packageJson.bugs
  delete packageJson.homepage

  if (packageJson.dependencies && !manifest.includeLauncher) {
    delete packageJson.dependencies['accessible-astro-launcher']
  }

  if (packageJson.devDependencies && !manifest.keepMdx) {
    delete packageJson.devDependencies['@astrojs/mdx']
  }

  // sanitize-html is only used by PageHeader
  if (packageJson.devDependencies && !manifest.usePageHeader) {
    delete packageJson.devDependencies['sanitize-html']
    delete packageJson.devDependencies['@types/sanitize-html']
  }

  await writeJson(packageJsonPath, packageJson)
}

async function writeProjectFiles(targetDir: string, options: ResolvedOptions, manifest: ProjectManifest): Promise<void> {
  const keepOriginalFullChrome = manifest.preset === 'full' && manifest.includeLauncher

  await writeText(resolve(targetDir, 'README.md'), createReadme(options))
  await writeText(resolve(targetDir, 'astro.config.mjs'), createAstroConfig(manifest))
  await writeText(resolve(targetDir, 'theme.config.ts'), createThemeConfig(options, manifest))
  if (!keepOriginalFullChrome) {
    await writeText(resolve(targetDir, 'src/components/Header.astro'), createHeader(manifest.includeLauncher))
    await writeText(resolve(targetDir, 'src/components/Navigation.astro'), createNavigation(manifest.includeLauncher))
    await writeText(resolve(targetDir, 'src/components/Footer.astro'), createFooter(manifest))
  }
  await writeText(resolve(targetDir, 'src/components/NavigationItems.astro'), createNavigationItems(manifest.includeLauncher))
  await writeText(resolve(targetDir, 'src/pages/index.astro'), createIndexPage(options))

  if (manifest.preset === 'full' || manifest.preset === 'blog' || manifest.preset === 'portfolio') {
    await writeText(resolve(targetDir, 'src/components/Hero.astro'), createHero(options))
  }

  if (manifest.keepContactPage) {
    await writeText(resolve(targetDir, 'src/pages/contact.astro'), createContactPage())
  }

  if (manifest.keepThankYouPage) {
    await writeText(resolve(targetDir, 'src/pages/thank-you.astro'), createThankYouPage())
  }

  if (manifest.keepAboutPage) {
    await writeText(resolve(targetDir, 'src/pages/about.astro'), createAboutPage(options.siteName))
  } else if (await pathExists(resolve(targetDir, 'src/pages/about.astro'))) {
    await removePath(resolve(targetDir, 'src/pages/about.astro'))
  }

  if (manifest.includeLauncher) {
    await writeText(resolve(targetDir, 'src/components/LauncherConfig.astro'), createLauncherConfig(manifest))
  }
}

async function cleanupEmptyProjectDirectories(targetDir: string): Promise<void> {
  await Promise.all(
    [
      'scripts',
      'src/assets/images',
      'src/content',
      'src/pages/blog',
      'src/pages/portfolio',
      'src/pages/portfolio/tag',
      'public/posts',
      'public/projects',
      'packages',
    ].map((relativePath) => removeEmptyDirectories(resolve(targetDir, relativePath))),
  )
}

export async function scaffoldProject(options: ResolvedOptions, manifest = buildManifest(options)): Promise<void> {
  await ensureDirectoryIsReady(options.targetDir)
  await materializeTemplate(options.targetDir)
  await removeNamedFiles(options.targetDir, '.DS_Store')
  await removePaths(options.targetDir, manifest.pathsToDelete)
  await writeProjectFiles(options.targetDir, options, manifest)
  await rewritePackageJson(options.targetDir, options, manifest)
  await cleanupEmptyProjectDirectories(options.targetDir)
}
