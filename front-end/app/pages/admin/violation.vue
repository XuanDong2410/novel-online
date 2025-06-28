<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
    <!-- Modern Header -->
    <header class="sticky top-0 z-50 backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border-b border-slate-200/50 dark:border-slate-700/50 shadow-sm">
      <div class="max-w-7xl mx-auto px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <div class="flex items-center space-x-6">
            <div class="flex items-center space-x-3">
              <div class="w-8 h-8 bg-gradient-to-r from-red-600 to-orange-600 rounded-lg flex items-center justify-center">
                <UIcon name="i-heroicons-shield-exclamation" class="w-5 h-5" />
              </div>
              <h1 class="text-xl font-bold">
                Violation Management
              </h1>
            </div>
          </div>

          <div class="flex items-center space-x-4">
            <!-- Real-time Stats -->
            <div class="hidden lg:flex items-center space-x-3">
              <div class="flex items-center space-x-2 px-3 py-1.5 bg-red-100 dark:bg-red-900/30 rounded-full">
                <div class="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <span class="text-sm font-medium text-red-700 dark:text-red-300">{{ pendingReports }} Pending</span>
              </div>
              <div class="flex items-center space-x-2 px-3 py-1.5 bg-yellow-100 dark:bg-yellow-900/30 rounded-full">
                <div class="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
                <span class="text-sm font-medium text-yellow-700 dark:text-yellow-300">{{ pendingAppeals }} Appeals</span>
              </div>
              <div class="flex items-center space-x-2 px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                <div class="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                <span class="text-sm font-medium text-blue-700 dark:text-blue-300">{{ aiModerationQueue }} AI Queue</span>
              </div>
            </div>

            <!-- Quick Actions -->
            <UButton
              icon="i-heroicons-cog-8-tooth"
              variant="ghost"
              size="sm"
              class="hidden md:flex"
              @click="showBulkActionsModal = true"
            >
              Bulk Actions
            </UButton>

            <UButton
              icon="i-heroicons-arrow-path"
              variant="ghost"
              size="sm"
              :loading="isRefreshing"
              @click="refreshData"
            />
          </div>
        </div>
      </div>
    </header>

    <div class="max-w-7xl mx-auto px-6 lg:px-8 py-8">
      <!-- Tab Content -->
      <div class="space-y-8">
        <UTabs
          :items="itemTabs"
          color="secondary"
          variant="link"
          class="gap-4 w-full"
          :ui="{ trigger: 'grow' }"
        >
          <template #dashboard>
            <!-- Key Metrics -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div
                v-for="metric in keyMetrics"
                :key="metric.key"
                class="relative overflow-hidden bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-all duration-300"
              >
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-sm font-medium text-slate-600 dark:text-slate-400">
                      {{ metric.label }}
                    </p>
                    <p class="text-3xl font-bold text-slate-900 dark:text-white mt-2">
                      {{ metric.value }}
                    </p>
                    <div class="flex items-center mt-2">
                      <UIcon
                        :name="metric.trend === 'up' ? 'i-heroicons-arrow-trending-up' : metric.trend === 'down' ? 'i-heroicons-arrow-trending-down' : 'i-heroicons-minus'"
                        :class="[
                          'w-4 h-4 mr-1',
                          metric.trend === 'up' ? 'text-red-500' : metric.trend === 'down' ? 'text-emerald-500' : 'text-slate-400'
                        ]"
                      />
                      <span
                        :class="[
                          'text-sm font-medium',
                          metric.trend === 'up' ? 'text-red-600 dark:text-red-400' : metric.trend === 'down' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500'
                        ]"
                      >
                        {{ metric.change }}%
                      </span>
                      <span class="text-sm text-slate-500 ml-1">vs last week</span>
                    </div>
                  </div>
                  <div
                    :class="[
                      'w-12 h-12 rounded-xl flex items-center justify-center',
                      metric.bgColor
                    ]"
                  >
                    <UIcon :name="metric.icon" :class="['w-6 h-6', metric.iconColor]" />
                  </div>
                </div>

                <!-- Progress Bar -->
                <div class="mt-4">
                  <div class="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2">
                    <div
                      :class="[
                        'h-2 rounded-full transition-all duration-500',
                        metric.progressColor
                      ]"
                      :style="{ width: `${metric.progress}%` }"
                    />
                  </div>
                </div>
              </div>
            </div>

            <!-- Charts Section -->
            <div class="grid grid-cols-1 lg:grid-cols-6 gap-6">
              <!-- Violation Trends Chart (3/5 width) -->
              <UCard class="lg:col-span-4">
                <template #header>
                  <div class="flex items-center justify-between">
                    <h3 class="text-lg font-semibold text-slate-900 dark:text-white">
                      Violation Trends
                    </h3>
                    <USelectMenu
                      v-model="chartTimeRange"
                      :items="timeRangeOptions"
                      size="sm"
                    />
                  </div>
                </template>

                <div class="h-80 flex items-center justify-center text-slate-500 dark:text-slate-400">
                  <div class="text-center">
                    <UIcon name="i-heroicons-chart-bar" class="w-16 h-16 mx-auto mb-4 text-slate-300" />
                    <p>Violation trends chart</p>
                    <p class="text-sm mt-1">
                      Time Range: {{ chartTimeRange.label }}
                    </p>
                    <p class="text-sm mt-1">
                      Shows violation patterns over time
                    </p>
                  </div>
                </div>
              </UCard>

              <!-- Moderation Efficiency (2/5 width) -->
              <UCard class="lg:col-span-2">
                <template #header>
                  <h3 class="text-lg font-semibold text-slate-900 dark:text-white">
                    Moderation Efficiency
                  </h3>
                </template>

                <div class="space-y-6">
                  <div class="text-center">
                    <div class="text-4xl font-bold text-blue-600 dark:text-blue-400">
                      {{ moderationEfficiency }}%
                    </div>
                    <div class="text-sm text-slate-500 dark:text-slate-400 mt-1">
                      Overall Efficiency
                    </div>
                  </div>

                  <div class="space-y-4">
                    <div
                      v-for="efficiency in efficiencyBreakdown"
                      :key="efficiency.key"
                      class="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800"
                    >
                      <div class="flex items-center space-x-3">
                        <div
                          :class="[
                            'w-3 h-3 rounded-full',
                            efficiency.color
                          ]"
                        />
                        <span class="text-sm font-medium text-slate-700 dark:text-slate-300">
                          {{ efficiency.label }}
                        </span>
                      </div>
                      <div class="flex items-center space-x-3">
                        <div class="w-24 bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                          <div
                            :class="['h-2 rounded-full transition-all duration-500', efficiency.color]"
                            :style="{ width: `${efficiency.percentage}%` }"
                          />
                        </div>
                        <span class="text-sm font-semibold text-slate-900 dark:text-white min-w-[3rem] text-right">
                          {{ efficiency.percentage }}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </UCard>
            </div>

            <!-- Recent Activities -->
            <UCard>
              <template #header>
                <div class="flex items-center justify-between">
                  <h3 class="text-lg font-semibold text-slate-900 dark:text-white">
                    Recent Moderation Activities
                  </h3>
                  <UButton
                    variant="ghost"
                    size="sm"
                    trailing-icon="i-heroicons-arrow-right"
                    @click="activeTab = 'moderation-logs'"
                  >
                    View All
                  </UButton>
                </div>
              </template>

              <div class="space-y-4">
                <div
                  v-for="activity in recentActivities"
                  :key="activity.id"
                  class="flex items-start space-x-4 p-4 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <div
                    :class="[
                      'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0',
                      getActivityBgColor(activity.type)
                    ]"
                  >
                    <UIcon
                      :name="getActivityIcon(activity.type)"
                      :class="['w-5 h-5', getActivityIconColor(activity.type)]"
                    />
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-slate-900 dark:text-white">
                      {{ activity.title }}
                    </p>
                    <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">
                      {{ activity.description }}
                    </p>
                    <div class="flex items-center space-x-4 mt-2">
                      <span class="text-xs text-slate-400">{{ formatTimeAgo(activity.timestamp) }}</span>
                      <UBadge
                        :label="activity.status"
                        :color="getStatusColor(activity.status as any)"
                        size="xs"
                        variant="soft"
                      />
                    </div>
                  </div>
                  <UButton
                    icon="i-heroicons-eye"
                    variant="ghost"
                    size="xs"
                    @click="viewActivityDetails(activity)"
                  />
                </div>
              </div>
            </UCard>
          </template>
          <template #reports>
            <AdminReport
              :role="role"
              :data="reportsData"
              :loading="pending"
              :error="error"
            />
          </template>
          <template #appeals>
            <AdminAppeal
              :role="role"
              :data="appealsData"
              :loading="pending"
              :error="error"
            />
          </template>
          <template #moderation>
            <!-- AI Stats -->
            <AdminAIModeration />
          </template>
        </UTabs>
      </div>
    </div>
  </div>

  <!-- Modals -->
  <!-- Report Review Modal -->
  <UModal v-model:open="showReportModal" :class="{ width: 'max-w-4xl' }">
    <template #header>
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-semibold text-slate-900 dark:text-white">
          Review Report
        </h3>
        <UButton
          icon="i-heroicons-x-mark"
          variant="ghost"
          size="sm"
          @click="showReportModal = false"
        />
      </div>
    </template>
    <template #body>
      <UCard>
        <div v-if="selectedReport" class="space-y-6">
          <!-- Report Details -->
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
                    :label="getStatusLabel(selectedReport.status)"
                    :color="getStatusColor(selectedReport.status)"
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

          <!-- Action Form -->
          <div v-if="selectedReport.status === 'pending'" class="border-t border-slate-200 dark:border-slate-700 pt-6">
            <h4 class="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              Take Action
            </h4>
            <UForm :state="reportActionForm" class="space-y-4" @submit="submitReportAction">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <UFormField label="Action" required>
                  <USelectMenu
                    v-model="reportActionForm.action"
                    :options="reportActionOptions"
                    placeholder="Select action..."
                  />
                </UFormField>

                <UFormField label="Severity" required>
                  <USelectMenu
                    v-model="reportActionForm.severity"
                    :options="severityOptions"
                    placeholder="Select severity..."
                  />
                </UFormField>
              </div>

              <UFormField label="Note">
                <UTextarea
                  v-model="reportActionForm.note"
                  placeholder="Add a note about this action..."
                  rows="3"
                />
              </UFormField>

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

  <!-- Appeal Review Modal -->
  <UModal v-model:open="showAppealModal" :class="{ width: 'max-w-4xl' }">
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
      <UCard>
        <div v-if="selectedAppeal" class="space-y-6">
          <!-- Appeal Details -->
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
                    :color="getAppealActionColor(selectedAppeal.actionType)"
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

          <!-- Action Form -->
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
                  rows="3"
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
      </UCard>
    </template>
  </UModal>

  <!-- Bulk Actions Modal -->
  <UModal v-model:open="showBulkActionsModal" :class="{ width: 'max-w-2xl' }">
    <template #header>
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-semibold text-slate-900 dark:text-white">
          Bulk Actions
        </h3>
        <UButton
          icon="i-heroicons-x-mark"
          variant="ghost"
          size="sm"
          @click="showBulkActionsModal = false"
        />
      </div>
    </template>
    <template #body>
      <UCard>
        <div class="space-y-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Reports Bulk Actions -->
            <UCard>
              <template #header>
                <h4 class="text-lg font-semibold text-slate-900 dark:text-white">
                  Reports
                </h4>
              </template>

              <div class="space-y-4">
                <UButton
                  icon="i-heroicons-check-circle"
                  variant="outline"
                  color="success"
                  block
                  @click="bulkApproveReports"
                >
                  Bulk Approve Pending
                </UButton>
                <UButton
                  icon="i-heroicons-x-circle"
                  variant="outline"
                  color="error"
                  block
                  @click="bulkRejectReports"
                >
                  Bulk Reject Spam
                </UButton>
                <UButton
                  icon="i-heroicons-document-arrow-down"
                  variant="outline"
                  block
                  @click="exportAllReports"
                >
                  Export All Reports
                </UButton>
              </div>
            </UCard>

            <!-- Appeals Bulk Actions -->
            <UCard>
              <template #header>
                <h4 class="text-lg font-semibold text-slate-900 dark:text-white">
                  Appeals
                </h4>
              </template>

              <div class="space-y-4">
                <UButton
                  icon="i-heroicons-scale"
                  variant="outline"
                  color="secondary"
                  block
                  @click="bulkProcessAppeals"
                >
                  Process Valid Appeals
                </UButton>
                <UButton
                  icon="i-heroicons-x-circle"
                  variant="outline"
                  color="error"
                  block
                  @click="bulkRejectAppeals"
                >
                  Reject Invalid Appeals
                </UButton>
                <UButton
                  icon="i-heroicons-document-arrow-down"
                  variant="outline"
                  block
                  @click="exportAllAppeals"
                >
                  Export All Appeals
                </UButton>
              </div>
            </UCard>
          </div>

          <!-- AI Actions -->
          <UCard>
            <template #header>
              <h4 class="text-lg font-semibold text-slate-900 dark:text-white">
                AI Moderation
              </h4>
            </template>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <UButton
                icon="i-heroicons-cpu-chip"
                variant="outline"
                color="primary"
                block
                @click="retrainAIModel"
              >
                Retrain AI Model
              </UButton>
              <UButton
                icon="i-heroicons-adjustments-horizontal"
                variant="outline"
                color="warning"
                block
                @click="adjustAIThreshold"
              >
                Adjust Threshold
              </UButton>
              <UButton
                icon="i-heroicons-trash"
                variant="outline"
                color="error"
                block
                @click="clearAIQueue"
              >
                Clear AI Queue
              </UButton>
            </div>
          </UCard>
        </div>
      </UCard>
    </template>
  </UModal>

  <!-- Bulk Report Actions Modal -->
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
              {{ selectedReports.length }} reports selected for bulk action
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
                Apply to {{ selectedReports.length }} Reports
              </UButton>
            </div>
          </UForm>
        </div>
      </UCard>
    </template>
  </UModal>

  <!-- AI Item Review Modal -->
  <UModal v-model:open="showAIReviewModal" :class="{ width: 'max-w-4xl' }">
    <template #header>
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-semibold text-slate-900 dark:text-white">
          AI Detection Review
        </h3>
        <UButton
          icon="i-heroicons-x-mark"
          variant="ghost"
          size="sm"
          @click="showAIReviewModal = false"
        />
      </div>
    </template>
    <template #body>
      <UCard>
        <div v-if="selectedAIItem" class="space-y-6">
          <!-- AI Detection Details -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div class="space-y-4">
              <div>
                <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Content Type</label>
                <div class="flex items-center space-x-3 mt-2">
                  <div
                    :class="[
                      'w-8 h-8 rounded-lg flex items-center justify-center',
                      getAIItemBgColor(selectedAIItem.type)
                    ]"
                  >
                    <UIcon
                      :name="getAIItemIcon(selectedAIItem.type)"
                      :class="['w-4 h-4', getAIItemIconColor(selectedAIItem.type)]"
                    />
                  </div>
                  <div>
                    <p class="text-sm font-medium text-slate-900 dark:text-white">
                      {{ selectedAIItem.title }}
                    </p>
                    <p class="text-xs text-slate-500">
                      {{ selectedAIItem.type }}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label class="text-sm font-medium text-slate-700 dark:text-slate-300">AI Confidence</label>
                <div class="mt-2">
                  <div class="flex items-center space-x-3">
                    <div class="flex-1 bg-slate-200 dark:bg-slate-700 rounded-full h-3">
                      <div
                        class="h-3 rounded-full bg-gradient-to-r from-red-500 to-orange-500"
                        :style="{ width: `${selectedAIItem.confidence}%` }"
                      />
                    </div>
                    <span class="text-sm font-semibold text-slate-900 dark:text-white">
                      {{ selectedAIItem.confidence }}%
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Status</label>
                <div class="mt-2">
                  <UBadge
                    :label="getStatusLabel(selectedAIItem.status)"
                    :color="getAIStatusColor(selectedAIItem.status)"
                    variant="soft"
                  />
                </div>
              </div>
            </div>

            <div class="space-y-4">
              <div>
                <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Detection Details</label>
                <div class="mt-2 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <div class="space-y-2">
                    <div class="flex justify-between">
                      <span class="text-sm text-slate-600 dark:text-slate-400">Inappropriate Content:</span>
                      <span class="text-sm font-medium text-slate-900 dark:text-white">85%</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-sm text-slate-600 dark:text-slate-400">Spam Detection:</span>
                      <span class="text-sm font-medium text-slate-900 dark:text-white">12%</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-sm text-slate-600 dark:text-slate-400">Policy Violation:</span>
                      <span class="text-sm font-medium text-slate-900 dark:text-white">67%</span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Detected At</label>
                <p class="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  {{ formatDate(selectedAIItem.createdAt) }}
                </p>
              </div>
            </div>
          </div>

          <!-- Action Form -->
          <div class="border-t border-slate-200 dark:border-slate-700 pt-6">
            <h4 class="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              Review Decision
            </h4>
            <UForm :state="aiReviewForm" class="space-y-4" @submit="submitAIReview">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <UFormField label="Decision" required>
                  <USelectMenu
                    v-model="aiReviewForm.decision"
                    :options="aiDecisionOptions"
                    placeholder="Select decision..."
                  />
                </UFormField>

                <UFormField label="Confidence Override">
                  <USelectMenu
                    v-model="aiReviewForm.confidenceOverride"
                    :options="confidenceOptions"
                    placeholder="Override confidence..."
                  />
                </UFormField>
              </div>

              <UFormField label="Review Note">
                <UTextarea
                  v-model="aiReviewForm.note"
                  placeholder="Add a note about this AI detection review..."
                  :rows="3"
                />
              </UFormField>

              <div class="flex justify-end space-x-3">
                <UButton
                  variant="outline"
                  @click="showAIReviewModal = false"
                >
                  Cancel
                </UButton>
                <UButton
                  type="submit"
                  :loading="submittingAIReview"
                  color="primary"
                >
                  Submit Review
                </UButton>
              </div>
            </UForm>
          </div>
        </div>
      </UCard>
    </template>
  </UModal>

  <!-- Log Details Modal -->
  <UModal v-model:open="showLogDetailsModal" :class="{ width: 'max-w-4xl' }">
    <template #header>
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-semibold text-slate-900 dark:text-white">
          Moderation Log Details
        </h3>
        <UButton
          icon="i-heroicons-x-mark"
          variant="ghost"
          size="sm"
          @click="showLogDetailsModal = false"
        />
      </div>
    </template>
    <template #body>
      <UCard>
        <div v-if="selectedLog" class="space-y-6">
          <!-- Log Details -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div class="space-y-4">
              <div>
                <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Action</label>
                <div class="flex items-center space-x-3 mt-2">
                  <div
                    :class="[
                      'w-8 h-8 rounded-lg flex items-center justify-center',
                      getActionBgColor(selectedLog.action)
                    ]"
                  >
                    <UIcon
                      :name="getActionIcon(selectedLog.action)"
                      :class="['w-4 h-4', getActionIconColor(selectedLog.action)]"
                    />
                  </div>
                  <div>
                    <p class="text-sm font-medium text-slate-900 dark:text-white">
                      {{ getActionLabel(selectedLog.action) }}
                    </p>
                    <p class="text-xs text-slate-500">
                      {{ selectedLog.isSystemAction ? 'System Action' : 'Manual Action' }}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Target</label>
                <p class="text-sm text-slate-900 dark:text-white mt-2">
                  {{ getLogTargetTitle(selectedLog) }}
                </p>
                <p class="text-xs text-slate-500">
                  {{ getLogTargetType(selectedLog) }}
                </p>
              </div>

              <div>
                <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Timestamp</label>
                <p class="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  {{ formatDate(selectedLog.createdAt) }}
                </p>
              </div>
            </div>

            <div class="space-y-4">
              <div v-if="selectedLog.moderator">
                <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Moderator</label>
                <div class="flex items-center space-x-3 mt-2">
                  <UAvatar
                    :src="selectedLog.moderator?.image"
                    :alt="selectedLog.moderator?.username"
                    size="sm"
                  />
                  <div>
                    <p class="text-sm font-medium text-slate-900 dark:text-white">
                      {{ selectedLog.moderator?.username }}
                    </p>
                    <p class="text-xs text-slate-500">
                      {{ selectedLog.moderator?.role }}
                    </p>
                  </div>
                </div>
              </div>

              <div v-if="selectedLog.note">
                <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Note</label>
                <p class="text-sm text-slate-900 dark:text-white mt-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  {{ selectedLog.note }}
                </p>
              </div>

              <div v-if="selectedLog.details">
                <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Details</label>
                <div class="mt-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <pre class="text-xs text-slate-600 dark:text-slate-400 whitespace-pre-wrap">{{ JSON.stringify(selectedLog.details, null, 2) }}</pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      </UCard>
    </template>
  </UModal>
