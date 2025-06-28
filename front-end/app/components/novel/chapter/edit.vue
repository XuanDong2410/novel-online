<script setup lang="ts">
import { ref, reactive, watch, onUnmounted } from 'vue'
import type { Chapter } from '~/types/chapter'
import type { statusPublish } from '~/types'
import { useChapters } from '~/composables/useChapters'

const props = defineProps<{
  chapterId: string
}>()

const emit = defineEmits<{
  (e: 'submit', data: Chapter): void
}>()

const toast = useToast()
const { getChapterById, updateChapter } = useChapters()
const { useChapterStatus } = useStatus()
const {
  activeAction,
  isModalOpen,
  openActionModal,
  handleSubmitAction
} = useModalActionHandler()
console.log('edit.vue: updateChapter function available:', !!updateChapter)

// Ensure chapterConfig is typed as a record with statusPublish keys
// (If useStatus already returns the correct type, you can skip this cast)

if (!props.chapterId) {
  toast.add({ title: 'Lỗi', description: 'ID chương không hợp lệ.', color: 'error' })
}

const defaultChapter = (): Chapter => ({
  _id: '',
  title: '',
  novelId: '',
  content: '',
  chapterNumber: 0,
  status: 'draft' as statusPublish,
  isPublished: false,
  reports: [],
  createdAt: new Date(),
  updatedAt: new Date(),
  viewCount: 0,
  wordCount: 0,
  averageListenTime: 0
})

const localChapter = reactive<Chapter>(defaultChapter())
const originalChapter = ref<Chapter | null>(null)
const agreed = ref(false)
const errors = ref<Record<string, string>>({})
const loading = ref(false)
const canEdit = computed(() => {
  // Only allow editing if chapter status is 'draft' or 'editing'
  return localChapter.status === 'draft' || localChapter.status === 'editing'
})
const { data: chapterData, error: fetchError } = await useAsyncData(
  `chapter-${props.chapterId}`,
  async () => {
    if (!props.chapterId) return null
    try {
      const { data } = await getChapterById(props.chapterId)
      return data.value
    } catch (err) {
      console.error('Error fetching chapter:', err)
    }
  }
)
const statusConfig = computed(() => {
  const config = useChapterStatus(localChapter.status)
  // Attach click handler to actions
  return {
    ...config,
    actions: config.actions.map((action: StatusAction) => ({
      ...action,
      click: () => openActionModal(action)
    }))
  }
})

watch(
  () => [chapterData.value, fetchError.value],
  ([newChapter, newError]) => {
    if (newError) {
      toast.add({
        title: 'Lỗi',
        description: `Không thể tải dữ liệu chương: ${typeof newError === 'object' && newError && 'message' in newError ? (newError as { message?: string }).message : String(newError) || 'Unknown error'}`,
        color: 'error'
      })
      Object.assign(localChapter, defaultChapter())
      originalChapter.value = null
      return
    }
    if (newChapter && typeof newChapter === 'object' && '_id' in newChapter) {
      console.log('Syncing chapter:', newChapter)
      const copy: Chapter = {
        _id: (newChapter as Chapter)._id || '',
        title: (newChapter as Chapter).title || '',
        novelId: (newChapter as Chapter).novelId || '',
        content: (newChapter as Chapter).content || '',
        chapterNumber: (newChapter as Chapter).chapterNumber || 0,
        status: (newChapter as Chapter).status || 'draft',
        isPublished: (newChapter as Chapter).isPublished || false,
        reports: [],
        createdAt: (newChapter as Chapter).createdAt ? new Date((newChapter as Chapter).createdAt) : new Date(),
        updatedAt: (newChapter as Chapter).updatedAt ? new Date((newChapter as Chapter).updatedAt) : new Date(),
        viewCount: (newChapter as Chapter).viewCount || 0,
        wordCount: (newChapter as Chapter).wordCount || 0,
        averageListenTime: (newChapter as Chapter).averageListenTime || 0
      }
      Object.assign(localChapter, copy)
      originalChapter.value = { ...copy }
    } else {
      console.warn('No chapter data, falling back to default')
      Object.assign(localChapter, defaultChapter())
      originalChapter.value = null
      if (!newError) {
        toast.add({ title: 'Lỗi', description: 'Không tìm thấy chương.', color: 'error' })
      }
    }
  },
  { immediate: true }
)

function validateForm(): boolean {
  errors.value = {}
  if (!localChapter.title.trim()) {
    errors.value.title = 'Tiêu đề chương không được để trống.'
  } else if (localChapter.title.length > 200) {
    errors.value.title = 'Tiêu đề chương không được vượt quá 200 ký tự.'
  }
  if (!localChapter.content.trim()) {
    errors.value.content = 'Nội dung chương không được để trống.'
  } else if (localChapter.content.length > 100000) {
    errors.value.content = 'Nội dung chương không được vượt quá 100,000 ký tự.'
  }
  if (localChapter.chapterNumber < 0) {
    errors.value.chapterNumber = 'Số thứ tự chương phải lớn hơn hoặc bằng 0.'
  }
  return Object.keys(errors.value).length === 0
}

