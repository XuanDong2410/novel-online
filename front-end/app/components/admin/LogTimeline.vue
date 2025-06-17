<template>
  <div class="space-y-6">
    <!-- Stats Cards -->
    <div v-if="stats" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <UCard class="hover:shadow-lg transition-shadow duration-200">
        <div class="flex items-center gap-4">
          <div class="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
            <UIcon name="i-lucide-activity" class="size-6 text-white" />
          </div>
          <div>
            <p class="text-sm font-medium text-gray-500 dark:text-gray-400">
              Tổng nhật ký
            </p>
            <p class="text-3xl font-bold text-gray-900 dark:text-white">
              {{ formatNumber(stats.totalLogs) }}
            </p>
          </div>
        </div>
      </UCard>

      <UCard class="hover:shadow-lg transition-shadow duration-200">
        <div class="flex items-center gap-4">
          <div class="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg">
            <UIcon name="i-lucide-calendar-days" class="size-6 text-white" />
          </div>
          <div>
            <p class="text-sm font-medium text-gray-500 dark:text-gray-400">
              Hôm nay
            </p>
            <p class="text-3xl font-bold text-gray-900 dark:text-white">
              {{ formatNumber(stats.todayLogs) }}
            </p>
          </div>
        </div>
      </UCard>

      <UCard class="hover:shadow-lg transition-shadow duration-200">
        <div class="flex items-center gap-4">
          <div class="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg">
            <UIcon name="i-lucide-bot" class="size-6 text-white" />
          </div>
          <div>
            <p class="text-sm font-medium text-gray-500 dark:text-gray-400">
              Hệ thống
            </p>
            <p class="text-3xl font-bold text-gray-900 dark:text-white">
              {{ formatNumber(stats.systemActions) }}
            </p>
          </div>
        </div>
      </UCard>

      <UCard class="hover:shadow-lg transition-shadow duration-200">
        <div class="flex items-center gap-4">
          <div class="p-3 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg">
            <UIcon name="i-lucide-user-check" class="size-6 text-white" />
          </div>
          <div>
            <p class="text-sm font-medium text-gray-500 dark:text-gray-400">
              Thủ công
            </p>
            <p class="text-3xl font-bold text-gray-900 dark:text-white">
              {{ formatNumber(stats.manualActions) }}
            </p>
          </div>
        </div>
      </UCard>
    </div>

    <!-- Timeline Header -->
    <div class="flex justify-between items-center">
      <div>
        <h3 class="text-2xl font-bold text-gray-900 dark:text-white">
          Nhật ký hoạt động
        </h3>
        <p class="text-gray-500 dark:text-gray-400 mt-1">
          Theo dõi tất cả hoạt động kiểm duyệt
        </p>
      </div>
      <div class="flex gap-3">
        <UButton
          variant="outline"
          size="sm"
          :loading="loading"
          class="hover:bg-gray-50 dark:hover:bg-gray-800"
          @click="$emit('refresh')"
        >
          <UIcon name="i-lucide-refresh-cw" class="size-4" />
          Làm mới
        </UButton>
        <UButton
          variant="outline"
          size="sm"
          class="hover:bg-gray-50 dark:hover:bg-gray-800"
          @click="$emit('toggle-filters')"
        >
          <UIcon name="i-lucide-filter" class="size-4" />
          Bộ lọc
        </UButton>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="space-y-4">
      <div v-for="i in 5" :key="i" class="animate-pulse">
        <div class="flex gap-4">
          <div class="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full" />
          <div class="flex-1 space-y-2">
            <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
            <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
            <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <UCard v-else-if="!logs || logs.length === 0" class="text-center py-16">
      <div class="flex flex-col items-center gap-4">
        <div class="p-4 bg-gray-100 dark:bg-gray-800 rounded-full">
          <UIcon name="i-lucide-file-text" class="size-12 text-gray-400" />
        </div>
        <div>
          <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Không có nhật ký
          </h3>
          <p class="text-gray-500 dark:text-gray-400">
            Chưa có hoạt động nào được ghi lại trong hệ thống.
          </p>
        </div>
      </div>
    </UCard>

    <!-- Custom Timeline -->
    <div v-else class="relative">
      <!-- Timeline Line -->
      <div class="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-200 via-purple-200 to-pink-200 dark:from-blue-800 dark:via-purple-800 dark:to-pink-800" />

      <!-- Timeline Items -->
      <div class="space-y-6">
        <div
          v-for="(log, index) in logs"
          :key="log._id"
          class="relative flex gap-6 group"
          :class="{ 'animate-fade-in': index < 3 }"
        >
          <!-- Timeline Dot -->
          <div class="relative z-10 flex-shrink-0">
            <div
              class="w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 group-hover:scale-110"
              :class="getActionGradientClass(log.action)"
            >
              <UIcon
                :name="getActionIcon(log.action)"
                class="size-5 text-white"
              />
            </div>
            <!-- Pulse Animation for Recent Logs -->
            <div
              v-if="isRecent(log.createdAt)"
              class="absolute inset-0 rounded-full animate-ping opacity-20"
              :class="getActionBgClass(log.action)"
            />
          </div>

          <!-- Log Content Card -->
          <div class="flex-1 min-w-0">
            <UCard
              class="hover:shadow-xl transition-all duration-300 group-hover:translate-x-1 border-l-4"
              :class="getActionBorderClass(log.action)"
            >
              <div class="space-y-4">
                <!-- Header -->
                <div class="flex items-start justify-between gap-4">
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-3 mb-2">
                      <h4 class="font-semibold text-lg text-gray-900 dark:text-white">
                        {{ getActionText(log.action) }}
                      </h4>
                      <UBadge
                        v-if="log.isSystemAction"
                        color="neutral"
                        variant="soft"
                        size="sm"
                        class="flex items-center gap-1"
                      >
                        <UIcon name="i-lucide-bot" class="size-3" />
                        Hệ thống
                      </UBadge>
                      <UBadge
                        v-if="isRecent(log.createdAt)"
                        color="success"
                        variant="soft"
                        size="sm"
                        class="animate-pulse"
                      >
                        Mới
                      </UBadge>
                    </div>

                    <!-- Timestamp -->
                    <div class="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                      <UIcon name="i-lucide-clock" class="size-4" />
                      <span>{{ formatDate(log.createdAt) }}</span>
                      <span class="text-xs">{{ getRelativeTime(log.createdAt) }}</span>
                    </div>
                  </div>

                  <!-- Actions Menu -->
                  <UDropdownMenu :items="getLogActions(log)" :popper="{ placement: 'bottom-end' }">
                    <UButton
                      variant="ghost"
                      size="sm"
                      square
                      class="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <UIcon name="i-lucide-more-horizontal" class="size-4" />
                    </UButton>
                  </UDropdownMenu>
                </div>

                <!-- Content Grid -->
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <!-- Left Column -->
                  <div class="space-y-3">
                    <!-- Novel/Chapter Info -->
                    <div v-if="log.novelId || log.chapterId" class="space-y-2">
                      <div v-if="log.novelId" class="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <UIcon name="i-lucide-book-open" class="size-4 text-blue-600" />
                        <div class="min-w-0 flex-1">
                          <p class="text-xs font-medium text-blue-600 dark:text-blue-400">
                            Truyện
                          </p>
                          <p class="font-medium text-gray-900 dark:text-white truncate">
                            {{ log.novelId.title }}
                          </p>
                        </div>
                      </div>

                      <div v-if="log.chapterId" class="flex items-center gap-2 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                        <UIcon name="i-lucide-file-text" class="size-4 text-purple-600" />
                        <div class="min-w-0 flex-1">
                          <p class="text-xs font-medium text-purple-600 dark:text-purple-400">
                            Chương
                          </p>
                          <p class="font-medium text-gray-900 dark:text-white truncate">
                            {{ log.chapterId.title }}
                          </p>
                        </div>
                      </div>
                    </div>

                    <!-- Moderator Info -->
                    <div v-if="log.moderator && !log.isSystemAction" class="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <UIcon name="i-lucide-user-check" class="size-4 text-green-600" />
                      <div class="min-w-0 flex-1">
                        <p class="text-xs font-medium text-green-600 dark:text-green-400">
                          Người thực hiện
                        </p>
                        <p class="font-medium text-gray-900 dark:text-white truncate">
                          {{ log.moderator.username }}
                        </p>
                      </div>
                    </div>
                  </div>

                  <!-- Right Column -->
                  <div class="space-y-3">
                    <!-- Note -->
                    <div v-if="log.note" class="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border-l-2 border-gray-300 dark:border-gray-600">
                      <div class="flex items-start gap-2">
                        <UIcon name="i-lucide-message-square" class="size-4 text-gray-500 mt-0.5 flex-shrink-0" />
                        <div class="min-w-0 flex-1">
                          <p class="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                            Ghi chú
                          </p>
                          <p class="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                            {{ log.note }}
                          </p>
                        </div>
                      </div>
                    </div>

                    <!-- Details -->
                    <div v-if="log.details && Object.keys(log.details).length > 0" class="space-y-2">
                      <UButton
                        variant="ghost"
                        size="xs"
                        class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        @click="toggleDetails(log._id)"
                      >
                        <UIcon
                          :name="expandedDetails.has(log._id) ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
                          class="size-3 mr-1"
                        />
                        Chi tiết kỹ thuật
                      </UButton>

                      <div
                        v-if="expandedDetails.has(log._id)"
                        class="p-3 bg-gray-900 dark:bg-gray-800 rounded-lg border overflow-hidden"
                      >
                        <pre class="text-xs text-green-400 font-mono overflow-auto max-h-40 leading-relaxed">{{ JSON.stringify(log.details, null, 2) }}</pre>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </UCard>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { format, formatDistanceToNow, isAfter, subHours } from 'date-fns'
