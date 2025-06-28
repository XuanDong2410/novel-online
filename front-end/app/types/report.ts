import type { User } from '~/types/user'
import type { Novel } from '~/types/novel'
import type { Chapter } from '~/types/chapter'
import type { Rate } from '~/types/rate'

export interface Report {
  _id: string
  reporter: User
  targetType: Rate | Novel | Chapter
  targetId: string
  reason: string
  status: 'pending' | 'reviewed' | 'rejected'
  moderator?: User
  handledAt?: Date
  note?: string
  createdAt: Date
  updatedAt?: Date
}

export interface ReportsQuery {
  page?: number
  limit?: { label: string, value: number }
  status?: 'all' | 'pending' | 'reviewed' | 'rejected'
  type?: 'all' | 'Rate' | 'Novel' | 'Chapter'
  search?: string
  sort?: 'createdAt' | 'createdAt_asc' | 'priority'
}

export interface ReportsResponse {
  success: boolean
  message: string
  data: Report[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface ReportStats {
  total: number
  pending: number
  reviewed: number
  rejected: number
  byType: Record<string, number>
}

export interface HandleReportPayload {
  status: 'reviewed' | 'rejected'
  note?: string
  action?: 'approve' | 'reject' | 'flag' | 'hide' | 'warning'
  severity?: 'low' | 'medium' | 'high' | 'critical'
}

export interface BulkHandleReportsPayload {
  reportIds: string[]
  action: 'approve_all' | 'reject_all' | 'flag_all' | 'hide_all'
  severity: 'low' | 'medium' | 'high' | 'critical'
  note?: string
}

export interface ExportReportsQuery {
  status?: 'all' | 'pending' | 'reviewed' | 'rejected'
  type?: 'all' | 'Rate' | 'Novel' | 'Chapter'
  format?: 'csv' | 'json'
}
