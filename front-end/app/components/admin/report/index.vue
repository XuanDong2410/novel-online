<script setup lang="ts">
import type { TableColumn, TableRow } from '@nuxt/ui'
import type { Column } from '@tanstack/vue-table'
import { upperFirst } from 'scule'
import { getPaginationRowModel } from '@tanstack/table-core'
import { useDebounceFn } from '@vueuse/core'
import type { Report, ReportsQuery } from '~/types/report'
import type { Rate } from '~/types/rate'
import type { Chapter } from '~/types/chapter'
import type { Novel } from '~/types/novel'
import type { statusPublish } from '~/types'
// import { useReportsStore } from '~/stores/report.store'
// import { h } from 'vue'
const { getStatusLabel, getStatusColor } = useStatus()
const UButton = resolveComponent('UButton')
const UBadge = resolveComponent('UBadge')
const UDropdownMenu = resolveComponent('UDropdownMenu')
const UAvatar = resolveComponent('UAvatar')
const UIcon = resolveComponent('UIcon')
const reportsStore = useReportStore()
const toast = useToast()
const table = useTemplateRef('table')

const props = defineProps<{
  role: 'user' | 'moderator' | 'admin' | 'system' | undefined
  data?: Report[]
  loading?: boolean
  error: string | null
}>()
console.log('Report Management Component Props:', props)
const showReportModal = ref<boolean>(false)
const showBulkReportActions = ref<boolean>(false)
const submittingBulkReportAction = ref<boolean>(false)
const submittingReportAction = ref<boolean>(false)

interface BulkReportForm {
  action: { label: string, value: string }
  severity: { label: string, value: string }
  note: string
}

const selectedReport = ref<Report | undefined>(undefined)
const rowSelection = ref({})
const bulkReportForm = ref<BulkReportForm>({
  action: { label: '', value: '' },
  severity: { label: '', value: '' },
  note: ''
})

interface ReportActionForm {
  action: string
  severity: string
  note: string
}

const reportActionForm = ref<ReportActionForm>({
  action: '',
  severity: '',
  note: ''
})

const columnFilters = ref([{ id: 'reason', value: '' }])
const columnVisibility = ref({})
const statusFilter = ref({ value: 'all', label: 'All Status' })
const sortFilter = ref({ value: 'latest', label: 'Latest' })
const typeFilter = ref({ value: 'all', label: 'All Types' })
const isRefetching = ref(false)
const lastQuery = ref<ReportsQuery | null>(null)

