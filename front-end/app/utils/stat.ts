import { isWithinInterval, startOfDay, startOfWeek, startOfMonth } from 'date-fns'
import { memoize } from 'lodash'
import type { Period, Range } from '~/types'
import { type DataRecord, type StatEntry, StatKey, statConfigs } from '~/types/statType'

export const groupByPeriod = memoize(
  (stats: DataRecord[], range: Range, period: Period) => {
    const { start, end } = range
    if (!start || !end || start > end) {
      console.warn('Invalid date range:', range)
      return []
    }

    const map = new Map<string, StatEntry>()

    for (const record of stats) {
      // Check record.statistics is an array
      if (!Array.isArray(record.statistics)) {
        console.warn(`Invalid statistics for novelId ${record.novelId}: statistics is not an array`)
        continue
      }
      for (const stat of record.statistics) {
        const date = new Date(stat.date)
        if (!isWithinInterval(date, { start, end })) continue

        let keyDate: Date
        switch (period) {
          case 'daily':
            keyDate = startOfDay(date)
            break
          case 'weekly':
            keyDate = startOfWeek(date, { weekStartsOn: 1 })
            break
          case 'monthly':
            keyDate = startOfMonth(date)
            break
          default:
            console.warn(`Invalid period: ${period}`)
            continue
        }

        const key = keyDate.toISOString()
        if (!map.has(key)) {
          map.set(key, {
            date: keyDate,
            views: 0,
            likes: 0,
            comments: 0,
            reads: 0,
            avgReadTime: 0,
            count: 0
          })
        }

        const entry = map.get(key)!
        entry.views += stat.views || 0
        entry.likes += stat.likes || 0
        entry.comments += stat.comments || 0
        entry.reads += stat.reads || 0
        entry.avgReadTime += stat.avgReadTime || 0
        entry.count += 1
      }
    }

    return Array.from(map.values()).map(entry => ({
      date: entry.date,
      views: entry.views,
      likes: entry.likes,
      comments: entry.comments,
      reads: entry.reads,
      avgReadTime: entry.count ? entry.avgReadTime / entry.count : 0
    }))
  },
  (stats, range, period) => {
    // Tạo cache dựa trên các tham số
    const statsHash = stats.map(s => `${s.novelId}-${s.title}-${s.statistics.length}`).join('|')
    return `${range.start.toISOString()}-${range.end.toISOString()}-${period}-${statsHash}`
  }
)
// Tách xử lý dữ liệu thành hàm riêng để tái sử dụng
export function normalizeStatistics(record: unknown): DataRecord {
  if (!record || typeof record !== 'object') {
    return {
      novelId: 0,
      title: 'Unknown',
      statistics: []
    }
  }
  const raw = record as DataRecord
  return {
    novelId: typeof raw.novelId === 'number' ? raw.novelId : 0,
    title: typeof raw.title === 'string' ? raw.title : 'Unknown',
    statistics: Array.isArray(raw.statistics)
      ? raw.statistics
          .map(stat => ({
            date: new Date(stat.date),
            views: Number(stat.views) || 0,
            likes: Number(stat.likes) || 0,
            comments: Number(stat.comments) || 0,
            reads: Number(stat.reads) || 0,
            avgReadTime: Number(stat.avgReadTime) || 0
          }))
          .filter(stat => !isNaN(stat.date.getTime()))
      : []
  }
}
export function calculateTotalStat(data: ReturnType<typeof groupByPeriod>, statKey: StatKey): number | string {
  if (!data?.length) return 0
  if (statKey === StatKey.AvgReadTime) {
    const total = data.reduce((sum, item) => sum + (item.avgReadTime || 0), 0)
    return Number((total / data.length).toFixed(3))
  }
  return data.reduce((sum, item) => sum + (item[statKey] ?? 0), 0)
}

export function useSummary(dataSource: ComputedRef<ReturnType<typeof groupByPeriod>>) {
  return computed(() => {
    const grouped = dataSource.value
    return Object.values(StatKey).reduce(
      (acc, key) => {
        acc[key] = calculateTotalStat(grouped, key)
        return acc
      },
      {} as Record<StatKey, number | string>)
  })
}

export function formatStatValue(value: number, statKey: StatKey): string {
  const config = statConfigs.find(c => c.key === statKey)
  return config?.formatter ? config.formatter(value) : value.toString()
}
