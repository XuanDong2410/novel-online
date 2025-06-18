// import type { AvatarProps } from '@nuxt/ui'
// import type { NovelAudience, NovelCharacterTrait, NovelGenre, NovelPublishStatus, NovelStatus, NovelSubGenre, NovelWorldBuilding } from './novelType.js'
import type { User } from './user'

export type UserStatus = 'subscribed' | 'unsubscribed' | 'bounced'
export type SaleStatus = 'paid' | 'failed' | 'refunded'

export enum statusPublish {
  pending = 'pending',
  draft = 'draft',
  editing = 'editing',
  warning = 'warning',
  approved = 'approved',
  rejected = 'rejected',
  retracted = 'retracted'
}

// Novel types
// export type NovelStatus = 'ongoing' | 'completed' | 'hiatus'
// export type NovelPublishStatus = 'published' | 'draft' | 'archived'
export interface Issue {
  _id: string
  type: string
  severity: string
  title: string
  description: string
  line: number
  position: string
  resolved: boolean
}

export interface Guideline {
  id: string
  title: string
  checked: boolean
}

// export interface Novel {
//   id: number
//   title: string
//   description: string
//   status: NovelStatus
//   publishStatus: NovelPublishStatus
//   genre: NovelGenre
//   subGenre: NovelSubGenre // Lưu phái, thẻ loại phụ
//   audience: NovelAudience// Đối tượng độc giả
//   author: string
//   characterTrait: NovelCharacterTrait // Tính cách nhân vật
//   worldBuilding: NovelWorldBuilding // Bối cảnh Thế giới
//   coverImg?: AvatarProps
//   createAt: string
//   updateAt?: string
// }
// export interface Chapter {
//   id: number
//   novelId: number
//   index: number
//   title: string
//   content: string
//   wordCount?: number
//   createAt: string
//   updateAt?: string
// }

/////
export interface Sale {
  id: number
  novel: Novel
  buyer: User
  status: SaleStatus
  date: string
  price: number
}

// export interface User {
//   id: number
//   name: string
//   email: string
//   avatar?: AvatarProps
//   status: UserStatus
//   location: string
// }

export interface Mail {
  id: number
  unread?: boolean
  from: User
  subject: string
  body: string
  date: string
}

export interface Member {
  name: string
  username: string
  role: 'member' | 'owner'
  avatar: Avatar
}

export interface Stat {
  title: string
  icon: string
  value: number | string
  variation: number
  formatter?: (value: number) => string
}
// export enum StatKey {
//   Views = 'views',
//   Likes = 'likes',
//   Comments = 'comments',
//   Reads = 'reads',
//   AvgReadTime = 'avgReadTime'
// }
// export interface StatConfig {
//   key: StatKey
//   title: string
//   icon: string
//   value?: number | string
//   variation?: number
//   formatter?: (value: number) => string
// }
export interface Sale {
  id: string
  date: string
  status: SaleStatus
  email: string
  amount: number
}

export interface Notification {
  id: number
  unread?: boolean
  sender: User
  body: string
  date: string
}

export type Period = 'daily' | 'weekly' | 'monthly'

export interface Range {
  start: Date
  end: Date
}

export interface AuthResponse {
  user: User
  token: string
}
