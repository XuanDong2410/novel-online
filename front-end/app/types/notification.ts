import type { User } from './user'

export interface Notification {
  _id: string
  from: User
  to: User
  type: 'favorite' | 'rate' | 'comment' | 'mention' | 'reply' | 'report' | 'novelUpdate' | 'userNotice' | 'adminNotice' | 'systemNotice'
  message?: string
  read: boolean
  createdAt: Date
  updatedAt: Date
}
