// import type { AvatarProps } from '@nuxt/ui'
import type { User } from '@/types/user'
import type { Chapter } from '@/types/chapter'
import type { statusPublish } from '@/types'

export interface NovelAttribute {
  _id: string
  name: string
  type: 'genre' | 'subgenre' | 'world' | 'character' | 'audience'
  description?: string
  isActive: boolean
  createdAt?: Date
  updatedAt?: Date
}

export interface Novel {
  _id: string
  title: string
  author: string
  description: string
  createdBy: User // User ID
  statusPublish: statusPublish
  status: 'ongoing' | 'completed' | 'hiatus'
  attributes: NovelAttribute[] // NovelAttribute IDs
  favorites: string[] // User IDs
  reports: string[] // Report IDs
  rates: {
    total: number
    count: number
    averageRating?: number
  }
  chapters: Chapter[]
  isHidden: boolean
  hiddenBy?: string // User ID
  viewCount: number
  moderation: {
    isModerating: boolean
    moderator?: string // User ID
    lastModeratedAt: Date | null
    lastModeratedBy?: string // User ID
  }
  violation: {
    aiFlag: boolean
    userReports: number
    modConfirmed: boolean
    details: string
    count: number
  }
  coverImage?: string
  tags: string[]
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

export interface NovelQuery {
  page?: number
  limit?: number
  sort?: string
  direction?: 'asc' | 'desc'
}
