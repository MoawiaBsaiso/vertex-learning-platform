import assert from 'node:assert/strict'
import test from 'node:test'

import {
  buildVideoDocument,
  sanitizeSanityId,
  validateVideoDocument,
} from './document'

const baseUrl = 'https://www.youtube.com/watch?v=GErEgIOMy_4'

function validDocument() {
  return buildVideoDocument({
    provider: 'youtube',
    videoId: 'GErEgIOMy_4',
    url: baseUrl,
    chapters: [{ startSeconds: 0, label: 'Intro' }],
    chunks: [{ startSeconds: 0, text: 'Transcript text' }],
  })
}

test('builds deterministic ids with Sanity-safe characters', () => {
  assert.equal(
    sanitizeSanityId('video-youtube-GErEgIOMy_4', baseUrl),
    'video-youtube-GErEgIOMy_4',
  )

  const sanitized = sanitizeSanityId('video-youtube-a/b:c', baseUrl)

  assert.match(sanitized, /^[A-Za-z0-9_.-]+$/)
  assert.match(sanitized, /-[a-f0-9]{8}$/)
})

test('builds a valid video document with stable array keys', () => {
  const document = validDocument()

  assert.equal(document._id, 'video-youtube-GErEgIOMy_4')
  assert.equal(document._type, 'video')
  assert.equal(document.id, 'GErEgIOMy_4')
  assert.equal(document.url, baseUrl)
  assert.equal(document.chapters[0]._key, 'h0')
  assert.equal(document.chunks[0]._key, 'c0')
  assert.deepEqual(validateVideoDocument(document), [])
})

test('rejects duplicate starts, empty text, and oversized text', () => {
  const duplicate = validDocument()
  duplicate.chunks.push({
    _type: 'videoChunk',
    _key: 'c0b',
    startSeconds: 0,
    text: 'duplicate',
  })

  assert.match(
    validateVideoDocument(duplicate).join('; '),
    /startSeconds must be greater/,
  )

  const empty = validDocument()
  empty.chunks[0].text = '   '
  assert.match(validateVideoDocument(empty).join('; '), /text is empty/)

  const oversized = validDocument()
  oversized.chunks[0].text = 'a'.repeat(1201)
  assert.match(validateVideoDocument(oversized).join('; '), /text is empty or too long/)
})
