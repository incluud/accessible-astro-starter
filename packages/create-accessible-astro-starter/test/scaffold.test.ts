import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildManifest } from '../src/presets.js'
import { scaffoldProject } from '../src/scaffold.js'
import { PRESETS, type Preset, type ResolvedOptions } from '../src/types.js'
import { slugifySiteName } from '../src/utils.js'

const repoRoot = resolve(fileURLToPath(new URL('../../../../', import.meta.url)))

function createOptions(preset: Preset, includeLauncher: boolean, targetDir: string, siteName = `Fixture ${preset}`): ResolvedOptions {
  return {
    targetDir,
    siteName,
    siteId: slugifySiteName(siteName),
    preset,
    includeLauncher,
  }
}

test('full preset keeps the starter header, navigation, logo, and hero structure', async () => {
  const tempRoot = await mkdtemp(join(tmpdir(), 'accessible-astro-starter-'))
  const targetDir = join(tempRoot, 'full-launcher-original-chrome')
  const options = createOptions('full', true, targetDir)
  const manifest = buildManifest(options)

  process.env.ACCESSIBLE_ASTRO_STARTER_TEMPLATE_DIR = repoRoot
  await scaffoldProject(options, manifest)

  const generatedHeader = await readFile(resolve(targetDir, 'src/components/Header.astro'), 'utf8')
  const generatedNavigation = await readFile(resolve(targetDir, 'src/components/Navigation.astro'), 'utf8')
  const generatedLogo = await readFile(resolve(targetDir, 'src/components/Logo.astro'), 'utf8')
  const generatedHero = await readFile(resolve(targetDir, 'src/components/Hero.astro'), 'utf8')
  const generatedFeature = await readFile(resolve(targetDir, 'src/components/Feature.astro'), 'utf8')
  const generatedNavigationItems = await readFile(resolve(targetDir, 'src/components/NavigationItems.astro'), 'utf8')
  const generatedFooter = await readFile(resolve(targetDir, 'src/components/Footer.astro'), 'utf8')
  const generatedIndex = await readFile(resolve(targetDir, 'src/pages/index.astro'), 'utf8')

  assert.equal(generatedHeader, await readFile(resolve(repoRoot, 'src/components/Header.astro'), 'utf8'))
  assert.equal(generatedNavigation, await readFile(resolve(repoRoot, 'src/components/Navigation.astro'), 'utf8'))
  assert.equal(generatedLogo, await readFile(resolve(repoRoot, 'src/components/Logo.astro'), 'utf8'))
  assert.equal(generatedFooter, await readFile(resolve(repoRoot, 'src/components/Footer.astro'), 'utf8'))

  assert.ok(
    generatedHero.includes(
      '<h1 class="text-center text-6xl md:text-left lg:text-8xl"><span class="text-gradient">Fixture</span> full</h1>',
    ),
  )
  assert.ok(
    generatedHero.includes('A flexible starting point for publishing content, sharing work, and building accessibly with Astro.'),
  )
  assert.ok(generatedHero.includes('<Image class="hidden lg:block" src={src} alt="" decoding="async" width={800} height={600} loading="eager" />'))
  assert.ok(generatedHero.includes('Star on GitHub'))
  assert.ok(generatedHero.includes('Read the docs'))
  await expectExists(targetDir, 'public/astronaut-hero-img.webp')
  await expectExists(targetDir, 'src/assets/img/logo.svg')
  await expectExists(targetDir, 'src/components/Feature.astro')
  await expectExists(targetDir, 'src/components/CallToAction.astro')
  assert.ok(generatedNavigationItems.includes('const currentPathname = Astro.url.pathname'))
  assert.ok(generatedNavigationItems.includes("aria-current={isCurrentPage(item.href) ? 'page' : undefined}"))
  assert.ok(generatedNavigationItems.includes('<li class="menu-item type-icon animate-rotate">'))
  assert.ok(generatedIndex.includes("import Hero from '@components/Hero.astro'"))
  assert.ok(generatedIndex.includes("import Feature from '@components/Feature.astro'"))
  assert.ok(generatedIndex.includes('<Hero />'))
  assert.ok(generatedFeature.includes("level?: 'h2' | 'h3' | 'h4' | 'h5' | 'h6'"))
  assert.ok(generatedFeature.includes('<Heading level={level} size="h6" class="mb-2">{title}</Heading>'))
  assert.ok(generatedIndex.includes('<Feature icon="lucide:layout-template" title="Start with real structure" level="h2">'))
  assert.ok(generatedIndex.includes('<Feature icon="lucide:scissors" title="Keep what you need" level="h2">'))
  assert.ok(generatedIndex.includes('<Feature icon="lucide:accessibility" title="Build accessibly" level="h2">'))
  assert.ok(!generatedIndex.includes('<article class="rounded-xl border'))
  assert.ok(!generatedIndex.includes('href="/contact">Contact</Link>'))
})

