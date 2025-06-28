<template>
  <USlideover
    v-model:open="sidebarOpen"
    aria-describedby="undefined"
    title=""
    side="left"
  >
    <template #content>
      <div v-if="pending" class="p-4 text-center">
        <USkeleton class="h-6 w-32" />
      </div>
      <div v-else-if="error" class="p-4 text-red-500">
        {{ error }}
      </div>
      <div v-else class="space-y-2 overflow-y-auto h-[calc(100vh-10px)] my-2">
        <div class="flex items-center justify-between mb-4 mx-2">
          <h3 class="font-semibold text-gray-900 dark:text-white">
            Danh sách chương
          </h3>
          <UBadge color="primary" variant="subtle">
            {{ pendingChapters.length }} chờ duyệt
          </UBadge>
        </div>
        <div v-if="pendingChapters.length" class="flex items-center justify-between mb-3 mx-2">
          <UCheckbox
            v-model="selectAll"
            label="Chọn tất cả"
            aria-label="Chọn tất cả các chương chờ duyệt"
            @update:model-value="toggleSelectAll"
          />
          <div v-if="selectedChapters.length" class="flex items-center gap-2">
            <UButton
              icon="i-lucide-check"
              size="xs"
              variant="outline"
              color="success"
              :loading="batchLoading"
              aria-label="Duyệt các chương đã chọn"
              @click="batchApprove"
            >
              Duyệt {{ selectedChapters.length }}
            </UButton>
            <UButton
              icon="i-lucide-x"
              size="xs"
              variant="outline"
              color="error"
              :loading="batchLoading"
              aria-label="Từ chối các chương đã chọn"
              @click="batchReject"
            >
              Từ chối {{ selectedChapters.length }}
            </UButton>
          </div>
        </div>
        <div
          v-for="chapter in chapters"
          :key="chapter._id"
          class="p-3 mx-2 rounded-lg border cursor-pointer transition-colors"
          :class="[
            currentChapter?._id === chapter._id
              ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
              : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
          ]"
          @click="selectChapter(chapter)"
        >
          <div class="flex items-center justify-between gap-2 mb-2">
            <UCheckbox
              :checked="selectedChapters.includes(chapter._id)"
              :disabled="chapter.status === 'approved' || chapter.status === 'rejected'"
              :aria-label="`Chọn chương: ${chapter.title}`"
              @update:checked="(checked: boolean) => {
                if (checked) {
                  if (!selectedChapters.includes(chapter._id)) selectedChapters.push(chapter._id)
                }
                else {
                  selectedChapters = selectedChapters.filter(id => id !== chapter._id)
                }
              }"
            />
            <span class="font-medium text-sm truncate max-w-[70%]">{{ chapter.title }}</span>
            <UBadge
              :color="getStatusColor(chapter.status)"
              :icon="getStatusIcon(chapter.status)"
              variant="subtle"
              size="xs"
            >
              {{ getStatusLabel(chapter.status) }}
            </UBadge>
          </div>
          <div class="flex items-center gap-2 sm:gap-4 text-xs text-gray-500">
            <span>{{ chapter.wordCount || 0 }} từ</span>
            <span>{{ formatDate(chapter.createdAt) }}</span>
          </div>
          <div v-if="chapter.violation?.count?.total ?? 0 > 0" class="mt-2 space-y-1">
            <div class="flex items-center gap-1">
              <UIcon name="i-lucide-alert-triangle" class="w-3 h-3 text-orange-500" />
              <span class="text-xs text-orange-600">{{ chapter.violation?.count?.total ?? 0 }} vấn đề</span>
            </div>
            <div class="text-xs text-gray-600 dark:text-gray-400 flex flex-wrap gap-2">
              <span v-if="chapter.violation?.count?.violence">Bạo lực: {{ chapter.violation.count.violence }}</span>
              <span v-if="chapter.violation?.count?.adult">Người lớn: {{ chapter.violation.count.adult }}</span>
              <span v-if="chapter.violation?.count?.hate_speech">Thù địch: {{ chapter.violation.count.hate_speech }}</span>
              <span v-if="chapter.violation?.count?.spam">Spam: {{ chapter.violation.count.spam }}</span>
            </div>
          </div>
        </div>
      </div>
    </template>
  </USlideover>
