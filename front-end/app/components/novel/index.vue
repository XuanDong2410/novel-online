<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import { upperFirst } from 'scule'
import { getPaginationRowModel, type Row } from '@tanstack/table-core'
import type { Novel } from '~/types/novel'
import { useNovels } from '~/composables/useNovels'
import { useNovelsStore } from '~/stores/novel.store'

const {
  getStatusLabel,
  getStatusColor,
  getStatusIcon
} = useStatus()

const { fetchNovels } = useNovels()
const novelsStore = useNovelsStore()
const toast = useToast()
const table = useTemplateRef('table')

// const UAvatar = resolveComponent('UAvatar')
const UButton = resolveComponent('UButton')
const UBadge = resolveComponent('UBadge')
const UDropdownMenu = resolveComponent('UDropdownMenu')
const UCheckbox = resolveComponent('UCheckbox')
const columnFilters = ref([{
  id: 'title',
  value: ''
}])
const columnVisibility = ref()
const rowSelection = ref({})

// const props = defineProps({
//   status: {
//     type: String,
//     default: 'pending'
//   }
// })

const isListChapterModalOpen = ref(false)
const isEditNovelModalOpen = ref(false)
const isAdminContactModalOpen = ref(false)
const isViewStatsModalOpen = ref(false)
const selectedNovel = ref<Novel | null>(null)

// Fetch novels on mount
onMounted(async () => {
  await fetchNovels({
    page: novelsStore.pagination.page,
    limit: novelsStore.pagination.limit,
    sort: 'createdAt',
    direction: 'desc'
  })
})

function openAdminContactModal(novel: Novel) {
  selectedNovel.value = novel
  isAdminContactModalOpen.value = true
}
function openEditNovelModal(novel: Novel) {
  selectedNovel.value = novel
  isEditNovelModalOpen.value = true
}
function openListChapterModal(novel: Novel) {
  selectedNovel.value = novel
  isListChapterModalOpen.value = true
}
function openViewStatsModal(novel: Novel) {
  selectedNovel.value = novel
  isViewStatsModalOpen.value = true
}

function getRowItems(_row: Row<Novel>) {
  return [
    {
      type: 'label',
      label: 'Actions'
    },
    {
      type: 'separator'
    },
    {
      label: 'Danh sách chương',
      icon: 'i-lucide-list',
      onSelect() {
        openListChapterModal(_row.original)
      }
    },
    {
      label: 'Chỉnh sửa truyện',
      icon: 'i-lucide-pen-line',
      onSelect() {
        openEditNovelModal(_row.original)
      }
    },
    {
      type: 'separator'
    },
    {
      label: 'Thống kê',
      icon: 'i-lucide-chart-line',
      onSelect() {
        openViewStatsModal(_row.original)
      }
    },
    {
      label: 'Liên hệ quản trị viên',
      icon: 'i-lucide-message-circle-warning',
      onSelect() {
        openAdminContactModal(_row.original)
      }
    },
    {
      type: 'separator'
    },
    {
      label: 'Delete',
      icon: 'i-lucide-trash',
      color: 'error',
      onSelect() {
        toast.add({
          title: 'Novel deleted',
          description: 'The novel has been deleted.'
        })
      }
    }
  ]
}

const columns: TableColumn<Novel>[] = [
  {
    id: 'select',
    header: ({ table }) =>
      h(UCheckbox, {
        'modelValue': table.getIsSomePageRowsSelected()
          ? 'indeterminate'
          : table.getIsAllPageRowsSelected(),
        'onUpdate:modelValue': (value: boolean | 'indeterminate') =>
          table.toggleAllPageRowsSelected(!!value),
        'ariaLabel': 'Select all'
      }
      ),
    cell: ({ row }) =>
      h(UCheckbox, {
        'modelValue': row.getIsSelected(),
        'onUpdate:modelValue': (value: boolean | 'indeterminate') => row.toggleSelected(!!value),
        'ariaLabel': 'Select row'
      })
  },
  {
    accessorKey: '_id',
    header: 'ID'
  },
  {
    accessorKey: 'title',
    header: 'Truyện',
    cell: ({ row }) => {
      return h('div', { class: 'flex items-center gap-3' }, [
        h('div', undefined, [
          h('p', { class: 'font-medium text-(--ui-text-highlighted)' }, row.original.title),
          h('p', { class: '' }, row.original.statusPublish)
        ])
      ])
    }
  },
  {
    accessorKey: 'statusPublish',
    header: 'Xuất bản',
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
    accessorKey: 'createdAt',
    header: ({ column }) => {
      const isSorted = column.getIsSorted()

      return h(UButton, {
        color: 'neutral',
        variant: 'ghost',
        label: 'Thời gian',
        icon: isSorted
          ? isSorted === 'asc'
            ? 'i-lucide-arrow-up-narrow-wide'
            : 'i-lucide-arrow-down-wide-narrow'
          : 'i-lucide-arrow-up-down',
        class: '-mx-2.5',
        onClick: () => column.toggleSorting(column.getIsSorted() === 'asc')
      })
    }
  },
  {
    accessorKey: 'attributes',
    header: 'Thể loại',
    cell: ({ row }) => row.original.attributes.map(attr => attr.name).join(', ')
  },
  {
    accessorKey: 'status',
    header: 'Trạng thái nội dung',
    filterFn: 'equals',
    cell: ({ row }) => {
      const statusMap: Record<string, { label: string }> = {
        completed: { label: 'Hoàn thành' },
        ongoing: { label: 'Còn tiếp' },
        hiatus: { label: 'Tạm ngưng' }
      }
      const statusData = statusMap[row.original.status]
      if (statusData) {
        const color = {
          'Hoàn thành': 'success' as const,
          'Tạm ngưng': 'error' as const,
          'Còn tiếp': 'warning' as const
        }[statusData.label]
        return h(UBadge, { class: 'capitalize', variant: 'subtle', color }, () => statusData.label)
      }
    }
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      return h(
        'div',
        { class: 'text-right' },
        h(
          UDropdownMenu,
          {
            content: {
              align: 'end'
            },
            items: getRowItems(row)
          },
          () =>
            h(UButton, {
              icon: 'i-lucide-ellipsis-vertical',
              color: 'neutral',
              variant: 'ghost',
              class: 'ml-auto'
            })
        )
      )
    }
  }
]

