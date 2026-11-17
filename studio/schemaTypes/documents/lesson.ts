import { PlayIcon } from '@sanity/icons'
import { defineArrayMember, defineField, defineType } from 'sanity'

const youtubeHosts = new Set([
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'youtu.be',
  'www.youtu.be',
])

const vimeoHosts = new Set([
  'vimeo.com',
  'www.vimeo.com',
  'player.vimeo.com',
])

const bunnyHosts = new Set([
  'iframe.mediadelivery.net',
  'video.bunnycdn.com',
])

function isAllowedVideoUrl(value: string) {
  try {
    const url = new URL(value)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return false
    }

    const host = url.hostname.toLowerCase()

    return (
      youtubeHosts.has(host) ||
      vimeoHosts.has(host) ||
      bunnyHosts.has(host) ||
      host === 'b-cdn.net' ||
      host.endsWith('.b-cdn.net')
    )
  } catch {
    return false
  }
}

export const lesson = defineType({
  name: 'lesson',
  title: 'Lesson',
  type: 'document',
  icon: PlayIcon,
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (rule) => rule.required().max(120),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'title', maxLength: 96 },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'videoUrl',
      title: 'Video URL',
      description: 'YouTube, Vimeo, or Bunny embed URL.',
      type: 'url',
      validation: (rule) =>
        rule
          .required()
          .uri({ scheme: ['http', 'https'] })
          .custom((value) => {
            if (!value) {
              return true
            }

            return (
              isAllowedVideoUrl(value) ||
              'Use a YouTube, Vimeo, or Bunny video URL.'
            )
          }),
    }),
    defineField({
      name: 'thumbnail',
      title: 'Thumbnail',
      type: 'image',
      options: { hotspot: true },
      fields: [
        defineField({
          name: 'alt',
          title: 'Alternative text',
          type: 'string',
          validation: (rule) => rule.required(),
        }),
      ],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'duration',
      title: 'Duration (seconds)',
      type: 'number',
      validation: (rule) => rule.required().integer().min(1),
    }),
    defineField({
      name: 'freePreview',
      title: 'Free preview',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'studentCount',
      title: 'Student count',
      type: 'number',
      initialValue: 0,
      validation: (rule) => rule.integer().min(0),
    }),
    defineField({
      name: 'keyPoints',
      title: 'Key points',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'string',
          validation: (rule) => rule.required().max(160),
        }),
      ],
      validation: (rule) => rule.required().min(1).max(6),
    }),
    defineField({
      name: 'proTip',
      title: 'Pro tip',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'notes',
      title: 'Notes',
      type: 'blockContent',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'resources',
      title: 'Resources',
      type: 'array',
      of: [defineArrayMember({ type: 'resource' })],
    }),
  ],
  preview: {
    select: {
      title: 'title',
      duration: 'duration',
      freePreview: 'freePreview',
      media: 'thumbnail',
    },
    prepare({ title, duration, freePreview, media }) {
      const minutes = typeof duration === 'number' ? Math.ceil(duration / 60) : 0
      const label = minutes > 0 ? `${minutes} min` : 'Duration not set'

      return {
        title,
        subtitle: freePreview ? `${label} · Free preview` : label,
        media,
      }
    },
  },
})
