<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { Column } from '@tanstack/vue-table'
import { upperFirst } from 'scule'
import { getPaginationRowModel } from '@tanstack/table-core'
import { useDebounceFn } from '@vueuse/core'
import type { Appeal, AppealsQuery } from '~/types/appeal'
import { useAppealStore } from '~/stores/appeal.store'

const UButton = resolveComponent('UButton')
const UBadge = resolveComponent('UBadge')
const UDropdownMenu = resolveComponent('UDropdownMenu')
const { appeals, fetchAllAppeals, fetchAppealStats, handleAppeal, exportAppeals } = useAppeals()
const toast = useToast()
const table = useTemplateRef('table')

const props = defineProps<{
  role: 'user' | 'moderator' | 'admin' | 'system' | undefined
  data?: Appeal[]
  loading?: boolean
  error: string | null
}>()

const columnFilters = ref([{ id: 'reason', value: '' }])
const columnVisibility = ref()
const rowSelection = ref({})
const statusFilter = ref('all')
const typeFilter = ref('all')
const sortFilter = ref('createdAt')
const isRefetching = ref(false)
const lastQuery = ref<AppealsQuery | null>(null)
const selectedAppeal = ref<Appeal | undefined>(undefined)
const stats = ref<AppealStats | null>(null)
const showAppealModal = ref(false)
const submittingAppealAction = ref(false)

const appealActionForm = ref<{
  decision: string
  priority: string
  responseMessage: string
}>({
  decision: '',
  priority: 'medium',
  responseMessage: ''
})