import { vi } from 'date-fns/locale'
import type { ModerationLog, LogStats, ModerationAction } from '~/types/log'
import { useLogs } from '~/composables/useLogs'

defineProps<{
  logs?: ModerationLog[]
  stats: LogStats | null
  loading?: boolean
}>()

// const props = defineProps<Props>()
const emit = defineEmits<{
  'refresh': []
  'toggle-filters': []
  'delete-log': [logId: string]
  'view-details': [log: ModerationLog]
}>()

const { getActionColor, getActionText, getActionIcon } = useLogs()
const expandedDetails = ref(new Set<string>())

// Helper functions
const getActionGradientClass = (action: ModerationAction) => {
  const color = getActionColor(action)
  const gradientClasses: Record<string, string> = {
    green: 'bg-gradient-to-br from-green-500 to-green-600',
    red: 'bg-gradient-to-br from-red-500 to-red-600',
    orange: 'bg-gradient-to-br from-orange-500 to-orange-600',
    blue: 'bg-gradient-to-br from-blue-500 to-blue-600',
    yellow: 'bg-gradient-to-br from-yellow-500 to-yellow-600',
    gray: 'bg-gradient-to-br from-gray-500 to-gray-600'
  }
  return gradientClasses[color] || gradientClasses.gray
}

const getActionBgClass = (action: ModerationAction) => {
  const color = getActionColor(action)
  const bgClasses: Record<string, string> = {
    green: 'bg-green-500',
    red: 'bg-red-500',
    orange: 'bg-orange-500',
    blue: 'bg-blue-500',
    yellow: 'bg-yellow-500',
    gray: 'bg-gray-500'
  }
  return bgClasses[color] || bgClasses.gray
}

