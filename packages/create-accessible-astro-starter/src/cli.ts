import * as p from '@clack/prompts'
import { relative, resolve } from 'node:path'
import { buildManifest } from './presets.js'
import { parseCliArgs, getDefaultLauncher } from './options.js'
import { scaffoldProject } from './scaffold.js'
import { outroMessage, renderIntro } from './cli-output.js'
import type { ParsedFlags, Preset, ResolvedOptions } from './types.js'
import { deriveSiteNameFromDirectory, formatPresetLabel, slugifySiteName } from './utils.js'

function unwrapPrompt<T>(value: T | symbol): T {
  if (p.isCancel(value)) {
    p.cancel('Scaffolding cancelled.')
    process.exit(0)
  }

  return value as T
}

const DEFAULT_TARGET_DIR = './my-accessible-site'

async function promptForTargetDir(): Promise<string> {
  return unwrapPrompt(
    await p.text({
      message: 'Where should we create your new project?',
      // Suggest the default without pre-filling it, so a different path can be typed right away.
      // Pressing Enter on the empty field accepts the suggestion.
      placeholder: DEFAULT_TARGET_DIR,
      defaultValue: DEFAULT_TARGET_DIR,
      validate(value) {
        if (value && !value.trim()) {
          return 'Please choose a project directory.'
        }

        return undefined
      },
    }),
  )
}

async function promptForSiteName(initialValue: string): Promise<string> {
  return unwrapPrompt(
    await p.text({
      message: 'What should we call your site?',
      initialValue,
      validate(value) {
        if (!value.trim()) {
          return 'Please enter a site name.'
        }

        return undefined
      },
    }),
  )
}

async function promptForPreset(): Promise<Preset> {
  return unwrapPrompt(
    await p.select<Preset>({
      message: 'Which preset should we start from?',
      options: [
        {
          value: 'full',
          label: 'Full',
          hint: 'Blog, portfolio, and all demo pages',
        },
        {
          value: 'blog',
          label: 'Blog',
          hint: 'Content site with blog + contact pages',
        },
        {
          value: 'portfolio',
          label: 'Portfolio',
          hint: 'Project showcase + contact pages',
        },
        {
          value: 'minimal',
          label: 'Minimal',
          hint: 'Simple content website with home, about, and contact',
        },
        {
          value: 'barebones',
          label: 'Barebones',
          hint: 'Layout, navigation, and styles only',
        },
      ],
    }),
  )
}

async function promptForLauncher(preset: Preset): Promise<boolean> {
  return unwrapPrompt(
    await p.confirm({
      message: 'Include the Accessible Astro launcher?',
      initialValue: getDefaultLauncher(preset),
    }),
  )
}

async function resolveOptions(flags: ParsedFlags): Promise<ResolvedOptions> {
  const targetDirInput = flags.targetDir ?? (flags.yes ? DEFAULT_TARGET_DIR : await promptForTargetDir())
  const targetDir = resolve(process.cwd(), targetDirInput)

  const inferredSiteName = deriveSiteNameFromDirectory(targetDirInput)
  const siteName = flags.siteName ?? (flags.yes ? inferredSiteName : await promptForSiteName(inferredSiteName))
  const preset = flags.preset ?? (flags.yes ? 'full' : await promptForPreset())
  const includeLauncher =
    flags.includeLauncher ?? (flags.yes ? getDefaultLauncher(preset) : await promptForLauncher(preset))
  const siteId = slugifySiteName(siteName)

  if (!siteId) {
    throw new Error('Could not derive a valid package name from the provided site name.')
  }

  return {
    targetDir,
    siteName: siteName.trim(),
    siteId,
    preset,
    includeLauncher,
  }
}

export async function run(argv = process.argv.slice(2)): Promise<void> {
  const flags = parseCliArgs(argv)

  process.stdout.write(renderIntro({ columns: process.stdout.columns }))

  const options = await resolveOptions(flags)
  const manifest = buildManifest(options)
  const spinner = p.spinner()

  spinner.start('Scaffolding your project')
  await scaffoldProject(options, manifest)
  spinner.stop(`Created ${options.siteName}`)

  const relativeFromCwd = relative(process.cwd(), options.targetDir).replace(/\\/g, '/')
  const relativeDir =
    relativeFromCwd === '' ? '.' : relativeFromCwd.startsWith('..') ? options.targetDir : `./${relativeFromCwd}`

  p.note(
    [
      `Directory: ${relativeDir}`,
      `Preset: ${formatPresetLabel(options.preset)}`,
      `Launcher: ${options.includeLauncher ? 'Included' : 'Removed'}`,
      '',
      'Next steps:',
      `cd ${relativeDir}`,
      'npm install',
      'npm run dev',
    ].join('\n'),
    'Project ready',
  )

  p.outro(outroMessage)
}