</template>

<script setup lang="ts">
// import type { User } from '~/types/user'
import type { ModerationLog } from '~/types/log'
import type { Report } from '~/types/report'
import type { Appeal } from '~/types/appeal'

const auth = useAuthStore()
const role = computed(() => auth.user?.role)
console.log('User Role:', role.value)

// Fetch novels based on role
definePageMeta({
  layout: 'admin'
})
const { fetchAllReports, fetchAllAppeals, fetchModerationLogs, fetchAIQueue } = useReports()
const { data: reportData } = await fetchAllReports()// Types
console.log('Fetched Reports:', reportData)
// interface User {
//   _id: string
//   username: string
//   email: string
//   image?: string
//   role: string
//   violation: {
//     count: number
//     userReports: number
//     modConfirmed: boolean
//     details?: any
//   }
// }

// interface Report {
//   _id: string
//   reporter: User
//   targetType: 'Rate' | 'Novel' | 'Chapter'
//   targetId: string
//   reason: string
//   status: 'pending' | 'reviewed' | 'rejected'
//   moderator?: User
//   handledAt?: Date
//   note?: string
//   createdAt: Date
//   target?: any
// }

// interface Appeal {
//   _id: string
//   user: User
//   novelId?: string
//   chapterId?: string
//   actionType: 'reject' | 'warning' | 'flag' | 'hide'
//   reason: string
//   status: 'pending' | 'approved' | 'rejected' | 'deleted'
//   handledBy?: User
//   responseMessage?: string
//   handledAt?: Date
//   createdAt: Date
//   novel?: any
//   chapter?: any
// }

