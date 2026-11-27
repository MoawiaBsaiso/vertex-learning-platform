import { resolve } from 'node:path'

import { apiVersion, dataset, projectId } from '../../env'

function requiredEnv(name: string): string {
  const value = process.env[name]

  if (!value || !value.trim()) {
    throw new Error(`Missing environment variable: ${name}`)
  }

  return value
}

const readToken =
  process.env.SANITY_API_READ_TOKEN?.trim() ||
  process.env.SANITY_API_WRITE_TOKEN?.trim()

if (!readToken) {
  throw new Error(
    'Missing environment variable: SANITY_API_READ_TOKEN or SANITY_API_WRITE_TOKEN',
  )
}

export const sanityConfig = {
  apiVersion,
  dataset,
  projectId,
}

export const readTokenValue = readToken
export const writeTokenValue = requiredEnv('SANITY_API_WRITE_TOKEN')

export function requireWriteToken(): string {
  return writeTokenValue
}

export const artifactsDir = resolve(process.cwd(), '.video-ingestion')
export const rawDir = resolve(artifactsDir, 'raw')
export const reportPath = resolve(artifactsDir, 'report.json')
export const chapterManifestPath = resolve(
  process.cwd(),
  'scripts/video-ingestion/chapters.json',
)
