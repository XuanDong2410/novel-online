<template>
  <div class="max-w-4xl mx-auto">
    <!-- Chapter Header -->
    <div class="bg-white rounded-lg shadow-md p-6 mb-6">
      <div class="flex items-center justify-between mb-4">
        <NuxtLink
          :to="`/novels/${novelId}`"
          class="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft class="w-5 h-5" />
          <span>Quay lại</span>
        </NuxtLink>
        <div class="flex items-center space-x-4">
          <button
            :class="[
              'px-4 py-2 rounded-md text-sm font-medium',
              audioSyncEnabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
            ]"
            @click="toggleAudioSync"
          >
            {{ audioSyncEnabled ? 'Tắt đồng bộ' : 'Bật đồng bộ' }}
          </button>
        </div>
      </div>
      <h1 class="text-2xl font-bold text-gray-900 mb-2">
        {{ selectedChapter?.title }}
      </h1>
      <p class="text-gray-600">
        Chương {{ selectedChapter?.chapterNumber }}
      </p>
    </div>

    <!-- Audio Player -->
    <div v-if="currentAudio" class="bg-white rounded-lg shadow-md p-6 mb-6">
      <div class="flex items-center space-x-4 mb-4">
        <button
          class="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700"
          @click="togglePlayPause"
        >
          <Play v-if="!isPlaying" class="w-6 h-6 ml-1" />
          <Pause v-else class="w-6 h-6" />
        </button>
        <div class="flex-1">
          <div class="flex items-center justify-between text-sm text-gray-600 mb-2">
            <span>{{ formatTime(currentTime) }}</span>
            <span>{{ formatTime(duration) }}</span>
          </div>
          <div class="relative">
            <input
              type="range"
              :value="currentTime"
              :max="duration"
              class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              @input="seekAudio"
            >
            <div
              class="absolute top-0 left-0 h-2 bg-blue-600 rounded-lg pointer-events-none"
              :style="{ width: `${(currentTime / duration) * 100}%` }"
            />
          </div>
        </div>
        <div class="flex items-center space-x-2">
          <Volume2 class="w-5 h-5 text-gray-600" />
          <input
            v-model="volume"
            type="range"
            min="0"
            max="1"
            step="0.1"
            class="w-20"
            @input="updateVolume"
          >
        </div>
      </div>
      <audio
        ref="audioPlayer"
        :src="currentAudio.audioFileUrl"
        @loadedmetadata="onAudioLoaded"
        @timeupdate="onTimeUpdate"
        @ended="onAudioEnded"
      />
    </div>

    <!-- Content -->
    <div class="bg-white rounded-lg shadow-md p-8">
      <div class="prose max-w-none">
        <div
          v-for="(sentence, index) in sentences"
          :key="index"
          :class="[
            'sentence cursor-pointer p-2 rounded transition-colors',
            selectedSentenceIndex === index
              ? 'bg-blue-100 border-l-4 border-blue-500'
              : 'hover:bg-gray-50',
            currentSentenceIndex === index && audioSyncEnabled
              ? 'bg-yellow-100 border-l-4 border-yellow-500'
              : ''
          ]"
          :data-start-time="sentence.startTime"
          :data-end-time="sentence.endTime"
          @click="selectSentence(index)"
        >
          {{ sentence.text }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Volume2, ArrowLeft, Play, Pause } from 'lucide-vue-next'
import type { IAudio } from '~/types/chapter'
import { useChapters } from '~/composables/useChapters'

interface Sentence {
  text: string
  startTime: number
  endTime: number
}

const route = useRoute()
// const novelId = route.params.id as string
const chapterId = route.params.chapter as string