// interface ModerationLog {
//   _id: string
//   novelId?: string
//   chapterId?: string
//   moderator?: User
//   action: string
//   note?: string
//   details?: any
//   isSystemAction: boolean
//   createdAt: Date
//   novel?: any
//   chapter?: any
// }

interface AIQueueItem {
  id: string
  type: 'novel' | 'chapter' | 'rate'
  title: string
  confidence: number
  status: 'processing' | 'flagged' | 'approved'
  createdAt: Date
}

interface ReportActionForm {
  action: string
  severity: string
  note: string
}
const { getStatusLabel, getStatusColor } = useStatus()

// Reactive state
// const activeTab = ref<string>('dashboard')
const isRefreshing = ref<boolean>(false)
const showAIReviewModal = ref<boolean>(false)
const showLogDetailsModal = ref<boolean>(false)

// Data
const reports = ref<Report[]>([])
const appeals = ref<Appeal[]>([])
const moderationLogs = ref<ModerationLog[]>([])
const aiQueueItems = ref<AIQueueItem[]>([])

// Search and filters
const reportSearchQuery = ref<string>('')
const selectedReportStatus = ref<{ label: string, value: string }>({ label: 'All Status', value: '' })
const selectedReportType = ref<{ label: string, value: string }>({ label: 'All Types', value: '' })
const reportSortBy = ref<{ label: string, value: string }>({ label: 'Newest First', value: 'createdAt' })

