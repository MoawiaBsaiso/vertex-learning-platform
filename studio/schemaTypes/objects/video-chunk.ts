import { defineField, defineType } from 'sanity'

export const videoChunk = defineType({
  name: 'videoChunk',
  title: 'Transcript chunk',
  type: 'object',
  fields: [
    defineField({
      name: 'startSeconds',
      title: 'Start (seconds)',
      type: 'number',
      validation: (rule) => rule.required().integer().min(0),
    }),
    defineField({
      name: 'text',
      type: 'text',
      rows: 3,
      validation: (rule) => rule.required().max(1200),
    }),
  ],
  preview: {
    select: {
      title: 'text',
      startSeconds: 'startSeconds',
    },
    prepare({ title, startSeconds }) {
      return {
        title,
        subtitle:
          typeof startSeconds === 'number'
            ? `Starts at ${startSeconds}s`
            : 'Start not set',
      }
    },
  },
})
