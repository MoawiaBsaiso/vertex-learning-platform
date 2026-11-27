import type { SchemaTypeDefinition } from 'sanity'

import { blockContent } from './objects/block-content'
import { learningOutcome } from './objects/learning-outcome'
import { moduleType } from './objects/module'
import { resource } from './objects/resource'
import { category } from './documents/category'
import { course } from './documents/course'
import { instructor } from './documents/instructor'
import { lesson } from './documents/lesson'
import { video } from './documents/video'
import { videoChapter } from './objects/video-chapter'
import { videoChunk } from './objects/video-chunk'

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [
    course,
    lesson,
    video,
    instructor,
    category,
    moduleType,
    learningOutcome,
    resource,
    videoChapter,
    videoChunk,
    blockContent,
  ],
}
