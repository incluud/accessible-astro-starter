# Stokoe Homepage Design Specification

**Version:** 1.0
**Type:** Reference Architecture / Standards Documentation
**Target:** Mobile-first (iPhone 390px → Desktop 1440px)
**Theme:** Dark, high-contrast, single accent

---

## 1. Visual Tone & Principles

### Core Directive
This is not a marketing site. This is a technical specification presented as a web page.

### Design Philosophy
- **Declarative, not persuasive**: State facts, not benefits
- **Architectural, not promotional**: Show structure, not hype
- **Reference-grade**: Confidence through clarity, not decoration
- **Austere formality**: Inspired by W3C specs, RFC documents, and IETF standards
- **Restrained visual language**: Typography and spacing do all the work

### Prohibited Elements
- Animations, transitions, hover effects (except focus states)
- Gradient backgrounds, decorative shapes, blobs
- Testimonials, logo walls, customer counts
- Marketing language ("AI-powered", "revolutionary", "game-changing")
- Auto-playing media, parallax, scroll-triggered effects
- Social proof indicators, call-out badges, urgency language

---

## 2. Layout Grid & Spacing System

### Grid Structure

**Mobile (390px base)**
```
Container: 100vw
Padding: 16px left/right
Content max-width: 358px
Gutter: 16px
```

**Tablet (768px+)**
```
Container: 100vw
Padding: 32px left/right
Content max-width: 704px
Gutter: 24px
```

**Desktop (1024px+)**
```
Container: 100vw
Padding: 48px left/right
Content max-width: 928px
Gutter: 32px
```

**Wide Desktop (1440px+)**
```
Container: 100vw
Padding: 64px left/right
Content max-width: 1312px
Gutter: 40px
```

### Spacing Scale (t-shirt sizing)

```
4xs:  2px   (hairline dividers)
3xs:  4px   (micro spacing)
2xs:  8px   (tight grouping)
xs:   12px  (related elements)
sm:   16px  (default gap)
md:   24px  (section breathing room)
lg:   32px  (paragraph separation)
xl:   48px  (subsection boundary)
2xl:  64px  (section boundary)
3xl:  96px  (major section boundary)
4xl:  128px (hero/footer padding)
```

**Vertical Rhythm Rule:**
All vertical spacing must be a multiple of 8px. Line heights must align to 8px baseline grid.

---

## 3. Typography System

### Font Stack

**Sans (body, interface):**
```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
```

**Mono (code, technical labels):**
```css
font-family: 'SF Mono', 'Consolas', 'Monaco', 'Courier New', monospace;
```

**No decorative fonts. No custom web fonts beyond system defaults.**

### Type Scale

| Element | Size (px) | Line Height | Weight | Letter Spacing |
|---------|-----------|-------------|--------|----------------|
| **H1** (hero) | 36 / 48† | 40 / 52† | 700 | -0.02em |
| **H2** (section) | 28 / 36† | 32 / 40† | 600 | -0.01em |
| **H3** (subsection) | 20 / 24† | 24 / 28† | 600 | 0 |
| **H4** (pillar title) | 16 / 18† | 24 / 24† | 600 | 0 |
| **Body Large** | 18 / 20† | 28 / 32† | 400 | 0 |
| **Body** | 16 | 24 | 400 | 0 |
| **Body Small** | 14 | 20 | 400 | 0 |
| **Label** | 12 | 16 | 500 | 0.03em |
| **Code Inline** | 14 | inherit | 400 | 0 |
| **Code Block** | 13 | 20 | 400 | 0 |

**† = Mobile / Desktop**

### Typographic Rules
- Maximum line length: 80ch (body text)
- Headings: max 40ch
- No justified text
- No all-caps except labels (sparingly)
- No italics except `<em>` in body copy
- Mono font only for code, file paths, technical identifiers

---

## 4. Color System

### Palette (Dark Theme)

```css
/* Backgrounds */
--bg-base:         #0A0A0B;    /* Primary background */
--bg-subtle:       #141416;    /* Elevated surfaces */
--bg-raised:       #1C1C1F;    /* Cards, modals */
--bg-input:        #0F0F10;    /* Form fields */

/* Text */
--text-primary:    #FFFFFF;    /* Headings, primary content */
--text-secondary:  #A1A1A6;    /* Body copy */
--text-tertiary:   #6E6E73;    /* Captions, metadata */
--text-disabled:   #48484D;    /* Disabled states */

/* Accent (single color) */
--accent:          #0A84FF;    /* Links, CTAs, focus rings */
--accent-hover:    #409CFF;    /* Hover state (accessibility only) */
--accent-muted:    #0A3D75;    /* Accent backgrounds */

/* Borders */
--border-subtle:   #2C2C2E;    /* Dividers, card outlines */
--border-strong:   #48484D;    /* Emphasized borders */
--border-accent:   #0A84FF;    /* Focus, active states */

/* Functional */
--success:         #30D158;    /* Rare use */
--error:           #FF453A;    /* Rare use */
--warning:         #FFD60A;    /* Rare use */
```

