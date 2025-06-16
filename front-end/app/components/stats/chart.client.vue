<script setup lang="ts">
import {
  eachDayOfInterval,
  eachWeekOfInterval,
  eachMonthOfInterval,
  format,
  isWithinInterval,
  type Interval
} from 'date-fns'
import {
  VisXYContainer,
  VisLine,
  VisAxis,
  VisArea,
  VisCrosshair,
  VisTooltip,
  VisBulletLegend
} from '@unovis/vue'
import type { Period, Range } from '~/types'
import { type StatKey, type DataRecord, statConfigs, type NovelData } from '~/types/statType'

const props = defineProps<{
  data: NovelData[]
  period: Period
  range: Range
  metric: StatKey
  selectedNovelId: number | null
  novelData?: DataRecord[]
}>()

const cardRef = useTemplateRef<HTMLElement | null>('cardRef')
const { width } = useElementSize(cardRef)

const dateIntervals = computed(() => {
  const intervalFns = {
    daily: eachDayOfInterval,
    weekly: eachWeekOfInterval,
    monthly: eachMonthOfInterval
  }
  const fn = intervalFns[props.period] as (interval: Interval) => Date[]
  return fn(props.range)
})

const chartData = computed(() => {
  if (!props.data || !Array.isArray(props.data)) return []

  const key = props.metric
  const filtered = props.data.filter(s => isWithinInterval(s.date, props.range))
  const novel = props.novelData?.find(n => n.novelId === props.selectedNovelId)

  return dateIntervals.value.map((pointDate, i) => {
    const nextDate = dateIntervals.value[i + 1] ?? new Date(props.range.end.getTime() + 1)
    const interval: Interval = {
      start: pointDate,
      end: new Date(nextDate.getTime() - 1)
    }

    const total = filtered
      .filter(d => isWithinInterval(d.date, interval))
      .reduce((sum, d) => sum + (d[key] || 0), 0)

    const novelTotal = novel?.statistics
      .filter(d => isWithinInterval(d.date, interval))
      .reduce((sum, d) => sum + (d[key] || 0), 0)

    return { date: pointDate, total, novel: novelTotal }
  })
})
const x = (_: unknown, i: number) => i
const yTotal = (d: { total: number }) => d.total
const yNovel = (d: { novel: number }) => d.novel

const total = computed(() =>
  chartData.value.reduce((acc, d) => acc + d.total, 0)
)
// ban đầu là 'views'
const metricLabel = computed(() => {
  const config = statConfigs.find(c => c.key === props.metric)
  return config?.title ?? props.metric
})

const formatDate = (date: Date): string =>
  ({
    daily: format(date, 'd MMM'),
    weekly: format(date, 'd MMM'),
    monthly: format(date, 'MMM yyyy')
  }[props.period])

const xTicks = (i: number) => {
  if (i === 0 || i === chartData.value.length - 1 || !chartData.value[i])
    return ''
  return formatDate(chartData.value[i].date)
}

const template = (d: { date: Date, total: number, novel: number }) => {
  const lines = [`<strong>${formatDate(d.date)}</strong>:`]
  lines.push(
    `<br/>Tổng cộng: <strong>${formatStatValue(d.total, props.metric)}</strong> ${metricLabel.value.toLowerCase()}`
  )
  if (props.selectedNovelId) {
    const novel = props.novelData?.find(n => n.novelId === props.selectedNovelId)
    lines.push(
      `<br>${novel?.title || 'Tiểu thuyết'}: <strong>${formatStatValue(d.novel, props.metric)}</strong> ${metricLabel.value.toLowerCase()}`
    )
  }
  return lines.join('\n')
}

const legendItems = computed(() => {
  const items = [{ name: 'Tổng', color: 'var(--ui-primary)' }]
  if (props.selectedNovelId) {
    const novel = props.novelData?.find(n => n.novelId === props.selectedNovelId)
    items.push({
      name: novel?.title || `Tiểu thuyết #${props.selectedNovelId}`,
      color: '#FF5722'
    })
  }
  return items
})
</script>

<template>
  <UCard :ui="{ body: '!px-0 !pt-0 !pb-3' }">
    <template #header>
      <div class="flex items-center gap-2">
        <div class="flex justify-between items-start">
          <div>
            <p class="text-xs text-(--ui-text-muted) uppercase mb-1.5">
              {{ metricLabel }}
            </p>
            <p class="text-3xl text-(--ui-text-highlighted) font-semibold">
              {{ formatStatValue(total, props.metric) }}
            </p>
          </div>
        </div>
      </div>
    </template>
    <div v-if="!chartData.length" class="p-4 text-center text-gray-500">
      Không có dữ liệu để hiển thị
    </div>
    <div ref="cardRef" class="h-auto">
      <VisXYContainer
        :data="chartData"
        :padding="{ top: 40 }"
        class="h-96"
        :width="width"
      >
        <VisLine
          :x="x"
          :y="yTotal"
          color="var(--ui-primary)"
        />
        <VisArea
          :x="x"
          :y="yTotal"
          color="var(--ui-primary)"
          :opacity="0.1"
        />
        <!-- Biểu đồ cho Novel (nếu được chọn) -->
        <VisLine
          v-if="props.selectedNovelId"
          :x="x"
          :y="yNovel"
          color="#FF5722"
        />
        <VisAxis type="x" :x="x" :tick-format="xTicks" />
        <VisCrosshair
          :x="x"
          :y="[yTotal, yNovel]"
          color="var(--ui-primary)"
          :template="template"
        />
        <VisTooltip />
        <VisBulletLegend
          :items="legendItems"
          class="mx-2"
        />
      </VisXYContainer>
    </div>
  </UCard>
</template>

<style scoped>
.unovis-xy-container {
  --vis-crosshair-line-stroke-color: var(--ui-primary);
  --vis-crosshair-circle-stroke-color: var(--ui-bg);

  --vis-axis-grid-color: var(--ui-border);
  --vis-axis-tick-color: var(--ui-border);
  --vis-axis-tick-label-color: var(--ui-text-dimmed);

  --vis-tooltip-background-color: var(--ui-bg);
  --vis-tooltip-border-color: var(--ui-border);
  --vis-tooltip-text-color: var(--ui-text-highlighted);
}
</style>
