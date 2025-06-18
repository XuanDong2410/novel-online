import type { statusPublish } from '@/types'

export interface Report {
  _id: string
}

export interface Moderation {
  isModerating: boolean
  moderator?: string // User ID
  lastModeratedAt: Date | null
  lastModeratedBy?: string// User ID
}

export interface Violation {
  aiFlag: boolean
  userReports: number
  modConfirmed: boolean
  details: string
  count: number
}

export interface Chapter {
  _id: string
  title: string
  content: string
  chapterNumber: number
  contentUrl?: string
  audioFileUrl?: string
  subtitleFileUrl?: string
  novelId: string
  status: statusPublish
  isPublished: boolean
  publishDate?: Date
  reports: string[] // Report IDs
  moderation?: Moderation
  violation?: Violation
  viewCount: number
  wordCount: number
  averageListenTime: number
  createdAt: Date
  updatedAt: Date
}

export interface ApiResponse<T> {
  success: boolean
  message?: string
  data: T
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface ChapterListResponse {
  chapters: Chapter[]
}
export interface ChapterQuery {
  page?: number
  limit?: number
  sort?: string
  direction?: 'asc' | 'desc'
}