### Color Usage Rules

1. **Background hierarchy**: Use max 2 levels (base + subtle). Avoid third level.
2. **Text contrast**:
   - Primary text on base: 16:1 (AAA)
   - Secondary text on base: 7:1 (AA)
   - Tertiary text on base: 4.5:1 (minimum AA)
3. **Accent sparingly**: Links, primary CTA, focus rings only
4. **No gradients, no transparency** (except 1px borders at 50% opacity for diagrams)

---

## 5. Component Library

### 5.1 Navigation Header

**Structure:**
```
[Logo] ————————————————————— [Documentation] [GitHub]
```

**Specs:**
- Height: 64px (mobile), 72px (desktop)
- Background: `--bg-base` with 1px `--border-subtle` bottom border
- Logo: Text-only "Stokoe" in 18px / 600 weight
- Links: 14px / 500 weight, `--text-secondary`, hover → `--text-primary`
- Sticky: No
- Layout: Flexbox, space-between, align center
- Padding: 16px (mobile), 24px (desktop) horizontal

**Mobile Behavior:**
- Same layout, no hamburger menu
- Hide GitHub link if < 360px width

---

### 5.2 Hero Section

**Structure:**
```
[Category Label]
[Headline]
[Subhead]
[CTA Primary] [CTA Secondary]
```

**Specs:**
- Padding top: 64px (mobile), 96px (desktop)
- Padding bottom: 64px (mobile), 96px (desktop)
- Background: `--bg-base`
- Max-width: 640px (centered)
- Text alignment: Center (mobile), Left (desktop 1024px+)

**Elements:**
- **Category Label**: 12px mono, `--text-tertiary`, letter-spacing 0.05em, margin-bottom 16px
  - Example: "ACCESSIBILITY FRAMEWORK"
- **Headline (H1)**: Type scale H1, `--text-primary`, margin-bottom 16px
  - Max 12 words, declarative statement
- **Subhead**: Body Large, `--text-secondary`, margin-bottom 32px
  - Single sentence, max 20 words
- **CTAs**: Horizontal flex, gap 12px (mobile stacks if needed)

---

### 5.3 Button Component

**Primary CTA:**
```css
Background: --accent
Color: #FFFFFF
Padding: 12px 24px (mobile), 14px 32px (desktop)
Border-radius: 6px
Font: 14px / 600 / 0.01em
Border: none
Height: 44px (mobile), 48px (desktop)
```

**Secondary CTA:**
```css
Background: transparent
Color: --text-primary
Border: 1px solid --border-strong
Padding: 12px 24px (mobile), 14px 32px (desktop)
Border-radius: 6px
Font: 14px / 600 / 0.01em
Height: 44px (mobile), 48px (desktop)
```

**Text Link (tertiary):**
```css
Background: none
Color: --accent
Font: 14px / 500
Text-decoration: underline
Text-underline-offset: 3px
```

**States:**
- **Hover**: No visual change (accessibility only)
- **Focus**: 2px `--accent` outline, 2px offset
- **Active**: Opacity 0.8 (brief, on click)
- **Disabled**: Opacity 0.4, cursor not-allowed

---

### 5.4 Section Header

**Pattern:**
```
[Section Number] [Section Title]
[Optional description paragraph]
```

**Specs:**
- Section Number: 12px mono, `--text-tertiary`, margin-right 12px
  - Example: "01", "02", "03"
- Section Title (H2): Type scale H2, `--text-primary`
- Description: Body, `--text-secondary`, margin-top 12px, max-width 60ch
- Margin-bottom: 48px
- Horizontal rule: 1px `--border-subtle`, margin-bottom 48px (optional)

---

### 5.5 Pillar Block (Architectural Guarantees)

**Layout:** 2-column grid (mobile: 1 column)

**Grid Specs:**
```css
Display: grid
Grid-template-columns: repeat(auto-fit, minmax(280px, 1fr))
Gap: 24px (mobile), 32px (desktop)
```

**Single Pillar:**
```
[Number Badge] [Title]
[Description]
```

