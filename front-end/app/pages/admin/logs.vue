<template>
  <UDashboardPanel id="adminLogs" class="min-h-screen">
    <template #header>
      <UDashboardNavbar title="Nhật ký hoạt động" :ui="{ right: 'gap-3' }">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #right>
          <UButton
            variant="outline"
            :color="hasActiveFilters ? 'primary' : 'neutral'"
            class="relative"
            @click="showFilters = !showFilters"
          >
            <UIcon name="i-lucide-filter" class="size-4" />
            Bộ lọc
            <UBadge
              v-if="hasActiveFilters"
              color="primary"
              size="xs"
              class="absolute -top-1 -right-1"
            >
              {{ activeFiltersCount }}
            </UBadge>
          </UButton>

          <UButton
            variant="outline"
            :color="showStats ? 'primary' : 'neutral'"
            @click="showStats = !showStats"
          >
            <UIcon name="i-lucide-bar-chart-3" class="size-4" />
            Thống kê
          </UButton>

          <UButton
            variant="outline"
            :loading="exporting"
            @click="exportLogs"
          >
            <UIcon name="i-lucide-download" class="size-4" />
            Xuất file
          </UButton>

          <UDropdownMenu :items="bulkActions">
            <UButton color="error" variant="outline">
              <UIcon name="i-lucide-trash-2" class="size-4" />
              Xóa
            </UButton>
          </UDropdownMenu>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="space-y-8 p-6">
        <!-- Stats -->
        <div v-if="showStats && statsData" class="animate-in slide-in-from-top duration-300">
          <AdminLogStats :stats="statsData" />
        </div>
        <!-- Filters -->
        <div v-if="showFilters" class="animate-in slide-in-from-top duration-300">
          <AdminLogFilters
            v-model="query"
            @apply="handleFiltersApply"
          />
        </div>
        <!-- Timeline -->
        <div class="animate-in fade-in duration-500">
          <AdminLogTimeline
            :logs="data"
            :stats="statsData"
            :loading="pending"
            @refresh="handleRefresh"
            @toggle-filters="showFilters = !showFilters"
            @delete-log="handleDeleteLog"
            @view-details="handleViewDetails"
          />
        </div>

        <!-- Pagination -->
        <div v-if="pagination && pagination.totalPages > 1" class="flex justify-center">
          <UPagination
            :page="pagination.page"
            :total="pagination.total"
            :page-count="pagination.limit"
            class="shadow-lg"
            @update:page="handlePageChange"
          />
        </div>
      </div>
    </template>
  </UDashboardPanel>
  <!-- Log Details Modal -->
  <UModal v-model:open="showDetailsModal" :class="{ width: 'sm:max-w-2xl' }">
    <template #header>
      <div class="flex justify-between items-center">
        <div class="flex items-center gap-3">
          <div
            class="p-2 rounded-lg"
            :class="selectedLog ? getActionBgClass(selectedLog.action) : ''"
          >
            <UIcon :name="selectedLog ? getActionIcon(selectedLog.action) : ''" class="size-5 text-white" />
          </div>
          <div>
            <h3 class="text-xl font-bold">
              Chi tiết nhật ký
            </h3>
            <p class="text-sm text-gray-500">
              {{ selectedLog ? getActionText(selectedLog.action) : '' }}
            </p>
          </div>
        </div>
        <UButton variant="ghost" size="sm" @click="showDetailsModal = false">
          <UIcon name="i-lucide-x" class="size-4" />
        </UButton>
      </div>
    </template>
    <template #content>
      <UCard v-if="selectedLog" class="overflow-hidden">
        <div class="space-y-6">
          <!-- Basic Info Grid -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div v-if="selectedLog.novelId" class="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <label class="text-sm font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-2">
                <UIcon name="i-lucide-book-open" class="size-4" />
                Truyện
              </label>
              <p class="mt-2 font-medium text-gray-900 dark:text-white">
                {{ selectedLog.novelId.title }}
              </p>
            </div>

            <div v-if="selectedLog.chapterId" class="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <label class="text-sm font-semibold text-purple-600 dark:text-purple-400 flex items-center gap-2">
                <UIcon name="i-lucide-file-text" class="size-4" />
                Chương
              </label>
              <p class="mt-2 font-medium text-gray-900 dark:text-white">
                {{ selectedLog.chapterId.title }}
              </p>
            </div>

            <div v-if="selectedLog.moderator" class="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <label class="text-sm font-semibold text-green-600 dark:text-green-400 flex items-center gap-2">
                <UIcon name="i-lucide-user-check" class="size-4" />
                Người thực hiện
              </label>
              <p class="mt-2 font-medium text-gray-900 dark:text-white">
                {{ selectedLog.moderator.username }}
              </p>
              <p class="text-sm text-gray-500">
                {{ selectedLog.moderator.email }}
              </p>
            </div>

            <div class="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <label class="text-sm font-semibold text-gray-600 dark:text-gray-400 flex items-center gap-2">
                <UIcon name="i-lucide-clock" class="size-4" />
                Thời gian
              </label>
              <p class="mt-2 font-medium text-gray-900 dark:text-white">
                {{ formatDate(selectedLog.createdAt) }}
              </p>
              <p class="text-sm text-gray-500">
                {{ getRelativeTime(selectedLog.createdAt) }}
              </p>
            </div>
          </div>

          <!-- Note -->
          <div v-if="selectedLog.note" class="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border-l-4 border-yellow-400">
            <label class="text-sm font-semibold text-yellow-600 dark:text-yellow-400 flex items-center gap-2 mb-2">
              <UIcon name="i-lucide-message-square" class="size-4" />
              Ghi chú
            </label>
            <p class="text-gray-700 dark:text-gray-300 leading-relaxed">
              {{ selectedLog.note }}
            </p>
          </div>

          <!-- Details -->
          <div v-if="selectedLog.details" class="space-y-2">
            <label class="text-sm font-semibold text-gray-600 dark:text-gray-400 flex items-center gap-2">
              <UIcon name="i-lucide-code" class="size-4" />
              Chi tiết kỹ thuật
            </label>
            <div class="p-4 bg-gray-900 dark:bg-gray-800 rounded-lg border overflow-hidden">
              <pre class="text-sm text-green-400 font-mono overflow-auto max-h-100 leading-relaxed">{{ JSON.stringify(selectedLog.details, null, 2) }}</pre>
            </div>
          </div>
        </div>
      </UCard>
    </template>
    <template #footer>
      <div class="flex justify-end gap-2">
        <UButton variant="outline" @click="showDetailsModal = false">
          Đóng
        </UButton>
        <UButton v-if="selectedLog" color="error" @click="handleDeleteLog(selectedLog._id); showDetailsModal = false">
          <UIcon name="i-lucide-trash-2" class="size-4" />
          Xóa nhật ký
        </UButton>
      </div>
    </template>
  </UModal>

  <!-- Delete Confirmation Modal -->
  <UModal v-model:open="showDeleteModal">
    <template #header>
      <div class="flex items-center gap-3">
        <div class="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
          <UIcon name="i-lucide-alert-triangle" class="size-5 text-red-600" />
        </div>
        <h3 class="text-lg font-semibold">
          Xác nhận xóa
        </h3>
      </div>
    </template>
    <template #content>
      <UCard>
        <div class="space-y-4">
          <p class="text-gray-700 dark:text-gray-300">
            Bạn có chắc chắn muốn xóa nhật ký này không?
          </p>
          <div class="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
            <p class="text-sm text-red-700 dark:text-red-300 font-medium">
              ⚠️ Hành động này không thể hoàn tác và sẽ xóa vĩnh viễn dữ liệu nhật ký.
            </p>
          </div>
        </div>
      </UCard>
    </template>
    <template #footer>
      <div class="flex justify-end gap-2">
        <UButton variant="outline" @click="showDeleteModal = false">
          Hủy
        </UButton>
        <UButton color="error" :loading="deleting" @click="confirmDelete">
          <UIcon name="i-lucide-trash-2" class="size-4" />
          Xóa nhật ký
        </UButton>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { format, formatDistanceToNow } from 'date-fns'
