# Accessible Astro Starter

A ready-to-use, SEO and accessibility-focused Astro starter template with blog and portfolio functionality.

## Project Overview

- **Type**: Starter theme (static site / blog / portfolio)
- **Output Mode**: Static (SSG)
- **Homepage**: https://accessible-astro-starter.incluud.dev/
- **Repository**: https://github.com/incluud/accessible-astro-starter

Check `package.json` for current version and all dependencies.

### Key Dependencies

- `astro` - Framework (Astro 5.x+)
- `accessible-astro-components` - Core component library
- `tailwindcss` - Styling (v4.x with Vite plugin)
- `@astrojs/mdx` - MDX support
- `@astrojs/sitemap` - XML sitemap generation
- `astro-icon` - Icon system (using Lucide icon set)
- ESLint with `eslint-plugin-jsx-a11y` - Accessibility linting
- Prettier with Astro and Tailwind plugins - Code formatting

## Project Purpose

This is the **flagship starter theme** of the Accessible Astro ecosystem:

- **Target Audience**: Developers building blogs, portfolios, or content-focused websites
- **Features**: Blog with pagination, project portfolio, contact forms, MDX support
- **Showcase**: Demonstrates all components from `accessible-astro-components`
- **WCAG 2.2 AA**: Fully compliant with comprehensive accessibility features
- **Reference Implementation**: Shows best practices for using the component library

## Dev Environment Setup

1. **Install dependencies**:

   ```bash
   npm install
   ```

2. **Start dev server**:

   ```bash
   npm run dev
   # or
   npm start
   ```

   Server starts at `http://localhost:4321`

3. **Build production site**:

   ```bash
   npm run build
   ```

   Output: `./dist/`

4. **Preview production build**:
   ```bash
   npm run preview
   ```

### Workspace Development (Symlinked Components)

This project can work with locally linked `accessible-astro-components`:

- The `astro.config.mjs` automatically detects symlinked packages
- When symlinks are detected, it enables:
  - Auto-reload on component changes
  - Filesystem access to parent directories
  - Symlink preservation in Vite

**To link local components**:

```bash
cd ../accessible-astro-components
npm link
cd ../accessible-astro-starter
npm link accessible-astro-components
```

## Code Style Guidelines

### TypeScript

- Strict mode enabled
- Path aliases configured for cleaner imports:
  - `@components` → `./src/components`
  - `@layouts` → `./src/layouts`
  - `@assets` → `./src/assets`
  - `@content` → `./src/content`
  - `@pages` → `./src/pages`
  - `@public` → `./public`
  - `@post-images` → `./public/posts`
  - `@project-images` → `./public/projects`

### Formatting

- **Prettier** is configured with:
  - `prettier-plugin-astro`
  - `prettier-plugin-css-order`
  - `prettier-plugin-tailwindcss`
- Run format manually: `npx prettier --write .`

### Linting

- **ESLint** configured with:
  - `@typescript-eslint/eslint-plugin`
  - `eslint-plugin-astro`
  - `eslint-plugin-jsx-a11y` (strict accessibility rules)
- Check manually: `npx eslint .`

### Styling

- **Tailwind CSS v4** with Vite plugin
- **SCSS** with custom utilities in `src/assets/scss/`
- **Modern OKLCH** color system with automatic palette generation
- Use logical properties (e.g., `inline-start` instead of `left`)
- Custom properties for theming
- **Atkinson Hyperlegible** font for improved readability

## Accessibility Requirements

This project follows **WCAG 2.2 AA** standards and serves as a reference implementation.

### Essential Practices

1. **Semantic HTML**: Use appropriate elements (`<button>`, `<nav>`, `<main>`, etc.)
2. **Keyboard Navigation**: All interactive elements must be keyboard accessible
3. **Focus Indicators**: Never remove focus outlines without accessible alternatives
4. **Alt Text**: Provide meaningful alt text for images (or use `alt=""` for decorative images)
5. **Color Contrast**: Ensure text has 4.5:1 contrast (3:1 for large text)
6. **ARIA**: Only use ARIA when native HTML is insufficient
7. **Heading Hierarchy**: Maintain proper h1-h6 order
8. **Forms**: Use `<label>`, proper input types, and error messages
9. **Motion**: Respect `prefers-reduced-motion` for all animations

