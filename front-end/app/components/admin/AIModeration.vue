<template>
  <!-- AI Stats -->
  <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
    <UCard>
      <div class="text-center p-6">
        <div class="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <UIcon name="i-heroicons-cpu-chip" class="w-8 h-8 text-white" />
        </div>
        <h3 class="text-lg font-semibold text-slate-900 dark:text-white mb-2">
          AI Processing Rate
        </h3>
        <p class="text-3xl font-bold text-blue-600 dark:text-blue-400">
          {{ aiProcessingRate }}/min
        </p>
        <p class="text-sm text-slate-500 mt-1">
          Average processing speed
        </p>
      </div>
    </UCard>

    <UCard>
      <div class="text-center p-6">
        <div class="w-16 h-16 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <UIcon name="i-heroicons-check-badge" class="w-8 h-8 text-white" />
        </div>
        <h3 class="text-lg font-semibold text-slate-900 dark:text-white mb-2">
          AI Accuracy
        </h3>
        <p class="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
          {{ aiAccuracy }}%
        </p>
        <p class="text-sm text-slate-500 mt-1">
          Confirmed by moderators
        </p>
      </div>
    </UCard>

    <UCard>
      <div class="text-center p-6">
        <div class="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <UIcon name="i-heroicons-exclamation-triangle" class="w-8 h-8 text-white" />
        </div>
        <h3 class="text-lg font-semibold text-slate-900 dark:text-white mb-2">
          False Positives
        </h3>
        <p class="text-3xl font-bold text-orange-600 dark:text-orange-400">
          {{ aiFalsePositives }}%
        </p>
        <p class="text-sm text-slate-500 mt-1">
          Requires improvement
        </p>
      </div>
    </UCard>
  </div>

  <!-- AI Queue -->
  <UCard>
    <template #header>
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-semibold text-slate-900 dark:text-white">
          AI Moderation Queue
        </h3>
        <div class="flex items-center space-x-3">
          <UBadge
            :label="`${aiModerationQueue} items`"
            color="info"
            variant="soft"
          />
          <UButton
            icon="i-heroicons-arrow-path"
            variant="ghost"
            size="sm"
            :loading="refreshingAI"
            @click="refreshAIQueue"
          />
        </div>
      </div>
    </template>

    <div class="space-y-4">
      <div
        v-for="item in AIQueueItems"
        :key="item.id"
        class="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
      >
        <div class="flex items-center space-x-4">
          <div
            :class="[
              'w-10 h-10 rounded-full flex items-center justify-center',
              getAIItemBgColor(item.type)
            ]"
          >
            <UIcon
              :name="getAIItemIcon(item.type)"
              :class="['w-5 h-5', getAIItemIconColor(item.type)]"
            />
          </div>
          <div>
            <p class="text-sm font-medium text-slate-900 dark:text-white">
              {{ item.title }}
            </p>
            <p class="text-xs text-slate-500">
              Confidence: {{ item.confidence }}% | {{ item.type }}
            </p>
          </div>
        </div>
        <div class="flex items-center space-x-2">
          <UBadge
            :label="item.status"
            :color="getAIStatusColor(mapAIStatusToPublishStatus(item.status) as statusPublish)"
            size="xs"
            variant="soft"
          />
          <UButton
            icon="i-heroicons-eye"
            size="xs"
            variant="ghost"
            @click="reviewAIItem(item)"
          />
        </div>
      </div>
    </div>
  </UCard>

  <!-- AI Item Review Modal -->
  <UModal
    v-model:open="showAIReviewModal"
    title="Review AI Detection"
    :size="1024"
    :class="{ width: 'w-3/4' }"
  >
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
                    :label="getStatusLabel(mapAIStatusToPublishStatus(selectedAIItem.status) as statusPublish)"
                    :color="getStatusColor(mapAIStatusToPublishStatus(selectedAIItem.status)as statusPublish)"
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
</template>

<script setup lang="ts">
import type { statusPublish } from '~/types'

const toast = useToast()
const { getStatusLabel, getStatusColor } = useStatus()
interface AIQueueItem {
  id: string
  type: 'novel' | 'chapter' | 'rate'
  title: string
  confidence: number
  status: 'processing' | 'flagged' | 'approved'
  createdAt: Date
}

// Map AI status to statusPublish type
const mapAIStatusToPublishStatus = (status: string): string => {
  // Adjust these mappings as needed to match your statusPublish values
  switch (status) {
    case 'processing':
      return 'draft'
    case 'flagged':
      return 'rejected'
    case 'approved':
      return 'published'
    default:
      return 'draft'
  }
}
interface AIReviewForm {
  decision: string
  confidenceOverride: string
  note: string
}
const aiQueueItems = ref<AIQueueItem[]>([])
const selectedAIItem = ref<AIQueueItem | null>(null)
const aiReviewForm = ref<AIReviewForm>({
  decision: '',
  confidenceOverride: '',
  note: ''
})
const showAIReviewModal = ref<boolean>(false)
const submittingAIReview = ref<boolean>(false)

const refreshingAI = ref<boolean>(false)
const aiModerationQueue = computed(() => aiQueueItems.value.filter(item => item.status === 'processing').length)
const aiProcessingRate = computed(() => 45) // Mock data
const aiAccuracy = computed(() => 87) // Mock data
const aiFalsePositives = computed(() => 13) // Mock data
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

const getAIItemIcon = (type: string): string => {
  const iconMap: Record<string, string> = {
    novel: 'i-heroicons-book-open',
    chapter: 'i-heroicons-document-text',
    rate: 'i-heroicons-star'
  }
  return iconMap[type] || 'i-heroicons-document'
}

const getAIItemBgColor = (type: string): string => {
  const colorMap: Record<string, string> = {
    novel: 'bg-blue-100 dark:bg-blue-900/30',
    chapter: 'bg-green-100 dark:bg-green-900/30',
    rate: 'bg-yellow-100 dark:bg-yellow-900/30'
  }
  return colorMap[type] || 'bg-gray-100 dark:bg-gray-800'
}

const getAIItemIconColor = (type: string): string => {
  const colorMap: Record<string, string> = {
    novel: 'text-blue-600',
    chapter: 'text-green-600',
    rate: 'text-yellow-600'
  }
  return colorMap[type] || 'text-gray-600'
}

const getAIStatusColor = (status: string): 'primary' | 'info' | 'success' | 'warning' | 'error' | 'secondary' | 'neutral' | undefined => {
  const colorMap: Record<string, 'primary' | 'info' | 'success' | 'warning' | 'error' | 'secondary' | 'neutral'> = {
    processing: 'info',
    flagged: 'error',
    approved: 'success'
  }
  return colorMap[status] || 'neutral'
}

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
const AIQueueItems: AIQueueItem[] = [
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
const reviewAIItem = (item: AIQueueItem): void => {
  selectedAIItem.value = item
  showAIReviewModal.value = true
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
      color: 'primary'
    })

    showAIReviewModal.value = false

    aiReviewForm.value = {
      decision: '',
      confidenceOverride: '',
      note: ''
    }
  } catch (error) {
    console.log(error)
    toast.add({
      title: 'Error',
      description: 'Failed to submit AI review',
      color: 'error'
    })
  } finally {
    submittingAIReview.value = false
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
