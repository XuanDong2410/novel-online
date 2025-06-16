<script setup lang="ts">
import { sub } from 'date-fns'
import type { Period, Range } from '~/types'

const props = defineProps<{
  novelId: string | undefined
}>()

const range = shallowRef<Range>({
  start: sub(new Date(), { days: 14 }),
  end: new Date()
})

const period = ref<Period>('daily')

type DataRecord = {
  novelId: string | undefined
  statistics: {
    date: Date
    views: number
    likes: number
    comments: number
    reads: number
    avgReadTime: number
  }[]
}

</script>

<template>
  <UDashboardPanel id="stats">
    <template #header>
      <UDashboardToolbar>
        <template #left>
          <StatsDateRangePicker v-model="range" class="-ms-1" />
          <StatsPeriodSelect v-model="period" :range="range" />
        </template>
      </UDashboardToolbar>
    </template>

    <template #body>
      <NovelStatsChart
        v-if="props.novelId !== null && dataNovel"
        :data="dataNovel"
        :period="period"
        :range="range"
      />
      <!-- <NovelStatsLists :period="period" :range="range" /> -->
    </template>
  </UDashboardPanel>
</template>
