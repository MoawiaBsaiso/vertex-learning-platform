import assert from 'node:assert/strict'
import test from 'node:test'

import { detectProvider, parseVideoReference } from './providers'

test('detects supported and unsupported providers', () => {
  assert.equal(
    detectProvider('https://www.youtube.com/watch?v=GErEgIOMy_4'),
    'youtube',
  )
  assert.equal(detectProvider('https://youtu.be/GErEgIOMy_4'), 'youtube')
  assert.equal(
    detectProvider('https://www.youtube.com/embed/GErEgIOMy_4'),
    'youtube',
  )
  assert.equal(
    detectProvider('https://vimeo.com/123456789'),
    'vimeo',
  )
  assert.equal(
    detectProvider(
      'https://iframe.mediadelivery.net/embed/123/456',
    ),
    'bunny',
  )
  assert.equal(detectProvider('https://example.com/video'), 'unsupported')
  assert.equal(detectProvider('not a url'), 'unsupported')
})

test('extracts provider ids while preserving the exact url', () => {
  const url = 'https://www.youtube.com/watch?v=GErEgIOMy_4&t=10s'
  const reference = parseVideoReference(url)

  assert.equal(reference?.provider, 'youtube')
  assert.equal(reference?.videoId, 'GErEgIOMy_4')
  assert.equal(reference?.url, url)
  assert.equal(
    parseVideoReference('https://vimeo.com/123456789')?.videoId,
    '123456789',
  )
  assert.equal(
    parseVideoReference('ftp://vimeo.com/123456789'),
    null,
  )
})