</template>

<script setup lang="ts">
import { useStatus } from '~/composables/useStatus'
import type { statusPublish } from '~/types'
import type { Chapter } from '~/types/chapter'

const props = defineProps<{
  chapters: Chapter[]
  selectedChapterId?: string | null
  openSidebar: boolean
}>()

const emit = defineEmits<{
  (e: 'update:selectedChapter', chapter: Chapter): void
  (e: 'update:openSidebar', value: boolean): void
}>()

const { getStatusColor, getStatusLabel, getStatusIcon } = useStatus()
const toast = useToast()
const chapters = ref<Chapter[]>(props.chapters)
const currentChapter = ref<Chapter | null>(null)
const sidebarOpen = computed({
  get: () => props.openSidebar,
  set: value => emit('update:openSidebar', value)
})
const selectAll = ref(false)
const selectedChapters = ref<string[]>([])
const pending = ref(false)
const error = ref<string | null>(null)
const batchLoading = ref(false)

const pendingChapters = computed(() =>
  chapters.value.filter(ch => ['pending', 'in_review'].includes(ch.status))
)

watch(
  [() => props.selectedChapterId, chapters],
  ([newId, newChapters]) => {
    if (newId && newChapters) {
      const foundChapter = newChapters.find(ch => ch._id === newId)
      currentChapter.value = foundChapter || newChapters[0] || null
    } else if (newChapters && newChapters.length) {
      currentChapter.value = newChapters[0] || null
    }
  },
  { immediate: true }
)

watch(selectAll, (value) => {
  if (value) {
    selectedChapters.value = pendingChapters.value.map(ch => ch._id)
  } else {
    selectedChapters.value = []
  }
})

const formatDate = (date: string | Date) => {
  return new Date(date).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })
}

const selectChapter = async (chapter: Chapter) => {
  try {
    pending.value = true
    currentChapter.value = chapter
    sidebarOpen.value = false
    emit('update:selectedChapter', chapter)
    toast.add({ title: 'Thành công', description: `Đã chọn chương: ${chapter.title}`, color: 'success' })
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Không thể chọn chương'
    toast.add({ title: 'Lỗi', description: error.value, color: 'error' })
  } finally {
    pending.value = false
  }
}

const toggleSelectAll = () => {
  selectAll.value = !selectAll.value
}

const batchApprove = async () => {
  if (!selectedChapters.value.length) return
  batchLoading.value = true
  try {
    console.log('Batch approving chapters:', selectedChapters.value)
    for (const chapterId of selectedChapters.value) {
      const chapter = chapters.value.find(ch => ch._id === chapterId)
      if (chapter && chapter.status !== 'approved') {
        chapter.status = 'approved' as statusPublish
      }
    }
    selectedChapters.value = []
    selectAll.value = false
    toast.add({ title: 'Thành công', description: `Đã duyệt ${selectedChapters.value.length} chương`, color: 'success' })
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Không thể duyệt các chương'
    toast.add({ title: 'Lỗi', description: errorMessage, color: 'error' })
  } finally {
    batchLoading.value = false
  }
}

const batchReject = async () => {
  if (!selectedChapters.value.length) return
  batchLoading.value = true
  try {
    console.log('Batch rejecting chapters:', selectedChapters.value)
    for (const chapterId of selectedChapters.value) {
      const chapter = chapters.value.find(ch => ch._id === chapterId)
      if (chapter && chapter.status !== 'rejected') {
        chapter.status = 'rejected' as statusPublish
      }
    }
    selectedChapters.value = []
    selectAll.value = false
    toast.add({ title: 'Thành công', description: `Đã từ chối ${selectedChapters.value.length} chương`, color: 'success' })
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Không thể từ chối các chương'
    toast.add({ title: 'Lỗi', description: errorMessage, color: 'error' })
  } finally {
    batchLoading.value = false
  }
}
</script>

<style scoped>
::-webkit-scrollbar {
  width: 6px;
}
::-webkit-scrollbar-track {
  background: #f1f1f1;
}
::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}
::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>