async function submitChapter() {
  if (!agreed.value) {
    toast.add({ title: 'Lỗi', description: 'Vui lòng đồng ý với điều khoản dịch vụ.', color: 'error' })
    return
  }
  if (!validateForm()) {
    toast.add({ title: 'Lỗi', description: 'Vui lòng kiểm tra các trường dữ liệu.', color: 'error' })
    return
  }

  loading.value = true
  try {
    // Test server availability
    // await $fetch('http://localhost:5000/api/v1/user/chapters/ping', { method: 'GET', timeout: 2000 }).catch(() => {
    //   throw new Error('Không thể kết nối đến server. Vui lòng kiểm tra server backend.')
    // })
    // console.log('Submitting chapter update:', localChapter)
    await updateChapter(props.chapterId, localChapter)
    emit('submit', localChapter)
    toast.add({ title: 'Thành công', description: 'Chương đã được cập nhật.', color: 'success' })
    agreed.value = false
    errors.value = {}
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Không thể cập nhật chương.'
    toast.add({ title: 'Lỗi', description: errorMessage, color: 'error' })
    console.error('Submit chapter error:', err)
  } finally {
    loading.value = false
  }
}

function cancel() {
  if (originalChapter.value) {
    Object.assign(localChapter, { ...originalChapter.value })
  } else {
    Object.assign(localChapter, defaultChapter())
  }
  agreed.value = false
  errors.value = {}
}

onUnmounted(() => {
  console.log('NovelChapterEdit unmounted')
})
</script>

<template>
  <ClientOnly>
    <UCard class="max-w-5xl mx-auto space-y-4">
      <div v-if="fetchError" class="text-center py-4 text-red-500">
        Lỗi khi tải dữ liệu chương: {{ fetchError.message || 'Unknown error' }}
      </div>
      <UForm
        v-else-if="chapterData"
        :state="localChapter"
        class="space-y-4"
        @submit.prevent="submitChapter"
      >
        <div v-if="!canEdit" class="space-y-1">
          <UBanner
            v-if="!canEdit"
            :color="statusConfig.color"
            :icon="statusConfig.icon"
            :title="statusConfig.title"
            variant="soft"
            class="mb-2"
            :actions="statusConfig.actions"
          />
          <UModal v-model:open="isModalOpen">
            <template #content>
              <UCard class="p-4">
                <h3 class="text-lg font-semibold mb-2">
                  {{ activeAction?.label }}
                </h3>
                <p>Bạn có chắc muốn thực hiện hành động này?</p>
                <div class="flex justify-end gap-2 mt-4">
                  <UButton color="neutral" @click="isModalOpen = false">
                    Hủy
                  </UButton>
                  <UButton color="primary" @click="handleSubmitAction(props.chapterId)">
                    Xác nhận
                  </UButton>
                </div>
              </UCard>
            </template>
          </UModal>
        </div>
        <div class="w-full space-y-1">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Tiêu đề chương</label>
          <UInput
            v-model="localChapter.title"
            placeholder="Nhập tên chương"
            class="w-full"
            :error="errors.title"
            :disabled="loading"
          />
          <span v-if="errors.title" class="text-sm text-red-500">{{ errors.title }}</span>
        </div>
        <div class="w-full space-y-1">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Nội dung</label>
          <UTextarea
            v-model="localChapter.content"
            placeholder="Nội dung chương..."
            class="w-full h-[calc(100%+50rem)]"
            :rows="18"
            :error="errors.content"
            :disabled="loading"
          />
          <span v-if="errors.content" class="text-sm text-red-500">{{ errors.content }}</span>
        </div>
        <div class="w-full space-y-1">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Số thứ tự chương</label>
          <UInput
            v-model.number="localChapter.chapterNumber"
            type="number"
            placeholder="Số thứ tự chương"
            class="w-full"
            :error="errors.chapterNumber"
            :disabled="loading"
          />
          <span v-if="errors.chapterNumber" class="text-sm text-red-500">{{ errors.chapterNumber }}</span>
        </div>
        <div class="flex items-center space-x-2 pt-4 border-t border-gray-200 dark:border-gray-700">
          <UCheckbox v-model="agreed" :disabled="loading" />
          <span class="text-sm text-gray-700 dark:text-gray-300">
            Tôi đồng ý với
            <strong class="text-blue-500 hover:text-blue-400">Điều khoản Dịch vụ</strong>
          </span>
        </div>
        <div class="flex justify-end space-x-2">
          <UButton color="neutral" :disabled="loading" @click="cancel">
            Hủy bỏ
          </UButton>
          <UButton type="submit" color="primary" :disabled="!agreed || loading || !canEdit">
            Cập nhật
          </UButton>
        </div>
      </UForm>
      <div v-else class="text-center py-4">
        Đang tải...
      </div>
    </UCard>
  </ClientOnly>
</template>
