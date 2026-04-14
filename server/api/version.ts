import { execSync } from 'node:child_process'
import { defineEventHandler } from 'h3'

let cachedCommitHash: string | null = null
let cachedTag: string | null = null

export default defineEventHandler(() => {
  if (cachedCommitHash !== null && cachedTag !== null) {
    return { tag: cachedTag, hash: cachedCommitHash }
  }

  try {
    const hash = execSync('git rev-parse --short=7 HEAD', {
      cwd: process.cwd(),
      stdio: ['ignore', 'pipe', 'ignore'],
      encoding: 'utf-8'
    }).trim()

    cachedCommitHash = hash
  } catch (error) {
    console.error('Failed to retrieve git commit hash:', error)
    cachedCommitHash = 'unknown'
  }

  try {
    const tag = execSync('git describe --tags --abbrev=0', {
      cwd: process.cwd(),
      stdio: ['ignore', 'pipe', 'ignore'],
      encoding: 'utf-8'
    }).trim()

    cachedTag = tag || 'dev'
  } catch {
    cachedTag = 'dev'
  }

  return {
    tag: cachedTag,
    hash: cachedCommitHash
  }
})