import { vi } from 'date-fns/locale'
import type { LogsQuery, ModerationLog, ModerationAction } from '~/types/log'
import { useLogs } from '~/composables/useLogs'
import { useLogStore } from '~/stores/log.store'
import { definePageMeta } from '#imports'

// Meta
definePageMeta({
  middleware: 'auth',
  layout: 'admin'
})

// Composables
const {
  fetchAllLogs,
  fetchLogStats,
  getActionText,
  getActionIcon,
  getActionColor,
  deleteLogById
} = useLogs()
const logsStore = useLogStore()
const toast = useToast()

// State
const showFilters = ref(false)
const showStats = ref(true)
const showDetailsModal = ref(false)
const showDeleteModal = ref(false)
const selectedLog = ref<ModerationLog | null>(null)
const logToDelete = ref<string | null>(null)
const exporting = ref(false)
const deleting = ref(false)

// Query
const query = ref<LogsQuery>({
  page: 1,
  limit: { label: '20', value: 10 }
})

// Fetch data
const { data, pagination, pending, error, refresh } = await fetchAllLogs()
const { data: statsData, refresh: refreshStats } = await fetchLogStats()

// Computed
const hasActiveFilters = computed(() => {
  const { page, limit, ...filters } = query.value
  return Object.values(filters).some(value => value !== undefined && value !== null && value !== '')
})