test('blog preset keeps styled navigation, logo asset, and uses a generated hero', async () => {
  const tempRoot = await mkdtemp(join(tmpdir(), 'accessible-astro-starter-'))
  const targetDir = join(tempRoot, 'blog-launcher-original-chrome')
  const options = createOptions('blog', true, targetDir)
  const manifest = buildManifest(options)

  process.env.ACCESSIBLE_ASTRO_STARTER_TEMPLATE_DIR = repoRoot
  await scaffoldProject(options, manifest)

  const generatedHeader = await readFile(resolve(targetDir, 'src/components/Header.astro'), 'utf8')
  const generatedNavigation = await readFile(resolve(targetDir, 'src/components/Navigation.astro'), 'utf8')
  const generatedHero = await readFile(resolve(targetDir, 'src/components/Hero.astro'), 'utf8')
  const generatedNavigationItems = await readFile(resolve(targetDir, 'src/components/NavigationItems.astro'), 'utf8')
  const generatedIndex = await readFile(resolve(targetDir, 'src/pages/index.astro'), 'utf8')
  const generatedFooter = await readFile(resolve(targetDir, 'src/components/Footer.astro'), 'utf8')
  const generatedThemeConfig = await readFile(resolve(targetDir, 'theme.config.ts'), 'utf8')

  assert.ok(generatedHeader.includes("<style lang=\"scss\" is:global>"))
  assert.ok(generatedHeader.includes("li.desktop-launcher"))
  assert.ok(generatedNavigation.includes("<style lang=\"scss\" is:global>"))
  assert.ok(generatedNavigation.includes("document.addEventListener('astro:page-load'"))
  assert.ok(generatedNavigation.includes(".has-dropdown > button:focus-visible"))
  assert.ok(generatedNavigation.includes('.darkmode-toggle'))
  assert.ok(generatedNavigation.includes('inline-size: 30px'))
  assert.ok(generatedNavigationItems.includes('<li class="menu-item type-icon animate-rotate">'))
  assert.ok(generatedIndex.includes("import Hero from '@components/Hero.astro'"))
  assert.ok(generatedIndex.includes('<Hero />'))
  assert.ok(
    generatedHero.includes(
      '<h1 class="text-center text-6xl md:text-left lg:text-8xl"><span class="text-gradient">Fixture</span> blog</h1>',
    ),
  )
  assert.ok(generatedHero.includes('Update the blog routes, data source, and homepage copy to match how you want to publish content.'))
  assert.ok(
    generatedHero.indexOf('Update the blog routes') < generatedHero.indexOf('A clean, accessible blog starter with a contact flow'),
  )
  assert.ok(generatedHero.includes('Browse posts'))
  assert.ok(!generatedHero.includes('Blog preset'))
  assert.ok(!generatedHero.includes('eyebrow'))
  assert.ok(!generatedHero.includes('href="/contact"'))
  assert.ok(generatedFooter.includes('<ul class="flex flex-col gap-2">'))
  assert.ok(!generatedFooter.includes('<ul class="space-content">'))
  assert.ok(generatedFooter.includes('&copy; {currentYear} - Starter Theme for <Link href="https://astro.build/">Astro</Link>.'))
  assert.ok(generatedThemeConfig.includes("import logoImage from '@assets/img/logo.svg'"))
  assert.ok(generatedThemeConfig.includes('logo: logoImage'))
  await expectExists(targetDir, 'src/assets/img/logo.svg')
  await expectExists(targetDir, 'public/astronaut-hero-img.webp')
})

