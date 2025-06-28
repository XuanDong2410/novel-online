// types/index.ts hoặc types/chapter.ts
// Đảm bảo rằng User, Report interfaces đã được định nghĩa ở đâu đó nếu cần populate
import type { User } from './user' // Giả sử bạn có interface User
import type { Report } from './report' // Giả sử bạn có interface Report
import type { Novel } from './novel'
import type { statusPublish } from '@/types'

export interface Moderation {
  isModerating: boolean
  moderator?: string // User ID
  lastModeratedAt: Date | null
  lastModeratedBy?: string// User ID
}

export interface Violation {
  aiFlag: {
    violence: boolean
    adult: boolean
    hate_speech: boolean
    self_harm: boolean
    spam: boolean
  }
  userReports: number
  modConfirmed: boolean
  count: {
    violence: number
    adult: number
    hate_speech: number
    self_harm: number
    spam: number
    total: number
  }
  details: {
    _id: string
    category: string
    severity: 'low' | 'medium' | 'high' | 'critical'
    description: string
    line: number
    start: number
    end: number
    resolved: boolean
  }[]
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

// Voice Schema (từ Audio Model)
export interface IVoice {
  languageCodes: string[]
  name: string
  ssmlGender: 'MALE' | 'FEMALE' | 'NEUTRAL'
  naturalSampleRateHertz: number
}

// Audio Schema (từ Audio Model)
export interface IAudio {
  _id: string // Thêm _id nếu bạn cần nó từ Mongoose
  audioName: string
  audioFileUrl: string // URL của file audio chính
  audioFileType: 'MP3' | 'WAV' | 'OGG'
  duration?: number // Đơn vị: giây
  size?: number // Đơn vị: bytes
  status: 'pending' | 'processed' | 'error'
  voice: IVoice
  subtitle?: {
    url?: string // URL của file subtitle (VTT/SRT)
    language?: string
    format?: 'VTT' | 'SRT'
  }
  chapterId: string // ID của chapter liên quan
  createdAt: Date
  updatedAt: Date
}

// Chapter Schema
export interface Chapter {
  _id: string
  title: string
  content: string
  previousContent?: string // Thêm trường này nếu cần
  chapterNumber: number
  contentUrl?: string // URL của nội dung (có thể là một file HTML/text)
  audioFileUrl?: string // URL audio trực tiếp trên chapter (nếu không dùng mảng audios)
  subtitleFileUrl?: string // URL subtitle trực tiếp trên chapter (nếu không dùng mảng audios)

  // Khi populate, audios có thể là mảng các IAudio.
  // Khi không populate, nó là mảng các string (ObjectId).
  audios?: string[] | IAudio[] // Mảng các ID hoặc đối tượng Audio

  novelId: string | Novel // Có thể là ID hoặc object Novel nếu được populate
  status: statusPublish
  isPublished: boolean
  publishDate?: Date
  reports?: string[] | Report[] // Report IDs hoặc object Report

  moderation?: {
    isModerating?: boolean
    moderator?: string | User // User ID hoặc object User
    lastModeratedAt?: Date | null
    lastModeratedBy?: string | User // User ID hoặc object User
  }
  violation?: {
    aiFlag?: {
      violence?: boolean
      adult?: boolean
      hate_speech?: boolean
      spam?: boolean
      self_harm?: boolean
    }
    userReports?: number
    modConfirmed?: boolean
    count?: {
      violence?: number
      adult?: number
      hate_speech?: number
      self_harm?: number
      spam?: number
      total?: number
    }
    details?: {
      _id: string
      category: string
      severity: 'low' | 'medium' | 'high' | 'critical'
      description: string
      line: number
      start: number
      end: number
      resolved: boolean
    }[]
  }
  viewCount?: number
  wordCount?: number
  averageListenTime?: number
  comments?: {
    content: string
    type: 'general' | 'suggestion' | 'error' | 'praise'
    reviewerId: string | User // User ID hoặc object User
    line?: number
    createdAt?: Date
  }[]
  createdAt: Date
  updatedAt: Date
}

export interface ChapterQuery {
  page?: number
  limit?: number
  sort?: string
  direction?: 'asc' | 'desc'
  // Bổ sung các query params khác nếu cần
  novelId?: string
  status?: Chapter['status']
  isPublished?: boolean
  chapterNumber?: number
}