**Specs:**
- **Number Badge**:
  - Size: 32px × 32px
  - Background: `--bg-subtle`
  - Border: 1px `--border-subtle`
  - Border-radius: 4px
  - Content: "1", "2", "3", "4" in 14px mono, `--text-tertiary`, centered
  - Margin-bottom: 12px
- **Title (H4)**: Type scale H4, `--text-primary`, margin-bottom 8px
- **Description**: Body Small, `--text-secondary`, line-height 20px

**No hover effects, no cards, no shadows.**

---

### 5.6 Diagram Frame (Five-Lane Architecture)

**Container:**
```css
Background: --bg-subtle
Border: 1px solid --border-subtle
Border-radius: 8px
Padding: 32px (mobile), 48px (desktop)
```

**Diagram Placeholder:**
- Use SVG or `<pre>` ASCII diagram
- Mono font, 13px, `--text-secondary`
- Center-aligned
- Max-width: 100%
- Overflow-x: auto (mobile scroll if needed)

**Caption:**
```
Below diagram, 14px, --text-tertiary, italic, margin-top 16px
Example: "Figure 1: Five-lane separation of deterministic and enrichment layers"
```

---

### 5.7 CTA Band (Documentation)

**Structure:**
```
[Full-width band with centered content]
[Headline] [CTA Button]
```

**Specs:**
- Background: `--bg-subtle`
- Border-top: 1px `--border-subtle`
- Border-bottom: 1px `--border-subtle`
- Padding: 48px 16px (mobile), 64px 32px (desktop)
- Text alignment: Center
- **Headline**: H3 type scale, `--text-primary`, margin-bottom 24px
  - Example: "Read the technical specification"
- **CTA**: Primary button (single, centered)

---

### 5.8 Footer

**Structure:**
```
[Logo] ———————————————— [Privacy] [License] [GitHub]
```

**Specs:**
- Background: `--bg-base`
- Border-top: 1px `--border-subtle`
- Padding: 32px 16px (mobile), 48px 32px (desktop)
- Layout: Flexbox, space-between
- **Logo**: Same as header (text-only "Stokoe")
- **Links**: 14px, `--text-tertiary`, gap 24px
- **Mobile**: Stack vertically, logo top, links below with 8px gap

**No copyright statement, no social icons, no newsletter signup.**

---

## 6. Page Architecture

### 6.1 Section Order

1. **Navigation Header** (sticky: no)
2. **Hero** (category label + headline + subhead + 2 CTAs)
3. **What is Stokoe?** (section header + single paragraph, max 120 words)
4. **Architectural Guarantees** (section header + 4 pillar blocks)
5. **Five-Lane Architecture** (section header + diagram frame + caption)
6. **Reference Implementation** (section header + Catalyst description, 2 sentences max + link)
7. **Documentation CTA Band**
8. **Footer**

### 6.2 Section Spacing

- Hero to "What is Stokoe?": 96px
- Between sections: 96px (mobile), 128px (desktop)
- CTA Band to Footer: 0px (flush)

---

### 6.3 Content Specifications

#### Hero
- **Category Label**: "ACCESSIBILITY FRAMEWORK"
- **Headline**: "Deterministic captions first. Meaning emerges in layers."
- **Subhead**: "A five-lane architecture for real-time speech-to-text where trust is never delegated to interpretation."
- **CTA 1**: "Architecture" → `/docs/stokoe/architecture`
- **CTA 2**: "Reference Implementation" → `/catalyst`

#### What is Stokoe?
- **Paragraph**: "Stokoe is a standards-grade architecture for real-time accessibility. It separates deterministic operations (captions, sound awareness) from optional semantic enrichment (speaker detection, context, knowledge). Real-time lanes are predictable and never blocked. Enrichment layers add meaning without compromising the raw transcript. Trust is local, inspectable, and never dependent on opaque models or cloud services."

#### Architectural Guarantees (4 Pillars)
1. **Deterministic First**
   "Real-time lanes (A, B) operate independently of interpretation. Captions and sound events are delivered with predictable latency and zero dependency on semantic models."

2. **Layered Enrichment**
   "Meaning is added in optional, non-blocking lanes (C, D, E). Enrichment never replaces the raw transcript—it annotates it. Users control which layers they trust."

3. **Local by Default**
   "Processing happens on-device where possible. Cloud enrichment is opt-in, not required. Data sovereignty and privacy are architectural guarantees, not policy promises."

4. **Inspectable by Design**
   "Lane boundaries are explicit. Data flow is traceable. Users can audit what each layer contributes and disable layers that violate their trust model."

#### Five-Lane Architecture
- **Diagram**: ASCII or SVG representation of lanes A–E
- **Caption**: "Figure 1: Separation of deterministic (A, B) and enrichment (C, D, E) processing lanes"