test('portfolio preset uses a generated hero', async () => {
  const tempRoot = await mkdtemp(join(tmpdir(), 'accessible-astro-starter-'))
  const targetDir = join(tempRoot, 'portfolio-launcher-hero')
  const options = createOptions('portfolio', true, targetDir)
  const manifest = buildManifest(options)

  process.env.ACCESSIBLE_ASTRO_STARTER_TEMPLATE_DIR = repoRoot
  await scaffoldProject(options, manifest)

  const generatedHero = await readFile(resolve(targetDir, 'src/components/Hero.astro'), 'utf8')
  const generatedIndex = await readFile(resolve(targetDir, 'src/pages/index.astro'), 'utf8')

  assert.ok(generatedIndex.includes("import Hero from '@components/Hero.astro'"))
  assert.ok(generatedIndex.includes('<Hero />'))
  assert.ok(
    generatedHero.includes(
      '<h1 class="text-center text-6xl md:text-left lg:text-8xl"><span class="text-gradient">Fixture</span> portfolio</h1>',
    ),
  )
  assert.ok(generatedHero.includes('Swap the placeholder project content for your own case studies and update the tags to match your work.'))
  assert.ok(generatedHero.indexOf('Swap the placeholder project content') < generatedHero.indexOf('Showcase your work with accessible project pages'))
  assert.ok(generatedHero.includes('View projects'))
  assert.ok(!generatedHero.includes('Portfolio preset'))
  assert.ok(!generatedHero.includes('eyebrow'))
  assert.ok(!generatedHero.includes('href="/contact"'))
  await expectExists(targetDir, 'public/astronaut-hero-img.webp')
})

test('minimal preset renders clean homepage cards and actions', async () => {
  const tempRoot = await mkdtemp(join(tmpdir(), 'accessible-astro-starter-'))
  const targetDir = join(tempRoot, 'minimal-homepage-cleanup')
  const options = createOptions('minimal', true, targetDir)
  const manifest = buildManifest(options)

  process.env.ACCESSIBLE_ASTRO_STARTER_TEMPLATE_DIR = repoRoot
  await scaffoldProject(options, manifest)

  const generatedIndex = await readFile(resolve(targetDir, 'src/pages/index.astro'), 'utf8')

  assert.ok(generatedIndex.includes('<Link href="/about" isButton type="primary" animateOnHover animationType="boop">About</Link>'))
  assert.ok(generatedIndex.includes('<Link href="/contact" isButton type="secondary" animateOnHover animationType="boop">Contact</Link>'))
  assert.ok(generatedIndex.includes('<div class="rounded-xl border border-(--border-color-subtle) p-6">'))
  assert.ok(!generatedIndex.includes('<article class="rounded-xl border'))
  assert.ok(!generatedIndex.includes('Minimal preset'))
  assert.ok(!generatedIndex.includes('eyebrow'))
  assert.ok(!generatedIndex.includes('border-[var(--border-color-subtle)]'))
})

