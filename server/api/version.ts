import { execSync } from 'node:child_process'
import { defineEventHandler } from 'h3'

let cachedCommitHash: string | null = null

defineEventHandler(() => {
  // Return cached value if it exists
  if (cachedCommitHash !== null) {
    return { hash: cachedCommitHash }
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

  return {
    hash: cachedCommitHash
  }
})