const columns: TableColumn<Report>[] = [
  {
    accessorKey: 'reporter',
    header: ({ column }) => getHeader(column, 'Reporter', 'left'),
    cell: ({ row }) => {
      return h('div', { class: 'flex items-center space-x-3' }, [
        h(UAvatar, {
          src: row.original.reporter?.image,
          alt: row.original.reporter?.username,
          size: 'sm'
        }),
        h('div', { class: 'min-w-0' }, [
          h('p', {
            class: 'text-sm font-medium text-slate-900 dark:text-white truncate'
          }, row.original.reporter?.username),
          h('p', {
            class: 'text-xs text-slate-500 truncate'
          }, row.original.reporter?.email)
        ])
      ])
    }
  },
  {
    accessorKey: 'target',
    header: 'Target Content',
    cell: ({ row }) => {
      return h('div', { class: 'flex items-center space-x-3' }, [
        h('div', {
          class: [
            'w-8 h-8 rounded-lg flex items-center justify-center',
            getTargetTypeBgColor(row.original.targetType as unknown as TargetType)
          ]
        }, [
          h(UIcon, {
            name: getTargetTypeIcon(row.original.targetType as unknown as TargetType),
            class: ['w-4 h-4', getTargetTypeIconColor(row.original.targetType as unknown as TargetType)]
          })
        ]),
        h('div', { class: 'min-w-0' }, [
          h('p', {
            class: 'text-sm font-medium text-slate-900 dark:text-white truncate'
          }, getTargetTitle(row.original)),
          h('p', {
            class: 'text-xs text-slate-500 truncate'
          }, row.original.targetType as unknown as TargetType)
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
          label: getStatusLabel(row.original.status as statusPublish),
          color: getStatusColor(row.original.status as statusPublish),
          variant: 'soft',
          size: 'sm'
        })
      ])
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
      return h('div', { class: 'flex items-center justify-end space-x-1' }, [
        h(UButton, {
          icon: 'i-heroicons-eye',
          size: 'xs',
          variant: 'ghost',
          class: 'hover:bg-blue-50 dark:hover:bg-blue-900/20',
          onClick: () => reviewReport(row.original)
        }),
        row.original.status === 'pending'
          ? h(UButton, {
              icon: 'i-heroicons-check',
              size: 'xs',
              variant: 'ghost',
              class: 'hover:bg-green-50 dark:hover:bg-green-900/20',
              onClick: () => approveReport(row.original)
            })
          : null,
        row.original.status === 'pending'
          ? h(UButton, {
              icon: 'i-heroicons-x-mark',
              size: 'xs',
              variant: 'ghost',
              class: 'hover:bg-red-50 dark:hover:bg-red-900/20',
              onClick: () => rejectReport(row.original)
            })
          : null,
        h(UDropdownMenu, {
          items: getReportActions(row.original)
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

function getHeader(column: Column<Report>, label: string, position: 'left' | 'right') {
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

const debouncedFetchReports = useDebounceFn(async () => {
  if (isRefetching.value) return
  isRefetching.value = true
  try {
    const query: ReportsQuery = {
      page: pagination.value.pageIndex + 1,
      limit: { label: `${pagination.value.pageSize}`, value: pagination.value.pageSize },
      sort: sortFilter.value.value as 'createdAt' | 'createdAt_asc' | 'priority'
    }
    if (statusFilter.value.value !== 'all') {
      query.status = statusFilter.value.value as 'pending' | 'reviewed' | 'rejected' | 'all'
    }
    if (typeFilter.value.value !== 'all') {
      query.type = typeFilter.value.value as 'all' | 'Rate' | 'Novel' | 'Chapter' | undefined
    }
    if (columnFilters.value[0]?.value) {
      query.search = columnFilters.value[0].value
    }
    if (JSON.stringify(query) === JSON.stringify(lastQuery.value)) {
      console.log('Skipping fetch; query unchanged:', query)
      return
    }
    console.log('Fetching reports with query:', query)
    await reportsStore.fetchAllReports(query)
    lastQuery.value = { ...query }
  } catch (error) {
    console.error('Error refetching reports:', error)
    toast.add({
      title: 'Error',
      description: 'Failed to load reports.',
      color: 'error'
    })
  } finally {
    isRefetching.value = false
  }
}, 1500)

const pagination = ref({
  pageIndex: 0,
  pageSize: reportsStore.pagination?.limit || 10
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
        statusColumn.setFilterValue(statusFilter.value.value === 'all' ? undefined : statusFilter.value.value)
      }
    }
    await debouncedFetchReports()
  },
  { immediate: true }
)

const reportStatusOptions = [
  { label: 'All Status', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Reviewed', value: 'reviewed' },
  { label: 'Rejected', value: 'rejected' }
]

const reportTypeOptions = [
  { label: 'All Types', value: 'all' },
  { label: 'Novel', value: 'Novel' },
  { label: 'Chapter', value: 'Chapter' },
  { label: 'Rate', value: 'Rate' }
]

const reportSortOptions = [
  { label: 'Newest First', value: 'createdAt' },
  { label: 'Oldest First', value: 'createdAt_asc' },
  { label: 'Priority', value: 'priority' }
]

const reportActionOptions = [
  { label: 'Approve Report', value: 'approve' },
  { label: 'Reject Report', value: 'reject' },
  { label: 'Flag Content', value: 'flag' },
  { label: 'Hide Content', value: 'hide' },
  { label: 'Warning', value: 'warning' }
]

const severityOptions = [
  { label: 'Low', value: 'low' },
  { label: 'Medium', value: 'medium' },
  { label: 'High', value: 'high' },
  { label: 'Critical', value: 'critical' }
]

const bulkReportActionOptions = [
  { label: 'Approve All', value: 'approve_all' },
  { label: 'Reject All', value: 'reject_all' },
  { label: 'Flag All', value: 'flag_all' },
  { label: 'Hide All Content', value: 'hide_all' }
]
// Define TargetType as a union of string literals
type TargetType = 'Novel' | 'Chapter' | 'Rate'
const getTargetTypeIcon = (type: string): string => {
  const iconMap: Record<TargetType, string> = {
    Novel: 'i-heroicons-book-open',
    Chapter: 'i-heroicons-document-text',
    Rate: 'i-heroicons-star'
  }
  return iconMap[type as TargetType] || 'i-heroicons-document'
}

const getTargetTypeIconColor = (type: string): string => {
  const colorMap: Record<string, string> = {
    Novel: 'text-blue-600',
    Chapter: 'text-green-600',
    Rate: 'text-yellow-600'
  }
  return colorMap[type] || 'text-gray-600'
}

const getStatusDotColor = (status: string): string => {
  const colorMap: Record<string, string> = {
    pending: 'bg-yellow-400',
    reviewed: 'bg-green-400',
    rejected: 'bg-red-400',
    approved: 'bg-green-400',
    deleted: 'bg-gray-400',
    flagged: 'bg-red-400',
    processing: 'bg-blue-400'
  }
  return colorMap[status] || 'bg-gray-400'
}

const getTargetTitle = (report: Report): string => {
  // Since Report does not have a 'target' property, use targetType and targetId
  return `${report.targetType} (${report.targetId})`
}

const getTargetContent = (_report: Report): string => {
  // No content/description available on Report, so fallback to a generic message
  return 'Content not available'
}
const getTargetTypeBgColor = (targetType: TargetType) => {
  switch (targetType) {
    case 'Novel':
      return 'bg-blue-100 dark:bg-blue-900/30'
    case 'Chapter':
      return 'bg-green-100 dark:bg-green-900/30'
    case 'Rate':
      return 'bg-yellow-100 dark:bg-yellow-900/30'
    default:
      return 'bg-slate-100 dark:bg-slate-800'
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

const resetReportFilters = (): void => {
  columnFilters.value = [{ id: 'reason', value: '' }]
  statusFilter.value = { value: 'all', label: 'All Status' }
  typeFilter.value = { value: 'all', label: 'All Types' }
  sortFilter.value = { value: 'createdAt', label: 'Newest First' }
  pagination.value.pageIndex = 0
}

const reviewReport = (report: Report): void => {
  selectedReport.value = report
  showReportModal.value = true
}

const approveReport = async (report: Report): Promise<void> => {
  try {
    await new Promise(resolve => setTimeout(resolve, 1000))
    report.status = 'reviewed'
    report.handledAt = new Date()
    toast.add({
      title: 'Success',
      description: 'Report approved successfully.',
      color: 'success'
    })
  } catch (error) {
    console.error('Failed to approve report:', error)
    toast.add({
      title: 'Error',
      description: 'Failed to approve report.',
      color: 'error'
    })
  }
}

const rejectReport = async (report: Report): Promise<void> => {
  try {
    await new Promise(resolve => setTimeout(resolve, 1000))
    report.status = 'rejected'
    report.handledAt = new Date()
    toast.add({
      title: 'Success',
      description: 'Report rejected successfully.',
      color: 'success'
    })
  } catch (error) {
    console.error('Failed to reject report:', error)
    toast.add({
      title: 'Error',
      description: 'Failed to reject report.',
      color: 'error'
    })
  }
}

const getReportActions = (report: Report) => {
  const actions = [[
    {
      label: 'View Details',
      icon: 'i-heroicons-eye',
      click: () => reviewReport(report)
    }
  ]]
  if (report.status === 'pending') {
    actions.push([
      {
        label: 'Approve',
        icon: 'i-heroicons-check',
        click: () => approveReport(report)
      },
      {
        label: 'Reject',
        icon: 'i-heroicons-x-mark',
        click: () => rejectReport(report)
      }
    ])
  }
  return actions
}

const submitBulkReportAction = async (): Promise<void> => {
  submittingBulkReportAction.value = true
  try {
    await new Promise(resolve => setTimeout(resolve, 2000))
    const selectedRows = table.value?.tableApi?.getFilteredSelectedRowModel().rows || []
    selectedRows.forEach(({ original }) => {
      original.status = 'reviewed'
      original.handledAt = new Date()
      original.note = bulkReportForm.value.note
    })
    toast.add({
      title: 'Success',
      description: `Bulk action applied to ${selectedRows.length} reports`,
      color: 'success'
    })
    showBulkReportActions.value = false
    rowSelection.value = {}
    bulkReportForm.value = {
      action: { label: '', value: '' },
      severity: { label: '', value: '' },
      note: ''
    }
  } catch {
    toast.add({
      title: 'Error',
      description: 'Failed to apply bulk action',
      color: 'error'
    })
  } finally {
    submittingBulkReportAction.value = false
  }
}

const submitReportAction = async (): Promise<void> => {
  submittingReportAction.value = true
  try {
    await new Promise(resolve => setTimeout(resolve, 2000))
    if (selectedReport.value) {
      selectedReport.value.status = 'reviewed'
      selectedReport.value.handledAt = new Date()
      selectedReport.value.note = reportActionForm.value.note
      toast.add({
        title: 'Success',
        description: 'Report action submitted successfully.',
        color: 'success'
      })
    }
    showReportModal.value = false
    reportActionForm.value = {
      action: '',
      severity: '',
      note: ''
    }
  } catch (error) {
    console.error('Failed to submit report action:', error)
    toast.add({
      title: 'Error',
      description: 'Failed to submit report action.',
      color: 'error'
    })
  } finally {
    submittingReportAction.value = false
  }
}

const exportAllReports = (): void => {
  toast.add({
    title: 'Export Started',
    description: 'Reports export is being prepared',
    color: 'info'
  })
}
</script>

<template>
  <UCard>
    <div class="p-2 bg-gradient-to-r from-slate-50 to-red-50 dark:from-slate-800 dark:to-slate-700">
      <div class="flex flex-col lg:flex-row gap-4">
        <div class="flex-1">
          <UInput
            :model-value="(table?.tableApi?.getColumn('reason')?.getFilterValue() as string)"
            placeholder="Search reports by content, reporter, or target..."
            icon="i-heroicons-magnifying-glass"
            size="lg"
            class="w-full"
            @update:model-value="table?.tableApi?.getColumn('reason')?.setFilterValue($event)"
          />
        </div>
        <div class="flex flex-col sm:flex-row gap-3">
          <USelectMenu
            v-model="statusFilter"
            :items="reportStatusOptions"
            placeholder="Status"
            value-attribute="value"
            label-attribute="label"
            class="min-w-[140px]"
          />
          <USelectMenu
            v-model="typeFilter"
            :items="reportTypeOptions"
            placeholder="Type"
            value-attribute="value"
            label-attribute="label"
            class="min-w-[140px]"
          />
          <USelectMenu
            v-model="sortFilter"
            :items="reportSortOptions"
            placeholder="Sort by"
            value-attribute="value"
            label-attribute="label"
            class="min-w-[140px]"
          />
          <UButton
            icon="i-heroicons-x-mark"
            variant="outline"
            size="sm"
            class="shrink-0"
            @click="resetReportFilters"
          >
            Clear
          </UButton>
        </div>
      </div>
    </div>
  </UCard>

  <UCard>
    <template #header>
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 class="text-lg font-semibold text-slate-900 dark:text-white">
            Reports Management
          </h3>
          <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Review and manage user reports across the platform
          </p>
        </div>
        <div class="flex items-center space-x-3">
          <UButton
            icon="i-heroicons-document-arrow-down"
            variant="outline"
            size="sm"
            @click="exportAllReports"
          >
            Export
          </UButton>
          <UButton
            icon="i-heroicons-squares-plus"
            variant="outline"
            size="sm"
            @click="showBulkReportActions = true"
          >
            Bulk Actions
          </UButton>
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
    </template>

    <div class="overflow-x-auto">
      <UTable
        ref="table"
        v-model:column-pinning="columnPinning"
        v-model:column-filters="columnFilters"
        v-model:column-visibility="columnVisibility"
        v-model:row-selection="rowSelection"
        v-model:pagination="pagination"
        :pagination-options="{ getPaginationRowModel: getPaginationRowModel() }"
        class="w-full table-fixed border-separate border-spacing-0"
        :data="props.data || reportsStore.reports"
        :columns="columns"
        :loading="props.loading"
        :ui="{
          thead: '[&>tr]:bg-(--ui-bg-elevated)/50 [&>tr]:after:content-none',
          tbody: '[&>tr]:last:[&>td]:border-b-0',
          th: 'py-1 first:rounded-l-[calc(var(--ui-radius)*2)] last:rounded-r-[calc(var(--ui-radius)*2)] border-y border-(--ui-border) first:border-l last:border-r',
          td: 'border-b border-(--ui-border)'
        }"
      />
    </div>

    <template #footer>
      <div class="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-700">
        <div class="text-sm text-slate-500 dark:text-slate-400">
          {{ table?.tableApi?.getFilteredSelectedRowModel().rows.length || 0 }} of
          {{ table?.tableApi?.getFilteredRowModel().rows.length || 0 }} row(s) selected.
        </div>
        <UPagination
          :default-page="pagination.pageIndex + 1"
          :items-per-page="pagination.pageSize"
          :total="reportsStore.pagination?.total || 0"
          size="sm"
          @update:page="(p) => pagination.pageIndex = p - 1"
        />
      </div>
    </template>
  </UCard>

  <UModal v-model:open="showBulkReportActions" :class="{ width: 'max-w-3xl' }">
    <template #header>
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-semibold text-slate-900 dark:text-white">
          Bulk Report Actions
        </h3>
        <UButton
          icon="i-heroicons-x-mark"
          variant="ghost"
          size="sm"
          @click="showBulkReportActions = false"
        />
      </div>
    </template>
    <template #body>
      <UCard>
        <div class="space-y-6">
          <div class="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <p class="text-sm text-blue-800 dark:text-blue-200">
              {{ table?.tableApi?.getFilteredSelectedRowModel().rows.length || 0 }} reports selected for bulk action
            </p>
          </div>
          <UForm :state="bulkReportForm" class="space-y-4" @submit="submitBulkReportAction">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <UFormField label="Action" required>
                <USelectMenu
                  v-model="bulkReportForm.action"
                  :items="bulkReportActionOptions"
                  placeholder="Select action..."
                />
              </UFormField>
              <UFormField label="Severity" required>
                <USelectMenu
                  v-model="bulkReportForm.severity"
                  :items="severityOptions"
                  placeholder="Select severity..."
                />
              </UFormField>
            </div>
            <UFormField label="Bulk Note">
              <UTextarea
                v-model="bulkReportForm.note"
                placeholder="Add a note for all selected reports..."
                class="w-full"
                :rows="3"
              />
            </UFormField>
            <div class="flex justify-end space-x-3">
              <UButton
                variant="outline"
                @click="showBulkReportActions = false"
              >
                Cancel
              </UButton>
              <UButton
                type="submit"
                :loading="submittingBulkReportAction"
                color="primary"
              >
                Apply to {{ table?.tableApi?.getFilteredSelectedRowModel().rows.length || 0 }} Reports
              </UButton>
            </div>
          </UForm>
        </div>
      </UCard>
    </template>
  </UModal>

  <UModal v-model:open="showReportModal" :class="{ width: 'max-w-4xl' }">
    <template #header>
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-semibold text-slate-900 dark:text-white">
          Review Report
        </h3>
        <UButton
          size="sm"
          variant="ghost"
          icon="i-heroicons-x-mark"
          @click="showReportModal = false"
        />
      </div>
    </template>
    <template #body>
      <UCard>
        <div v-if="selectedReport" class="space-y-6">
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div class="space-y-4">
              <div>
                <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Reporter</label>
                <div class="flex items-center space-x-3 mt-2">
                  <UAvatar
                    :src="selectedReport.reporter?.image"
                    :alt="selectedReport.reporter?.username"
                    size="sm"
                  />
                  <div>
                    <p class="text-sm font-medium text-slate-900 dark:text-white">
                      {{ selectedReport.reporter?.username }}
                    </p>
                    <p class="text-xs text-slate-500">
                      {{ selectedReport.reporter?.email }}
                    </p>
                  </div>
                </div>
              </div>
              <div>
                <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Report Reason</label>
                <p class="text-sm text-slate-900 dark:text-white mt-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  {{ selectedReport.reason }}
                </p>
              </div>
              <div>
                <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Status</label>
                <div class="mt-2">
                  <UBadge
                    :label="getStatusLabel(selectedReport.status as statusPublish)"
                    :color="getStatusColor(selectedReport.status as statusPublish)"
                    variant="soft"
                  />
                </div>
              </div>
            </div>
            <div class="space-y-4">
              <div>
                <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Reported Content</label>
                <div class="mt-2 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <div class="flex items-center space-x-3 mb-3">
                    <div
                      :class="[
                        'w-8 h-8 rounded-lg flex items-center justify-center',
                        getTargetTypeBgColor(selectedReport.targetType)
                      ]"
                    >
                      <UIcon
                        :name="getTargetTypeIcon(selectedReport.targetType)"
                        :class="['w-4 h-4', getTargetTypeIconColor(selectedReport.targetType)]"
                      />
                    </div>
                    <div>
                      <p class="text-sm font-medium text-slate-900 dark:text-white">
                        {{ getTargetTitle(selectedReport) }}
                      </p>
                      <p class="text-xs text-slate-500">
                        {{ selectedReport.targetType }}
                      </p>
                    </div>
                  </div>
                  <p class="text-sm text-slate-700 dark:text-slate-300 line-clamp-4">
                    {{ getTargetContent(selectedReport) }}
                  </p>
                </div>
              </div>
              <div v-if="selectedReport.moderator">
                <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Handled By</label>
                <div class="flex items-center space-x-3 mt-2">
                  <UAvatar
                    :src="selectedReport.moderator?.image"
                    :alt="selectedReport.moderator?.username"
                    size="sm"
                  />
                  <div>
                    <p class="text-sm font-medium text-slate-900 dark:text-white">
                      {{ selectedReport.moderator?.username }}
                    </p>
                    <p class="text-xs text-slate-500">
                      {{ formatDate(selectedReport.handledAt) }}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div v-if="selectedReport.status === 'pending'" class="border-t border-slate-200 dark:border-slate-700 pt-6">
            <h4 class="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              Take Action
            </h4>
            <UForm :state="reportActionForm" class="space-y-4" @submit="submitReportAction">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <UFormGroup label="Action" required>
                  <USelectMenu
                    v-model="reportActionForm.action"
                    :options="reportActionOptions"
                    placeholder="Select action..."
                  />
                </UFormGroup>
                <UFormGroup label="Severity" required>
                  <USelectMenu
                    v-model="reportActionForm.severity"
                    :options="severityOptions"
                    placeholder="Select severity..."
                  />
                </UFormGroup>
              </div>
              <UFormGroup label="Note">
                <UTextarea
                  v-model="reportActionForm.note"
                  placeholder="Add a note about this action..."
                  :rows="3"
                />
              </UFormGroup>
              <div class="flex justify-end space-x-3">
                <UButton
                  variant="outline"
                  @click="showReportModal = false"
                >
                  Cancel
                </UButton>
                <UButton
                  type="submit"
                  :loading="submittingReportAction"
                  color="error"
                >
                  Submit Action
                </UButton>
              </div>
            </UForm>
          </div>
        </div>
      </UCard>
    </template>
  </UModal>
</template>
