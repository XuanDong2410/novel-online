<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { Column } from '@tanstack/vue-table'
import { upperFirst } from 'scule'
import { getPaginationRowModel, type Row } from '@tanstack/table-core'
import { useDebounceFn } from '@vueuse/core'
import type { Novel, NovelQuery } from '~/types/novel'
import { useNovelsStore } from '~/stores/novel.store'
import { useNovels } from '~/composables/useNovels'

const {
  getStatusLabel,
  getStatusColor,
  getStatusIcon
} = useStatus()

const UButton = resolveComponent('UButton')
const UBadge = resolveComponent('UBadge')
const UDropdownMenu = resolveComponent('UDropdownMenu')
const UCheckbox = resolveComponent('UCheckbox')
const { requestPublish } = useNovels()
const novelsStore = useNovelsStore()
const toast = useToast()
const table = useTemplateRef('table')

const props = defineProps<{
  role: 'user' | 'moderator' | 'admin' | 'system' | undefined
  data?: Novel[]
  loading?: boolean
  error: string | null
}>()

const emits = defineEmits<{
  (e: 'edit' | 'req-publish' | 'update:novels', novel?: Novel): void
}>()

const columnFilters = ref([{ id: 'title', value: '' }])
const columnVisibility = ref()
const rowSelection = ref({})
const statusFilter = ref('all')
const isListChapterModalOpen = ref(false)
const isEditNovelModalOpen = ref(false)
const isAdminContactModalOpen = ref(false)
const isViewStatsModalOpen = ref(false)
const selectedNovel = ref<Novel | undefined>(undefined)
const isRefetching = ref(false)
const lastQuery = ref<NovelQuery | null>(null)

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
async function openPublishNovel(novel: Novel) {
  try {
    await requestPublish(novel._id)
    toast.add({
      title: 'Thành công',
      description: 'Gửi yêu cầu xuất bản thành công',
      color: 'success'
    })
    emits('req-publish', novel)
  } catch {
    toast.add({
      title: 'Lỗi',
      description: 'Gửi yêu cầu xuất bản thất bại',
      color: 'error'
    })
  }
}

function getRowItems(_row: Row<Novel>, role: 'user' | 'moderator' | 'admin' | 'system' | undefined) {
  const novel = _row.original
  const isEditable = ['draft', 'editing'].includes(novel.statusPublish)
  const isPublishable = ['draft'].includes(novel.statusPublish)
  const baseItems = [
    {
      type: 'label',
      label: 'Hành động'
    },
    {
      type: 'separator'
    },
    {
      label: 'Danh sách chương',
      icon: 'i-lucide-list',
      onSelect() {
        openListChapterModal(novel)
      }
    }
  ]

  interface DropdownItem {
    label?: string
    icon?: string
    color?: string
    type?: 'label' | 'separator'
    onSelect?: () => void
    disabled?: boolean
    tooltip?: string
  }

  const roleSpecificItems: Record<string, DropdownItem[]> = {
    user: [
      {
        label: 'Yêu cầu xuất bản',
        icon: 'i-lucide-check-circle',
        onSelect() {
          openPublishNovel(novel)
        },
        disabled: !isPublishable,
        tooltip: isPublishable ? undefined : 'Truyện không đủ điều kiện để xuất bản'
      },
      {
        label: 'Chỉnh sửa truyện',
        icon: 'i-lucide-pen-line',
        onSelect() {
          openEditNovelModal(novel)
        }
      },
      {
        type: 'separator'
      },
      {
        label: 'Thống kê',
        icon: 'i-lucide-chart-line',
        onSelect() {
          openViewStatsModal(novel)
        }
      },
      {
        label: 'Liên hệ quản trị viên',
        icon: 'i-lucide-message-circle-warning',
        onSelect() {
          openAdminContactModal(novel)
        }
      },
      {
        type: 'separator'
      },
      {
        label: 'Xóa',
        icon: 'i-lucide-trash',
        color: 'error',
        onSelect() {
          toast.add({
            title: 'Truyện đã xóa',
            description: 'Truyện đã được xóa thành công.'
          })
        }
      }
    ],
    admin: [
      {
        label: 'Chỉnh sửa truyện',
        icon: 'i-lucide-pen-line',
        onSelect() {
          openEditNovelModal(novel)
        },
        disabled: !isEditable
      },
      {
        label: 'Xóa vĩnh viễn',
        icon: 'i-lucide-trash',
        color: 'error',
        onSelect() {
          toast.add({
            title: 'Truyện đã xóa vĩnh viễn',
            description: 'Truyện đã được xóa vĩnh viễn.'
          })
        }
      },
      {
        type: 'separator'
      },
      {
        label: 'Thống kê',
        icon: 'i-lucide-chart-line',
        onSelect() {
          openViewStatsModal(novel)
        }
      }
    ]
  }

  return [...baseItems, ...(roleSpecificItems[role || 'user'] || [])]
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
      }),
    cell: ({ row }) =>
      h(UCheckbox, {
        'modelValue': row.getIsSelected(),
        'onUpdate:modelValue': (value: boolean | 'indeterminate') => row.toggleSelected(!!value),
        'ariaLabel': 'Select row'
      })
  },
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
    accessorKey: 'status',
    header: 'Nội dung',
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
    cell: ({ row }) => {
      const attributes = row.original.attributes
      return Array.isArray(attributes) && attributes.length > 0
        ? attributes.map(attr => attr.name || 'Unknown').join(', ')
        : 'N/A'
    }
  },
  {
    id: 'actions',
    header: ({ column }) => h('div', { class: 'text-right' }, getHeader(column, 'Actions', 'right')),
    cell: ({ row }) => {
      return h(
        'div',
        { class: 'text-right' },
        h(
          UDropdownMenu,
          {
            content: { align: 'end' },
            items: getRowItems(row, props.role ? props.role : 'user')
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
    if (props.role === 'admin') {
      await novelsStore.fetchAllNovelsForAdmin()
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
          statusColumn.setFilterValue(newStatusFilter === 'Hoàn thành' ? 'completed' : newStatusFilter === 'Còn tiếp' ? 'ongoing' : 'hiatus')
        }
      }
    }
    await debouncedFetchNovels()
  },
  { immediate: true }
)

function handleNovelEditSubmit(updatedNovel: Novel) {
  console.log('Novel edited:', updatedNovel)
  if (selectedNovel.value?._id === updatedNovel._id) {
    selectedNovel.value = { ...updatedNovel }
  }
  const index = novelsStore.novels.findIndex(n => n._id === updatedNovel._id)
  if (index !== -1) {
    novelsStore.novels[index] = { ...updatedNovel }
  }
  emits('edit', updatedNovel)
  isEditNovelModalOpen.value = false
}
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
    v-model:open="isListChapterModalOpen"
    title="Danh sách chương"
    description="Danh sách chương của truyện."
    fullscreen
  >
    <template #body>
      <NovelChapter
        :role="role"
        :novel-id="selectedNovel?._id || ''"
      />
    </template>
  </UModal>

  <UModal
    v-model:open="isEditNovelModalOpen"
    title="Chỉnh sửa truyện"
    description="Chỉnh sửa hoặc xem thông tin truyện."
    fullscreen
  >
    <template #body>
      <NovelEdit
        :novel-id="selectedNovel?._id || ''"
        @edit="handleNovelEditSubmit"
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
        :novel-id="selectedNovel?._id ?? undefined"
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
