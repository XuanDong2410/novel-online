export type DataRecord = {
  novelId: number
  title: string
  statistics: {
    date: Date
    views: number
    likes: number
    comments: number
    reads: number
    avgReadTime: number
  }[]
}
export type NovelData = {
  date: Date
  views: number
  likes: number
  comments: number
  reads: number
  avgReadTime: number
}
export type StatEntry = NovelData & {
  count: number
}
export enum StatKey {
  Views = 'views',
  Likes = 'likes',
  Comments = 'comments',
  Reads = 'reads',
  AvgReadTime = 'avgReadTime'
}
export interface StatConfig {
  key: StatKey
  title: string
  icon: string
  formatter?: (value: number) => string
}
export const statConfigs: StatConfig[] = [
  {
    key: StatKey.Views,
    title: 'Lượt xem',
    icon: 'i-lucide-eye'
  },
  {
    key: StatKey.Likes,
    title: 'Lượt thích',
    icon: 'i-lucide-thumbs-up'
  },
  {
    key: StatKey.Comments,
    title: 'Bình luận',
    icon: 'i-lucide-message-circle'
  },
  {
    key: StatKey.Reads,
    title: 'Lượt đọc',
    icon: 'i-lucide-book-open'
  },
  {
    key: StatKey.AvgReadTime,
    title: 'Thời gian đọc trung bình',
    icon: 'i-lucide-clock',
    formatter: (value: number) => `${value} phút`
  }
]
