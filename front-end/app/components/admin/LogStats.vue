<template>
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <!-- Action Breakdown Chart -->
    <UCard>
      <template #header>
        <div class="flex items-center gap-2">
          <UIcon name="i-lucide-pie-chart" class="size-5 text-blue-600" />
          <h3 class="text-lg font-semibold">
            Phân tích hành động
          </h3>
        </div>
      </template>

      <div class="space-y-4">
        <div
          v-for="(count, action) in stats?.actionBreakdown"
          :key="action"
          class="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          <div class="flex items-center gap-3">
            <div
              class="w-3 h-3 rounded-full"
              :class="getActionBgClass(action as ModerationAction)"
            />
            <span class="font-medium">{{ getActionText(action as ModerationAction) }}</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="font-bold text-lg">{{ count }}</span>
            <span class="text-sm text-gray-500">
              ({{ getPercentage(count, stats?.totalLogs || 0) }}%)
            </span>
          </div>
        </div>
      </div>
    </UCard>

    <!-- Top Moderators -->
    <UCard>
      <template #header>
        <div class="flex items-center gap-2">
          <UIcon name="i-lucide-users" class="size-5 text-green-600" />
          <h3 class="text-lg font-semibold">
            Kiểm duyệt viên tích cực
          </h3>
        </div>
      </template>

      <div class="space-y-3">
        <div
          v-for="(moderator, index) in stats?.moderatorStats?.slice(0, 5)"
          :key="moderator.moderator._id"
          class="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          <div class="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold text-sm">
            {{ index + 1 }}
          </div>
          <div class="flex-1 min-w-0">
            <p class="font-medium truncate">
              {{ moderator.moderator.username }}
            </p>
            <p class="text-sm text-gray-500">
              {{ moderator.count }} hành động
            </p>
          </div>
          <div class="flex-shrink-0">
            <div class="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                class="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-500"
                :style="{ width: `${getModeratorPercentage(moderator.count, stats?.moderatorStats?.[0]?.count || 0)}%` }"
              />
            </div>
          </div>
        </div>
      </div>
    </UCard>
  </div>
</template>

<script setup lang="ts">
import type { LogStats, ModerationAction } from '~/types/log'
import { useLogs } from '~/composables/useLogs'

defineProps<{
  stats: LogStats | null
}>()

const { getActionColor, getActionText } = useLogs()

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

const getPercentage = (count: number, total: number) => {
  if (total === 0) return 0
  return Math.round((count / total) * 100)
}

const getModeratorPercentage = (count: number, maxCount: number) => {
  if (maxCount === 0) return 0
  return Math.round((count / maxCount) * 100)
}
</script>
