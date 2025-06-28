<template>
  <div class="p-4 bg-white dark:bg-gray-800 shadow rounded-lg">
    <div v-if="pendingVoices" class="flex justify-center items-center py-4">
      <USkeleton class="h-8 w-full" />
      <USkeleton class="h-8 w-full mt-2" />
    </div>

    <div v-else-if="voiceError" class="mb-4">
      <UAlert
        icon="i-lucide-alert-circle"
        color="error"
        variant="soft"
        title="Lỗi tải cấu hình giọng nói"
        :description="voiceError.message || 'Không thể tải danh sách giọng nói.'"
      />
      <UButton icon="i-lucide-refresh-cw" class="mt-2">
        Thử lại
      </UButton>
    </div>

    <UForm v-else :state="formState" @submit="generateAudio">
      <UFormField label="Chọn giọng đọc" name="voice" class="mb-4">
        <USelectMenu
          v-model="selectedVoiceName"
          :items="voiceOptions"
          placeholder="Chọn một giọng đọc"
          value-attribute="name"
          option-attribute="label"
          class="w-full"
        />
      </UFormField>

      <!-- <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <UFormField label="Cao độ (Pitch)" name="pitch" help="Điều chỉnh độ cao của giọng nói (-20.0 đến 20.0)">
          <UInput
            v-model.number="formState.pitch"
            type="number"
            step="0.1"
            min="-20"
            max="20"
            placeholder="0.0"
          />
        </UFormField>

        <UFormField label="Tốc độ nói (Speaking Rate)" name="speakingRate" help="Điều chỉnh tốc độ nói (0.25 đến 4.0)">
          <UInput
            v-model.number="formState.speakingRate"
            type="number"
            step="0.05"
            min="0.25"
            max="4"
            placeholder="1.0"
          />
        </UFormField>
      </div> -->

      <div class="mb-4 p-3 border border-gray-200 dark:border-gray-700 rounded-md">
        <h4 class="font-semibold text-gray-800 dark:text-gray-100 mb-2">
          Nghe thử cấu hình giọng đọc
        </h4>
        <UFormField label="Đoạn văn bản nghe thử" name="previewText" class="mb-2">
          <UTextarea
            v-model="previewText"
            placeholder="Nhập đoạn văn bản muốn nghe thử..."
            class="w-full"
            :rows="3"
            :maxrows="5"
          />
        </UFormField>

        <UButton
          icon="i-lucide-ear"
          color="neutral"
          variant="solid"
          :loading="isGeneratingPreview"
          :disabled="!selectedVoiceName || !previewText || isGeneratingPreview"
          class="w-full justify-center mb-2"
          @click="generatePreviewAudio"
        >
          {{ isGeneratingPreview ? 'Đang tạo bản nghe thử...' : 'Nghe thử' }}
        </UButton>

        <div v-if="previewError" class="mt-2">
          <UAlert
            icon="i-lucide-triangle-alert"
            color="error"
            variant="soft"
            :description="previewError"
          />
        </div>

        <div v-if="previewAudioUrl" class="mt-2">
          <audio
            ref="previewAudioPlayer"
            :src="previewAudioUrl"
            controls
            class="w-full"
          >
            Trình duyệt của bạn không hỗ trợ audio.
          </audio>
        </div>
      </div>

      <UButton
        type="submit"
        color="primary"
        variant="solid"
        :loading="isGenerating"
        :disabled="!selectedVoiceName || isGenerating"
        icon="i-lucide-audio-lines"
        size="lg"
        class="w-full justify-center"
      >
        {{ isGenerating ? 'Đang tạo Audio...' : 'Tạo Audio' }}
      </UButton>

      <div v-if="isGenerating" class="mt-4">
        <UProgress animation="carousel" />
        <p class="text-center text-sm text-gray-500 dark:text-gray-400 mt-2">
          Quá trình này có thể mất một chút thời gian...
        </p>
      </div>

      <div v-if="generationError" class="mt-4">
        <UAlert
          icon="i-lucide-triangle-alert"
          color="error"
          variant="soft"
          title="Lỗi tạo Audio"
          :description="generationError"
        />
      </div>

      <div v-if="generatedAudio" class="mt-4">
        <UAlert
          icon="i-lucide-check-circle"
          color="success"
          variant="soft"
          title="Tạo Audio thành công!"
          description="Audio mới đã được tạo và lưu trữ."
        />
        <div class="mt-4">
          <h4 class="font-semibold text-gray-800 dark:text-gray-100 mb-2">
            Audio đã tạo:
          </h4>
          <audio
            :src="generatedAudio.audioFileUrl"
            controls
            class="w-full"
          >
            Trình duyệt của bạn không hỗ trợ audio.
          </audio>
          <p v-if="generatedAudio.subtitleFileUrl" class="text-sm text-gray-600 dark:text-gray-400 mt-2">
            Phụ đề: <a :href="generatedAudio.subtitleFileUrl" target="_blank" class="text-primary-500 hover:underline">Tải về VTT</a>
          </p>
          <p class="text-sm text-gray-600 dark:text-gray-400">
            Giọng đọc: {{ generatedAudio.voiceConfig.name }}
          </p>
        </div>
      </div>
    </UForm>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed, nextTick } from 'vue'
