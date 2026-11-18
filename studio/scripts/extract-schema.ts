import { writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { extractSchema } from '@sanity/schema/_internal'
import { firstValueFrom } from 'rxjs'
import { resolveConfig } from 'sanity'
import config from '../sanity.config'

async function main() {
  const [workspace] = await firstValueFrom(resolveConfig(config))

  if (!workspace) {
    throw new Error('No workspace resolved from sanity.config.ts')
  }

  const schema = extractSchema(workspace.schema, {})
  const outputPath = resolve(process.cwd(), 'schema.json')

  await writeFile(outputPath, `${JSON.stringify(schema, null, 2)}\n`)

  console.log(`Wrote ${outputPath}`)
  process.exit(0)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
