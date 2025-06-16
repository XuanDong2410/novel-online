import type { AvatarProps } from '@nuxt/ui'

export interface User {
  _id: string
  username: string
  email: string
  role: 'user' | 'moderator' | 'admin' | 'system'
  bio?: string
  image: AvatarProps
  isBanned: boolean
  isActive: boolean
  lastLogin?: string
  violation: {
    count: number
    userReports: number
    modConfirmed: boolean
    details?: unknown
  }
  statistics: {
    totalUploaded: number
    totalReports: number
    totalAppeals: number
    totalLikesReceived: number
  }
}