### Testing

- Test with keyboard only (no mouse)
- Test with screen readers (VoiceOver, NVDA, JAWS)
- Use ESLint's jsx-a11y rules to catch common issues
- Check color contrast ratios
- Verify `prefers-reduced-motion` is respected
- Test responsive design on mobile

## File Structure

```
src/
├── components/          # Custom project-specific components
│   ├── Header.astro
│   ├── Footer.astro
│   ├── Navigation.astro
│   ├── SiteMeta.astro       # SEO component
│   ├── ColorContrast.astro  # WCAG contrast checker
│   ├── Featured*.astro      # Content showcase components
│   └── ... (explore for more)
├── content/             # MDX content collections
│   └── projects/        # Project portfolio items
├── layouts/
│   ├── DefaultLayout.astro    # Main layout
│   └── MarkdownLayout.astro   # Layout for MDX content
├── pages/               # Route pages (file-based routing)
│   ├── index.astro      # Homepage
│   ├── accessible-components.astro  # Component showcase
│   ├── blog/
│   │   ├── [...page].astro    # Blog pagination (dynamic route)
│   │   └── [post].astro       # Individual blog posts (dynamic route)
│   ├── contact.astro    # Contact form with validation
│   ├── color-contrast.astro   # Interactive contrast checker
│   ├── 404.astro        # Custom 404 page
│   └── ... (explore for more pages)
├── assets/
│   ├── images/          # Project images
│   ├── img/             # SVG assets
│   └── scss/            # SCSS utility classes
├── styles/
│   └── tailwind.css     # Global Tailwind styles
├── utils/               # Utility functions
├── content.config.ts    # Content collections config
└── env.d.ts             # Type definitions

public/                  # Static assets (served as-is)
├── fonts/               # Atkinson Hyperlegible web fonts
├── posts/               # Blog post images
├── projects/            # Project images
└── favicon.svg
```

## Working with Components

### Using Accessible Astro Components

Import from the package:

```astro
---
import { Accordion, AccordionItem, Button, Card, DarkMode, Modal } from 'accessible-astro-components'
---
```

Many files throughout this project import from `accessible-astro-components`. Check the `/accessible-components` page to see all available components in action.

### Creating Custom Components

- Place in `src/components/`
- Use semantic HTML
- Add proper ARIA attributes when needed
- Ensure keyboard accessibility
- Follow existing patterns in the codebase
- Import and use components from the package when possible

### Component Showcase Page

The `/accessible-components` page (`src/pages/accessible-components.astro`) demonstrates:

- All available components from the library
- Usage examples and code snippets
- Accessibility features of each component
- Interactive demos

## Content Collections

The project uses Astro Content Collections for structured content:

- **Projects**: `src/content/projects/` (7 MDX files)
- Schema defined in `src/content.config.ts`
- Use frontmatter for metadata
- Query with `getCollection()` API
- Dynamic routes generate pages from collections

### Adding Blog Posts

Blog posts are in `src/pages/blog/` as Astro files:

1. Create a new `.astro` file in `src/pages/blog/`
2. Add frontmatter with `title`, `description`, `publishDate`, etc.
3. The `[...page].astro` file handles pagination automatically
4. Add post images to `public/posts/`

### Adding Projects

Projects are MDX content in `src/content/projects/`:

1. Create a new `.mdx` file in `src/content/projects/`
2. Add frontmatter following the schema in `content.config.ts`
3. Write content in MDX format
4. Add project images to `public/projects/`

## Key Pages and Features

### Homepage (`index.astro`)

- Hero section with CTA
- Featured posts
- Featured projects
- Component showcases

### Blog (`blog/[...page].astro` and `blog/[post].astro`)

- Pagination support
- Dynamic routes for individual posts
- Breadcrumbs navigation
- Social sharing

