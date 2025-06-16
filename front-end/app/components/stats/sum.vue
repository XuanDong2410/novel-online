<script setup lang="ts">
import type { Period, Range } from '~/types'
import { type StatKey, statConfigs } from '~/types/statType'
import { formatStatValue } from '~/utils/stat'

type DataRecord = {
  [key in StatKey]: {
    value: number
    variation: number
  }
}
const props = defineProps<{
  data: DataRecord
  period: Period
  range: Range
  selectedMetric: StatKey
}>()
// Trạng thái metric được chọn
const emit = defineEmits<
  (e: 'update:selectedMetric', key: StatKey) => void
>()
const isDataValid = computed(() => props.data && Object.keys(props.data).length > 0)

const stats = computed(() => {
  if (!isDataValid.value) {
    return statConfigs.map(config => ({
      ...config,
      value: '--',
      variation: 0
    }))
  }
  return statConfigs.map((config) => {
    const entry = props.data![config.key]
    return {
      ...config,
      value: entry ? formatStatValue(entry.value, config.key) : '--',
      variation: entry?.variation ?? 0
    }
  })
})
</script>

<template>
  <UPageGrid class="lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-px">
    <UPageCard
      v-for="stat in stats"
      :key="stat.key"
      :icon="stat.icon"
      :title="stat.title"
      variant="subtle"
      :ui="{
        container: 'gap-y-1.5',
        leading: 'p-2.5 rounded-full bg-(--ui-primary)/10 ring ring-inset ring-(--ui-primary)/25',
        title: 'font-normal text-(--ui-text-muted) text-xs uppercase',
        root: stat.key === selectedMetric ? 'bg-(--ui-bg-elevated)' : ''
      }"
      class=" m-1 rounded-l-[calc(var(--ui-radius)*2)] hover:z-1 cursor-pointer"
      @click="emit('update:selectedMetric', stat.key)"
    >
      <div class="flex items-center gap-2">
        <span class="text-2xl font-semibold text-(--ui-text-highlighted)">
          {{ stat.value }}
        </span>

        <UBadge
          :color="stat.variation > 0 ? 'success' : 'error'"
          variant="subtle"
          class="text-xs"
        >
          {{ stat.variation > 0 ? '+' : '' }}{{ stat.variation }}%
        </UBadge>
      </div>
    </UPageCard>
  </UPageGrid>
  <div v-if="!isDataValid" class="text-red-500 text-sm mt-2">
    Không có dữ liệu để hiển thị
  </div>
</template>
