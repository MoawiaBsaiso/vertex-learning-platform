import type {
  CATEGORIES_LIST_QUERY_RESULT,
  COURSES_LIST_QUERY_RESULT,
  COURSE_BY_SLUG_QUERY_RESULT,
  INSTRUCTORS_LIST_QUERY_RESULT,
  INSTRUCTOR_BY_SLUG_QUERY_RESULT,
  LESSON_BY_SLUG_QUERY_RESULT,
} from '@/sanity.types'

import { sanityFetch } from './client'
import { formatDuration } from './format'
import {
  CATEGORIES_LIST_QUERY,
  COURSES_LIST_QUERY,
  COURSE_BY_SLUG_QUERY,
  COURSE_SLUGS_QUERY,
  INSTRUCTORS_LIST_QUERY,
  INSTRUCTOR_BY_SLUG_QUERY,
  LESSON_BY_SLUG_QUERY,
  LESSON_SLUGS_QUERY,
} from './queries'

type LessonDetail = NonNullable<LESSON_BY_SLUG_QUERY_RESULT>
type LessonCourse = NonNullable<LessonDetail['course']>
type LessonCourseModule = NonNullable<
  NonNullable<LessonCourse['modules']>[number]
>
type LessonCourseLesson = NonNullable<
  NonNullable<LessonCourseModule['lessons']>[number]
>

type InstructorDetail = NonNullable<INSTRUCTOR_BY_SLUG_QUERY_RESULT>
type InstructorCourse = NonNullable<InstructorDetail['courses']>[number]

type CourseWithModules = {
  modules?: ReadonlyArray<{
    lessons?: ReadonlyArray<{ duration?: number | null } | null> | null
  } | null> | null
}

type CourseStatsModule = NonNullable<
  NonNullable<CourseWithModules['modules']>[number]
>
type CourseStatsLesson = NonNullable<
  NonNullable<CourseStatsModule['lessons']>[number]
>

function withCourseStats<T extends CourseWithModules>(course: T) {
  const modules = (course.modules ?? []).filter(
    (module): module is CourseStatsModule => module !== null,
  )
  const lessons = modules.flatMap((module) =>
    (module.lessons ?? []).filter(
      (lesson): lesson is CourseStatsLesson => lesson !== null,
    ),
  )
  const durationSeconds = lessons.reduce(
    (total, lesson) => total + (lesson.duration ?? 0),
    0,
  )

  return {
    ...course,
    moduleCount: modules.length,
    lessonCount: lessons.length,
    durationSeconds,
    durationLabel: formatDuration(durationSeconds),
  }
}

function buildLessonContext(course: LessonCourse | null, lessonId: string) {
  if (!course) {
    return null
  }

  const modules = (course.modules ?? []).filter(
    (module): module is LessonCourseModule => module !== null,
  )
  const entries = modules.flatMap((module, moduleIndex) =>
    (module.lessons ?? [])
      .filter(
        (lesson): lesson is LessonCourseLesson => lesson !== null,
      )
      .map((lesson, lessonIndex) => ({
        module,
        moduleIndex,
        lesson,
        lessonIndex,
      })),
  )
  const currentIndex = entries.findIndex(
    (entry) => entry.lesson._id === lessonId,
  )

  if (currentIndex === -1) {
    return null
  }

  const current = entries[currentIndex]
  const previous = entries[currentIndex - 1]
  const next = entries[currentIndex + 1]
  const labelFor = (entry: (typeof entries)[number]) =>
    `${entry.moduleIndex + 1}.${entry.lessonIndex + 1}`
  const lessonLabel = labelFor(current)
  const durationLabelFor = (lesson: LessonCourseLesson) =>
    formatDuration(lesson.duration)

  return {
    course: {
      _id: course._id,
      title: course.title ?? "",
      slug: course.slug ?? "",
      summary: course.summary ?? null,
      level: course.level,
      icon: course.icon,
      instructor: course.instructor
        ? {
            _id: course.instructor._id,
            name: course.instructor.name,
            slug: course.instructor.slug,
            photo: course.instructor.photo,
            expertise: course.instructor.expertise,
          }
        : null,
      category: course.category
        ? {
            _id: course.category._id,
            title: course.category.title,
            slug: course.category.slug,
          }
        : null,
    },
    module: {
      _key: current.module._key,
      title: current.module.title ?? "",
      summary: current.module.summary,
    },
    moduleNumber: current.moduleIndex + 1,
    lessonNumber: current.lessonIndex + 1,
    lessonLabel,
    currentLessonId: lessonId,
    modules: modules.map((module, moduleIndex) => {
      const moduleLessons = (module.lessons ?? []).filter(
        (lesson): lesson is LessonCourseLesson => lesson !== null,
      )

      return {
        _key: module._key,
        title: module.title ?? "",
        durationLabel: formatDuration(
          moduleLessons.reduce(
            (total, lesson) => total + (lesson.duration ?? 0),
            0,
          ),
        ),
        moduleNumber: moduleIndex + 1,
        lessons: moduleLessons.map((lesson) => ({
          _id: lesson._id,
          title: lesson.title ?? "",
          slug: lesson.slug ?? "",
          durationLabel: durationLabelFor(lesson),
        })),
      }
    }),
    previousLesson: previous
      ? {
          title: previous.lesson.title,
          slug: previous.lesson.slug,
          lessonLabel: labelFor(previous),
          durationLabel: durationLabelFor(previous.lesson),
        }
      : null,
    nextLesson: next
      ? {
          title: next.lesson.title,
          slug: next.lesson.slug,
          lessonLabel: labelFor(next),
          durationLabel: durationLabelFor(next.lesson),
        }
      : null,
  }
}