import type { Chapter, IVoice } from '~/types/chapter' // Điều chỉnh đường dẫn

// Định nghĩa Props
const props = defineProps<{
  chapter: Chapter | undefined
  // novelName: string // Cần tên tiểu thuyết để truyền vào hàm backend
}>()

// Refs cho trạng thái
const allVoices = ref<IVoice[]>([])
const selectedVoiceName = ref<{ label: string, name: string } | undefined>(undefined) // Tên giọng đọc được chọn trong dropdown
const isGenerating = ref(false) // Trạng thái cho việc tạo audio đầy đủ
const generationError = ref<string | null>(null)
type GeneratedAudio = {
  audioFileUrl: string
  subtitleFileUrl: string
  voiceConfig: IVoice
  duration: number
  size: number
}

const generatedAudio = ref<GeneratedAudio | null>(null)

// Form state cho các tùy chỉnh
const formState = ref({
  pitch: 0.0,
  speakingRate: 1.0
})

// Ref cho Audio Preview
const previewText = ref<string>((props.chapter?.content ?? '').substring(0, Math.min((props.chapter?.content ?? '').length, 200))) // Mặc định lấy 200 ký tự đầu
const previewAudioUrl = ref<string | null>(null)
const isGeneratingPreview = ref(false)
const previewError = ref<string | null>(null)
const previewAudioPlayer = ref<HTMLAudioElement | null>(null)

// Fetch danh sách giọng nói từ API
const { pending: pendingVoices, error: voiceError } = await useFetch<{ voices: IVoice[] }>('http://localhost:5000/api/v1/chapter/voices', {
  lazy: true,
  method: 'GET', // Tải bất đồng bộ
  credentials: 'include', // Bao gồm Credentials
  onResponse({ response }) {
    if (response._data && response._data.voices) {
      allVoices.value = response._data.voices
      // Chọn giọng mặc định nếu có và chưa có lựa chọn
      if (allVoices.value.length > 0 && !selectedVoiceName.value) {
        const firstVoice = allVoices.value[0]
        selectedVoiceName.value = {
          label: `${firstVoice?.name} (${firstVoice?.ssmlGender === 'FEMALE' ? 'Nữ' : 'Nam'}) - ${firstVoice?.languageCodes.join(', ')}`,
          name: firstVoice?.name ?? ''
        } // Chọn giọng đầu tiên làm mặc định
      }
    }
  }
})

// Computed property để tạo options cho USelect
const voiceOptions = computed(() => {
  return allVoices.value.map(voice => ({
    label: `${voice.name} (${voice.ssmlGender === 'FEMALE' ? 'Nữ' : 'Nam'}) - ${voice.languageCodes.join(', ')}`,
    name: voice.name // Value cho USelect
  }))
})

