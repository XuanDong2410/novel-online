<script setup lang="ts">
import { sub, differenceInCalendarDays } from 'date-fns'
import type { Period, Range } from '~/types'
import { StatKey, type DataRecord } from '~/types/statType'

const range = shallowRef<Range>({
  start: sub(new Date(), { days: 14 }),
  end: new Date()
})

const period = ref<Period>('daily')
const selectedMetric = ref<StatKey>(StatKey.Views)
const filterCategory = ref<'all' | number>('all')
const selectedNovelId = ref<number | null>(null)

const { data, error, pending } = await useAsyncData<DataRecord[]>('stats', async () => {
  try {
    const response = await $fetch('/api/novel-statistics', {
      query: { limit: 100, offset: 0 }
    })
    return Array.isArray(response)
      ? response.map(normalizeStatistics)
      : []
  } catch (err) {
    console.error('Error fetching stats:', err)
    throw createError({
      statusCode: 500,
      message: 'Không thể tải dữ liệu thống kê. Vui lòng thử lại sau.'
    })
  }
})

const filteredData = computed(() => {
  if (!data.value || !Array.isArray(data.value)) return []
  if (filterCategory.value === 'all') return data.value
  return data.value.filter(item => item.novelId === filterCategory.value)
})
const currentData = computed(() => {
  return groupByPeriod(filteredData.value, range.value, period.value)
})
const previousData = computed(() => {
  const { start, end } = range.value
  if (!start || !end || start > end) return []

  const diffDays = differenceInCalendarDays(end, start)
  const prevStart = sub(start, { days: diffDays })
  const prevEnd = sub(end, { days: diffDays })

  return groupByPeriod(filteredData.value, { start: prevStart, end: prevEnd }, period.value)
})

const summaryCurrent = useSummary(currentData)
const summaryPrevious = useSummary(previousData)
// Calculate variation cho summaryCurrent
const summaryWithVariation = computed(() => {
  return Object.values(StatKey).reduce((acc, key) => {
    const current = Number(summaryCurrent.value[key] || 0)
    const previous = Number(summaryPrevious.value[key] || 0)
    let variation: number
    if (previous === 0) {
      variation = current === 0 ? 0 : 100
    } else {
      variation = ((current - previous) / previous) * 100
    }
    acc[key] = { value: current, variation: Number(variation.toFixed(2)) }
    return acc
  }, {} as Record<StatKey, { value: number, variation: number }>)
})

const handleSelectNovel = (novelId: number) => {
  selectedNovelId.value = selectedNovelId.value === novelId ? null : novelId
}
</script>

<template>
  <div v-if="pending" class="p-4 text-center">
    <div class="grid gap-2">
      <USkeleton class="h-4 w-[250px]" />
      <USkeleton class="h-4 w-[200px]" />
    </div>
  </div>
  <div v-else-if="error" class="p-4 text-center text-red-500">
    Lỗi: {{ error.message || 'Đã xảy ra lỗi không xác định' }}
  </div>
  <UDashboardPanel v-else id="stats">
    <template #header>
      <UDashboardToolbar :ui="{ right: 'gap-3' }">
        <template #left>
          <UDashboardSidebarCollapse />
          <StatsDateRangePicker v-model="range" class="-ms-1" />
          <StatsPeriodSelect v-model="period" :range="range" />
        </template>
      </UDashboardToolbar>
    </template>
    <template #body>
      <div v-if="!currentData.length" class="p-4 text-center text-gray-500">
        Không có dữ liệu cho khoảng thời gian này
      </div>
      <div v-else>
        <ClientOnly>
          <StatsSum
            v-model:selected-metric="selectedMetric"
            :data="summaryWithVariation"
            :period="period"
            :range="range"
          />
          <div class="mt-3">
            <StatsChart
              :data="currentData"
              :period="period"
              :range="range"
              :metric="selectedMetric"
              :selected-novel-id="selectedNovelId"
              :novel-data="data"
            />
          </div>
          <div class="mt-10">
            <StatsLists
              :period="period"
              :range="range"
              :metric="selectedMetric"
              :selected-novel-id="selectedNovelId"
              :data="data"
              @select-novel="handleSelectNovel"
            />
          </div>
        </ClientOnly>
      </div>
    </template>
  </UDashboardPanel>
</template>
