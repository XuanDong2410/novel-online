<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import { upperFirst } from 'scule'
import { getPaginationRowModel, type Row } from '@tanstack/table-core'
import type { Chapter } from '~/types/chapter'
import { useChapters } from '~/composables/useChapters'

const UButton = resolveComponent('UButton')
const UDropdownMenu = resolveComponent('UDropdownMenu')
const UCheckbox = resolveComponent('UCheckbox')

const toast = useToast()
const table = useTemplateRef('table')

const columnFilters = ref([{ id: 'title', value: '' }])
const columnVisibility = ref()
const rowSelection = ref({})

const props = defineProps<{ novelId: string }>()

if (!props.novelId) {
  console.error('Invalid novelId')
  toast.add({ title: 'Lỗi', description: 'ID truyện không hợp lệ.', color: 'error' })
}

// Fetch chapters with useAsyncData
const { data: chapters, refresh, error } = await useAsyncData(
  `chapters-${props.novelId}`,
  async () => {
    const { fetchChapters } = useChapters()
    const { data } = await fetchChapters(props.novelId)
    return data.value || []
  }
)

if (error.value) {
  toast.add({ title: 'Lỗi', description: 'Không thể tải danh sách chương.', color: 'error' })
}

const isEditChapterModalOpen = ref(false)
const selectedChapterId = ref<string | null>(null)
const isCreateChapterModalOpen = ref(false)

function openEditChapterModal(chapterId: string | null) {
  selectedChapterId.value = chapterId
  isEditChapterModalOpen.value = true
}

// Handle chapter creation or update to refresh data
function handleChapterChange() {
  refresh()
  toast.add({ title: 'Thành công', description: 'Danh sách chương đã được cập nhật.', color: 'success' })
}

function getRowItems(_row: Row<Chapter>) {
  return [
    { type: 'label', label: 'Actions' },
    { type: 'separator' },
    {
      label: 'Chỉnh sửa chương',
      icon: 'i-lucide-pen-line',
      onSelect() {
        openEditChapterModal(_row.original._id)
      }
    },
    { type: 'separator' },
    {
      label: 'Delete',
      icon: 'i-lucide-trash',
      color: 'error',
      onSelect() {
        toast.add({
          title: 'Chapter deleted',
          description: 'The chapter has been deleted.'
        })
      }
    }
  ]
}

const columns: TableColumn<Chapter>[] = [
  {
    id: 'select',
    header: ({ table }) =>
      h(UCheckbox, {
        'modelValue': table.getIsSomePageRowsSelected() ? 'indeterminate' : table.getIsAllPageRowsSelected(),
        'onUpdate:modelValue': (value: boolean | 'indeterminate') => table.toggleAllPageRowsSelected(!!value),
        'ariaLabel': 'Select all'
      }),
    cell: ({ row }) =>
      h(UCheckbox, {
        'modelValue': row.getIsSelected(),
        'onUpdate:modelValue': (value: boolean | 'indeterminate') => row.toggleSelected(!!value),
        'ariaLabel': 'Select row'
      })
  },
  { accessorKey: '_id', header: 'ID' },
  {
    accessorKey: 'title',
    header: 'Tên chương',
    cell: ({ row }) =>
      h('div', { class: 'flex items-center gap-3' }, [
        h('div', undefined, [h('p', { class: 'font-medium text-(--ui-text-highlighted)' }, row.original.title)])
      ])
  },
  {
    accessorKey: 'createdAt',
    header: ({ column }) => {
      const isSorted = column.getIsSorted()
      return h(UButton, {
        color: 'neutral',
        variant: 'ghost',
        label: 'Xuất bản lúc',
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
    id: 'actions',
    cell: ({ row }) =>
      h('div', { class: 'text-right' }, [
        h(UDropdownMenu, { content: { align: 'end' }, items: getRowItems(row) }, () =>
          h(UButton, {
            icon: 'i-lucide-ellipsis-vertical',
            color: 'neutral',
            variant: 'ghost',
            class: 'ml-auto'
          })
        )
      ])
  }
]

const statusFilter = ref('all')

watch(
  () => statusFilter.value,
  (newVal) => {
    if (!table?.value?.tableApi) return
    const statusColumn = table.value.tableApi.getColumn('status')
    if (!statusColumn) return
    statusColumn.setFilterValue(newVal === 'all' ? undefined : newVal)
  }
)

const pagination = ref({
  pageIndex: 0,
  pageSize: 10
})
</script>

<template>
  <UDashboardPanel id="chapters">
    <template #body>
      <div class="flex flex-wrap items-center justify-between gap-1.5">
        <div class="flex items-center gap-1.5">
          <UInput
            :model-value="(table?.tableApi?.getColumn('title')?.getFilterValue() as string)"
            class="max-w-sm"
            icon="i-lucide-search"
            placeholder="Filter..."
            @update:model-value="table?.tableApi?.getColumn('title')?.setFilterValue($event)"
          />
          <UButton
            label="Thêm chương mới"
            color="primary"
            variant="solid"
            icon="i-lucide-plus"
            @click="isCreateChapterModalOpen = true"
          />
        </div>
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
                <UKbd>{{ table?.tableApi?.getFilteredSelectedRowModel().rows.length }}</UKbd>
              </template>
            </UButton>
          </NovelDelete>
          <UDropdownMenu
            :items="
              table?.tableApi
                ?.getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => ({
                  label: upperFirst(column.id),
                  type: 'checkbox',
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
        :pagination-options="{ getPaginationRowModel: getPaginationRowModel() }"
        class="shrink-0"
        :data="chapters"
        :columns="columns"
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
            :default-page="(table?.tableApi?.getState().pagination.pageIndex || 0) + 1"
            :items-per-page="table?.tableApi?.getState().pagination.pageSize"
            :total="table?.tableApi?.getFilteredRowModel().rows.length"
            @update:page="(p) => table?.tableApi?.setPageIndex(p - 1)"
          />
        </div>
      </div>
      <UModal v-model:open="isCreateChapterModalOpen" title="Thêm chương mới" fullscreen>
        <template #body>
          <NovelChapterCreate :novel-id="props.novelId" @submit="handleChapterChange" />
        </template>
      </UModal>
      <UModal
        v-model:open="isEditChapterModalOpen"
        :title="selectedChapterId ? 'Chỉnh sửa chương' : 'Thêm Chương'"
        fullscreen
      >
        <template #body>
          <NovelChapterEdit :chapter-id="selectedChapterId ? selectedChapterId : ''" @submit="handleChapterChange" />
        </template>
      </UModal>
    </template>
  </UDashboardPanel>
</template>