// Computed property để lấy cấu hình giọng nói đầy đủ từ tên đã chọn
const selectedVoiceConfig = computed<IVoice | undefined>(() => {
  return allVoices.value.find(voice => voice.name === selectedVoiceName.value?.name)
})

// Watch để reset lỗi và kết quả khi thay đổi lựa chọn hoặc chapter
watch([selectedVoiceName, () => props.chapter?._id], () => {
  generationError.value = null
  generatedAudio.value = null
  // Reset preview cũng
  previewAudioUrl.value = null
  previewError.value = null
})

// Hàm tạo audio đầy đủ
async function generateAudio() {
  if (!selectedVoiceConfig.value || !props.chapter) {
    generationError.value = 'Vui lòng chọn giọng đọc và đảm bảo thông tin chương/truyện đầy đủ.'
    return
  }

  isGenerating.value = true
  generationError.value = null
  generatedAudio.value = null

  try {
    const response = await $fetch(`http://localhost:5000/api/v1/chapter/${props.chapter._id}/custom`, {
      method: 'POST',
      credentials: 'include',
      body: {
        content: props.chapter.content,
        chapterName: props.chapter.title,
        chapterId: props.chapter._id,
        voiceConfig: selectedVoiceConfig.value,
        customConfig: {
          pitch: formState.value.pitch,
          speakingRate: formState.value.speakingRate
        }
      }
    })
    generatedAudio.value = response as GeneratedAudio
  } catch (error: unknown) {
    console.error('Lỗi khi gọi API tạo audio:', error)
    if (typeof error === 'object' && error !== null && 'data' in error && typeof (error as Record<string, unknown>).data === 'object') {
      generationError.value = (error as { data?: { message?: string } }).data?.message || 'Không thể tạo audio. Vui lòng thử lại.'
    } else {
      generationError.value = 'Không thể tạo audio. Vui lòng thử lại.'
    }
  } finally {
    isGenerating.value = false
  }
}

// Hàm tạo audio preview
async function generatePreviewAudio() {
  if (!selectedVoiceConfig.value || !previewText.value.trim()) {
    previewError.value = 'Vui lòng nhập đoạn văn bản và chọn giọng đọc để nghe thử.'
    return
  }

  isGeneratingPreview.value = true
  previewError.value = null
  previewAudioUrl.value = null

  try {
    // Gọi API backend để tạo audio preview
    // Giả định API này trả về một object { audioUrl: string }
    const response = await $fetch('http://localhost:5000/api/v1/chapter/preview', { // Endpoint API mới cho preview
      method: 'POST',
      credentials: 'include',
      body: {
        text: previewText.value,
        voiceConfig: selectedVoiceConfig.value,
        customConfig: {
          pitch: formState.value.pitch,
          speakingRate: formState.value.speakingRate
        }
      }
    })

    const { audioUrl } = response as { audioUrl: string }
    previewAudioUrl.value = audioUrl
    // Tự động phát sau khi có URL
    if (previewAudioPlayer.value) {
      await nextTick() // Đảm bảo thẻ audio đã được render
      previewAudioPlayer.value.load() // Tải lại nguồn âm thanh
      previewAudioPlayer.value.play().catch((e) => {
        // Có thể xử lý lỗi phát audio ở đây nếu cần
        console.warn('Không thể tự động phát audio preview:', e)
      })
    }
  } catch (error: unknown) {
    console.error('Lỗi khi nghe thử audio:', error)
    if (typeof error === 'object' && error !== null && 'data' in error && typeof (error as Record<string, unknown>).data === 'object') {
      previewError.value = (error as { data?: { message?: string } }).data?.message || 'Không thể tạo bản nghe thử. Vui lòng thử lại.'
    } else {
      previewError.value = 'Không thể tạo bản nghe thử. Vui lòng thử lại.'
    }
  } finally {
    isGeneratingPreview.value = false
  }
}
</script>
