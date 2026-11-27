import assert from 'node:assert/strict'
import test from 'node:test'

import { segmentsToChunks } from './chunks'

test('creates ordered, unique, bounded chunks', () => {
  const longText = 'word '.repeat(300).trim()
  const chunks = segmentsToChunks([
    { offset: 0, text: '   Intro   ' },
    { offset: 0, text: 'same start' },
    { offset: 31, text: longText },
    { offset: 32, text: 'later segment' },
    { offset: 90, text: '   ' },
    { offset: 95, text: 'final' },
  ])

  assert.equal(chunks.length > 2, true)
  assert.equal(chunks.some((chunk) => chunk.text.includes('   ')), false)

  for (const [index, chunk] of chunks.entries()) {
    assert.equal(Number.isInteger(chunk.startSeconds), true)
    assert.equal(chunk.startSeconds >= 0, true)
    assert.equal(chunk.text.length > 0, true)
    assert.equal(chunk.text.length <= 1200, true)

    if (index > 0) {
      assert.equal(chunk.startSeconds > chunks[index - 1].startSeconds, true)
    }
  }

  assert.equal(chunks[0].startSeconds, 0)
  assert.match(chunks[0].text, /Intro same start/)
})

test('fails cleanly when there are no non-empty segments', () => {
  assert.deepEqual(
    segmentsToChunks([
      { offset: 0, text: '   ' },
      { offset: 10, text: '' },
    ]),
    [],
  )
})