### Contact Page (`contact.astro`)

- Form validation showcase
- Accessible form components
- Error handling examples
- Success page redirect

### Accessible Components (`accessible-components.astro`)

- Comprehensive component showcase
- Live interactive examples
- Component documentation
- Accessibility features highlighted

### Color Contrast Checker (`color-contrast.astro`)

- Interactive WCAG contrast checker
- Real-time contrast ratio calculation
- Pass/fail indicators for AA and AAA levels

## Deployment

This is a **static site** (SSG) that can be deployed anywhere:

### Popular Options

1. **Netlify**: Drop-in deployment
   - Build command: `npm run build`
   - Publish directory: `dist`

2. **Vercel**: Zero-config deployment
   - Auto-detects Astro
   - Deploys on push

3. **GitHub Pages**: Free hosting
   - Configure base path in `astro.config.mjs`
   - Use GitHub Actions for CI/CD

4. **Cloudflare Pages**: Fast global CDN
   - Build command: `npm run build`
   - Output directory: `dist`

### Build Configuration

- Site URL configured in `astro.config.mjs`: `site: 'https://accessible-astro-starter.incluud.dev'`
- Sitemap automatically generated via `@astrojs/sitemap`
- Compressed HTML output for performance

## Commit Guidelines

Follow conventional commits format:

```
type(scope): subject

[optional body]

[optional footer]
```

**Types**: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

**Examples**:

- `feat(blog): add social sharing component`
- `fix(navigation): resolve mobile menu keyboard trap`
- `docs(readme): update installation instructions`
- `a11y(forms): improve error message announcements`
- `style(homepage): update hero section layout`

## PR Instructions

- **Title format**: `[starter] Brief description`
- **Check before submitting**:
  - Run `npm run build` - no errors
  - Check `npx eslint .` - no accessibility violations
  - Test keyboard navigation
  - Verify no console errors
  - Check responsive design on mobile
  - Test with screen reader if accessibility-related
  - Verify `prefers-reduced-motion` respected
- **Include in PR description**:
  - What changed and why
  - Any accessibility considerations
  - Screenshots/videos for UI changes
  - Testing steps performed
  - Which pages are affected

## Troubleshooting

### Symlinked Components Not Updating

1. Check if symlink is detected: Look for "Workspace detected" message on dev server start
2. Verify symlink: `ls -la node_modules/accessible-astro-components`
3. Try restarting dev server
4. Clear cache: `rm -rf node_modules/.astro node_modules/.vite`

### Build Failures

1. Clear cache: `rm -rf node_modules/.astro node_modules/.vite`
2. Reinstall: `rm -rf node_modules && npm install`
3. Check Node version compatibility (Node 18+)
4. Verify all images exist in `public/` directory
5. Check for TypeScript errors: `npx tsc --noEmit`

### Content Collections Not Working

1. Verify schema in `src/content.config.ts`
2. Check frontmatter matches schema
3. Restart dev server
4. Clear Astro cache: `rm -rf node_modules/.astro`

### Styles Not Loading

1. Check Tailwind config: `tailwind.config.js`
2. Verify Vite plugin in `astro.config.mjs`
3. Clear cache and rebuild
4. Check browser console for CSS errors

## Related Projects

This is part of the Accessible Astro ecosystem:

- **[Accessible Astro Components](https://github.com/incluud/accessible-astro-components)**: Component library (dependency)
- **[Accessible Astro Dashboard](https://github.com/incluud/accessible-astro-dashboard)**: Dashboard theme with auth
- **[Accessible Astro Docs](https://github.com/incluud/accessible-astro-docs)**: Documentation site

## Resources

- [WCAG 2.2 Guidelines](https://www.w3.org/TR/WCAG22/)
- [Astro Documentation](https://docs.astro.build/)
- [Tailwind CSS v4](https://tailwindcss.com/docs)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [MDX Documentation](https://mdxjs.com/)
- [Project Roadmap](https://github.com/orgs/incluud/projects/4/views/1)