#### Reference Implementation: Catalyst
- **Text**: "Catalyst is the reference implementation of Stokoe. It demonstrates lane separation, local-first processing, and inspectable enrichment in a production-ready Swift framework."
- **Link**: "View Catalyst documentation" → `/catalyst`

#### Documentation CTA Band
- **Headline**: "Read the technical specification"
- **CTA**: "Documentation" → `/docs`

#### Footer
- **Links**: Privacy | License | GitHub

---

## 7. Accessibility Requirements

### Contrast Targets
- **WCAG AAA (7:1)**: Primary headings and body text
- **WCAG AA (4.5:1)**: Secondary text, captions, labels
- **Focus indicators**: 2px solid `--accent`, 2px offset, never hidden
- **Link underlines**: Always visible, no hover-only underlines

### Keyboard Navigation
- Tab order: Logical, left-to-right, top-to-bottom
- Skip links: Not required (simple layout)
- Escape key: No modals, no need
- Enter/Space: Activate buttons and links

### Semantic HTML
- `<header>`, `<nav>`, `<main>`, `<section>`, `<footer>`
- Heading hierarchy: Single `<h1>`, logical `<h2>`–`<h4>` nesting
- `<article>` for pillar blocks
- `<figure>` + `<figcaption>` for diagram

### ARIA
- `aria-label` on navigation: "Primary navigation"
- `aria-current="page"` on active nav link (if applicable)
- No `aria-hidden` on interactive elements
- No role overrides unless required for custom components

### Reduced Motion
- **Default**: No animations
- No need for `prefers-reduced-motion` media query (already zero motion)
- Transitions only on focus states (instant)

### Screen Reader Testing
- VoiceOver (macOS/iOS): Primary testing
- NVDA (Windows): Secondary testing
- Landmarks must be navigable
- All interactive elements must announce purpose

---

## 8. Do / Don't List

### DO
- ✓ Use declarative statements ("Stokoe is…", "Lane A handles…")
- ✓ Show architectural diagrams with labels
- ✓ Provide direct links to technical documentation
- ✓ Use monospace font for lane identifiers (A, B, C, D, E)
- ✓ Maintain strict vertical rhythm (8px baseline grid)
- ✓ Test with screen readers and keyboard-only navigation
- ✓ Use semantic HTML and proper heading hierarchy
- ✓ Keep content factual, technical, and precise

### DON'T
- ✗ Use marketing language ("revolutionary", "game-changing", "AI-powered")
- ✗ Add testimonials, customer logos, or social proof
- ✗ Include animations, parallax, or scroll-triggered effects
- ✗ Use gradient backgrounds or decorative shapes
- ✗ Add hover effects beyond accessibility focus states
- ✗ Use more than one accent color
- ✗ Add feature comparison tables or competitive positioning
- ✗ Include "Join our community" or newsletter signups
- ✗ Use custom fonts beyond system defaults
- ✗ Add loading spinners, skeleton screens, or micro-interactions
- ✗ Create artificial urgency ("Limited time", "Join 10,000+ users")
- ✗ Use stock photography or decorative imagery

---

## 9. Responsive Breakpoints

### Breakpoint Tokens
```css
--bp-sm:  390px   /* iPhone base */
--bp-md:  768px   /* Tablet portrait */
--bp-lg:  1024px  /* Tablet landscape / small desktop */
--bp-xl:  1440px  /* Desktop */
--bp-2xl: 1920px  /* Wide desktop */
```

### Responsive Behavior

**Typography:**
- Mobile (< 768px): Use smaller type scale values
- Desktop (≥ 768px): Use larger type scale values
- Line length: Constrain to 80ch max

**Layout:**
- Mobile: Single column, 16px padding
- Tablet (≥ 768px): Single column, 32px padding
- Desktop (≥ 1024px): Hero left-aligned, pillar grid 2-column
- Wide (≥ 1440px): Increase horizontal padding to 64px

**Navigation:**
- Mobile: Hide GitHub link if < 360px
- Desktop: Same layout, no changes

**Diagram:**
- Mobile: Horizontal scroll if needed
- Desktop: Fit within container

---

## 10. Implementation Notes

### Technology Assumptions
- **Framework**: Astro (static generation)
- **Styling**: Tailwind CSS or vanilla CSS (no CSS-in-JS)
- **Icons**: None (use Unicode symbols if needed: →, •, etc.)
- **Images**: SVG only (no raster graphics except diagram export)

