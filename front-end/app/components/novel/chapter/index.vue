<script setup lang="ts">
import { h, resolveComponent } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import { upperFirst } from 'scule'
import { getPaginationRowModel, type Row } from '@tanstack/table-core'
import type { Chapter, IAudio } from '~/types/chapter'

const {
  getStatusLabel,
  getStatusColor,
  getStatusIcon
} = useStatus()
const UButton = resolveComponent('UButton')
const UBadge = resolveComponent('UBadge')
const UDropdownMenu = resolveComponent('UDropdownMenu')
const UCheckbox = resolveComponent('UCheckbox')

const toast = useToast()
const table = useTemplateRef('table')

const columnFilters = ref([{ id: 'title', value: '' }])
const columnVisibility = ref()
const rowSelection = ref({})

const props = defineProps<{
  novelId: string
  role: 'user' | 'moderator' | 'admin' | 'system' | undefined
}>()

if (!props.novelId) {
  console.error('Invalid novelId')
  toast.add({ title: 'Lỗi', description: 'ID truyện không hợp lệ.', color: 'error' })
}
const { fetchChapters, getChapterById } = useChapters()
// Fetch chapters with useAsyncData
const { data: chapters, refresh, error } = await useAsyncData(
  `chapters-${props.novelId}`,
  async () => {
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
const isPreviewVttModalOpen = ref(false)
const isAudioModalOpen = ref(false)
const selectedChapterForAudio = ref<string | null>(null)

function openEditChapterModal(chapterId: string | null) {
  selectedChapterId.value = chapterId
  isEditChapterModalOpen.value = true
}
const chapter = ref<Chapter>()
async function openAddAudioModal(chapterId: string) {
  selectedChapterForAudio.value = chapterId
  const result = await getChapterById(chapterId)
  chapter.value = result.data?.value || undefined
  isAudioModalOpen.value = true
}
// State để lưu trữ nội dung VTT đã tải về từ URL
const fetchedVttContent = ref<string | null>(null)
// State để hiển thị trạng thái tải khi fetch
const isLoading = ref<boolean>(false)
// State để hiển thị lỗi khi fetch
const fetchError = ref<string | null>(null)
/**
 * @function fetchAndShowModal
 * @description Hàm xử lý việc tải nội dung VTT từ URL và sau đó hiển thị modal.
 */
const fetchAndShowModal = async (contentVttUrl: string) => {
  isLoading.value = true
  fetchError.value = null // Clear previous errors
  fetchedVttContent.value = null // Clear previous content

  try {
    const response = await fetch(contentVttUrl)
    if (!response.ok) {
      throw new Error(`Không thể tải VTT từ URL: ${response.statusText} (${response.status})`)
    }
    const text = await response.text()
    fetchedVttContent.value = text // Lưu nội dung đã tải
    isPreviewVttModalOpen.value = true // Mở modal sau khi tải thành công
  } catch (err: unknown) {
    let errorMessage = 'Không xác định lỗi'
    if (err && typeof err === 'object' && 'message' in err) {
      errorMessage = (err as { message: string }).message
    }
    fetchError.value = `Lỗi khi tải URL: ${errorMessage}`
    console.error('Lỗi khi tải URL:', err)
  } finally {
    isLoading.value = false
  }
}
// Handle chapter creation or update to refresh data
function handleChapterChange() {
  refresh()
  toast.add({ title: 'Thành công', description: 'Danh sách chương đã được cập nhật.', color: 'success' })
}
// function handleAudioAdded() {
//   isAddAudioModalOpen.value = false // Đóng modal sau khi thêm
//   refresh() // Refresh danh sách chapters để hiển thị audio mới
//   toast.add({ title: 'Thành công', description: 'Audio đã được thêm vào chương.', color: 'success' })
// }
function getRowItems(_row: Row<Chapter>) {
  const chapter: Chapter = _row.original
  const baseItems = [
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
      label: 'Xóa',
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
  interface DropdownItem {
    label?: string
    icon?: string
    color?: string
    type?: 'label' | 'separator'
    onSelect?: () => void
    disabled?: boolean
    tooltip?: string
  }

  // Prepare role-specific dropdown items
  function getRoleSpecificItems(chapter: Chapter): DropdownItem[] {
    const items: DropdownItem[] = []

    if (props.role === 'admin') {
      items.push(
        { type: 'separator' },
        {
          label: 'Âm thanh', // Nút thêm Audio mới
          icon: 'i-lucide-file-audio',
          onSelect() {
            openAddAudioModal(chapter._id)
          }
        }
      )
    }

    // Logic cho Preview VTT
    const chapterAudios: (IAudio | string)[] | undefined = chapter.audios
    let firstVttUrl: string | undefined

    // Kiểm tra nếu audios đã được populate và có ít nhất một audio với subtitle VTT
    if (chapterAudios && Array.isArray(chapterAudios) && chapterAudios.length > 0) {
      const firstAudioWithVtt: IAudio | undefined = chapterAudios.find(
        audio => typeof audio === 'object' && (audio as IAudio).subtitle?.url && (audio as IAudio).subtitle?.format === 'VTT'
      ) as IAudio | undefined

      if (firstAudioWithVtt) {
        firstVttUrl = firstAudioWithVtt.subtitle?.url
      }
    } else if ((chapter as Partial<Chapter> & { subtitleFileUrl?: string }).subtitleFileUrl) { // Trường hợp URL VTT trực tiếp trên chapter
      firstVttUrl = (chapter as Partial<Chapter> & { subtitleFileUrl?: string }).subtitleFileUrl
    }

    if (props.role === 'admin' || props.role === 'moderator') {
      items.push(
        { type: 'separator' },
        {
          label: 'Xem phụ đề',
          icon: 'i-lucide-eye',
          color: 'info',
          disabled: !firstVttUrl || isLoading.value, // Disable nếu không có URL hoặc đang tải
          tooltip: !firstVttUrl ? 'Không có file VTT nào để xem trước.' : undefined,
          onSelect() {
            if (firstVttUrl) {
              fetchAndShowModal(firstVttUrl)
            } else {
              toast.add({ title: 'Thông báo', description: 'Không tìm thấy URL VTT.', color: 'info' })
            }
          }
        }
      )
    }

    return items
  }

  // Replace previous roleSpecificItems logic with function call
  const roleSpecificItems: DropdownItem[] = getRoleSpecificItems(chapter)

  return [...roleSpecificItems, ...baseItems]
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
    accessorKey: 'status',
    header: 'Trạng thái',
    cell: ({ row }) =>
      h(UBadge, {
        class: 'w-full justify-center capitalize text-center',
        variant: 'subtle',
        color: getStatusColor(row.original.status),
        label: getStatusLabel(row.original.status),
        icon: getStatusIcon(row.original.status)
      })
  },
  {
    accessorKey: 'audios', // Thay đổi accessorKey để truy cập mảng audios
    header: 'Âm thanh',
    meta: {
      class: {
        td: 'w-[100px] text-center'
      }
    },
    cell: ({ row }) => {
      const chapter = row.original
      const audioList = chapter.audios

      if (!audioList || !Array.isArray(audioList) || audioList.length === 0) {
        return h('span', { class: 'text-gray-500' }, 'Không có audio')
      }

      // Filter for actual IAudio objects (not just IDs)
      const populatedAudios = audioList.filter((audio): audio is IAudio => typeof audio === 'object' && audio !== null)

      if (populatedAudios.length === 0) {
        return h('span', { class: 'text-gray-500' }, 'Không có audio đã populate')
      }

      return h('div', { class: 'flex flex-col gap-1' }, [
        ...populatedAudios.map(() =>
          h('a', {
            // href: audio.audioFileUrl,
            target: '_blank',
            rel: 'noopener noreferrer',
            class: 'text-primary-500 hover:underline flex items-center gap-1 text-sm'
          }, [
            h(UButton, {
              label: 'Âm thanh',
              variant: 'outline',
              size: 'sm',
              icon: 'i-lucide-headphones',
              class: 'w-full items-center',
              placeholder: 'Nghe audio',
              onClick: () => {
                openAddAudioModal(row.original._id)
              }
            })
            // h('span', audio.audioName || `Audio ${audio._id.substring(0, 6)}`)
          ])
        )
        // Có thể thêm nút xem VTT tại đây nếu muốn, hoặc giữ trong dropdown actions
        // Ví dụ:
        // h(UButton, {
        //   label: 'Xem VTT',
        //   variant: 'link',
        //   size: 'sm',
        //   icon: 'i-lucide-file-text',
        //   onClick: () => {
        //     if (populatedAudios[0]?.subtitle?.url && populatedAudios[0]?.subtitle?.format === 'VTT') {
        //       fetchAndShowModal(populatedAudios[0].subtitle.url);
        //     } else {
        //       toast.add({ title: 'Thông báo', description: 'Không có VTT cho audio này.', color: 'info' });
        //     }
        //   }
        // })
      ])
    }
    // aggregationFn: 'uniqueCount' // Không cần thiết cho cột hiển thị list audio
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
// const grouping_options = ref<GroupingOptions>({
//   groupedColumnMode: 'remove',
//   getGroupedRowModel: getGroupedRowModel()
// })
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
              label="Hiển thị"
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
      <!-- Modal để hiển thị VttPreview component -->
      <UModal v-model:open="isPreviewVttModalOpen" fullscreen title="Nội dung file VTT">
        <template #body>
          <AdminAudioPreview :vtt-source-content="fetchedVttContent" />
        </template>
      </UModal>
      <UModal
        v-model:open="isAudioModalOpen"
        title="Âm thanh của chương"
        fullscreen
        :class="{ width: 'max-w-3xl' }"
      >
        <template #body>
          <AdminAudio :chapter="chapter" />
        </template>
      </UModal>
    </template>
  </UDashboardPanel>
</template>
