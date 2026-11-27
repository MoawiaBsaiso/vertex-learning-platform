import { run } from './video-ingestion/ingest'

run(process.argv.slice(2)).catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error)
  console.error(`Video ingestion failed: ${message}`)
  process.exitCode = 1
})