const getActionBorderClass = (action: ModerationAction) => {
  const color = getActionColor(action)
  const borderClasses: Record<string, string> = {
    green: 'border-l-green-500',
    red: 'border-l-red-500',
    orange: 'border-l-orange-500',
    blue: 'border-l-blue-500',
    yellow: 'border-l-yellow-500',
    gray: 'border-l-gray-500'
  }
  return borderClasses[color] || borderClasses.gray
}

const formatDate = (dateString: string) => {
  return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: vi })
}

const getRelativeTime = (dateString: string) => {
  return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: vi })
}

const isRecent = (dateString: string) => {
  return isAfter(new Date(dateString), subHours(new Date(), 1))
}

const formatNumber = (num: number) => {
  return new Intl.NumberFormat('vi-VN').format(num)
}

const toggleDetails = (logId: string) => {
  if (expandedDetails.value.has(logId)) {
    expandedDetails.value.delete(logId)
  } else {
    expandedDetails.value.add(logId)
  }
}

const getLogActions = (log: ModerationLog) => {
  return [
    [{
      label: 'Xem chi tiết',
      icon: 'i-lucide-eye',
      onClick: () => {
        emit('view-details', log)
      }
    }],
    [{
      label: 'Xóa nhật ký',
      icon: 'i-lucide-trash-2',
      onClick: () => emit('delete-log', log._id),
      class: 'text-red-600 dark:text-red-400'
    }]
  ]
}
</script>

<style scoped>
@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in {
  animation: fade-in 0.6s ease-out forwards;
}

.animate-fade-in:nth-child(1) { animation-delay: 0.1s; }
.animate-fade-in:nth-child(2) { animation-delay: 0.2s; }
.animate-fade-in:nth-child(3) { animation-delay: 0.3s; }
</style>