### Performance
- **No JavaScript**: Except for dark mode toggle (if added later)
- **No external requests**: Self-hosted fonts (system fonts = zero requests)
- **First Contentful Paint**: < 1s on 3G
- **Lighthouse Score**: 100 accessibility, 100 best practices

### Browser Support
- **Baseline 2024**: Chrome, Safari, Firefox, Edge (latest 2 versions)
- **No IE11 support**
- **Fallbacks**: Not required (modern CSS only)

### Testing Checklist
- [ ] Keyboard navigation (tab through all interactive elements)
- [ ] Screen reader (VoiceOver: navigate landmarks, read content)
- [ ] Contrast (Axe DevTools: zero violations)
- [ ] Mobile (iPhone SE 2020, 375px width)
- [ ] Desktop (1440px width)
- [ ] Print stylesheet (optional: make diagram readable on paper)

---

## 11. Design Tokens (CSS Variables)

```css
:root {
  /* Spacing */
  --space-4xs: 2px;
  --space-3xs: 4px;
  --space-2xs: 8px;
  --space-xs: 12px;
  --space-sm: 16px;
  --space-md: 24px;
  --space-lg: 32px;
  --space-xl: 48px;
  --space-2xl: 64px;
  --space-3xl: 96px;
  --space-4xl: 128px;

  /* Colors */
  --bg-base: #0A0A0B;
  --bg-subtle: #141416;
  --bg-raised: #1C1C1F;
  --bg-input: #0F0F10;

  --text-primary: #FFFFFF;
  --text-secondary: #A1A1A6;
  --text-tertiary: #6E6E73;
  --text-disabled: #48484D;

  --accent: #0A84FF;
  --accent-hover: #409CFF;
  --accent-muted: #0A3D75;

  --border-subtle: #2C2C2E;
  --border-strong: #48484D;
  --border-accent: #0A84FF;

  --success: #30D158;
  --error: #FF453A;
  --warning: #FFD60A;

  /* Typography */
  --font-sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
  --font-mono: 'SF Mono', 'Consolas', 'Monaco', 'Courier New', monospace;

  /* Type Scale (mobile) */
  --text-h1: 36px;
  --text-h2: 28px;
  --text-h3: 20px;
  --text-h4: 16px;
  --text-body-lg: 18px;
  --text-body: 16px;
  --text-body-sm: 14px;
  --text-label: 12px;

  /* Line Heights */
  --lh-h1: 40px;
  --lh-h2: 32px;
  --lh-h3: 24px;
  --lh-h4: 24px;
  --lh-body-lg: 28px;
  --lh-body: 24px;
  --lh-body-sm: 20px;
  --lh-label: 16px;

  /* Borders */
  --border-radius-sm: 4px;
  --border-radius-md: 6px;
  --border-radius-lg: 8px;

  /* Transitions */
  --transition-none: 0ms;
}

@media (min-width: 768px) {
  :root {
    --text-h1: 48px;
    --text-h2: 36px;
    --text-h3: 24px;
    --text-h4: 18px;
    --text-body-lg: 20px;

    --lh-h1: 52px;
    --lh-h2: 40px;
    --lh-h3: 28px;
    --lh-h4: 24px;
    --lh-body-lg: 32px;
  }
}
```

---

## 12. ASCII Diagram Example (Five-Lane Architecture)

```
┌─────────────────────────────────────────────────────────────┐
│  REAL-TIME (Deterministic, Local, Non-blocking)             │
├─────────────────────────────────────────────────────────────┤
│  Lane A: Speech-to-Text         → Captions (raw transcript) │
│  Lane B: Sound Awareness         → Audio events (labeled)   │
├─────────────────────────────────────────────────────────────┤
│  ENRICHMENT (Optional, Annotative, Inspectable)             │
├─────────────────────────────────────────────────────────────┤
│  Lane C: Speaker Detection       → Who said what            │
│  Lane D: Semantic Context        → Intent, sentiment        │
│  Lane E: Knowledge Layer         → Linked data, references  │
└─────────────────────────────────────────────────────────────┘

        ↓ Data flows bottom-up (enrichment never blocks A/B)
        ↓ User controls which lanes are active
        ↓ Each lane is independently auditable
```

---

## End of Specification

**Implementation priority:**
1. Layout + spacing system
2. Typography + color system
3. Hero + navigation
4. Section architecture
5. Components (buttons, pillar blocks, diagram frame)
6. Accessibility audit
7. Responsive testing

**Next steps:**
- Developer implements this spec in Astro + Tailwind
- Designer reviews contrast ratios with Axe DevTools
- QA tests keyboard navigation and screen reader flow
- Stakeholder reviews content accuracy (no design iteration)

This specification is complete and implementation-ready.
