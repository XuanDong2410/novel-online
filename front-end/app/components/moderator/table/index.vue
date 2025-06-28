<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { Column } from '@tanstack/vue-table'
import { upperFirst } from 'scule'
import { getPaginationRowModel } from '@tanstack/table-core'
import { useDebounceFn } from '@vueuse/core'
import type { Novel, NovelQuery } from '~/types/novel'
import { useNovelsStore } from '~/stores/novel.store'

const {
  getStatusLabel,
  getStatusColor,
  getStatusIcon
} = useStatus()
const UButton = resolveComponent('UButton')
const UBadge = resolveComponent('UBadge')
const UDropdownMenu = resolveComponent('UDropdownMenu')
const novelsStore = useNovelsStore()
const toast = useToast()
const table = useTemplateRef('table')

const props = defineProps<{
  role: 'user' | 'moderator' | 'admin' | 'system' | undefined
  data?: Novel[]
  loading?: boolean
  error: string | null
}>()

const columnFilters = ref([{ id: 'title', value: '' }])
const columnVisibility = ref()
const rowSelection = ref({})
const statusFilter = ref('all')
const isRefetching = ref(false)
const lastQuery = ref<NovelQuery | null>(null)
const selectedNovel = ref<Novel | undefined>(undefined)

const isModerationModalOpen = ref(false)
async function openModerationModal(novel: Novel) {
  selectedNovel.value = novel
  isModerationModalOpen.value = true
}
const columns: TableColumn<Novel>[] = [
  {
    accessorKey: '_id',
    header: ({ column }) => getHeader(column, 'ID', 'left')
  },
  {
    accessorKey: 'title',
    header: 'Truyện',
    cell: ({ row }) => {
      return h('div', { class: 'flex items-center gap-1' }, [
        h('div', undefined, [
          h('div', {
            class: 'relative group cursor-pointer'
          }, [
            h('p', {
              class: 'font-medium text-(--ui-text-highlighted) max-w-[200px] truncate'
            }, row.original.title),
            h('div', {
              class: 'absolute z-50 hidden group-hover:block bg-gray-900 text-white text-sm rounded px-2 py-1 left-0 top-full mt-1 whitespace-normal max-w-xs'
            }, row.original.title)
          ])
        ])
      ])
    }
  },
  {
    accessorKey: 'statusPublish',
    header: ({ column }) => getHeader(column, 'Xuất bản', 'right'),
    cell: ({ row }) =>
      h(UBadge, {
        class: 'w-full justify-center capitalize text-center',
        variant: 'subtle',
        color: getStatusColor(row.original.statusPublish),
        label: getStatusLabel(row.original.statusPublish),
        icon: getStatusIcon(row.original.statusPublish)
      })
  },
  {
    accessorKey: 'violation',
    header: 'Cảnh báo',
    filterFn: 'equals',
    cell: ({ row }) => {
      const aiFlag = row.original.violation.aiFlag
      const modConfirmed = row.original.violation.modConfirmed

      return h(UBadge, {
        class: 'capitalize',
        variant: 'subtle',
        color: aiFlag ? 'error' : modConfirmed ? 'error' : 'success'
      }, () => aiFlag ? 'AI Flag' : modConfirmed ? 'Confirmed' : 'Clean')
    }
  },
  {
    accessorKey: 'createdBy',
    header: 'Người đăng',
    cell: ({ row }) => {
      return h('div', { class: 'flex items-center text-center gap-1' }, [
        h('div', undefined, [
          h('div', {
            class: 'relative group cursor-pointer'
          }, [
            h('p', {
              class: 'font-medium text-(--ui-text-highlighted) max-w-[200px] truncate'
            }, row.original.createdBy.username),
            h('div', {
              class: 'absolute z-50 hidden group-hover:block bg-gray-900 text-white text-sm rounded px-2 py-1 left-0 top-full mt-1 whitespace-normal max-w-xs'
            }, row.original.createdBy.username)
          ])
        ])
      ])
    }
  },
  {
    id: 'actions',
    header: ({ column }) => h('div', { class: 'text-right' }, getHeader(column, 'Actions', 'right')),
    cell: ({ row }) => {
      return h(
        'div',
        { class: 'text-right' },
        h(UButton, {
          icon: 'i-lucide-pen-line',
          color: 'neutral',
          variant: 'ghost',
          class: 'ml-auto',
          title: 'Kiểm duyệt',
          onClick: () => {
            // TODO: Add function of 1 novel is moderating
            openModerationModal(row.original)
          }
        })
      )
    }
  }
]

function getHeader(column: Column<Novel>, label: string, position: 'left' | 'right') {
  const isPinned = column.getIsPinned()
  return h(UButton, {
    color: 'neutral',
    variant: 'ghost',
    label,
    icon: isPinned ? 'i-lucide-pin-off' : 'i-lucide-pin',
    class: '-mx-2.5',
    onClick() {
      column.pin(isPinned === position ? false : position)
    }
  })
}

const columnPinning = ref({
  left: [],
  right: ['actions']
})