const appealStatusOptions = [
  { label: 'All Status', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' },
  { label: 'Deleted', value: 'deleted' }
]

const appealTypeOptions = [
  { label: 'All Types', value: 'all' },
  { label: 'Reject', value: 'reject' },
  { label: 'Warning', value: 'warning' },
  { label: 'Flag', value: 'flag' },
  { label: 'Hide', value: 'hide' }
]

const appealSortOptions = [
  { label: 'Newest First', value: 'createdAt' },
  { label: 'Oldest First', value: 'createdAt_asc' },
  { label: 'Priority', value: 'priority' }
]

const priorityOptions = [
  { label: 'Low', value: 'low' },
  { label: 'Medium', value: 'medium' },
  { label: 'High', value: 'high' },
  { label: 'Critical', value: 'critical' }
]

const appealDecisionOptions = [
  { label: 'Approve Appeal', value: 'approve' },
  { label: 'Reject Appeal', value: 'reject' },
  { label: 'Partial Approval', value: 'partial' }
]

const columns: TableColumn<Appeal>[] = [
  {
    accessorKey: '_id',
    header: ({ column }) => getHeader(column, 'ID', 'left')
  },
  {
    accessorKey: 'user',
    header: 'User',
    cell: ({ row }) => {
      return h('div', { class: 'flex items-center space-x-3' }, [
        h(UAvatar, {
          src: row.original.user?.image,
          alt: row.original.user?.username,
          size: 'sm'
        }),
        h('div', { class: 'min-w-0' }, [
          h('p', {
            class: 'text-sm font-medium text-slate-900 dark:text-white truncate'
          }, row.original.user?.username),
          h('p', {
            class: 'text-xs text-slate-500 truncate'
          }, `Violations: ${row.original.user?.violation?.count || 0}`)
        ])
      ])
    }
  },
  {
    accessorKey: 'actionType',
    header: 'Content',
    cell: ({ row }) => {
      return h('div', { class: 'flex items-center space-x-3' }, [
        h('div', {
          class: [
            'w-8 h-8 rounded-lg flex items-center justify-center',
            getAppealContentBgColor(row.original.actionType)
          ]
        }, [
          h(UIcon, {
            name: getAppealContentIcon(row.original.actionType),
            class: ['w-4 h-4', getAppealContentIconColor(row.original.actionType)]
          })
        ]),
        h('div', { class: 'min-w-0' }, [
          h('p', {
            class: 'text-sm font-medium text-slate-900 dark:text-white truncate'
          }, getAppealContentTitle(row.original)),
          h('p', {
            class: 'text-xs text-slate-500 truncate'
          }, `Action: ${row.original.actionType}`)
        ])
      ])
    }
  },
  {
    accessorKey: 'reason',
    header: 'Reason',
    cell: ({ row }) => {
      return h('div', { class: 'max-w-xs' }, [
        h('p', {
          class: 'text-sm text-slate-900 dark:text-white line-clamp-2'
        }, row.original.reason)
      ])
    }
  },
  {
    accessorKey: 'status',
    header: 'Status',
    filterFn: 'equals',
    cell: ({ row }) => {
      return h('div', { class: 'flex items-center space-x-2' }, [
        h('div', {
          class: [
            'w-2 h-2 rounded-full',
            getStatusDotColor(row.original.status)
          ]
        }),
        h(UBadge, {
          label: getStatusLabel(row.original.status),
          color: getStatusColor(row.original.status),
          variant: 'soft',
          size: 'sm'
        })
      ])
    }
  },
  {
    accessorKey: 'handledBy',
    header: 'Handled By',
    cell: ({ row }) => {
      return row.original.handledBy
        ? h('div', { class: 'flex items-center space-x-2' }, [
            h(UAvatar, {
              src: row.original.handledBy?.image,
              alt: row.original.handledBy?.username,
              size: 'xs'
            }),
            h('span', {
              class: 'text-sm text-slate-600 dark:text-slate-400'
            }, row.original.handledBy?.username)
          ])
        : h('span', {
            class: 'text-sm text-slate-400'
          }, '-')
    }
  },
  {
    accessorKey: 'createdAt',
    header: 'Date',
    cell: ({ row }) => {
      return h('div', {
        class: 'text-sm text-slate-600 dark:text-slate-400'
      }, formatDate(row.original.createdAt))
    }
  },
  {
    id: 'actions',
    header: ({ column }) => h('div', { class: 'text-right' }, getHeader(column, 'Actions', 'right')),
    cell: ({ row }) => {
      return h('div', { class: 'text-right flex items-center space-x-1' }, [
        h(UButton, {
          icon: 'i-heroicons-eye',
          size: 'xs',
          variant: 'ghost',
          class: 'hover:bg-blue-50 dark:hover:bg-blue-900/20',
          onClick: () => reviewAppeal(row.original)
        }),
        row.original.status === 'pending' && h(UButton, {
          icon: 'i-heroicons-check',
          size: 'xs',
          variant: 'ghost',
          class: 'hover:bg-green-50 dark:hover:bg-green-900/20',
          onClick: () => approveAppeal(row.original)
        }),
        row.original.status === 'pending' && h(UButton, {
          icon: 'i-heroicons-x-mark',
          size: 'xs',
          variant: 'ghost',
          class: 'hover:bg-red-50 dark:hover:bg-red-900/20',
          onClick: () => rejectAppeal(row.original)
        }),
        h(UDropdownMenu, {
          items: getAppealActions(row.original),
          content: { align: 'end' }
        }, () => [
          h(UButton, {
            icon: 'i-heroicons-ellipsis-vertical',
            size: 'xs',
            variant: 'ghost',
            class: 'hover:bg-slate-50 dark:hover:bg-slate-800'
          })
        ])
      ])
    }
  }
]

function getHeader(column: Column<Appeal>, label: string, position: 'left' | 'right') {
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

const debouncedFetchAppeals = useDebounceFn(async () => {
  if (isRefetching.value) return
  isRefetching.value = true
  try {
    const query: AppealsQuery = {
      page: pagination.value.pageIndex + 1,
      limit: { label: `${pagination.value.pageSize}`, value: pagination.value.pageSize },
      status: statusFilter.value,
      type: typeFilter.value,
      search: columnFilters.value[0]?.value || '',
      sort: sortFilter.value
    }
    if (JSON.stringify(query) === JSON.stringify(lastQuery.value)) {
      console.log('Skipping fetch; query unchanged:', query)
      return
    }
    console.log('Fetching appeals with query:', query)
    await fetchAllAppeals(query)
    lastQuery.value = { ...query }
  } catch (error) {
    console.error('Error refetching appeals:', error)
    toast.add({
      title: 'Lỗi',
      description: 'Không thể tải danh sách kháng cáo.',
      color: 'error'
    })
  } finally {
    isRefetching.value = false
  }
}, 1500)

const pagination = ref({
  pageIndex: 0,
  pageSize: useAppealStore().pagination.limit
})

watch(
  [statusFilter, typeFilter, sortFilter, () => pagination.value.pageIndex, () => columnFilters.value[0]?.value],
  async ([newStatusFilter, newTypeFilter, newSortFilter], [oldStatusFilter, oldTypeFilter, oldSortFilter]) => {
    if (newStatusFilter !== oldStatusFilter || newTypeFilter !== oldTypeFilter || newSortFilter !== oldSortFilter) {
      pagination.value.pageIndex = 0
    }
    if (table?.value?.tableApi) {
      const statusColumn = table.value.tableApi.getColumn('status')
      if (statusColumn) {
        statusColumn.setFilterValue(statusFilter.value === 'all' ? undefined : statusFilter.value)
      }
    }
    await debouncedFetchAppeals()
  },
  { immediate: true }
)

onMounted(async () => {
  const result = await fetchAppealStats()
  stats.value = result.data
})

const getAppealContentIcon = (actionType: string): string => {
  const iconMap: Record<string, string> = {
    reject: 'i-heroicons-x-circle',
    warning: 'i-heroicons-exclamation-triangle',
    flag: 'i-heroicons-flag',
    hide: 'i-heroicons-eye-slash'
  }
  return iconMap[actionType] || 'i-heroicons-document'
}

const getAppealContentBgColor = (actionType: string): string => {
  const colorMap: Record<string, string> = {
    reject: 'bg-red-100 dark:bg-red-900/30',
    warning: 'bg-yellow-100 dark:bg-yellow-900/30',
    flag: 'bg-orange-100 dark:bg-orange-900/30',
    hide: 'bg-gray-100 dark:bg-gray-800'
  }
  return colorMap[actionType] || 'bg-gray-100 dark:bg-gray-800'
}

const getAppealContentIconColor = (actionType: string): string => {
  const colorMap: Record<string, string> = {
    reject: 'text-red-600',
    warning: 'text-yellow-600',
    flag: 'text-orange-600',
    hide: 'text-gray-600'
  }
  return colorMap[actionType] || 'text-gray-600'
}

const getAppealContentTitle = (appeal: Appeal): string => {
  if (appeal.novelId) return appeal.novel?.title || 'Novel'
  if (appeal.chapterId) return appeal.chapter?.title || 'Chapter'
  return `${appeal.actionType} Appeal`
}

const getStatusDotColor = (status: string): string => {
  const colorMap: Record<string, string> = {
    pending: 'bg-yellow-400',
    approved: 'bg-green-400',
    rejected: 'bg-red-400',
    deleted: 'bg-gray-400'
  }
  return colorMap[status] || 'bg-gray-400'
}

const { getStatusColor, getStatusLabel } = useStatus()

const reviewAppeal = (appeal: Appeal): void => {
  selectedAppeal.value = appeal
  showAppealModal.value = true
}

const approveAppeal = async (appeal: Appeal): Promise<void> => {
  try {
    await handleAppeal(appeal._id, {
      status: 'approved',
      action: 'approve',
      severity: 'medium',
      note: 'Approved via quick action'
    })
    toast.add({
      title: 'Thành công',
      description: 'Kháng cáo đã được phê duyệt',
      color: 'success'
    })
    await fetchAllAppeals(lastQuery.value!)
  } catch (error) {
    console.error('Failed to approve appeal:', error)
    toast.add({
      title: 'Lỗi',
      description: 'Không thể phê duyệt kháng cáo',
      color: 'error'
    })
  }
}

const rejectAppeal = async (appeal: Appeal): Promise<void> => {
  try {
    await handleAppeal(appeal._id, {
      status: 'rejected',
      action: 'reject',
      severity: 'medium',
      note: 'Rejected via quick action'
    })
    toast.add({
      title: 'Thành công',
      description: 'Kháng cáo đã bị từ chối',
      color: 'success'
    })
    await fetchAllAppeals(lastQuery.value!)
  } catch (error) {
    console.error('Failed to reject appeal:', error)
    toast.add({
      title: 'Lỗi',
      description: 'Không thể từ chối kháng cáo',
      color: 'error'
    })
  }
}

const getAppealActions = (appeal: Appeal) => {
  const actions = [[
    {
      label: 'View Details',
      icon: 'i-heroicons-eye',
      click: () => reviewAppeal(appeal)
    }
  ]]
  if (appeal.status === 'pending') {
    actions.push([
      {
        label: 'Approve',
        icon: 'i-heroicons-check',
        click: () => approveAppeal(appeal)
      },
      {
        label: 'Reject',
        icon: 'i-heroicons-x-mark',
        click: () => rejectAppeal(appeal)
      }
    ])
  }
  return actions
}

const submitAppealAction = async (): Promise<void> => {
  submittingAppealAction.value = true
  try {
    if (selectedAppeal.value) {
      await handleAppeal(selectedAppeal.value._id, {
        status: appealActionForm.value.decision === 'approve' ? 'approved' : 'rejected',
        action: appealActionForm.value.decision,
        severity: appealActionForm.value.priority,
        note: appealActionForm.value.responseMessage
      })
      toast.add({
        title: 'Thành công',
        description: 'Hành động kháng cáo đã được gửi thành công',
        color: 'success'
      })
      showAppealModal.value = false
      appealActionForm.value = {
        decision: '',
        priority: 'medium',
        responseMessage: ''
      }
      await fetchAllAppeals(lastQuery.value!)
    }
  } catch {
    toast.add({
      title: 'Lỗi',
      description: 'Không thể gửi hành động kháng cáo',
      color: 'error'
    })
  } finally {
    submittingAppealAction.value = false
  }
}

const exportAllAppeals = async (format: 'csv' | 'json' = 'csv'): Promise<void> => {
  try {
    const data = await exportAppeals({
      status: statusFilter.value,
      type: typeFilter.value,
      format
    })
    const blob = new Blob([format === 'csv' ? data : JSON.stringify(data)], {
      type: format === 'csv' ? 'text/csv' : 'application/json'
    })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `appeals.${format}`
    a.click()
    window.URL.revokeObjectURL(url)
    toast.add({
      title: 'Thành công',
      description: `Kháng cáo đã được xuất thành công dưới dạng ${format.toUpperCase()}`,
      color: 'info'
    })
  } catch {
    toast.add({
      title: 'Lỗi',
      description: 'Không thể xuất kháng cáo',
      color: 'error'
    })
  }
}

const formatDate = (date: Date | undefined): string => {
  if (!date) return 'N/A'
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(date))
}
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 class="text-lg font-semibold text-slate-900 dark:text-white">
            Appeals Management
          </h3>
          <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Review and process user appeals for moderation actions
          </p>
          <div v-if="stats" class="mt-2 flex space-x-4">
            <div>
              <span class="text-sm font-medium">Tổng số: </span>
              <span class="text-sm">{{ stats.total }}</span>
            </div>
            <div>
              <span class="text-sm font-medium">Đang chờ: </span>
              <span class="text-sm">{{ stats.pending }}</span>
            </div>
            <div>
              <span class="text-sm font-medium">Đã phê duyệt: </span>
              <span class="text-sm">{{ stats.approved }}</span>
            </div>
            <div>
              <span class="text-sm font-medium">Bị từ chối: </span>
              <span class="text-sm">{{ stats.rejected }}</span>
            </div>
          </div>
        </div>
        <div class="flex items-center space-x-3">
          <UDropdownMenu
            :items="[
              [
                { label: 'CSV', click: () => exportAllAppeals('csv') },
                { label: 'JSON', click: () => exportAllAppeals('json') }
              ]
            ]"
            :content="{ align: 'end' }"
          >
            <UButton
              icon="i-heroicons-document-arrow-down"
              variant="outline"
              size="sm"
            >
              Export
            </UButton>
          </UDropdownMenu>
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
              size="sm"
            />
          </UDropdownMenu>
        </div>
      </div>
    </template>

    <div class="flex flex-wrap items-center justify-between gap-1.5">
      <UInput
        :model-value="(table?.tableApi?.getColumn('reason')?.getFilterValue() as string)"
        class="max-w-sm"
        icon="i-lucide-search"
        placeholder="Search appeals by user, content, or reason..."
        @update:model-value="table?.tableApi?.getColumn('reason')?.setFilterValue($event)"
      />

      <div class="flex flex-wrap items-center gap-1.5">
        <USelectMenu
          v-model="statusFilter"
          :items="appealStatusOptions"
          placeholder="Status"
          class="min-w-[140px]"
        />
        <USelectMenu
          v-model="typeFilter"
          :items="appealTypeOptions"
          placeholder="Type"
          class="min-w-[140px]"
        />
        <USelectMenu
          v-model="sortFilter"
          :items="appealSortOptions"
          placeholder="Sort by"
          class="min-w-[140px]"
        />
        <UButton
          icon="i-heroicons-x-mark"
          variant="outline"
          size="sm"
          @click="resetAppealFilters"
        >
          Clear
        </UButton>
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
      :data="data || appeals"
      :columns="columns"
      :loading="loading || useAppealStore().loading"
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
          :total="useAppealStore().pagination.total"
          @update:page="(p) => pagination.pageIndex = p - 1"
        />
      </div>
    </div>
  </UCard>

  <UModal v-model:open="showAppealModal" :class="{ width: 'max-w-4xl' }">
    <UCard>
      <template #header>
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold text-slate-900 dark:text-white">
            Review Appeal
          </h3>
          <UButton
            icon="i-heroicons-x-mark"
            variant="ghost"
            size="sm"
            @click="showAppealModal = false"
          />
        </div>
      </template>
      <template #body>
        <div v-if="selectedAppeal" class="space-y-6">
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div class="space-y-4">
              <div>
                <label class="text-sm font-medium text-slate-700 dark:text-slate-300">User</label>
                <div class="flex items-center space-x-3 mt-2">
                  <UAvatar
                    :src="selectedAppeal.user?.image"
                    :alt="selectedAppeal.user?.username"
                    size="sm"
                  />
                  <div>
                    <p class="text-sm font-medium text-slate-900 dark:text-white">
                      {{ selectedAppeal.user?.username }}
                    </p>
                    <p class="text-xs text-slate-500">
                      Violations: {{ selectedAppeal.user?.violation?.count || 0 }}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Appeal Reason</label>
                <p class="text-sm text-slate-900 dark:text-white mt-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  {{ selectedAppeal.reason }}
                </p>
              </div>

              <div>
                <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Action Type</label>
                <div class="mt-2">
                  <UBadge
                    :label="selectedAppeal.actionType"
                    :color="getAppealContentIconColor(selectedAppeal.actionType).replace('text-', '')"
                    variant="soft"
                  />
                </div>
              </div>
            </div>

            <div class="space-y-4">
              <div>
                <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Content</label>
                <div class="mt-2 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <div class="flex items-center space-x-3 mb-3">
                    <div
                      :class="[
                        'w-8 h-8 rounded-lg flex items-center justify-center',
                        getAppealContentBgColor(selectedAppeal.actionType)
                      ]"
                    >
                      <UIcon
                        :name="getAppealContentIcon(selectedAppeal.actionType)"
                        :class="['w-4 h-4', getAppealContentIconColor(selectedAppeal.actionType)]"
                      />
                    </div>
                    <div>
                      <p class="text-sm font-medium text-slate-900 dark:text-white">
                        {{ getAppealContentTitle(selectedAppeal) }}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div v-if="selectedAppeal.handledBy">
                <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Handled By</label>
                <div class="flex items-center space-x-3 mt-2">
                  <UAvatar
                    :src="selectedAppeal.handledBy?.image"
                    :alt="selectedAppeal.handledBy?.username"
                    size="sm"
                  />
                  <div>
                    <p class="text-sm font-medium text-slate-900 dark:text-white">
                      {{ selectedAppeal.handledBy?.username }}
                    </p>
                    <p class="text-xs text-slate-500">
                      {{ selectedAppeal.handledAt ? formatDate(selectedAppeal.handledAt) : '' }}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div v-if="selectedAppeal.status === 'pending'" class="border-t border-slate-200 dark:border-slate-700 pt-6">
            <h4 class="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              Take Action
            </h4>
            <UForm :state="appealActionForm" class="space-y-4" @submit="submitAppealAction">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <UFormField label="Decision" required>
                  <USelectMenu
                    v-model="appealActionForm.decision"
                    :options="appealDecisionOptions"
                    placeholder="Select decision..."
                  />
                </UFormField>

                <UFormField label="Priority" required>
                  <USelectMenu
                    v-model="appealActionForm.priority"
                    :options="priorityOptions"
                    placeholder="Select priority..."
                  />
                </UFormField>
              </div>

              <UFormField label="Response Message">
                <UTextarea
                  v-model="appealActionForm.responseMessage"
                  placeholder="Add a response message..."
                  :rows="3"
                />
              </UFormField>

              <div class="flex justify-end space-x-3">
                <UButton
                  variant="outline"
                  @click="showAppealModal = false"
                >
                  Cancel
                </UButton>
                <UButton
                  type="submit"
                  :loading="submittingAppealAction"
                  color="primary"
                >
                  Submit Decision
                </UButton>
              </div>
            </UForm>
          </div>
        </div>
      </template>
    </UCard>
  </UModal>
</template>