const appealSearchQuery = ref<string>('')
const selectedAppealStatus = ref<{ label: string, value: string }>({ label: 'All Status', value: '' })
const selectedAppealType = ref<{ label: string, value: string }>({ label: 'All Types', value: '' })
const appealSortBy = ref<{ label: string, value: string }>({ label: 'Newest First', value: 'createdAt' })

// const logSearchQuery = ref<string>('')
// const selectedLogAction = ref<string>('')
const chartTimeRange = ref<{ label: string, value: string }>({ label: 'Last 30 days', value: '30d' })
// const logTimeRange = ref<string>('7d')

// Modal states
const showReportModal = ref<boolean>(false)
const showAppealModal = ref<boolean>(false)
const showBulkActionsModal = ref<boolean>(false)
const showBulkReportActions = ref<boolean>(false)

// Selected items
const selectedReport = ref<Report | null>(null)
const selectedAppeal = ref<Appeal | null>(null)
const selectedReports = ref<Report[]>([])
const selectedAIItem = ref<AIQueueItem | null>(null)
const selectedLog = ref<ModerationLog | null>(null)

// Loading states
const loadingReports = ref<boolean>(false)
const loadingAppeals = ref<boolean>(false)
// const loadingLogs = ref<boolean>(false)
const refreshingAI = ref<boolean>(false)
const submittingReportAction = ref<boolean>(false)
const submittingAppealAction = ref<boolean>(false)
const submittingBulkReportAction = ref<boolean>(false)
const submittingAIReview = ref<boolean>(false)

// Add missing refreshAIQueue method
const refreshAIQueue = async (): Promise<void> => {
  refreshingAI.value = true
  try {
    // Simulate API call or refresh logic
    await new Promise(resolve => setTimeout(resolve, 1000))
    // Optionally update aiQueueItems.value here
  } finally {
    refreshingAI.value = false
  }
}

// Pagination
const currentReportPage = ref<number>(1)
const reportPageSize = ref<number>(10)
const currentAppealPage = ref<number>(1)
const appealPageSize = ref<number>(10)
// const currentLogPage = ref<number>(1)
// const logPageSize = ref<number>(10)

// Forms
interface AppealActionForm {
  decision: string
  priority: string
  responseMessage: string
}

interface BulkReportForm {
  action: { label: string, value: string }
  severity: { label: string, value: string }
  note: string
}

interface AIReviewForm {
  decision: string
  confidenceOverride: string
  note: string
}

const reportActionForm = ref<ReportActionForm>({
  action: '',
  severity: '',
  note: ''
})

const appealActionForm = ref<AppealActionForm>({
  decision: '',
  priority: '',
  responseMessage: ''
})

const bulkReportForm = ref<BulkReportForm>({
  action: { label: '', value: '' },
  severity: { label: '', value: '' },
  note: ''
})

const aiReviewForm = ref<AIReviewForm>({
  decision: '',
  confidenceOverride: '',
  note: ''
})

// Configuration
// const mainTabs = computed(() => [
//   {
//     key: 'dashboard',
//     label: 'Dashboard',
//     icon: 'i-heroicons-chart-pie'
//   },
//   {
//     key: 'reports',
//     label: 'Reports',
//     icon: 'i-heroicons-flag',
//     badge: pendingReports.value
//   },
//   {
//     key: 'appeals',
//     label: 'Appeals',
//     icon: 'i-heroicons-scale',
//     badge: pendingAppeals.value
//   },
//   {
//     key: 'ai-moderation',
//     label: 'AI Moderation',
//     icon: 'i-heroicons-cpu-chip',
//     badge: aiModerationQueue.value
//   },
//   {
//     key: 'moderation-logs',
//     label: 'Logs',
//     icon: 'i-heroicons-document-text'
//   }
// ])

const timeRangeOptions = [
  { label: 'Last 7 days', value: '7d' },
  { label: 'Last 30 days', value: '30d' },
  { label: 'Last 3 months', value: '3m' },
  { label: 'Last year', value: '1y' }
]