const debouncedFetchNovels = useDebounceFn(async () => {
  if (isRefetching.value) return
  isRefetching.value = true
  try {
    const query: NovelQuery = {
      page: pagination.value.pageIndex + 1,
      limit: pagination.value.pageSize,
      sort: 'createdAt',
      direction: 'desc'
    }
    if (statusFilter.value !== 'all') {
      query.sort = statusFilter.value === 'Hoàn thành' ? 'completed' : statusFilter.value === 'Còn tiếp' ? 'ongoing' : 'hiatus'
    }
    if (columnFilters.value[0]?.value) {
      query.sort = columnFilters.value[0].value
    }
    if (JSON.stringify(query) === JSON.stringify(lastQuery.value)) {
      console.log('Skipping fetch; query unchanged:', query)
      return
    }
    console.log('Fetching novels with query:', query)
    if (props.role === 'moderator') {
      await novelsStore.fetchPendingNovels(query)
    } else {
      await novelsStore.fetchNovels(query)
    }
    lastQuery.value = { ...query }
  } catch (error) {
    console.error('Error refetching novels:', error)
    toast.add({
      title: 'Lỗi',
      description: 'Không thể tải danh sách truyện.',
      color: 'error'
    })
  } finally {
    isRefetching.value = false
  }
}, 1500)

const pagination = ref({
  pageIndex: 0,
  pageSize: novelsStore.pagination.limit
})

watch(
  [statusFilter, () => pagination.value.pageIndex, () => columnFilters.value[0]?.value],
  async ([newStatusFilter], [oldStatusFilter]) => {
    if (newStatusFilter !== oldStatusFilter) {
      pagination.value.pageIndex = 0
    }
    if (table?.value?.tableApi) {
      const statusColumn = table.value.tableApi.getColumn('status')
      if (statusColumn) {
        if (newStatusFilter === 'all') {
          statusColumn.setFilterValue(undefined)
        } else {
          statusColumn.setFilterValue(newStatusFilter === 'Đang chờ' ? 'pending' : 'warning')
        }
      }
    }
    await debouncedFetchNovels()
  },
  { immediate: true }
)
</script>

<template>
  <div class="flex flex-wrap items-center justify-between gap-1.5">
    <UInput
      :model-value="(table?.tableApi?.getColumn('title')?.getFilterValue() as string)"
      class="max-w-sm"
      icon="i-lucide-search"
      placeholder="Filter..."
      @update:model-value="table?.tableApi?.getColumn('title')?.setFilterValue($event)"
    />

    <div class="flex flex-wrap items-center gap-1.5">
      <UDropdownMenu
        :items="
          table?.tableApi
            ?.getAllColumns()
            .filter((column) => column.getCanHide())
            .map((column) => ({
              label: upperFirst(column.id),
              type: 'checkbox' as const,
              checked: column.getIsVisible(),
              onUpdateChecked(checked: boolean) {
                table?.tableApi?.getColumn(column.id)?.toggleVisibility(!!checked)
              },
              onSelect(e?: Event) {
                e?.preventDefault()
              }
            }))
        "
        :content="{ align: 'end' }"
      >
        <UButton
          label="Display"
          color="neutral"
          variant="outline"
          trailing-icon="i-lucide-settings-2"
        />
      </UDropdownMenu>
    </div>
  </div>

  <UTable
    ref="table"
    v-model:column-pinning="columnPinning"
    v-model:column-filters="columnFilters"
    v-model:column-visibility="columnVisibility"
    v-model:row-selection="rowSelection"
    v-model:pagination="pagination"
    :pagination-options="{ getPaginationRowModel: getPaginationRowModel() }"
    class="shrink-0"
    :data="data || novelsStore.novels"
    :columns="columns"
    :loading="loading || novelsStore.isLoading"
    :ui="{
      base: 'table-fixed border-separate border-spacing-0',
      thead: '[&>tr]:bg-(--ui-bg-elevated)/50 [&>tr]:after:content-none',
      tbody: '[&>tr]:last:[&>td]:border-b-0',
      th: 'py-1 first:rounded-l-[calc(var(--ui-radius)*2)] last:rounded-r-[calc(var(--ui-radius)*2)] border-y border-(--ui-border) first:border-l last:border-r',
      td: 'border-b border-(--ui-border)'
    }"
  />

  <div class="flex items-center justify-between gap-3 border-t border-(--ui-border) pt-4 mt-auto">
    <div class="text-sm text-(--ui-text-muted)">
      {{ table?.tableApi?.getFilteredSelectedRowModel().rows.length || 0 }} of
      {{ table?.tableApi?.getFilteredRowModel().rows.length || 0 }} row(s) selected.
    </div>

    <div class="flex items-center gap-1.5">
      <UPagination
        :default-page="pagination.pageIndex + 1"
        :items-per-page="pagination.pageSize"
        :total="novelsStore.pagination.total"
        @update:page="(p) => pagination.pageIndex = p - 1"
      />
    </div>
  </div>

  <UModal
    v-model:open="isModerationModalOpen"
    aria-describedby="undefined"
    title="Moderate Novel"
    close-icon="i-lucide-arrow-left"
    fullscreen
    class="overflow-scroll"
  >
    <template #content>
      <ModeratorNovel
        v-if="selectedNovel"
        :novel-id="selectedNovel._id"
        :created-by="selectedNovel.createdBy"
        :on-close="() => {
          isModerationModalOpen = false
        }"
      />
    </template>
  </UModal>
</template>