export async function getCourses() {
  const courses = await sanityFetch({
    query: COURSES_LIST_QUERY,
    tags: ['course'],
  })

  return courses.map(withCourseStats)
}

export async function getCourseBySlug(slug: string) {
  const course = await sanityFetch({
    query: COURSE_BY_SLUG_QUERY,
    params: { slug },
    tags: ['course', `course:${slug}`],
  })

  return course ? withCourseStats(course) : null
}

export async function getCourseSlugs() {
  const slugs = await sanityFetch({
    query: COURSE_SLUGS_QUERY,
    tags: ['course'],
  })

  return slugs.flatMap(({ slug }) => (slug ? [slug] : []))
}

export async function getLessonBySlug(slug: string) {
  const lesson = await sanityFetch({
    query: LESSON_BY_SLUG_QUERY,
    params: { slug },
    tags: ['lesson', `lesson:${slug}`, 'course'],
  })

  if (!lesson) {
    return null
  }

  const { course, ...lessonData } = lesson

  return {
    ...lessonData,
    context: buildLessonContext(course, lesson._id),
  }
}

export async function getLessonSlugs() {
  const slugs = await sanityFetch({
    query: LESSON_SLUGS_QUERY,
    tags: ['lesson'],
  })

  return slugs.flatMap(({ slug }) => (slug ? [slug] : []))
}

export async function getInstructors() {
  return sanityFetch({
    query: INSTRUCTORS_LIST_QUERY,
    tags: ['instructor', 'course'],
  })
}

export async function getInstructorBySlug(slug: string) {
  const instructor = await sanityFetch({
    query: INSTRUCTOR_BY_SLUG_QUERY,
    params: { slug },
    tags: ['instructor', `instructor:${slug}`, 'course'],
  })

  if (!instructor) {
    return null
  }

  const courses = (instructor.courses ?? []).filter(
    (course): course is InstructorCourse => course !== null,
  )

  return {
    ...instructor,
    courses: courses.map(withCourseStats),
  }
}

export async function getInstructorSlugs() {
  const instructors = await getInstructors()

  return instructors.flatMap(({ slug }) => (slug ? [slug] : []))
}

export async function getCategories() {
  return sanityFetch({
    query: CATEGORIES_LIST_QUERY,
    tags: ['category', 'course'],
  })
}

export type {
  CATEGORIES_LIST_QUERY_RESULT,
  COURSES_LIST_QUERY_RESULT,
  COURSE_BY_SLUG_QUERY_RESULT,
  INSTRUCTORS_LIST_QUERY_RESULT,
  INSTRUCTOR_BY_SLUG_QUERY_RESULT,
  LESSON_BY_SLUG_QUERY_RESULT,
}