test('barebones preset renders notification and slim footer', async () => {
  const tempRoot = await mkdtemp(join(tmpdir(), 'accessible-astro-starter-'))
  const targetDir = join(tempRoot, 'barebones-cleanup')
  const options = createOptions('barebones', true, targetDir)
  const manifest = buildManifest(options)

  process.env.ACCESSIBLE_ASTRO_STARTER_TEMPLATE_DIR = repoRoot
  await scaffoldProject(options, manifest)

  const generatedIndex = await readFile(resolve(targetDir, 'src/pages/index.astro'), 'utf8')
  const generatedFooter = await readFile(resolve(targetDir, 'src/components/Footer.astro'), 'utf8')

  assert.ok(generatedIndex.includes("import { Heading, Notification } from 'accessible-astro-components'"))
  assert.ok(generatedIndex.includes('<Notification type="info">'))
  assert.ok(!generatedIndex.includes('variant="accent"'))
  assert.ok(generatedIndex.includes('Start by editing this page, theme.config.ts, and the navigation to match your project.'))
  assert.ok(generatedFooter.includes('&copy; {currentYear} - Starter Theme for <Link href="https://astro.build/">Astro</Link>.'))
  assert.ok(generatedFooter.includes('Made with ❤️ by <Link href="https://github.com/markteekman">Mark Teekman</Link>'))
  assert.ok(!generatedFooter.includes('footerLinks'))
  assert.ok(!generatedFooter.includes('socialLinks'))
  assert.ok(!generatedFooter.includes('<Heading level="h2" size="h4">{themeConfig.name}</Heading>'))
})

test('generated markup escapes site names in HTML text and attributes', async () => {
  const tempRoot = await mkdtemp(join(tmpdir(), 'accessible-astro-starter-'))
  const targetDir = join(tempRoot, 'escaped-site-name')
  const siteName = `O'Brien & <Co> "Site"`
  const options = createOptions('minimal', true, targetDir, siteName)
  const manifest = buildManifest(options)

  process.env.ACCESSIBLE_ASTRO_STARTER_TEMPLATE_DIR = repoRoot
  await scaffoldProject(options, manifest)

  const generatedIndex = await readFile(resolve(targetDir, 'src/pages/index.astro'), 'utf8')
  const generatedAbout = await readFile(resolve(targetDir, 'src/pages/about.astro'), 'utf8')

  assert.ok(generatedIndex.includes(`title="O'Brien &amp; &lt;Co&gt; &quot;Site&quot;"`))
  assert.ok(generatedIndex.includes(`<Heading level="h1">O'Brien &amp; &lt;Co&gt; &quot;Site&quot;</Heading>`))
  assert.ok(generatedAbout.includes(`subtitle="Use this page to introduce O'Brien &amp; &lt;Co&gt; &quot;Site&quot;`))
})

test('generated hero escapes site names in HTML text', async () => {
  const tempRoot = await mkdtemp(join(tmpdir(), 'accessible-astro-starter-'))
  const targetDir = join(tempRoot, 'escaped-hero-site-name')
  const siteName = `O'Brien & <Co> "Site"`
  const options = createOptions('blog', true, targetDir, siteName)
  const manifest = buildManifest(options)

  process.env.ACCESSIBLE_ASTRO_STARTER_TEMPLATE_DIR = repoRoot
  await scaffoldProject(options, manifest)

  const generatedHero = await readFile(resolve(targetDir, 'src/components/Hero.astro'), 'utf8')

  assert.ok(generatedHero.includes(`<span class="text-gradient">O'Brien</span> &amp; &lt;Co&gt; &quot;Site&quot;`))
  assert.ok(!generatedHero.includes(`O\\'Brien`))
})

test('generated navigation compares active paths without substring matches', async () => {
  const tempRoot = await mkdtemp(join(tmpdir(), 'accessible-astro-starter-'))
  const targetDir = join(tempRoot, 'active-navigation')
  const options = createOptions('blog', true, targetDir)
  const manifest = buildManifest(options)

  process.env.ACCESSIBLE_ASTRO_STARTER_TEMPLATE_DIR = repoRoot
  await scaffoldProject(options, manifest)

  const generatedNavigation = await readFile(resolve(targetDir, 'src/components/Navigation.astro'), 'utf8')

  assert.ok(generatedNavigation.includes("currentPath === itemPath || currentPath.startsWith(itemPath + '/')"))
  assert.ok(!generatedNavigation.includes("currentPathname.includes(menuItem.pathname.replaceAll('/', ''))"))
})

async function expectExists(rootDir: string, relativePath: string): Promise<void> {
  const file = resolve(rootDir, relativePath)
  const content = await readFile(file, 'utf8').catch(() => null)
  assert.notEqual(content, null, `${relativePath} should exist`)
}

