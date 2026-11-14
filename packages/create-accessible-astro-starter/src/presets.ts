import type { ProjectManifest, ResolvedOptions } from './types.js'

const ALWAYS_DELETE = [
  '.astro',
  '.github',
  'AGENTS.md',
  'cliff.toml',
  'dist',
  'package-lock.json',
  'packages',
  'public/accessible-components.webp',
  'public/wcag-compliant.webp',
  'src/components/ContentMedia.astro',
  'src/components/Counter.astro',
]

const DEMO_PAGE_GROUP = [
  'src/pages/accessibility-statement.mdx',
  'src/pages/accessible-components.astro',
  'src/pages/accessible-launcher.astro',
  'src/pages/color-contrast-checker.astro',
  'src/pages/markdown-page.md',
  'src/pages/mdx-page.mdx',
  'src/pages/sitemap.astro',
  'src/components/ColorContrast.astro',
]

export function buildManifest(options: Pick<ResolvedOptions, 'preset' | 'includeLauncher'>): ProjectManifest {
  const keepBlog = options.preset === 'full' || options.preset === 'blog'
  const keepPortfolio = options.preset === 'full' || options.preset === 'portfolio'
  const keepDemoPages = options.preset === 'full'
  const keepAboutPage = options.preset === 'minimal'
  const keepContactPage = options.preset !== 'barebones'
  const keepThankYouPage = keepContactPage
  const keepMdx = keepDemoPages || keepPortfolio
  const keepBlogEnv = keepBlog
  const keepContentCollection = keepPortfolio
  const usePageHeader = options.preset !== 'barebones'

  const pathsToDelete = new Set<string>(ALWAYS_DELETE)

  if (!keepDemoPages) {
    for (const path of DEMO_PAGE_GROUP) {
      pathsToDelete.add(path)
    }
  }

  if (options.preset !== 'full' && options.preset !== 'blog' && options.preset !== 'portfolio') {
    pathsToDelete.add('public/astronaut-hero-img.webp')
    pathsToDelete.add('src/components/Hero.astro')
  }

  if (options.preset !== 'full') {
    pathsToDelete.add('src/components/CallToAction.astro')
    pathsToDelete.add('src/components/Feature.astro')
  }

  if (!options.includeLauncher) {
    pathsToDelete.add('src/components/LauncherConfig.astro')
    pathsToDelete.add('src/pages/accessible-launcher.astro')
  }

  if (!keepBlog) {
    pathsToDelete.add('.env.example')
    pathsToDelete.add('public/posts')
    pathsToDelete.add('src/assets/images/posts')
    pathsToDelete.add('src/components/FeaturedPosts.astro')
    pathsToDelete.add('src/pages/blog')
  }

  if (!keepPortfolio) {
    pathsToDelete.add('public/projects')
    pathsToDelete.add('src/assets/images/projects')
    pathsToDelete.add('src/components/BlockQuote.astro')
    pathsToDelete.add('src/components/FeaturedProjects.astro')
    pathsToDelete.add('src/content')
    pathsToDelete.add('src/content.config.ts')
    pathsToDelete.add('src/pages/portfolio')
  }

  if (!keepContactPage) {
    pathsToDelete.add('src/pages/contact.astro')
    pathsToDelete.add('src/pages/thank-you.astro')
  }

  if (!keepThankYouPage) {
    pathsToDelete.add('src/pages/thank-you.astro')
  }

  if (!keepMdx) {
    pathsToDelete.add('src/layouts/MarkdownLayout.astro')
  }

  if (!keepBlog && !keepPortfolio) {
    pathsToDelete.add('src/components/BreakoutImage.astro')
    pathsToDelete.add('src/components/SocialShares.astro')
    pathsToDelete.add('src/utils/slugify.ts')
  }

  if (!usePageHeader) {
    pathsToDelete.add('src/components/PageHeader.astro')
  }

  return {
    preset: options.preset,
    includeLauncher: options.includeLauncher,
    keepBlog,
    keepPortfolio,
    keepDemoPages,
    keepAboutPage,
    keepContactPage,
    keepThankYouPage,
    keepMdx,
    keepBlogEnv,
    keepContentCollection,
    usePageHeader,
    pathsToDelete: Array.from(pathsToDelete),
  }
}
