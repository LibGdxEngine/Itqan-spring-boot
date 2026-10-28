import api from "@/lib/api-axios"
import type { Granularity, SeriesPoint } from "@/lib/admin-api"

// Typed client for the instructor studio: course builder, curriculum, quizzes, analytics.

export type LessonType = "VIDEO" | "TEXT" | "RESOURCE" | "QUIZ" | "ASSIGNMENT"
export type VideoStatus = "PENDING" | "UPLOADING" | "READY" | "FAILED"
export type CourseLevel = "BEGINNER" | "INTERMEDIATE" | "ADVANCED"

export interface StudioLesson {
  id: number
  title: string
  description?: string | null
  type: LessonType
  videoUrl?: string | null
  videoObjectKey?: string | null
  videoStatus?: VideoStatus | null
  content?: string | null
  resourceUrl?: string | null
  duration?: number | null
  orderIndex: number
  isFree?: boolean | null
  active?: boolean | null
  moduleId: number
  quizId?: number | null
}

export interface StudioModule {
  id: number
  title: string
  description?: string | null
  orderIndex: number
  active?: boolean | null
  courseId: number
  lessons: StudioLesson[]
}

export interface StudioCourse {
  id: number
  title: string
  description?: string | null
  instructor: string
  ownerUserId?: number | null
  price: number
  duration: number
  level: CourseLevel | string
  category: string
  thumbnailUrl?: string | null
  previewVideoUrl?: string | null
  learningOutcomes: string[]
  requirements: string[]
  tags: string[]
  active: boolean
  modules: StudioModule[]
  createdAt: string
  updatedAt: string
}

export interface CourseInput {
  title: string
  description?: string
  instructor?: string
  price: number
  duration: number
  level: string
  category: string
  thumbnailUrl?: string | null
  previewVideoUrl?: string | null
  tags?: string[]
  learningOutcomes?: string[]
  requirements?: string[]
}

export interface LessonInput {
  moduleId: number
  title: string
  description?: string
  type: LessonType
  videoUrl?: string
  content?: string
  resourceUrl?: string
  duration?: number
  orderIndex: number
  isFree?: boolean
  active?: boolean
}

export interface CurriculumLayout {
  modules: { moduleId: number; lessonIds: number[] }[]
}

function normalizeCourse(course: StudioCourse): StudioCourse {
  return {
    ...course,
    learningOutcomes: course.learningOutcomes ?? [],
    requirements: course.requirements ?? [],
    tags: course.tags ?? [],
    modules: [...(course.modules ?? [])]
      .sort((a, b) => a.orderIndex - b.orderIndex)
      .map((m) => ({ ...m, lessons: [...(m.lessons ?? [])].sort((a, b) => a.orderIndex - b.orderIndex) })),
  }
}

