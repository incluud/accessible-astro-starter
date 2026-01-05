# Stokoe

Deterministic real-time captions first. Meaning layered later — never instead.

## Overview

Stokoe is a five-lane architecture for real-time speech-to-text, sound awareness, and optional context — designed so real-time behavior is predictable, enrichment is non-blocking, and trust is never compromised.

This repository contains the static website for the Stokoe project, built with Astro and deployed on Cloudflare Pages.

## Design Philosophy

This is not a startup landing page. It's a **standards-grade reference architecture** presented as a web page.

**See [DESIGN_SPEC.md](./DESIGN_SPEC.md) for the complete design specification.**

### Design Principles

- **Declarative, not persuasive**: State facts, not benefits
- **Architectural, not promotional**: Show structure, not hype
- **Reference-grade confidence**: Clarity through typography and spacing
- **Austere formality**: Inspired by W3C specs, RFC documents, IETF standards
- **Zero motion**: No animations, transitions, or hover effects (except accessibility focus states)
- **Dark theme**: High contrast, single accent color, mobile-first

## Features

- **Standards-Grade Design**: Reference architecture aesthetic (calm, declarative, authoritative)
- **Accessibility First**: WCAG AAA contrast, visible focus states, semantic HTML, screen reader optimized
- **Static Site Generation**: No SSR, no JavaScript, optimized for Cloudflare Pages
- **System Fonts**: Zero web font requests, instant loading
- **Mobile-First**: iPhone 390px as primary target, scales to desktop 1440px+
- **Dark Theme Only**: High contrast with single accent color (#0A84FF)

## Tech Stack

- **Framework**: [Astro](https://astro.build) 4.x (static site generation)
- **Styling**: [Tailwind CSS](https://tailwindcss.com) 3.x (utility-first)
- **Content**: MDX with built-in routing
- **Fonts**: System fonts (no web font requests)
- **Icons**: None (Unicode symbols only: →, •, etc.)
- **JavaScript**: Zero (except optional dark mode toggle)

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:4321](http://localhost:4321) in your browser.

### Build

```bash
npm run build
```

Outputs to `dist/` directory.

### Preview

```bash
npm run preview
```

Preview the production build locally.

## Deployment to Cloudflare Pages

### Using the Cloudflare Dashboard

1. Push this repository to GitHub
2. Go to [Cloudflare Pages](https://pages.cloudflare.com)
3. Create a new project and connect your repository
4. Use the following build settings:
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Node version**: 18 or higher

### Using Wrangler CLI

```bash
npx wrangler pages deploy dist
```

## Project Structure

```
/
├── public/                 # Static assets
│   └── logo.svg           # Site logo
├── src/
│   ├── components/        # Astro components
│   │   ├── ui/           # Reusable UI components
│   │   ├── SiteHeader.astro
│   │   ├── Hero.astro
│   │   ├── FiveLaneDiagram.astro
│   │   └── FeatureGrid.astro
│   ├── layouts/          # Page layouts
│   │   ├── BaseLayout.astro
│   │   └── DocsLayout.astro
│   ├── pages/            # File-based routing
│   │   ├── index.mdx
│   │   ├── how-it-works.mdx
│   │   ├── catalyst.mdx
│   │   ├── privacy.mdx
│   │   └── docs/
│   │       ├── index.mdx
│   │       ├── stokoe/
│   │       │   └── architecture.mdx
│   │       └── catalyst/
│   │           └── architecture.mdx
│   ├── styles/
│   │   └── global.css    # Global styles + Liquid Glass utilities
│   └── env.d.ts
├── astro.config.mjs      # Astro configuration
├── tailwind.config.mjs   # Tailwind configuration
├── tsconfig.json         # TypeScript configuration
└── package.json
```

## Design Tokens

### Colors (Dark Theme)

- **Backgrounds**: `#0A0A0B` (base), `#141416` (subtle), `#1C1C1F` (raised)
- **Text**: `#FFFFFF` (primary), `#A1A1A6` (secondary), `#6E6E73` (tertiary)
- **Accent**: `#0A84FF` (links, CTAs, focus rings)
- **Borders**: `#2C2C2E` (subtle), `#48484D` (strong)

### Typography

- **Sans**: System font stack (-apple-system, BlinkMacSystemFont, 'Segoe UI', etc.)
- **Mono**: System mono stack ('SF Mono', 'Consolas', 'Monaco', etc.)
- **Scale**: 36px (H1) → 16px (Body) → 12px (Label)
- **Line Height**: 8px baseline grid alignment
- **Contrast**: WCAG AAA (7:1) for primary text

### Spacing

- **Scale**: 2px, 4px, 8px, 12px, 16px, 24px, 32px, 48px, 64px, 96px, 128px
- **Vertical Rhythm**: All spacing multiples of 8px
- **Grid**: Mobile 16px padding → Desktop 64px padding

## Architecture

### Five-Lane Concept

The Stokoe architecture separates real-time deterministic operations from optional enrichment:

- **Lane A**: Real-time captions (deterministic)
- **Lane B**: Sound awareness (deterministic)
- **Lane C**: Speaker detection (enrichment)
- **Lane D**: Semantic context (enrichment)
- **Lane E**: Knowledge layer (enrichment)

### Pages

- `/` - Homepage with hero, five-lane diagram, and feature grid
- `/how-it-works` - Explanation of the five-lane system
- `/catalyst` - Reference implementation details
- `/privacy` - Privacy and trust principles
- `/docs` - Documentation hub
- `/docs/stokoe/architecture` - Core architecture documentation
- `/docs/catalyst/architecture` - Catalyst implementation details

## Accessibility

- **Contrast**: WCAG AAA (7:1) for primary text, AA (4.5:1) minimum for secondary
- **Focus States**: 2px solid accent outline, 2px offset, always visible
- **Semantic HTML**: `<header>`, `<nav>`, `<main>`, `<section>`, `<footer>`, proper heading hierarchy
- **ARIA**: Minimal, only where required (navigation landmarks, diagram labels)
- **Keyboard Navigation**: Logical tab order, all interactive elements accessible
- **Screen Reader**: Tested with VoiceOver (macOS/iOS) and NVDA (Windows)
- **Motion**: Zero animations by default, no `prefers-reduced-motion` needed

## Performance

- **Static Site Generation**: No SSR, pure HTML/CSS
- **Zero External Requests**: System fonts, no CDNs, no analytics
- **No JavaScript**: Except optional dark mode toggle (< 1KB)
- **First Contentful Paint**: < 1s on 3G
- **Lighthouse Score**: 100 accessibility, 100 best practices target

## License

[Your License Here]

## Contributing

[Your Contributing Guidelines Here]
