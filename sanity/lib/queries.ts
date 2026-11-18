import { defineQuery } from 'next-sanity'

export const COURSES_LIST_QUERY = defineQuery(`*[
  _type == "course" &&
  defined(slug.current)
] | order(title asc) {
  _id,
  title,
  "slug": slug.current,
  summary,
  coverImage,
  icon,
  level,
  price,
  popular,
  studentCount,
  instructor->{
    _id,
    name,
    "slug": slug.current,
    photo,
    expertise
  },
  category->{
    _id,
    title,
    "slug": slug.current
  },
  modules[]{
    _key,
    title,
    summary,
    lessons[]->{
      _id,
      title,
      "slug": slug.current,
      thumbnail,
      duration,
      freePreview
    }
  }
}`)

export const COURSE_SLUGS_QUERY = defineQuery(`*[
  _type == "course" &&
  defined(slug.current)
] | order(slug.current asc) {
  "slug": slug.current
}`)

export const COURSE_BY_SLUG_QUERY = defineQuery(`*[
  _type == "course" &&
  slug.current == $slug
][0] {
  _id,
  title,
  "slug": slug.current,
  summary,
  coverImage,
  icon,
  level,
  price,
  popular,
  studentCount,
  learningOutcomes[]{
    _key,
    icon,
    title,
    description
  },
  instructor->{
    _id,
    name,
    "slug": slug.current,
    photo,
    expertise,
    bio
  },
  category->{
    _id,
    title,
    "slug": slug.current,
    description
  },
  modules[]{
    _key,
    title,
    summary,
    lessons[]->{
      _id,
      title,
      "slug": slug.current,
      thumbnail,
      duration,
      freePreview
    }
  }
}`)

export const LESSON_SLUGS_QUERY = defineQuery(`*[
  _type == "lesson" &&
  defined(slug.current)
] | order(slug.current asc) {
  "slug": slug.current
}`)

export const LESSON_BY_SLUG_QUERY = defineQuery(`*[
  _type == "lesson" &&
  slug.current == $slug
][0] {
  _id,
  title,
  "slug": slug.current,
  videoUrl,
  thumbnail,
  duration,
  freePreview,
  studentCount,
  keyPoints,
  proTip,
  notes,
  resources[]{
    _key,
    type,
    title,
    description,
    url
  },
  "course": *[
    _type == "course" &&
    references(^._id)
  ][0] {
    _id,
    title,
    "slug": slug.current,
    level,
    icon,
    instructor->{
      _id,
      name,
      "slug": slug.current,
      photo,
      expertise
    },
    category->{
      _id,
      title,
      "slug": slug.current
    },
    modules[]{
      _key,
      title,
      summary,
      lessons[]->{
        _id,
        title,
        "slug": slug.current
      }
    }
  }
}`)

export const INSTRUCTORS_LIST_QUERY = defineQuery(`*[
  _type == "instructor" &&
  defined(slug.current)
] | order(name asc) {
  _id,
  name,
  "slug": slug.current,
  photo,
  expertise,
  "courseCount": count(*[
    _type == "course" &&
    references(^._id)
  ])
}`)

export const INSTRUCTOR_BY_SLUG_QUERY = defineQuery(`*[
  _type == "instructor" &&
  slug.current == $slug
][0] {
  _id,
  name,
  "slug": slug.current,
  photo,
  expertise,
  bio,
  "courses": *[
    _type == "course" &&
    references(^._id)
  ] | order(title asc) {
    _id,
    title,
    "slug": slug.current,
    summary,
    coverImage,
    icon,
    level,
    price,
    popular,
    studentCount,
    category->{
      _id,
      title,
      "slug": slug.current
    },
    modules[]{
      _key,
      title,
      summary,
      lessons[]->{
        _id,
        title,
        "slug": slug.current,
        thumbnail,
        duration,
        freePreview
      }
    }
  }
}`)

export const CATEGORIES_LIST_QUERY = defineQuery(`*[
  _type == "category" &&
  defined(slug.current)
] | order(title asc) {
  _id,
  title,
  "slug": slug.current,
  description,
  "courseCount": count(*[
    _type == "course" &&
    references(^._id)
  ])
}`)