async function expectMissing(rootDir: string, relativePath: string): Promise<void> {
  const file = resolve(rootDir, relativePath)
  await assert.rejects(() => readFile(file, 'utf8'), `${relativePath} should be removed`)
}

for (const preset of PRESETS) {
  for (const includeLauncher of [true, false]) {
    test(`${preset} preset scaffolds with launcher ${includeLauncher ? 'on' : 'off'}`, async () => {
      const tempRoot = await mkdtemp(join(tmpdir(), 'accessible-astro-starter-'))
      const targetDir = join(tempRoot, `${preset}-${includeLauncher ? 'launcher' : 'plain'}`)
      const options = createOptions(preset, includeLauncher, targetDir)
      const manifest = buildManifest(options)

      process.env.ACCESSIBLE_ASTRO_STARTER_TEMPLATE_DIR = repoRoot
      await scaffoldProject(options, manifest)

      const packageJson = JSON.parse(await readFile(resolve(targetDir, 'package.json'), 'utf8')) as {
        name: string
        private?: boolean
        workspaces?: string[]
        dependencies?: Record<string, string>
        devDependencies?: Record<string, string>
      }

      assert.equal(packageJson.name, options.siteId)
      assert.equal(packageJson.private, true)
      assert.equal(packageJson.workspaces, undefined)
      assert.equal(Boolean(packageJson.dependencies?.['accessible-astro-launcher']), includeLauncher)
      assert.equal(Boolean(packageJson.devDependencies?.['@astrojs/mdx']), manifest.keepMdx)

      const astroConfig = await readFile(resolve(targetDir, 'astro.config.mjs'), 'utf8')
      assert.ok(astroConfig.includes('vite: viteConfig'))
      assert.equal(astroConfig.includes("@astrojs/mdx"), manifest.keepMdx)
      assert.equal(astroConfig.includes('BLOG_API_URL'), manifest.keepBlogEnv)

      await expectMissing(targetDir, 'package-lock.json')
      await expectExists(targetDir, 'src/assets/img/logo.svg')

      if (manifest.keepBlog) {
        await expectExists(targetDir, 'src/pages/blog/[...page].astro')
        await expectExists(targetDir, '.env.example')
      } else {
        await expectMissing(targetDir, 'src/pages/blog/[...page].astro')
        await expectMissing(targetDir, '.env.example')
      }

      if (manifest.keepPortfolio) {
        await expectExists(targetDir, 'src/pages/portfolio/[...page].astro')
        await expectExists(targetDir, 'src/content.config.ts')
      } else {
        await expectMissing(targetDir, 'src/pages/portfolio/[...page].astro')
        await expectMissing(targetDir, 'src/content.config.ts')
      }

      if (manifest.keepAboutPage) {
        await expectExists(targetDir, 'src/pages/about.astro')
      } else {
        await expectMissing(targetDir, 'src/pages/about.astro')
      }

      if (manifest.keepContactPage) {
        await expectExists(targetDir, 'src/pages/contact.astro')
        await expectExists(targetDir, 'src/pages/thank-you.astro')
      } else {
        await expectMissing(targetDir, 'src/pages/contact.astro')
        await expectMissing(targetDir, 'src/pages/thank-you.astro')
      }

      if (manifest.keepDemoPages) {
        await expectExists(targetDir, 'src/pages/accessible-components.astro')
        await expectExists(targetDir, 'src/pages/color-contrast-checker.astro')
      } else {
        await expectMissing(targetDir, 'src/pages/accessible-components.astro')
        await expectMissing(targetDir, 'src/pages/color-contrast-checker.astro')
      }

      if (includeLauncher) {
        await expectExists(targetDir, 'src/components/LauncherConfig.astro')
      } else {
        await expectMissing(targetDir, 'src/components/LauncherConfig.astro')
      }

      if (manifest.keepDemoPages && includeLauncher) {
        await expectExists(targetDir, 'src/pages/accessible-launcher.astro')
      } else {
        await expectMissing(targetDir, 'src/pages/accessible-launcher.astro')
      }
    })
  }
}
