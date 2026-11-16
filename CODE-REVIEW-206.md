# Code review follow-ups: PR #206 (CI quality gate)

Working note for follow-ups. Delete it once everything is done: the CLI doesn't remove it, so it would end up in scaffolded sites. Written 2026-11-16 from a `/code-review` (high) of `main...ci/quality-gate`
at `7f45d32`, with each finding checked against the code.

## Where things stand

- Stack [#207](https://github.com/incluud/accessible-astro-starter/stack/207): #205 (housekeeping, approved) → #206 (CI quality gate)
- #206: all 12 CI jobs green, CodeRabbit passed, waiting on review from markteekman
- accessible-astro-launcher 2.0.1 is released and already included in #206
- None of the findings below blocks #206

## Fix in #206: small, and introduced by this PR

Suggested as one commit on `ci/quality-gate`.

- [ ] **#6 Notification links can lose their underline**: `src/assets/scss/base/_general.scss:65`
  - `.notification a { color: inherit }` applies site-wide, but the underline only comes from `main a, footer a`.
    A notification outside `<main>`/`<footer>` (say, in the header) would show links that look like plain text (WCAG 1.4.1).
    None exist today, but the rule is global.
  - Fix: give `.notification a` its own underline (for example the `text-decoration` mixin with `currentColor`).
  - Don't move the fix into the component. We established that `Notification` doesn't style links, and the bug comes
    from the starter's link color (`primary-400` only reaches 4.5:1 on white). See the "fix at the source" decision.

- [ ] **#5 The dark-mode check fails on sites without a dark-mode toggle**: `packages/qa/scripts/a11y-scan.mjs:88`
  - The check requires `html.darkmode`, which only the DarkMode toggle sets (`themeConfig.navigation.darkmode`).
    A preset or user with `darkmode: false` gets `darkmode-not-applied` on every dark scan, so CI goes red with no
    accessibility problem behind it.
  - Fix: skip the dark pass when the site has no dark mode, instead of failing.

- [ ] **#4 `--others` also copies untracked files**: `packages/create-accessible-astro-starter/src/utils.ts:85`
  - The comment says "mirror what giget downloads", but `git ls-files --others` also lists untracked, non-ignored files.
    A demo site created inside the repo (`npm run create:local -- my-demo-site`) gets copied into the next demo site.
    The old plain copy did this too, so it isn't a regression, but the comment is wrong.
  - Fix: drop `--others` so local scaffolds contain exactly the committed files, like giget. New files then need
    `git add` (or `git add -N`) before they show up in a local scaffold.

- [ ] **#8 A malformed URL crashes the scan server**: `packages/qa/scripts/a11y-scan.mjs:52`
  - `decodeURIComponent` throws a `URIError` on input like `/%E0%A4`. That happens inside the async request handler,
    so the rejection is never caught and the scan stops.
  - Fix: wrap the URL decoding in try/catch and return 400. The suggestion to switch to `astro preview` isn't worth it.

## Solved anyway by planned roadmap steps: don't touch now

- **#1 No checks around `fetch(BLOG_API_URL)` in `FeaturedPosts`**: `src/components/FeaturedPosts.astro:45`
  - An empty value, an HTTP error or non-JSON breaks the homepage build. This existed before #205, which only swapped the hardcoded URL.
  - **Step 5 (blog content loader)** rewrites this. We agreed there that the build should fail loudly when the API
    can't be reached, so a check that silently skips would go against that decision.
- **#2 Homepage post links use a different slug than the blog pages**: `src/components/FeaturedPosts.astro:64`
  - The homepage builds its links with `replaceAll(' ', '-')`, but `blog/[post].astro` uses `slugify()`. Any title with
    punctuation gets a homepage link that 404s. JSONPlaceholder titles have no punctuation, so it doesn't show today.
  - **Step 5** solves it: all consumers then read the same collection with the same slug.
- **#3 The plain-copy fallback copies `.cursor`, `.claude`, `.env` and similar**: `packages/create-accessible-astro-starter/src/utils.ts:116`
  - Only when git can't see the template folder, and only on the local or CI path. Users downloading through giget are unaffected.
  - **Step 6 (CLI refactor)** rewrites this copy logic anyway.

## Skip for now, or later

- **#7 TypeScript for `astro check` only works because npm hoists it**: root `check` script, with deps in `packages/qa`
  - npm currently hoists typescript 6.0.3 (from qa) to the root, and the CLI keeps its own 5.9.3 nested. In practice this works.
  - Fixing it properly would mean adding `@astrojs/check` and `typescript` to the root `package.json`, and those would ship to users.
- **#9 CI downloads Chromium in all 11 jobs**: `.github/workflows/ci.yml:117`
  - A speed optimization, not a bug: cache `~/.cache/ms-playwright` per Playwright version, or build the CLI once
    and share it as an artifact. Worth doing once CI time becomes annoying.
- **#10 The dependency check walks through `node_modules`**: `packages/qa/scripts/check-unused-deps.mjs:21`
  - The `readdir` with `{ recursive: true }` reads everything and filters afterwards. It's still fast.
    The difference between local and CI (local-only `.claude`/`.bloom` folders) is theoretical.
  - A manual walk that skips ignored folders would solve both.

## Next steps on the roadmap (after the stack is merged)

3. Remove `/accessible-components` and link to the docs
4. Images in one place (`src/assets`, through `astro:assets`), delete `public/posts` + `public/projects`
5. Blog through a custom content loader (keep the API; the build fails loudly when it's unreachable); solves #1 and #2
6. CLI refactor: delete-only, with `src/slots/home/` + `src/slots/header/`, three config writers, a real `/about` page,
   and `npm run dev:preset`; solves #3
7. Later: ESLint 10
