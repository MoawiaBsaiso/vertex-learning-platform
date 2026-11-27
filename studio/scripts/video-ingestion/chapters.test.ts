import assert from 'node:assert/strict'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

import {
  parseDescriptionChapters,
  parseWatchPageChapters,
  resolveChapters,
} from './chapters'

test('parses description timestamp lines and ignores prose', () => {
  const chapters = parseDescriptionChapters(
    [
      'Some intro prose with 12:34 in it',
      '0:00 - Introduction',
      '00:22 Demo – Agent Loop',
      '1:02:03 Wrap up',
    ].join('\n'),
  )

  assert.deepEqual(chapters, [
    { startSeconds: 0, label: 'Introduction' },
    { startSeconds: 22, label: 'Demo – Agent Loop' },
    { startSeconds: 3723, label: 'Wrap up' },
  ])
})

test('parses youtube watch page chapter renderers', () => {
  const html = `
    <script>var ytInitialData = {"contents":{"x":{
      "chapterRenderer":{"timeRangeStartMillis":22000,"title":{"simpleText":"Demo"}},
      "macroMarkersListItemRenderer":{"timeRangeStartMillis":0,"title":{"runs":[{"text":"Intro"},{"text":" "},{"text":"part"}]}}
    }}};</script>
  `

  assert.deepEqual(parseWatchPageChapters(html), [
    { startSeconds: 0, label: 'Intro part' },
    { startSeconds: 22, label: 'Demo' },
  ])
})

test('uses watch page chapters when description has fewer than two timestamps', async () => {
  const resolution = await resolveChapters({
    videoId: 'GErEgIOMy_4',
    description: '0:00 Only one timestamp',
    manifestPath: 'C:\\__missing_video_chapters__.json',
    fetchHtml: async () =>
      `var ytInitialData = {"a":{"chapterRenderer":{"timeRangeStartMillis":0,"title":{"simpleText":"Intro"}},"b":{"chapterRenderer":{"timeRangeStartMillis":30000,"title":{"simpleText":"Next"}}}}};`,
  })

  assert.equal(resolution.source, 'watch-page')
  assert.deepEqual(resolution.chapters, [
    { startSeconds: 0, label: 'Intro' },
    { startSeconds: 30, label: 'Next' },
  ])
})

test('falls back to authored manifest chapters after watch page failure', async () => {
  const manifestPath = fileURLToPath(new URL('./chapters.json', import.meta.url))

  const resolution = await resolveChapters({
    videoId: 'missing-id',
    description: null,
    manifestPath,
    fetchHtml: async () => {
      throw new Error('network blocked')
    },
  })

  assert.equal(resolution.source, 'none')
  assert.deepEqual(resolution.chapters, [])
  assert.match(resolution.warning ?? '', /watch-page chapter fallback failed/)
})