export const studioApi = {
  myCourses: async (): Promise<StudioCourse[]> => {
    const { data } = await api.get<{ content: StudioCourse[] }>("/api/courses/mine", { params: { size: 200 } })
    return (data.content ?? []).map(normalizeCourse)
  },
  getCourse: async (id: number) => normalizeCourse((await api.get<StudioCourse>(`/api/courses/${id}`)).data),
  createCourse: async (input: CourseInput) => normalizeCourse((await api.post<StudioCourse>("/api/courses", input)).data),
  updateCourse: async (id: number, input: CourseInput) =>
    normalizeCourse((await api.put<StudioCourse>(`/api/courses/${id}`, input)).data),
  publish: async (id: number) => normalizeCourse((await api.patch<StudioCourse>(`/api/courses/${id}/publish`)).data),
  unpublish: async (id: number) =>
    normalizeCourse((await api.patch<StudioCourse>(`/api/courses/${id}/deactivate`)).data),
  deleteCourse: async (id: number) => {
    await api.delete(`/api/courses/${id}`)
  },
  saveCurriculum: async (courseId: number, layout: CurriculumLayout) => {
    await api.put(`/api/courses/${courseId}/curriculum`, layout)
  },

  createModule: async (courseId: number, title: string, orderIndex: number) =>
    (await api.post<StudioModule>("/api/modules", { courseId, title, orderIndex })).data,
  updateModule: async (module: StudioModule, title: string) =>
    (
      await api.put<StudioModule>(`/api/modules/${module.id}`, {
        courseId: module.courseId,
        title,
        description: module.description,
        orderIndex: module.orderIndex,
        active: module.active,
      })
    ).data,
  deleteModule: async (id: number) => {
    await api.delete(`/api/modules/${id}`)
  },

  createLesson: async (input: LessonInput) => (await api.post<StudioLesson>("/api/lessons", input)).data,
  updateLesson: async (id: number, input: LessonInput) =>
    (await api.put<StudioLesson>(`/api/lessons/${id}`, input)).data,
  deleteLesson: async (id: number) => {
    await api.delete(`/api/lessons/${id}`)
  },
  uploadResource: async (file: File) => {
    const form = new FormData()
    form.append("file", file)
    const { data } = await api.post<{ url: string; objectKey: string }>("/api/lessons/resource", form, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    return data
  },
}

// ---------- Quizzes ----------

export type QuestionType = "MULTIPLE_CHOICE" | "TRUE_FALSE" | "SHORT_ANSWER"

export interface QuizOption {
  id?: number | null
  optionText: string
  isCorrect?: boolean | null
}

export interface QuizQuestion {
  id?: number | null
  questionText: string
  questionType: QuestionType
  points: number
  correctAnswer?: string | null
  options: QuizOption[]
}

export interface QuizDefinition {
  id?: number
  title: string
  description?: string | null
  passingScore: number
  timeLimit?: number | null
  attemptsAllowed: number
  showCorrectAnswers: boolean
  lessonId?: number | null
  questions: QuizQuestion[]
}

export const quizApi = {
  getForEditing: async (id: number) => (await api.get<QuizDefinition>(`/api/quizzes/${id}/edit`)).data,
  create: async (quiz: QuizDefinition) => (await api.post<QuizDefinition>("/api/quizzes", quiz)).data,
  update: async (id: number, quiz: QuizDefinition) => (await api.put<QuizDefinition>(`/api/quizzes/${id}`, quiz)).data,
  remove: async (id: number) => {
    await api.delete(`/api/quizzes/${id}`)
  },
}

// ---------- Analytics ----------

export interface StudioSeries {
  key: string
  points: SeriesPoint[]
}

export interface InstructorCourseStats {
  courseId: number
  title: string
  published: boolean
  students: number
  newEnrollments: number
  completedStudents: number
  averageProgress: number
  lessons: number
  revenueByCurrency: Record<string, number>
  quizAttempts: number
  averageQuizScore: number | null
}

export interface InstructorOverview {
  range: { from: string; to: string }
  summary: {
    totalCourses: number
    publishedCourses: number
    totalStudents: number
    newEnrollments: number
    revenueByCurrency: Record<string, number>
    averageProgress: number
    averageQuizScore: number | null
  }
  enrollmentSeries: StudioSeries
  revenueSeries: StudioSeries[]
  courses: InstructorCourseStats[]
}

export interface CourseAnalyticsDetail {
  courseId: number
  title: string
  students: number
  lessons: { lessonId: number; title: string; moduleTitle: string; type: LessonType; completed: number }[]
  quizzes: {
    quizId: number
    title: string
    lessonTitle: string
    questions: number
    attempts: number
    averageScore: number | null
    passRate: number | null
  }[]
}

export const instructorAnalyticsApi = {
  overview: async (params: { from?: string; to?: string; granularity?: Granularity }) =>
    (await api.get<InstructorOverview>("/api/instructor/analytics", { params })).data,
  course: async (courseId: number) =>
    (await api.get<CourseAnalyticsDetail>(`/api/instructor/analytics/courses/${courseId}`)).data,
}
