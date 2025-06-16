<script setup lang="ts">
import { h } from 'vue'
import { isWithinInterval } from 'date-fns'
import type { TableColumn, TableRow } from '@nuxt/ui'
import type { Period, Range } from '~/types'
import { type StatKey, type DataRecord, statConfigs } from '~/types/statType'

// Type for table data with dynamic metric key
type TableDataRecord = {
  novelId: number
  title: string
  [key: string]: number | string // Allow dynamic metric keys
}
const props = defineProps<{
  period: Period
  range: Range
  metric: StatKey
  data?: DataRecord[]
  selectedNovelId: number | null
}>()

const emit = defineEmits<{
  (e: 'selectNovel', novelId: number): void
}>()
const rowSelection = ref<number | null>(props.selectedNovelId)
watch(
  () => props.selectedNovelId,
  (novelId) => {
    rowSelection.value = novelId
  },
  { immediate: true }
)

const metricLabel = computed(() => {
  const config = statConfigs.find(c => c.key === props.metric)
  return config?.title ?? props.metric
})

const tableData = computed(() => {
  if (!props.data || !Array.isArray(props.data) || !props.range.start || !props.range.end)
    return []
  return props.data.map((record) => {
    const total = record.statistics
      .filter((stat) => {
        try {
          return isWithinInterval(stat.date, props.range)
        } catch {
          return false
        }
      })
      .reduce((sum, stat) => {
        const value = stat[props.metric]
        return sum + (typeof value === 'number' && !isNaN(value) ? value : 0)
      }, 0)
    return {
      novelId: record.novelId,
      title: record.title,
      [props.metric]: total
    }
  })
})

const columns = computed((): TableColumn<TableDataRecord>[] => {
  const metricKey = props.metric
  return [
    {
      accessorKey: 'novelId',
      header: 'ID',
      cell: ({ row }) => `#${row.getValue('novelId')}`
    },
    {
      accessorKey: 'title',
      header: 'Truyện'
    },
    {
      accessorKey: metricKey,
      header: metricLabel.value,
      cell: ({ row }) => {
        const raw = row.getValue(metricKey)
        const value = typeof raw === 'number' ? raw : Number(raw)
        return h('div', { class: 'font-medium' }, formatStatValue(value, props.metric))
      }
    },
    {
      accessorKey: 'select',
      id: 'select',
      header: '',
      cell: ({ row }) =>
        h('div', { class: 'w-6 flex items-end' }, [
          h('input', {
            type: 'radio',
            name: 'novel-select',
            checked: row.original.novelId === rowSelection.value,
            onChange: () => {
              emit('selectNovel', row.original.novelId)
            },
            class: 'cursor-pointer'
          })
        ])
    }
  ]
})
</script>

<template>
  <UCard :ui="{ body: '!px-0 !pt-0 !pb-3' }">
    <div v-if="!tableData.length" class="p-4 text-center text-gray-500">
      Không có dữ liệu để hiển thị
    </div>
    <UTable
      :key="metric"
      :data="tableData"
      :columns="columns"
      class="shrink-0"
      :ui="{
        base: 'table-fixed border-separate border-spacing-0',
        thead: '[&>tr]:bg-(--ui-bg-elevated)/50 [&>tr]:after:content-none',
        tbody: '[&>tr]:last:[&>td]:border-b-0',
        th: 'first:rounded-l-[calc(var(--ui-radius)*2)] last:rounded-r-[calc(var(--ui-radius)*2)] border-y border-(--ui-border) first:border-l last:border-r',
        td: 'border-b border-default',
        tr: 'cursor-pointer'
      }"
      @row-click="(row: TableRow<TableDataRecord>) => emit('selectNovel', row.original.novelId)"
    />
  </UCard>
</template>

<style scoped>
/* :row-class="(row: TableRow<TableDataRecord>) => row.original.novelId === rowSelection ? 'selected' : ''" */
.u-table tbody tr {
  cursor: pointer;
}
.u-table td,
.u-table th {
  padding: 0.75rem;
}
.u-table input[type="radio"] {
  accent-color: var(--color-primary, #3b82f6);
}
</style>
