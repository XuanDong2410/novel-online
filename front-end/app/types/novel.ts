import type { AvatarProps } from '@nuxt/ui'

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
  createdBy: string // User ID
  statusPublish: 'draft' | 'pending' | 'editing' | 'warning' | 'approved' | 'rejected'
  status: 'ongoing' | 'completed' | 'hiatus'
  attributes: NovelAttribute[] // NovelAttribute IDs
  favorites: string[] // User IDs
  reports: string[] // Report IDs
  rates: {
    total: number
    count: number
    averageRating?: number
  }
  chapters: {
    count: number
    latestChapter: string // Chapter ID
    updateAt: Date | null
  }
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
  coverImage?: AvatarProps
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
