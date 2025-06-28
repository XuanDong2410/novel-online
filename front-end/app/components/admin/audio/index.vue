<template>
  <div class="p-4 bg-white dark:bg-gray-800 shadow rounded-lg">
    <div class="flex justify-between">
      <h3 class="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
        Audio của Chương "{{ chapter?.title }}"
      </h3>
      <UButton
        color="primary"
        variant="ghost"
        class="mb-4"
        @click="isAddAudioModalOpen = true"
      >
        Thêm âm thanh
      </UButton>
    </div>
    <div v-if="loadingSubtitles" class="text-gray-500 dark:text-gray-400 mb-4">
      Đang tải phụ đề...
    </div>

    <div v-if="chapter && chapter.audios && chapter.audios.length > 0">
      <UAccordion :items="audioListItems" multiple>
        <template #default="{ item }">
          <UButton
            color="neutral"
            variant="ghost"
            class="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <span class="truncate">{{ item.label }}</span>

            <!-- <template #trailing>
              <UIcon
                name="i-heroicons-chevron-right-20-solid"
                class="w-5 h-5 ml-auto transform transition-transform duration-200"
                :class="[open && 'rotate-90']"
              />
            </template> -->
          </UButton>
        </template>

        <template #content="{ item }">
          <div class="px-4 py-3">
            <div class="mb-4">
              <audio
                ref="audioPlayer"
                :src="item.data.audioFileUrl"
                class="w-full"
                controls
                @timeupdate="handleTimeUpdate"
                @loadedmetadata="handleLoadedMetadata"
                @play="currentPlayingAudio = item.data"
                @pause="currentPlayingAudio = null"
              >
                Trình duyệt của bạn không hỗ trợ phần tử audio.
                <track
                  v-if="item.data.subtitle?.url"
                  kind="subtitles"
                  :label="item.data.subtitle.language || 'Tiếng Việt'"
                  :src="item.data.subtitle.url"
                  default
                >
              </audio>
            </div>

            <div
              v-if="currentPlayingAudio?._id === item.data._id && currentSubtitleText"
              class="mt-4 p-3 bg-gray-100 dark:bg-gray-700 rounded-md text-gray-800 dark:text-gray-200 text-center"
            >
              {{ currentSubtitleText }}
            </div>
            <div
              v-else-if="currentPlayingAudio?._id === item.data._id && !currentSubtitleText && item.data.subtitle?.url"
              class="mt-4 p-3 bg-gray-100 dark:bg-gray-700 rounded-md text-gray-800 dark:text-gray-200 text-center text-sm"
            >
              Không có phụ đề tại thời điểm hiện tại.
            </div>
            <div
              v-else-if="currentPlayingAudio?._id !== item.data._id && item.data.subtitle?.url"
              class="mt-4 p-3 bg-gray-100 dark:bg-gray-700 rounded-md text-gray-800 dark:text-gray-200 text-center text-sm"
            >
              Phụ đề sẽ hiển thị khi audio đang phát.
            </div>
            <div
              v-else-if="!item.data.subtitle?.url"
              class="mt-4 p-3 bg-gray-100 dark:bg-gray-700 rounded-md text-gray-800 dark:text-gray-200 text-center text-sm"
            >
              Không có file phụ đề cho audio này.
            </div>
          </div>
        </template>
      </UAccordion>
    </div>
    <div v-else class="text-gray-500 dark:text-gray-400">
      Chương này hiện chưa có audio nào.
    </div>
  </div>
  <UModal v-model:open="isAddAudioModalOpen">
    <template #content>
      <AdminAudioCreate :chapter="props.chapter" />
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Chapter, IAudio } from '~/types/chapter' // Điều chỉnh đường dẫn đến file types của bạn

// Định nghĩa Props
const props = defineProps<{
  chapter: Chapter | undefined
}>()

// Refs cho trạng thái audio
const audioPlayer = ref<HTMLAudioElement | null>(null)
const currentPlayingAudio = ref<IAudio | null>(null)
const audioDuration = ref(0)
const audioProgress = ref(0)
const isPlaying = ref(false)
const isAddAudioModalOpen = ref(false)

// Refs cho Subtitle
interface SubtitleCue {
  start: number
  end: number
  text: string
}
const allSubtitles = ref<Record<string, SubtitleCue[]>>({}) // Lưu trữ phụ đề cho từng audio
const currentSubtitleText = ref('')
const loadingSubtitles = ref(false)

