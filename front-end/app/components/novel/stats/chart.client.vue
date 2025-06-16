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
  VisTooltip
} from '@unovis/vue'
import type { Period, Range } from '~/types'

type DataRecord = {
  novelId: number | null
  statistics: {
    date: Date
    views: number
    likes: number
    comments: number
    reads: number
    avgReadTime: number
  }[]
}

const cardRef = useTemplateRef<HTMLElement | null>('cardRef')

const props = defineProps<{
  data: DataRecord
  period: Period
  range: Range
}>()

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

const dataCharts = computed(() => {
  const stats = props.data.statistics.map(s => ({
    date: new Date(s.date),
    views: s.views,
    likes: s.likes,
    comments: s.comments
  }))

  const filtered = stats.filter(s => isWithinInterval(s.date, props.range))

  return dateIntervals.value.map((pointDate, i) => {
    const nextDate = dateIntervals.value[i + 1] ?? new Date(props.range.end.getTime() + 1)
    const interval: Interval = {
      start: pointDate,
      end: new Date(nextDate.getTime() - 1)
    }

    const total = filtered
      .filter(d => isWithinInterval(d.date, interval))
      .reduce((sum, d) => sum + d[(metric.value?.value ?? 'views') as MetricKey], 0)
    return { date: pointDate, amount: total }
  })
})

const x = (_: unknown, i: number) => i
const y = (d: { amount: number }) => d.amount

const total = computed(() =>
  dataCharts.value.reduce((acc, d) => acc + d.amount, 0)
)

const formatNumber = new Intl.NumberFormat('vi-VN').format

const formatDate = (date: Date): string =>
  ({
    daily: format(date, 'd MMM'),
    weekly: format(date, 'd MMM'),
    monthly: format(date, 'MMM yyyy')
  }[props.period])

const xTicks = (i: number) => {
  if (i === 0 || i === dataCharts.value.length - 1 || !dataCharts.value[i])
    return ''
  return formatDate(dataCharts.value[i].date)
}
type MetricKey = 'views' | 'likes' | 'comments'

const metricOptions: { label: string, value: MetricKey }[] = [
  { label: 'Lượt xem', value: 'views' },
  { label: 'Lượt thích', value: 'likes' },
  { label: 'Bình luận', value: 'comments' }
]

const metric = ref<{ label: string, value: MetricKey }>(metricOptions[0]!) // ban đầu là 'views'
const metricLabel = computed(() => metric.value?.label ?? '')

const template = (d: { date: Date, amount: number }) =>
  `${formatDate(d.date)}: ${formatNumber(d.amount)} ${metricLabel.value.toLowerCase()}`
</script>

<template>
  <UCard ref="cardRef" :ui="{ body: '!px-0 !pt-0 !pb-3' }">
    <template #header>
      <div class="flex justify-between items-start">
        <div>
          <p class="text-xs text-(--ui-text-muted) uppercase mb-1.5">
            {{ metricLabel }}
          </p>
          <p class="text-3xl text-(--ui-text-highlighted) font-semibold">
            {{ formatNumber(total) }}
          </p>
        </div>
        <!-- Chọn loại thống kê -->
        <USelectMenu
          v-model="metric"
          :items="metricOptions"
          :options="metricOptions"
          variant="ghost"
          class="data-[state=open]:bg-(--ui-bg-elevated)"
          :ui="{ value: 'capitalize', itemLabel: 'capitalize', trailingIcon: 'group-data-[state=open]:rotate-180 transition-transform duration-200' }"
        />
      </div>
    </template>

    <VisXYContainer
      :data="dataCharts"
      :padding="{ top: 40 }"
      class="h-96"
      :width="width"
    >
      <VisLine :x="x" :y="y" color="var(--ui-primary)" />
      <VisArea
        :x="x"
        :y="y"
        color="var(--ui-primary)"
        :opacity="0.1"
      />
      <VisAxis type="x" :x="x" :tick-format="xTicks" />
      <VisCrosshair color="var(--ui-primary)" :template="template" />
      <VisTooltip />
    </VisXYContainer>
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