const statusFilter = ref('all')

watch(() => statusFilter.value, (newVal) => {
  if (!table?.value?.tableApi) return

  const statusColumn = table.value.tableApi.getColumn('status')
  if (!statusColumn) return

  if (newVal === 'all') {
    statusColumn.setFilterValue(undefined)
  } else {
    statusColumn.setFilterValue(newVal === 'Hoàn thành' ? 'completed' : newVal === 'Còn tiếp' ? 'ongoing' : 'hiatus')
  }
})

const pagination = ref({
  pageIndex: computed(() => novelsStore.pagination.page - 1),
  pageSize: computed(() => novelsStore.pagination.limit)
})

watch(pagination, async (newVal) => {
  await fetchNovels({
    page: newVal.pageIndex + 1,
    limit: newVal.pageSize
  })
}, { deep: true })
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
      <NovelDelete :count="table?.tableApi?.getFilteredSelectedRowModel().rows.length">
        <UButton
          v-if="table?.tableApi?.getFilteredSelectedRowModel().rows.length"
          label="Delete"
          color="error"
          variant="subtle"
          icon="i-lucide-trash"
        >
          <template #trailing>
            <UKbd>
              {{ table?.tableApi?.getFilteredSelectedRowModel().rows.length }}
            </UKbd>
          </template>
        </UButton>
      </NovelDelete>

      <USelect
        v-model="statusFilter"
        :items="[
          { label: 'All', value: 'all' },
          { label: 'Còn tiếp', value: 'Còn tiếp' },
          { label: 'Hoàn thành', value: 'Hoàn thành' },
          { label: 'Tạm ngưng', value: 'Tạm ngưng' }
        ]"
        :ui="{ trailingIcon: 'group-data-[state=open]:rotate-180 transition-transform duration-200' }"
        placeholder="Filter status"
        class="min-w-28"
      />
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
    v-model:column-filters="columnFilters"
    v-model:column-visibility="columnVisibility"
    v-model:row-selection="rowSelection"
    v-model:pagination="pagination"
    :pagination-options="{
      getPaginationRowModel: getPaginationRowModel()
    }"
    class="shrink-0"
    :data="novelsStore.novels"
    :columns="columns"
    :loading="novelsStore.isLoading"
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
        :default-page="novelsStore.pagination.page"
        :items-per-page="novelsStore.pagination.limit"
        :total="novelsStore.pagination.total"
        @update:page="(p) => pagination.pageIndex = p - 1"
      />
    </div>
  </div>

  <UModal
    v-model:open="isListChapterModalOpen"
    title="Danh sách chương"
    description="Danh sách chương của truyện."
    fullscreen
  >
    <template #body>
      <NovelChapter
        :novel-id="selectedNovel?._id ?? null"
      />
    </template>
  </UModal>
  <UModal
    v-model:open="isEditNovelModalOpen"
    title="Chỉnh sửa truyện"
    description="Chỉnh sửa thông tin truyện."
    fullscreen
  >
    <template #body>
      <NovelEdit
        :novel-id="selectedNovel?._id ?? null"
      />
    </template>
  </UModal>
  <UModal
    v-model:open="isViewStatsModalOpen"
    title="Thống kê truyện"
    description="Thống kê truyện."
    fullscreen
  >
    <template #body>
      <NovelStats
        :novel-id="selectedNovel?._id ?? null"
      />
    </template>
  </UModal>
  <UModal
    v-model:open="isAdminContactModalOpen"
    title="Liên hệ quản trị viên"
    description="Liên hệ quản trị viên của truyện."
  >
    <template #body>
      <NovelAdminContact
        :novel="selectedNovel ?? undefined"
      />
    </template>
  </UModal>
</template>