const { getChapterById } = useChapters()
const { data: selectedChapter } = await useAsyncData('chapter', async () => {
  const result = await getChapterById(chapterId)
  const raw = result.data.value
  return {
    ...raw,
    novelId: typeof raw?.novelId === 'string' ? raw.novelId : (raw?.novelId?._id ?? ''),
    audios: Array.isArray(raw?.audios) ? raw.audios.filter(a => typeof a === 'object') : []
  }
})
const novelId = selectedChapter.value?.novelId
const sentences = ref<Sentence[]>([])
const selectedSentenceIndex = ref<number>(-1)
const currentSentenceIndex = ref<number>(-1)
const audioSyncEnabled = ref<boolean>(true)
const audioPlayer = ref<HTMLAudioElement | null>(null)
const isPlaying = ref<boolean>(false)
const currentTime = ref<number>(0)
const duration = ref<number>(0)
const volume = ref<number>(1)

const currentAudio = computed(() => {
  if (!selectedChapter.value?.audios?.length) return null
  return selectedChapter.value.audios[0] as IAudio
})

const parseSentences = (content: string) => {
  const sentenceTexts = content.split(/[.!?]+/).filter(s => s.trim().length > 0)
  const avgDuration = currentAudio.value?.duration || 300
  const timePerSentence = avgDuration / sentenceTexts.length

  sentences.value = sentenceTexts.map((text, index) => ({
    text: text.trim(),
    startTime: index * timePerSentence,
    endTime: (index + 1) * timePerSentence
  }))
}

const loadSubtitle = async (subtitleUrl: string) => {
  try {
    console.log('Loading subtitle from:', subtitleUrl)
  } catch (error) {
    console.error('Error loading subtitle:', error)
  }
}

const selectSentence = (index: number) => {
  selectedSentenceIndex.value = index
  if (audioSyncEnabled.value && audioPlayer.value && sentences.value[index]) {
    audioPlayer.value.currentTime = sentences.value[index].startTime
  }
}

const toggleAudioSync = () => {
  audioSyncEnabled.value = !audioSyncEnabled.value
}

const togglePlayPause = () => {
  if (!audioPlayer.value) return
  if (isPlaying.value) {
    audioPlayer.value.pause()
  } else {
    audioPlayer.value.play()
  }
  isPlaying.value = !isPlaying.value
}

const seekAudio = (event: Event) => {
  const target = event.target as HTMLInputElement
  const time = parseFloat(target.value)
  if (audioPlayer.value) {
    audioPlayer.value.currentTime = time
  }
}

const updateVolume = () => {
  if (audioPlayer.value) {
    audioPlayer.value.volume = volume.value
  }
}

const onAudioLoaded = () => {
  if (audioPlayer.value) {
    duration.value = audioPlayer.value.duration
  }
}

const onTimeUpdate = () => {
  if (audioPlayer.value) {
    currentTime.value = audioPlayer.value.currentTime
    if (audioSyncEnabled.value) {
      const currentSentence = sentences.value.findIndex(
        s => currentTime.value >= s.startTime && currentTime.value <= s.endTime
      )
      if (currentSentence !== -1) {
        currentSentenceIndex.value = currentSentence
      }
    }
  }
}

const onAudioEnded = () => {
  isPlaying.value = false
  currentSentenceIndex.value = -1
}

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

onMounted(() => {
  if (selectedChapter.value?.content) {
    parseSentences(selectedChapter.value.content)
    if (currentAudio.value?.subtitle?.url) {
      loadSubtitle(currentAudio.value.subtitle.url)
    }
  }
})

watch(volume, updateVolume)
</script>

<style scoped>
.sentence {
  line-height: 1.8;
  margin-bottom: 0.5rem;
}

.sentence:hover {
  transform: translateX(4px);
}

input[type="range"] {
  -webkit-appearance: none;
  appearance: none;
  background: transparent;
  cursor: pointer;
}

input[type="range"]::-webkit-slider-track {
  background: #e5e7eb;
  height: 8px;
  border-radius: 4px;
}

input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  background: #2563eb;
  height: 20px;
  width: 20px;
  border-radius: 50%;
  cursor: pointer;
}

input[type="range"]::-moz-range-track {
  background: #e5e7eb;
  height: 8px;
  border-radius: 4px;
  border: none;
}

input[type="range"]::-moz-range-thumb {
  background: #2563eb;
  height: 20px;
  width: 20px;
  border-radius: 50%;
  cursor: pointer;
  border: none;
}
</style>
