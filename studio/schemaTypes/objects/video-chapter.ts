import { defineField, defineType } from 'sanity'

export const videoChapter = defineType({
  name: 'videoChapter',
  title: 'Video chapter',
  type: 'object',
  fields: [
    defineField({
      name: 'startSeconds',
      title: 'Start (seconds)',
      type: 'number',
      validation: (rule) => rule.required().integer().min(0),
    }),
    defineField({
      name: 'label',
      type: 'string',
      validation: (rule) => rule.required().max(160),
    }),
  ],
  preview: {
    select: {
      title: 'label',
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