const reportStatusOptions = [
  { label: 'All Status', value: '' },
  { label: 'Pending', value: 'pending' },
  { label: 'Reviewed', value: 'reviewed' },
  { label: 'Rejected', value: 'rejected' }
]

const reportTypeOptions = [
  { label: 'All Types', value: '' },
  { label: 'Novel', value: 'Novel' },
  { label: 'Chapter', value: 'Chapter' },
  { label: 'Rate', value: 'Rate' }
]

const reportSortOptions = [
  { label: 'Newest First', value: 'createdAt' },
  { label: 'Oldest First', value: 'createdAt_asc' },
  { label: 'Priority', value: 'priority' }
]

const appealStatusOptions = [
  { label: 'All Status', value: '' },
  { label: 'Pending', value: 'pending' },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' },
  { label: 'Deleted', value: 'deleted' }
]

const appealTypeOptions = [
  { label: 'All Types', value: '' },
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

// const logActionOptions = [
//   { label: 'All Actions', value: '' },
//   { label: 'Approve', value: 'approve' },
//   { label: 'Reject', value: 'reject' },
//   { label: 'Warning', value: 'warning' },
//   { label: 'Hide', value: 'hide' },
//   { label: 'Flag', value: 'flag' }
// ]

// const moderatorOptions = computed(() => {
//   const moderators = [...new Set(moderationLogs.value.map(log => log.moderator).filter(Boolean))]
//   return [
//     { label: 'All Moderators', value: '' },
//     ...moderators.map(mod => ({ label: mod!.username, value: mod!._id }))
//   ]
// })

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

const appealDecisionOptions = [
  { label: 'Approve Appeal', value: 'approve' },
  { label: 'Reject Appeal', value: 'reject' },
  { label: 'Partial Approval', value: 'partial' }
]

const priorityOptions = [
  { label: 'Low', value: 'low' },
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

const aiDecisionOptions = [
  { label: 'Confirm AI Detection', value: 'confirm' },
  { label: 'Override - False Positive', value: 'false_positive' },
  { label: 'Override - Needs Review', value: 'needs_review' }
]

const confidenceOptions = [
  { label: 'Very Low (0-20%)', value: 'very_low' },
  { label: 'Low (21-40%)', value: 'low' },
  { label: 'Medium (41-60%)', value: 'medium' },
  { label: 'High (61-80%)', value: 'high' },
  { label: 'Very High (81-100%)', value: 'very_high' }
]

// Table columns
const reportColumns = [
  { id: 'reporter', label: 'Reporter' },
  { id: 'target', label: 'Target Content' },
  { id: 'reason', label: 'Reason' },
  { id: 'status', label: 'Status' },
  { id: 'createdAt', label: 'Date' },
  { id: 'actions', label: 'Actions' }
]

const appealColumns = [
  { id: 'user', label: 'User' },
  { id: 'content', label: 'Content' },
  { id: 'reason', label: 'Appeal Reason' },
  { id: 'status', label: 'Status' },
  { id: 'handledBy', label: 'Handled By' },
  { id: 'createdAt', label: 'Date' },
  { id: 'actions', label: 'Actions' }
]

// const logColumns = [
//   { id: 'action', label: 'Action' },
//   { id: 'target', label: 'Target' },
//   { id: 'moderator', label: 'Moderator' },
//   { id: 'note', label: 'Note' },
//   { id: 'createdAt', label: 'Date' },
//   { id: 'actions', label: 'Actions' }
// ]

// Mock data
const mockReports: Report[] = [
  {
    _id: '1',
    reporter: {
      _id: 'u1',
      username: 'user123',
      email: 'user123@example.com',
      role: 'user',
      violation: { count: 0, userReports: 0, modConfirmed: false }
    },
    targetType: 'Novel',
    targetId: 'n1',
    reason: 'This novel contains inappropriate content that violates community guidelines.',
    status: 'pending',
    createdAt: new Date('2024-01-15'),
    target: {
      title: 'The Legendary Sword Master',
      content: 'An epic tale of adventure...'
    }
  },
  {
    _id: '2',
    reporter: {
      _id: 'u2',
      username: 'moderator1',
      email: 'mod1@example.com',
      role: 'moderator',
      violation: { count: 0, userReports: 0, modConfirmed: false }
    },
    targetType: 'Chapter',
    targetId: 'c1',
    reason: 'Chapter contains spam content and irrelevant information.',
    status: 'reviewed',
    moderator: {
      _id: 'm1',
      username: 'admin1',
      email: 'admin1@example.com',
      role: 'admin',
      violation: { count: 0, userReports: 0, modConfirmed: false }
    },
    handledAt: new Date('2024-01-16'),
    note: 'Content reviewed and action taken.',
    createdAt: new Date('2024-01-14'),
    target: {
      title: 'Chapter 1: The Beginning',
      content: 'In a small village nestled at the foot of the mountains...'
    }
  }
]

const mockAppeals: Appeal[] = [
  {
    _id: '1',
    user: {
      _id: 'u3',
      username: 'author1',
      email: 'author1@example.com',
      role: 'user',
      violation: { count: 2, userReports: 1, modConfirmed: true }
    },
    novelId: 'n1',
    actionType: 'reject',
    reason: 'I believe my novel was wrongly rejected. The content follows all community guidelines and does not contain any inappropriate material.',
    status: 'pending',
    createdAt: new Date('2024-01-16'),
    novel: {
      title: 'The Magical World Chronicles',
      description: 'A fantasy adventure story...'
    }
  },
  {
    _id: '2',
    user: {
      _id: 'u4',
      username: 'writer2',
      email: 'writer2@example.com',
      role: 'user',
      violation: { count: 1, userReports: 0, modConfirmed: false }
    },
    chapterId: 'c2',
    actionType: 'warning',
    reason: 'The warning issued for this chapter seems unfair. I have reviewed the content and made necessary changes.',
    status: 'approved',
    handledBy: {
      _id: 'm2',
      username: 'moderator2',
      email: 'mod2@example.com',
      role: 'moderator',
      violation: { count: 0, userReports: 0, modConfirmed: false }
    },
    responseMessage: 'Appeal approved. Warning has been removed.',
    handledAt: new Date('2024-01-17'),
    createdAt: new Date('2024-01-15'),
    chapter: {
      title: 'Chapter 5: The Great Battle',
      content: 'The battle raged on...'
    }
  }
]

const mockModerationLogs: ModerationLog[] = [
  {
    _id: '1',
    novelId: 'n1',
    moderator: {
      _id: 'm1',
      username: 'admin1',
      email: 'admin1@example.com',
      role: 'admin',
      violation: { count: 0, userReports: 0, modConfirmed: false }
    },
    action: 'approve',
    note: 'Content meets community standards.',
    isSystemAction: false,
    createdAt: new Date('2024-01-16'),
    novel: {
      title: 'The Legendary Sword Master'
    }
  },
  {
    _id: '2',
    chapterId: 'c1',
    action: 'flag',
    note: 'AI detected potential policy violation.',
    details: { confidence: 0.85, violationType: 'inappropriate_content' },
    isSystemAction: true,
    createdAt: new Date('2024-01-15'),
    chapter: {
      title: 'Chapter 1: The Beginning'
    }
  }
]

const mockAIQueueItems: AIQueueItem[] = [
  {
    id: '1',
    type: 'novel',
    title: 'The Dark Chronicles',
    confidence: 92,
    status: 'flagged',
    createdAt: new Date('2024-01-16')
  },
  {
    id: '2',
    type: 'chapter',
    title: 'Chapter 3: The Forbidden Magic',
    confidence: 78,
    status: 'processing',
    createdAt: new Date('2024-01-16')
  }
]

// Computed properties
// const breadcrumbLinks = computed(() => {
//   const links = [{ label: 'Dashboard', to: '/' }]

//   if (activeTab.value === 'dashboard') {
//     links.push({ label: 'Violation Management', to: '/' })
//   } else if (activeTab.value === 'reports') {
//     links.push({ label: 'Reports Management', to: '/' })
//   } else if (activeTab.value === 'appeals') {
//     links.push({ label: 'Appeals Management', to: '/' })
//   } else if (activeTab.value === 'ai-moderation') {
//     links.push({ label: 'AI Moderation', to: '/' })
//   } else if (activeTab.value === 'moderation-logs') {
//     links.push({ label: 'Moderation Logs', to: '/' })
//   }

//   return links
// })

// Statistics
const pendingReports = computed(() => reports.value.filter(r => r.status === 'pending').length)
const pendingAppeals = computed(() => appeals.value.filter(a => a.status === 'pending').length)
const aiModerationQueue = computed(() => aiQueueItems.value.filter(item => item.status === 'processing').length)

const totalReports = computed(() => reports.value.length)
const totalAppeals = computed(() => appeals.value.length)
const totalViolations = computed(() => 156) // Mock data
const moderationEfficiency = computed(() => 94) // Mock data
const aiProcessingRate = computed(() => 45) // Mock data
const aiAccuracy = computed(() => 87) // Mock data
const aiFalsePositives = computed(() => 13) // Mock data

const keyMetrics = computed(() => [
  {
    key: 'total-reports',
    label: 'Total Reports',
    value: totalReports.value,
    icon: 'i-heroicons-flag',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    iconColor: 'text-red-600',
    progressColor: 'bg-red-500',
    progress: 100,
    trend: 'up',
    change: 15
  },
  {
    key: 'pending-reports',
    label: 'Pending Reports',
    value: pendingReports.value,
    icon: 'i-heroicons-clock',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
    iconColor: 'text-yellow-600',
    progressColor: 'bg-yellow-500',
    progress: (pendingReports.value / totalReports.value) * 100,
    trend: 'down',
    change: 8
  },
  {
    key: 'total-appeals',
    label: 'Total Appeals',
    value: totalAppeals.value,
    icon: 'i-heroicons-scale',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    iconColor: 'text-blue-600',
    progressColor: 'bg-blue-500',
    progress: 100,
    trend: 'up',
    change: 12
  },
  {
    key: 'violations',
    label: 'Total Violations',
    value: totalViolations.value,
    icon: 'i-heroicons-exclamation-triangle',
    bgColor: 'bg-orange-100 dark:bg-orange-900/30',
    iconColor: 'text-orange-600',
    progressColor: 'bg-orange-500',
    progress: 100,
    trend: 'down',
    change: 5
  }
])

const efficiencyBreakdown = computed(() => [
  {
    key: 'response-time',
    label: 'Response Time',
    percentage: 92,
    color: 'bg-emerald-500'
  },
  {
    key: 'accuracy',
    label: 'Decision Accuracy',
    percentage: 96,
    color: 'bg-blue-500'
  },
  {
    key: 'user-satisfaction',
    label: 'User Satisfaction',
    percentage: 89,
    color: 'bg-purple-500'
  }
])

const recentActivities = computed(() => [
  {
    id: '1',
    type: 'report',
    title: 'New report submitted',
    description: 'User reported inappropriate content in "The Dark Chronicles"',
    status: 'pending',
    timestamp: new Date('2024-01-16T10:30:00')
  },
  {
    id: '2',
    type: 'appeal',
    title: 'Appeal approved',
    description: 'Appeal for "Chapter 5: The Great Battle" has been approved',
    status: 'approved',
    timestamp: new Date('2024-01-16T09:15:00')
  },
  {
    id: '3',
    type: 'ai-flag',
    title: 'AI flagged content',
    description: 'AI system flagged potential violation in new chapter',
    status: 'flagged',
    timestamp: new Date('2024-01-16T08:45:00')
  }
])

// Filtered data
const filteredReports = computed(() => {
  let filtered = [...reports.value]

  if (reportSearchQuery.value) {
    const query = reportSearchQuery.value.toLowerCase()
    filtered = filtered.filter(report =>
      report.reason.toLowerCase().includes(query)
      || report.reporter.username.toLowerCase().includes(query)
      || (report.target?.title && report.target.title.toLowerCase().includes(query))
    )
  }

  if (selectedReportStatus.value.value) {
    filtered = filtered.filter(report => report.status === selectedReportStatus.value.value)
  }

  if (selectedReportType.value.value) {
    filtered = filtered.filter(report => report.targetType === selectedReportType.value.value)
  }

  // Sorting
  filtered.sort((a, b) => {
    switch (reportSortBy.value.value) {
      case 'createdAt':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      case 'createdAt_asc':
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      default:
        return 0
    }
  })

  return filtered
})

const paginatedReports = computed(() => {
  const start = (currentReportPage.value - 1) * reportPageSize.value
  const end = start + reportPageSize.value
  return filteredReports.value.slice(start, end)
})

const filteredAppeals = computed(() => {
  let filtered = [...appeals.value]

  if (appealSearchQuery.value) {
    const query = appealSearchQuery.value.toLowerCase()
    filtered = filtered.filter(appeal =>
      appeal.reason.toLowerCase().includes(query)
      || appeal.user.username.toLowerCase().includes(query)
      || (appeal.novel?.title && appeal.novel.title.toLowerCase().includes(query))
      || (appeal.chapter?.title && appeal.chapter.title.toLowerCase().includes(query))
    )
  }

  if (selectedAppealStatus.value.value) {
    filtered = filtered.filter(appeal => appeal.status === selectedAppealStatus.value.value)
  }

  if (selectedAppealType.value.value) {
    filtered = filtered.filter(appeal => appeal.actionType === selectedAppealType.value.value)
  }

  // Sorting
  filtered.sort((a, b) => {
    switch (appealSortBy.value.value) {
      case 'createdAt':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      case 'createdAt_asc':
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      default:
        return 0
    }
  })

  return filtered
})

const paginatedAppeals = computed(() => {
  const start = (currentAppealPage.value - 1) * appealPageSize.value
  const end = start + appealPageSize.value
  return filteredAppeals.value.slice(start, end)
})

// const filteredLogs = computed(() => {
//   let filtered = [...moderationLogs.value]

//   if (logSearchQuery.value) {
//     const query = logSearchQuery.value.toLowerCase()
//     filtered = filtered.filter(log =>
//       log.action.toLowerCase().includes(query)
//       || (log.moderator?.username && log.moderator.username.toLowerCase().includes(query))
//       || (log.note && log.note.toLowerCase().includes(query))
//     )
//   }

//   if (selectedLogAction.value) {
//     filtered = filtered.filter(log => log.action === selectedLogAction.value)
//   }

//   if (selectedLogModerator.value) {
//     filtered = filtered.filter(log => log.moderator?._id === selectedLogModerator.value)
//   }

//   return filtered
// })

// const paginatedLogs = computed(() => {
//   const start = (currentLogPage.value - 1) * logPageSize.value
//   const end = start + logPageSize.value
//   return filteredLogs.value.slice(start, end)
// })

// Methods
const toast = useToast()

// Dummy handler for recent activity "View" button
interface Activity {
  id: string
  type: string
  title: string
  description: string
  status: string
  timestamp: Date
}

const viewActivityDetails = (activity: Activity): void => {
  // You can implement navigation or modal logic here if needed
  toast.add({
    title: 'Activity Details',
    description: `Viewing details for: ${activity.title}`,
    color: 'info'
  })
}

const refreshData = async (): Promise<void> => {
  isRefreshing.value = true
  try {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    // Refresh data here
  } finally {
    isRefreshing.value = false
  }
}

const resetAppealFilters = (): void => {
  appealSearchQuery.value = ''
  selectedAppealStatus.value = { label: 'All Status', value: '' }
  selectedAppealType.value = { label: 'All Types', value: '' }
  appealSortBy.value = { label: 'Newest First', value: 'createdAt' }
}

// const resetLogFilters = (): void => {
//   logSearchQuery.value = ''
//   selectedLogAction.value = ''
//   selectedLogModerator.value = ''
//   logTimeRange.value = '7d'
// }

const reviewReport = (report: Report): void => {
  selectedReport.value = report
  showReportModal.value = true
}

const approveReport = async (report: Report): Promise<void> => {
  try {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    report.status = 'reviewed'
    report.handledAt = new Date()
    // Show success notification
  } catch (error) {
    console.error('Failed to approve report:', error)
  }
}

const rejectReport = async (report: Report): Promise<void> => {
  try {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    report.status = 'rejected'
    report.handledAt = new Date()
    // Show success notification
  } catch (error) {
    console.error('Failed to reject report:', error)
  }
}

const reviewAppeal = (appeal: Appeal): void => {
  selectedAppeal.value = appeal
  showAppealModal.value = true
}

const approveAppeal = async (appeal: Appeal): Promise<void> => {
  try {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    appeal.status = 'approved'
    appeal.handledAt = new Date()
    // Show success notification
  } catch (error) {
    console.error('Failed to approve appeal:', error)
  }
}

const rejectAppeal = async (appeal: Appeal): Promise<void> => {
  try {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    appeal.status = 'rejected'
    appeal.handledAt = new Date()
    // Show success notification
  } catch (error) {
    console.error('Failed to reject appeal:', error)
  }
}

const submitReportAction = async (): Promise<void> => {
  submittingReportAction.value = true

  try {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000))

    if (selectedReport.value) {
      selectedReport.value.status = 'reviewed'
      selectedReport.value.handledAt = new Date()
      selectedReport.value.note = reportActionForm.value.note
    }

    showReportModal.value = false

    // Reset form
    reportActionForm.value = {
      action: '',
      severity: '',
      note: ''
    }
  } catch (error) {
    console.error('Failed to submit report action:', error)
  } finally {
    submittingReportAction.value = false
  }
}

