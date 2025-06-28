<script setup lang="ts">
import { ref, reactive } from 'vue'
import type { Chapter } from '~/types/chapter'
import { useChapters } from '~/composables/useChapters'
import type { statusPublish } from '~/types'

const props = defineProps<{
  novelId: string
}>()

const emit = defineEmits<{
  (e: 'submit', data: Chapter): void
}>()

const toast = useToast()
const { createChapter } = useChapters()

const defaultChapter = (): Chapter => ({
  _id: '',
  title: '',
  novelId: props.novelId,
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
const agreed = ref(false)
const errors = ref<Record<string, string>>({})
const loading = ref(false)

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
  if (!localChapter.novelId) {
    errors.value.novelId = 'ID truyện không hợp lệ.'
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
    await createChapter(localChapter)
    emit('submit', localChapter)
    Object.assign(localChapter, defaultChapter())
    agreed.value = false
    errors.value = {}
  } catch (err) {
    toast.add({
      title: 'Lỗi',
      description: err instanceof Error ? err.message : 'Không thể tạo chương.',
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}

function cancel() {
  Object.assign(localChapter, defaultChapter())
  agreed.value = false
  errors.value = {}
}
</script>

<template>
  <UCard class="max-w-5xl mx-auto space-y-4">
    <UForm :state="localChapter" class="space-y-4" @submit.prevent="submitChapter">
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
      <div class="w-full space-y-1">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">ID Truyện</label>
        <UInput
          v-model="localChapter.novelId"
          placeholder="Nhập ID truyện"
          class="w-full"
          :error="errors.novelId"
          disabled
        />
        <span v-if="errors.novelId" class="text-sm text-red-500">{{ errors.novelId }}</span>
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
        <UButton type="submit" color="primary" :disabled="!agreed || loading">
          Tạo mới
        </UButton>
      </div>
    </UForm>
  </UCard>
</template>
