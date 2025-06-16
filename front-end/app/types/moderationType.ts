export interface CategoryScores {
  'sexual': number
  'violence': number
  'self-harm': number
  'sexual/minors': number
  'harassment': number
  'hate': number
  'violence/graphic': number
  'harassment/threatening': number
  'hate/threatening': number
  'illicit': number
  'illicit/violent': number
  'self-harm/intent': number
  'self-harm/instructions': number
  [key: string]: number
}

export interface ModerationCategories {
  'sexual': boolean
  'violence': boolean
  'self-harm': boolean
  'sexual/minors': boolean
  'harassment': boolean
  'hate': boolean
  'violence/graphic': boolean
  'harassment/threatening': boolean
  'hate/threatening': boolean
  'illicit': boolean
  'illicit/violent': boolean
  'self-harm/intent': boolean
  'self-harm/instructions': boolean
  [key: string]: boolean
}

export interface ModerationResult {
  flagged: boolean
  categories: ModerationCategories
  category_scores: CategoryScores
  category_applied_input_types: {
    text: string[]
  }
}

export interface UserReport {
  userId: string
  description?: string
  reportedAt: string
}

export interface ChapterModeration {
  id: number
  novelId: number
  index: number
  title: string
  content: string
  result: ModerationResult[]
  status: 'PENDING_REVIEW' | 'REJECTED' | 'NEEDS_EDIT' | 'FLAGGED_SENSITIVE' | 'SAFE' | 'REPORTED_BY_USER' | 'LOCKED_BY_SYSTEM'
  createdAt: string
  updatedAt: string
  creator: string
  reported?: boolean
  reportCount?: number
  userReports?: UserReport[]
  moderatorId?: string // ID của admin thực hiện kiểm duyệt
}