const activeFiltersCount = computed(() => {
  const { page, limit, ...filters } = query.value
  return Object.values(filters).filter(value => value !== undefined && value !== null && value !== '').length
})

const bulkActions = computed(() => [
  [{
    label: 'Xóa tất cả nhật ký',
    icon: 'i-lucide-trash-2',
    click: handleDeleteAll,
    class: 'text-red-600'
  }]
])

// Methods
const handleFiltersApply = (filters: LogsQuery) => {
  query.value = { ...filters, page: 1 }
}

const handlePageChange = (page: number) => {
  query.value.page = page
}

const handleRefresh = async () => {
  await Promise.all([refresh(), refreshStats()])
  toast.add({
    title: 'Đã làm mới',
    description: 'Dữ liệu nhật ký đã được cập nhật',
    color: 'success'
  })
}

const handleDeleteLog = (logId: string) => {
  logToDelete.value = logId
  showDeleteModal.value = true
}

const handleViewDetails = (log: ModerationLog) => {
  selectedLog.value = log
  showDetailsModal.value = true
}

const confirmDelete = async () => {
  if (!logToDelete.value) return

  deleting.value = true
  try {
    await deleteLogById(logToDelete.value)
    await Promise.all([refresh(), refreshStats()])

    toast.add({
      title: 'Đã xóa nhật ký',
      description: 'Nhật ký đã được xóa thành công',
      color: 'success'
    })

    showDeleteModal.value = false
    logToDelete.value = null
  } catch {
    toast.add({
      title: 'Lỗi',
      description: 'Không thể xóa nhật ký. Vui lòng thử lại.',
      color: 'error'
    })
  } finally {
    deleting.value = false
  }
}

const handleDeleteAll = async () => {
  const confirmed = confirm('Bạn có chắc chắn muốn xóa TẤT CẢ nhật ký không? Hành động này không thể hoàn tác.')
  if (!confirmed) return

  try {
    await logsStore.deleteAllLogs()
    await Promise.all([refresh(), refreshStats()])

    toast.add({
      title: 'Đã xóa tất cả nhật ký',
      description: 'Tất cả nhật ký đã được xóa thành công',
      color: 'success'
    })
  } catch {
    toast.add({
      title: 'Lỗi',
      description: 'Không thể xóa nhật ký. Vui lòng thử lại.',
      color: 'error'
    })
  }
}

const exportLogs = async () => {
  exporting.value = true
  try {
    // Implementation for exporting logs
    toast.add({
      title: 'Đang xuất file',
      description: 'File sẽ được tải xuống trong giây lát',
      color: 'info'
    })
  } catch {
    toast.add({
      title: 'Lỗi xuất file',
      description: 'Không thể xuất file. Vui lòng thử lại.',
      color: 'error'
    })
  } finally {
    exporting.value = false
  }
}

// Helper functions
const getActionBgClass = (action: ModerationAction) => {
  const color = getActionColor(action)
  const bgClasses: Record<string, string> = {
    green: 'bg-green-100 dark:bg-green-900',
    red: 'bg-red-100 dark:bg-red-900',
    orange: 'bg-orange-100 dark:bg-orange-900',
    blue: 'bg-blue-100 dark:bg-blue-900',
    yellow: 'bg-yellow-100 dark:bg-yellow-900',
    gray: 'bg-gray-100 dark:bg-gray-800'
  }
  return bgClasses[color] || bgClasses.gray
}

const formatDate = (dateString: string) => {
  return format(new Date(dateString), 'dd/MM/yyyy HH:mm:ss', { locale: vi })
}

const getRelativeTime = (dateString: string) => {
  return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: vi })
}

// Watch for query changes
watch(query, async () => {
  await refresh()
}, { deep: true })

// Handle errors
watch(error, (newError) => {
  if (newError) {
    toast.add({
      title: 'Lỗi tải dữ liệu',
      description: 'Không thể tải nhật ký. Vui lòng thử lại.',
      color: 'error'
    })
  }
})
</script>
