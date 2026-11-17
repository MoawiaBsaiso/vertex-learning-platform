import { defineField, defineType } from 'sanity'

export const learningOutcome = defineType({
  name: 'learningOutcome',
  title: 'Learning Outcome',
  type: 'object',
  fields: [
    defineField({
      name: 'icon',
      title: 'Icon',
      type: 'string',
      options: {
        list: [
          { title: 'Code', value: 'code' },
          { title: 'Layers', value: 'layers' },
          { title: 'Database', value: 'database' },
          { title: 'Shield', value: 'shield' },
          { title: 'Rocket', value: 'rocket' },
          { title: 'Target', value: 'target' },
          { title: 'Terminal', value: 'terminal' },
          { title: 'Book', value: 'book' },
          { title: 'Clock', value: 'clock' },
        ],
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (rule) => rule.required().max(80),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 3,
      validation: (rule) => rule.required().max(200),
    }),
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'icon',
    },
  },
})