const reviewAIItem = (item: AIQueueItem): void => {
  selectedAIItem.value = item
  showAIReviewModal.value = true
}

// const viewLogDetails = (log: ModerationLog): void => {
//   selectedLog.value = log
//   showLogDetailsModal.value = true
// }

const submitAppealAction = async (): Promise<void> => {
  submittingAppealAction.value = true

  try {
    await new Promise(resolve => setTimeout(resolve, 2000))

    if (selectedAppeal.value) {
      selectedAppeal.value.status = appealActionForm.value.decision === 'approve' ? 'approved' : 'rejected'
      selectedAppeal.value.handledAt = new Date()
      selectedAppeal.value.responseMessage = appealActionForm.value.responseMessage
    }

    toast.add({
      title: 'Success',
      description: 'Appeal action submitted successfully',
      color: 'success'
    })

    showAppealModal.value = false

    appealActionForm.value = {
      decision: '',
      priority: '',
      responseMessage: ''
    }
  } catch {
    toast.add({
      title: 'Error',
      description: 'Failed to submit appeal action',
      color: 'error'
    })
  } finally {
    submittingAppealAction.value = false
  }
}

const submitBulkReportAction = async (): Promise<void> => {
  submittingBulkReportAction.value = true

  try {
    await new Promise(resolve => setTimeout(resolve, 2000))

    selectedReports.value.forEach((report) => {
      report.status = 'reviewed'
      report.handledAt = new Date()
      report.note = bulkReportForm.value.note
    })

    toast.add({
      title: 'Success',
      description: `Bulk action applied to ${selectedReports.value.length} reports`,
      color: 'success'
    })

    showBulkReportActions.value = false
    selectedReports.value = []

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

const submitAIReview = async (): Promise<void> => {
  submittingAIReview.value = true

  try {
    await new Promise(resolve => setTimeout(resolve, 2000))

    if (selectedAIItem.value) {
      selectedAIItem.value.status = aiReviewForm.value.decision === 'confirm' ? 'flagged' : 'approved'
    }

    toast.add({
      title: 'Success',
      description: 'AI review submitted successfully',
      color: 'success'
    })

    showAIReviewModal.value = false

    aiReviewForm.value = {
      decision: '',
      confidenceOverride: '',
      note: ''
    }
  } catch {
    toast.add({
      title: 'Error',
      description: 'Failed to submit AI review',
      color: 'error'
    })
  } finally {
    submittingAIReview.value = false
  }
}

// Bulk action methods
const bulkApproveReports = async (): Promise<void> => {
  try {
    await new Promise(resolve => setTimeout(resolve, 1500))
    const pendingReports = reports.value.filter(r => r.status === 'pending')
    pendingReports.forEach((report) => {
      report.status = 'reviewed'
      report.handledAt = new Date()
    })

    toast.add({
      title: 'Success',
      description: `${pendingReports.length} reports approved`,
      color: 'success'
    })

    showBulkActionsModal.value = false
  } catch {
    toast.add({
      title: 'Error',
      description: 'Failed to bulk approve reports',
      color: 'error'
    })
  }
}

const bulkRejectReports = async (): Promise<void> => {
  try {
    await new Promise(resolve => setTimeout(resolve, 1500))
    const spamReports = reports.value.filter(r => r.reason.toLowerCase().includes('spam'))
    spamReports.forEach((report) => {
      report.status = 'rejected'
      report.handledAt = new Date()
    })

    toast.add({
      title: 'Success',
      description: `${spamReports.length} spam reports rejected`,
      color: 'success'
    })

    showBulkActionsModal.value = false
  } catch {
    toast.add({
      title: 'Error',
      description: 'Failed to bulk reject reports',
      color: 'error'
    })
  }
}

const exportAllReports = (): void => {
  toast.add({
    title: 'Export Started',
    description: 'Reports export is being prepared',
    color: 'info'
  })
  showBulkActionsModal.value = false
}

const bulkProcessAppeals = async (): Promise<void> => {
  try {
    await new Promise(resolve => setTimeout(resolve, 1500))
    const validAppeals = appeals.value.filter(a => a.status === 'pending' && a.reason.length > 50)
    validAppeals.forEach((appeal) => {
      appeal.status = 'approved'
      appeal.handledAt = new Date()
    })

    toast.add({
      title: 'Success',
      description: `${validAppeals.length} valid appeals processed`,
      color: 'success'
    })

    showBulkActionsModal.value = false
  } catch {
    toast.add({
      title: 'Error',
      description: 'Failed to process appeals',
      color: 'error'
    })
  }
}

const bulkRejectAppeals = async (): Promise<void> => {
  try {
    await new Promise(resolve => setTimeout(resolve, 1500))
    const invalidAppeals = appeals.value.filter(a => a.status === 'pending' && a.reason.length < 20)
    invalidAppeals.forEach((appeal) => {
      appeal.status = 'rejected'
      appeal.handledAt = new Date()
    })

    toast.add({
      title: 'Success',
      description: `${invalidAppeals.length} invalid appeals rejected`,
      color: 'success'
    })

    showBulkActionsModal.value = false
  } catch {
    toast.add({
      title: 'Error',
      description: 'Failed to reject appeals',
      color: 'error'
    })
  }
}

const exportAllAppeals = (): void => {
  toast.add({
    title: 'Export Started',
    description: 'Appeals export is being prepared',
    color: 'info'
  })
  showBulkActionsModal.value = false
}

const retrainAIModel = async (): Promise<void> => {
  try {
    await new Promise(resolve => setTimeout(resolve, 2000))
    toast.add({
      title: 'AI Model Retraining',
      description: 'AI model retraining has been initiated',
      color: 'neutral'
    })
    showBulkActionsModal.value = false
  } catch {
    toast.add({
      title: 'Error',
      description: 'Failed to initiate AI retraining',
      color: 'error'
    })
  }
}

const adjustAIThreshold = (): void => {
  toast.add({
    title: 'AI Threshold',
    description: 'AI threshold adjustment panel opened',
    color: 'warning'
  })
  showBulkActionsModal.value = false
}

const clearAIQueue = async (): Promise<void> => {
  try {
    await new Promise(resolve => setTimeout(resolve, 1000))
    aiQueueItems.value = []
    toast.add({
      title: 'Success',
      description: 'AI queue cleared successfully',
      color: 'success'
    })
    showBulkActionsModal.value = false
  } catch {
    toast.add({
      title: 'Error',
      description: 'Failed to clear AI queue',
      color: 'error'
    })
  }
}

const getAppealActionColor = (actionType: string): string => {
  const colorMap: Record<string, string> = {
    reject: 'red',
    warning: 'yellow',
    flag: 'orange',
    hide: 'gray'
  }
  return colorMap[actionType] || 'gray'
}

// Add getTargetTypeBgColor for report target types
const getTargetTypeBgColor = (targetType: string): string => {
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

// Add getActivityBgColor for recentActivities
const getActivityBgColor = (type: string): string => {
  switch (type) {
    case 'report':
      return 'bg-red-100 dark:bg-red-900/30'
    case 'appeal':
      return 'bg-blue-100 dark:bg-blue-900/30'
    case 'ai-flag':
      return 'bg-orange-100 dark:bg-orange-900/30'
    default:
      return 'bg-slate-100 dark:bg-slate-800'
  }
}

// Add getActivityIcon for recentActivities
const getActivityIcon = (type: string): string => {
  switch (type) {
    case 'report':
      return 'i-heroicons-flag'
    case 'appeal':
      return 'i-heroicons-scale'
    case 'ai-flag':
      return 'i-heroicons-cpu-chip'
    default:
      return 'i-heroicons-information-circle'
  }
}

// Optionally, add getActivityIconColor if needed
const getActivityIconColor = (type: string): string => {
  switch (type) {
    case 'report':
      return 'text-red-500'
    case 'appeal':
      return 'text-blue-500'
    case 'ai-flag':
      return 'text-orange-500'
    default:
      return 'text-slate-400'
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

const formatTimeAgo = (date: Date): string => {
  const now = new Date()
  const diff = now.getTime() - new Date(date).getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) return `${days}d ago`
  if (hours > 0) return `${hours}h ago`
  if (minutes > 0) return `${minutes}m ago`
  return 'Just now'
}
const itemTabs = ref([
  {
    slot: 'dashboard',
    label: 'Dashboard',
    icon: 'i-heroicons-chart-pie'
  },
  {
    slot: 'reports',
    label: 'Reports',
    icon: 'i-heroicons-flag',
    badge: pendingReports.value
  },
  {
    slot: 'appeals',
    label: 'Appeals',
    icon: 'i-heroicons-scale',
    badge: pendingAppeals.value
  },
  {
    slot: 'moderation',
    label: 'AI Moderation',
    icon: 'i-heroicons-cpu-chip',
    badge: aiModerationQueue.value
  }
])
// Lifecycle
onMounted(() => {
  reports.value = mockReports
  appeals.value = mockAppeals
  moderationLogs.value = mockModerationLogs
  aiQueueItems.value = mockAIQueueItems
})

// Watch for tab changes
// watch(activeTab, (newTab) => {
//   // Reset filters when switching tabs
//   if (newTab === 'reports') {
//     resetReportFilters()
//   } else if (newTab === 'appeals') {
//     resetAppealFilters()
//   } else if (newTab === 'moderation-logs') {
//     resetLogFilters()
//   }
// })
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.line-clamp-4 {
  display: -webkit-box;
  -webkit-line-clamp: 4;
  line-clamp: 4;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Custom scrollbar */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: rgba(156, 163, 175, 0.5);
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(156, 163, 175, 0.7);
}

.dark ::-webkit-scrollbar-thumb {
  background: rgba(75, 85, 99, 0.5);
}

.dark ::-webkit-scrollbar-thumb:hover {
  background: rgba(75, 85, 99, 0.7);
}

/* Smooth transitions */
* {
  transition-property: color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;
}

/* Glass effect for header */
.backdrop-blur-xl {
  backdrop-filter: blur(24px);
}

/* Gradient text */
.bg-clip-text {
  -webkit-background-clip: text;
  background-clip: text;
}

/* Custom animations */
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

/* Enhanced focus states */
.focus\:ring-2:focus {
  outline: 2px solid transparent;
  outline-offset: 2px;
  box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.5);
}

/* Custom gradient backgrounds */
.bg-gradient-to-r {
  background-image: linear-gradient(to right, var(--tw-gradient-stops));
}

.bg-gradient-to-br {
  background-image: linear-gradient(to bottom right, var(--tw-gradient-stops));
}
</style>