// Computed property để chuẩn bị dữ liệu cho UAccordion
const audioListItems = computed(() => {
  // Đảm bảo chapter.audios là mảng IAudio[]
  if (!props.chapter || !props.chapter.audios || typeof props.chapter.audios[0] === 'string') {
    return []
  }
  return (props.chapter.audios as IAudio[]).map((audio: IAudio) => ({
    label: audio.audioName,
    icon: 'i-lucide-headphones', // Icon cho mỗi audio
    data: audio // Gắn kèm dữ liệu IAudio để dễ dàng truy cập trong template
  }))
})

// Watch khi chapter hoặc audio đang phát thay đổi để tải phụ đề
watch(currentPlayingAudio, (newAudio) => {
  currentSubtitleText.value = '' // Reset subtitle khi chuyển audio
  if (newAudio && newAudio.subtitle?.url && !allSubtitles.value[newAudio._id]) {
    loadVttFile(newAudio._id, newAudio.subtitle.url)
  }
}, { immediate: true }) // Chạy ngay khi component mounted để tải phụ đề cho audio đầu tiên nếu có

// Hàm tải và phân tích cú pháp file VTT
async function loadVttFile(audioId: string, url: string) {
  loadingSubtitles.value = true
  try {
    const response = await fetch(url)
    const vttText = await response.text()
    const cues = parseVtt(vttText)
    allSubtitles.value[audioId] = cues
  } catch (error) {
    console.error(`Lỗi khi tải hoặc phân tích cú pháp VTT cho audio ${audioId}:`, error)
    allSubtitles.value[audioId] = [] // Đảm bảo là mảng rỗng nếu có lỗi
  } finally {
    loadingSubtitles.value = false
  }
}

// Hàm đơn giản để phân tích cú pháp VTT (có thể cần thư viện phức tạp hơn cho VTT đầy đủ)
function parseVtt(vttText: string): SubtitleCue[] {
  const cues: SubtitleCue[] = []
  const lines = vttText.split(/\r?\n/)
  let i = 0
  while (i < lines.length) {
    if (lines[i]?.includes('-->')) {
      const timeParts = lines[i]?.split('-->').map(s => s.trim())
      const start = parseVttTime(timeParts && timeParts[0] ? timeParts[0] : '0')
      const end = parseVttTime(timeParts && timeParts[1] ? timeParts[1] : '0')
      let text = ''
      i++
      while (i < lines.length && lines[i]?.trim() !== '') {
        text += (text ? '\n' : '') + lines[i]?.trim()
        i++
      }
      cues.push({ start, end, text })
    }
    i++
  }
  return cues
}

// Hàm chuyển đổi thời gian VTT (hh:mm:ss.sss) thành giây
function parseVttTime(timeStr: string): number {
  const parts = timeStr.split(':')
  let seconds = 0
  if (parts.length === 3) { // hh:mm:ss.sss
    seconds += parseFloat(parts[0] ?? '0') * 3600
    seconds += parseFloat(parts[1] ?? '0') * 60
    seconds += parseFloat(parts[2] ?? '0')
  } else if (parts.length === 2) { // mm:ss.sss
    seconds += parseFloat(parts[0] ?? '0') * 60
    seconds += parseFloat(parts[1] ?? '0')
  } else { // ss.sss (unlikely for VTT but for robustness)
    seconds += parseFloat(parts[0] ?? '0')
  }
  return seconds
}

// Hàm xử lý sự kiện timeupdate của audio
function handleTimeUpdate() {
  if (audioPlayer.value) {
    audioProgress.value = audioPlayer.value.currentTime
    isPlaying.value = !audioPlayer.value.paused

    // Cập nhật phụ đề hiện tại
    if (currentPlayingAudio.value && allSubtitles.value[currentPlayingAudio.value._id]) {
      const currentCues = allSubtitles.value[currentPlayingAudio.value._id]
      const currentCue = currentCues?.find(
        cue => audioPlayer.value!.currentTime >= cue.start && audioPlayer.value!.currentTime < cue.end
      )
      currentSubtitleText.value = currentCue ? currentCue.text : ''
    } else {
      currentSubtitleText.value = ''
    }
  }
}

// Hàm xử lý khi metadata của audio được tải
function handleLoadedMetadata() {
  if (audioPlayer.value) {
    audioDuration.value = audioPlayer.value.duration
  }
}

// Exposed for custom controls (nếu bạn muốn dùng thay vì controls mặc định)
// function togglePlayPause() {
//   if (audioPlayer.value) {
//     if (isPlaying.value) {
//       audioPlayer.value.pause();
//     } else {
//       audioPlayer.value.play();
//     }
//     isPlaying.value = !isPlaying.value;
//   }
// }

// function handleSeek(event: Event) {
//   if (audioPlayer.value) {
//     audioPlayer.value.currentTime = parseFloat((event.target as HTMLInputElement).value);
//   }
// }
</script>

<style scoped>
/* Các style tùy chỉnh nếu cần */
</style>
