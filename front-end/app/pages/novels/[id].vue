<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- Header -->
    <header class="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800">
      <div class="flex items-center justify-between px-4 py-3">
        <div class="flex items-center gap-3">
          <UButton
            icon="i-lucide-menu"
            variant="ghost"
            size="sm"
            @click="sidebarOpen = !sidebarOpen"
          />
          <h1 class="font-semibold text-gray-900 dark:text-white truncate">
            {{ currentNovel.title }}
          </h1>
        </div>

        <div class="flex items-center gap-2">
          <!-- Combined Audio/TTS Controls -->
          <div v-if="isAudioMode" class="flex items-center gap-2 px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <UButton
              :icon="isPlayingOrTTSPlaying ? 'i-lucide-pause' : 'i-lucide-play'"
              variant="ghost"
              size="xs"
              @click="toggleAudioOrTTS"
            />
            <span class="text-xs text-gray-600 dark:text-gray-400">
              <template v-if="isTTSMode">
                {{ currentSentenceIndex + 1 }} / {{ sentences.length }}
              </template>
              <template v-else>
                {{ formatTime(currentTime) }} / {{ formatTime(duration) }}
              </template>
            </span>
          </div>

          <!-- Combined Audio/TTS Toggle -->
          <UButton
            :icon="isAudioMode ? 'i-lucide-book-open' : 'i-lucide-headphones'"
            variant="ghost"
            size="sm"
            :class="isAudioMode ? 'text-blue-500' : ''"
            @click="toggleAudioOrTTSMode"
          />

          <!-- Settings -->
          <UButton
            v-model="showSettings"
            icon="i-lucide-settings"
            variant="ghost"
            size="sm"
            @click="showSettings = !showSettings"
          />
        </div>
      </div>

      <!-- Progress Bar -->
      <div class="h-1 bg-gray-200 dark:bg-gray-800">
        <div
          class="h-full bg-primary-500 transition-all duration-300"
          :style="{ width: `${readingProgress}%` }"
        />
      </div>
    </header>

    <div class="flex">
      <!-- Sidebar -->
      <aside
        class="fixed inset-y-0 left-0 z-40 w-80 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transform transition-transform duration-300"
        :class="sidebarOpen ? 'translate-x-0' : '-translate-x-full'"
      >
        <div class="flex flex-col h-full pt-16">
          <!-- Novel Info -->
          <div class="p-4 border-b border-gray-200 dark:border-gray-800">
            <div class="flex gap-3">
              <img
                :src="currentNovel.cover"
                :alt="currentNovel.title"
                class="w-16 h-20 object-cover rounded-lg"
              >
              <div class="flex-1 min-w-0">
                <h2 class="font-semibold text-gray-900 dark:text-white truncate">
                  {{ currentNovel.title }}
                </h2>
                <p class="text-sm text-gray-600 dark:text-gray-400 truncate">
                  {{ currentNovel.author }}
                </p>
                <div class="flex items-center gap-2 mt-1">
                  <div class="flex text-yellow-400">
                    <UIcon
                      v-for="i in 5"
                      :key="i"
                      name="i-lucide-star"
                      class="w-4 h-4"
                    />
                  </div>
                  <span class="text-xs text-gray-500">{{ currentNovel.rating }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Chapter List -->
          <div class="flex-1 overflow-y-auto">
            <div class="p-4">
              <h3 class="font-medium text-gray-900 dark:text-white mb-3">
                Danh sách chương
              </h3>
              <div class="space-y-1">
                <button
                  v-for="chapter in chapters"
                  :key="chapter.id"
                  class="w-full text-left p-3 rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
                  :class="currentChapter.id === chapter.id ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400' : 'text-gray-700 dark:text-gray-300'"
                  @click="selectChapter(chapter)"
                >
                  <div class="flex items-center justify-between">
                    <span class="font-medium">{{ chapter.title }}</span>
                    <div class="flex items-center gap-1">
                      <UIcon
                        v-if="chapter.isRead"
                        name="i-lucide-check"
                        class="w-4 h-4 text-green-500"
                      />
                      <UIcon
                        v-if="chapter.hasAudio"
                        name="i-lucide-headphones"
                        class="w-4 h-4 text-blue-500"
                      />
                    </div>
                  </div>
                  <p class="text-xs text-gray-500 mt-1">
                    {{ chapter.duration || chapter.wordCount + ' từ' }}
                  </p>
                </button>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <!-- Main Content -->
      <main
        class="flex-1 transition-all duration-300"
        :class="sidebarOpen ? 'ml-80' : 'ml-0'"
      >
        <div class="max-w-4xl mx-auto px-6 py-8">
          <!-- Chapter Header -->
          <div class="mb-8">
            <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {{ currentChapter.title }}
            </h1>
            <div class="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
              <span>Chương {{ currentChapter.number }}</span>
              <span>•</span>
              <span>{{ currentChapter.wordCount }} từ</span>
              <span>•</span>
              <span>{{ currentChapter.readTime }} phút đọc</span>
            </div>
          </div>

          <!-- Audio/TTS Player -->
          <div v-if="isAudioMode" class="mb-8">
            <div class="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <div class="flex items-center gap-4 mb-4">
                <UButton
                  :icon="isPlayingOrTTSPlaying ? 'i-lucide-pause' : 'i-lucide-play'"
                  size="lg"
                  @click="toggleAudioOrTTS"
                />
                <div class="flex-1">
                  <div class="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
                    <template v-if="isTTSMode">
                      <span>Câu {{ currentSentenceIndex + 1 }}</span>
                      <span>{{ sentences.length }} câu</span>
                    </template>
                    <template v-else>
                      <span>{{ formatTime(currentTime) }}</span>
                      <span>{{ formatTime(duration) }}</span>
                    </template>
                  </div>
                  <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      class="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      :style="{ width: isTTSMode ? `${(currentSentenceIndex / Math.max(sentences.length - 1, 1)) * 100}%` : `${(currentTime / duration) * 100}%` }"
                    />
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  <UButton
                    icon="i-lucide-skip-back"
                    variant="ghost"
                    size="sm"
                    :disabled="isTTSMode && currentSentenceIndex === 0"
                    @click="isTTSMode ? previousSentence() : skipBackward()"
                  />
                  <UButton
                    icon="i-lucide-skip-forward"
                    variant="ghost"
                    size="sm"
                    :disabled="isTTSMode && currentSentenceIndex >= sentences.length - 1"
                    @click="isTTSMode ? nextSentence() : skipForward()"
                  />
                  <UButton
                    v-if="isTTSMode"
                    icon="i-lucide-rotate-ccw"
                    variant="ghost"
                    size="sm"
                    @click="restartTTS"
                  />
                  <USelectMenu
                    v-model="playbackSpeed"
                    :options="speedOptions"
                    size="sm"
                  />
                </div>
              </div>

              <!-- Current sentence highlight for TTS -->
              <div v-if="isTTSMode" class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border-l-4 border-blue-500">
                <p class="text-sm text-gray-700 dark:text-gray-300">
                  <strong>Đang đọc:</strong> {{ sentences[currentSentenceIndex] || 'Không có nội dung' }}
                </p>
              </div>
            </div>
          </div>

          <!-- Reading Content -->
          <article
            class="prose prose-lg dark:prose-invert max-w-none"
            :style="{
              fontSize: `${fontSize}px`,
              lineHeight: lineHeight.value,
              fontFamily: fontFamily
            }"
          >
            <div v-if="isTTSMode" class="tts-content">
              <p v-for="(sentence, index) in sentences" :key="index">
                <span
                  :class="[
                    'sentence',
                    index === currentSentenceIndex ? 'current-sentence' : '',
                    index < currentSentenceIndex ? 'read-sentence' : ''
                  ]"
                  @click="jumpToSentence(index)"
                >
                  {{ sentence }}
                </span>
              </p>
            </div>
            <div v-else v-html="sanitizedContent" />
          </article>

          <!-- Navigation -->
          <div class="flex items-center justify-between mt-12 pt-8 border-t border-gray-200 dark:border-gray-800">
            <UButton
              v-if="previousChapter"
              icon="i-lucide-chevron-left"
              variant="outline"
              @click="selectChapter(previousChapter)"
            >
              Chương trước
            </UButton>
            <div v-else />

            <UButton
              v-if="nextChapter"
              icon="i-lucide-chevron-right"
              trailing
              @click="selectChapter(nextChapter)"
            >
              Chương tiếp
            </UButton>
            <div v-else />
          </div>
        </div>
      </main>
    </div>

    <!-- Settings Modal -->
    <USlideover v-model:open="showSettings" title="Settings">
      <template #header>
        <h3 class="text-lg font-semibold">
          Cài đặt
        </h3>
      </template>
      <template #body>
        <UTabs :unmount-on-hide="false" :items="settingsTabs" class="w-full">
          <template #text>
            <UCard>
              <div class="space-y-6">
                <!-- Font Settings -->
                <div>
                  <label class="block text-sm font-medium mb-2">Cỡ chữ</label>
                  <USlider
                    v-model="fontSize"
                    :min="14"
                    :max="24"
                    :step="1"
                  />
                  <div class="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Nhỏ</span>
                    <span>Lớn</span>
                  </div>
                </div>

                <div>
                  <label class="block text-sm font-medium mb-2">Khoảng cách dòng</label>
                  <USelectMenu
                    v-model="lineHeight"
                    :items="[
                      { label: 'Gần', value: '1.4' },
                      { label: 'Bình thường', value: '1.6' },
                      { label: 'Xa', value: '1.8' },
                      { label: 'Rất xa', value: '2.0' }
                    ]"
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium mb-2">Font chữ</label>
                  <USelectMenu
                    v-model="fontFamily"
                    :items="[
                      { label: 'Mặc định', value: 'system-ui' },
                      { label: 'Times New Roman', value: 'Times New Roman, serif' },
                      { label: 'Georgia', value: 'Georgia, serif' },
                      { label: 'Arial', value: 'Arial, sans-serif' }
                    ]"
                  />
                </div>

                <!-- Theme -->
                <div>
                  <label class="block text-sm font-medium mb-2">Giao diện</label>
                  <div class="grid grid-cols-3 gap-2">
                    <button
                      v-for="theme in themes"
                      :key="theme.value"
                      class="p-3 rounded-lg border-2 transition-colors"
                      :class="selectedTheme === theme.value ? 'border-primary-500' : 'border-gray-200 dark:border-gray-700'"
                      @click="selectedTheme = theme.value"
                    >
                      <div class="w-full h-8 rounded mb-2" :class="theme.preview" />
                      <span class="text-xs">{{ theme.label }}</span>
                    </button>
                  </div>
                </div>
              </div>
            </UCard>
          </template>
          <template #audio>
            <UCard>
              <div class="space-y-6">
                <!-- Auto Scroll -->
                <div class="flex items-center justify-between">
                  <div>
                    <label class="text-sm font-medium">Tự động cuộn</label>
                    <p class="text-xs text-gray-500">
                      Cuộn tự động đến câu đang đọc
                    </p>
                  </div>
                  <USwitch v-model="ttsAutoScroll" />
                </div>

                <!-- Auto Next Chapter -->
                <div class="flex items-center justify-between">
                  <div>
                    <label class="text-sm font-medium">Tự động chuyển chương</label>
                    <p class="text-xs text-gray-500">
                      Chuyển sang chương tiếp theo khi đọc xong
                    </p>
                  </div>
                  <USwitch v-model="autoNextChapter" />
                </div>

                <div v-if="isTTSMode">
                  <label class="block text-sm font-medium mb-2">Tốc độ đọc</label>
                  <USelectMenu
                    v-model="ttsRate"
                    :options="speedOptions"
                  />
                </div>

                <div v-if="isTTSMode">
                  <label class="block text-sm font-medium mb-2">Độ cao giọng</label>
                  <USlider
                    v-model="ttsPitch"
                    :min="0.5"
                    :max="2"
                    :step="0.1"
                  />
                </div>
                <!-- Voice Selection -->
                <div>
                  <label class="block text-sm font-medium mb-2">Giọng đọc</label>
                  <USelectMenu
                    v-model="selectedVoice"
                    :items="voiceOptions"
                    option-attribute="name"
                    value-attribute="voice"
                    class="w-full"
                  >
                    <template #body>
                      {{ selectedVoice?.name || 'Chọn giọng đọc' }}
                    </template>
                  </USelectMenu>
                  <p class="text-xs text-gray-500 mt-1">
                    {{ voiceOptions.length }} giọng có sẵn
                  </p>
                </div>

                <!-- Rate Control -->
                <div>
                  <label class="block text-sm font-medium mb-2">
                    Tốc độ đọc: {{ ttsRate.toFixed(1) }}x
                  </label>
                  <USlider
                    v-model="ttsRate"
                    :min="0.5"
                    :max="2.0"
                    :step="0.1"
                  />
                  <div class="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Chậm (0.5x)</span>
                    <span>Nhanh (2.0x)</span>
                  </div>
                </div>

                <!-- Pitch Control -->
                <div>
                  <label class="block text-sm font-medium mb-2">
                    Cao độ: {{ ttsPitch.toFixed(1) }}
                  </label>
                  <USlider
                    v-model="ttsPitch"
                    :min="0.5"
                    :max="2.0"
                    :step="0.1"
                  />
                  <div class="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Thấp (0.5)</span>
                    <span>Cao (2.0)</span>
                  </div>
                </div>

                <!-- Volume Control -->
                <div>
                  <label class="block text-sm font-medium mb-2">
                    Âm lượng: {{ Math.round(ttsVolume * 100) }}%
                  </label>
                  <USlider
                    v-model="ttsVolume"
                    :min="0"
                    :max="1"
                    :step="0.1"
                  />
                </div>
                <!-- Test Voice -->
                <div>
                  <UButton
                    variant="outline"
                    :loading="isTesting"
                    block
                    @click="testVoice"
                  >
                    <UIcon name="i-lucide-volume-2" class="mr-2" />
                    Thử giọng đọc
                  </UButton>
                </div>
              </div>
            </UCard>
          </template>
        </UTabs>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton variant="outline" @click="cancel">
            Hủy
          </UButton>
          <UButton @click="saveSettings">
            Lưu
          </UButton>
        </div>
      </template>
    </USlideover>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import DOMPurify from 'dompurify'
import { useHead } from '@vueuse/head'
import type { TabsItem } from '@nuxt/ui'

definePageMeta({
  layout: false
})

// Reactive data
const sidebarOpen = ref(false)
const showSettings = ref(false)
const isAudioMode = ref(false)
const isPlaying = ref(false)
const currentTime = ref(0)
const duration = ref(0)
const playbackSpeed = ref('1.0x')
const volume = ref(80)
const selectedVoice = ref('vi-VN-female')
const autoNextChapter = ref(true)

// TTS related
const isTTSMode = ref(false)
const ttsVoices = ref([])
const ttsRate = ref(1.0)
const ttsPitch = ref(1.0)
const ttsVolume = ref(0.8)
const currentSentenceIndex = ref(0)
const sentences = ref([])
const speechSynthesis = ref(null)
const currentUtterance = ref(null)
const isTTSPlaying = ref(false)
const ttsAutoScroll = ref(true)
const autoScroll = ref(false)
// Reading settings
const fontSize = ref(18)
const lineHeight = ref({ label: 'Bình thường', value: '1.6' })
const fontFamily = ref('system-ui')
const selectedTheme = ref('light')

// Tabs configuration
const settingsTabs = ref<TabsItem[]>([
  {
    label: 'Văn bản',
    slot: 'text',
    icon: 'i-lucide-type'
  },
  {
    label: 'Âm thanh',
    slot: 'audio',
    icon: 'i-lucide-headphones'
  }
])

// Sample data
const currentNovel = ref({
  id: 1,
  title: 'Tôi Là Đại Thần Tài',
  author: 'Nguyễn Văn A',
  cover: 'https://lh3.googleusercontent.com/pw/AP1GczNh017h8blChyagrEXtVQ3iFf32r9_A-ixVdtHWSa6z_7Ey__aMXMyPhE8Ck-L29d3A6O7MX9v_s1JXkL0G6uNtxj4KD3uut7TSWkuBD11G3FBlCPgruufPjMd86HUC9WayCV9KeF3-9NdtM5lW62LB=w215-h322-s-no-gm?authuser=4?height=200&width=160',
  rating: 4.8
})

const currentChapter = ref({
  id: 1,
  number: 1,
  title: 'Khởi đầu của một hành trình',
  content: `
    <p>Giây phút Lê Mạn mở mắt ra, nhìn thấy ánh sáng mặt trời xuyên qua mái nhà tranh trên đầu, hơn nữa đây căn bản không phải là thân thể của mình, nàng có thể khẳng định mình đã xuyên không rồi, dù sao thì giây trước đó ngồi trên máy bay sang Paris, xảy ra tai nạn máy bay rơi hy hữu, nàng không tin mình có thể sống sót, nếu có sống thì giờ này cũng đang trong bệnh viện, chứ không phải trong gian phòng cỏ tràn đầy màu sắc cổ xưa như như vậy, chỉ là không biết rốt cuộc đây là nơi nào.</p>

    <p>Chống lại những cơn đau đầu choáng váng, Lê Mạn từ trên giường ngồi dậy, bên dưới phát ra tiếng sột soạt sột soạt, cúi đầu nhìn xuống, là rơm rạ trải dưới tấm ga giường cũ nát phát ra âm thanh, lại ngẩng đầu nhìn xung quanh, tường vách bốn phía đều là dùng bùn trát lên, đã có vài vết nứt, giấy dán trên chiếc cửa sổ duy nhất đã ố vàng, rách thủng vài lỗ, không đủ sức che chắn gió mưa, cả căn phòng ngoại trừ chiếc giường này, chỉ có một chiếc hòm rách và cái bàn thiếu một chân, không còn đồ vật nào khác.</p>

    <p>Lê Mạn cơ bản đã có thể khẳng định, phải dùng mấy chữ nghèo rớt mồng tơi để hình dung về cái nhà này, trước mắt xem ra mình đã xuyên không đến một nơi nghèo đến nổi không thể nghèo hơn.</p>

    <p>Nghĩ đến việc mình còn chưa biết thân phận này có hoàn cảnh như thế nào, bên ngoài tình hình ra sao, Lê Mạn chống lại cơn đau mỏi toàn thân và sự choáng váng trong đầu, chậm rãi nhấc chân xuống giường muốn ra khỏi phòng xem bên ngoài thế nào, chẳng thể ngờ vừa đứng lên, đầu nàng bỗng đau như bị kim đâm, một ánh sáng trắng chói mắt lóe lên, giây tiếp theo liền chìm vào bóng tối.</p>
  `,
  wordCount: 1250,
  readTime: 5,
  hasAudio: true,
  isRead: false
})

const chapters = ref([
  { id: 1, title: 'Khởi đầu của một hành trình', duration: '15:30', wordCount: 1234, hasAudio: true, isRead: false },
  { id: 2, title: 'Cuộc gặp gỡ định mệnh', duration: '18:45', wordCount: 1234, hasAudio: true, isRead: false },
  { id: 3, title: 'Sức mạnh thức tỉnh', duration: '22:10', wordCount: 1234, hasAudio: true, isRead: false },
  { id: 4, title: 'Thử thách đầu tiên', duration: '16:20', wordCount: 1234, hasAudio: false, isRead: false },
  { id: 5, title: 'Bí mật được tiết lộ', duration: '20:35', wordCount: 1234, hasAudio: true, isRead: false }
])

// Options
const speedOptions = [
  { label: '0.5x', value: '0.5x' },
  { label: '0.75x', value: '0.75x' },
  { label: '1.0x', value: '1.0x' },
  { label: '1.25x', value: '1.25x' },
  { label: '1.5x', value: '1.5x' },
  { label: '2.0x', value: '2.0x' }
]

const voiceOptions = [
  { label: 'Giọng nữ Việt Nam', value: 'vi-VN-female' },
  { label: 'Giọng nam Việt Nam', value: 'vi-VN-male' },
  { label: 'Giọng nữ miền Bắc', value: 'vi-VN-north-female' },
  { label: 'Giọng nam miền Nam', value: 'vi-VN-south-male' }
]

const themes = [
  { label: 'Sáng', value: 'light', preview: 'bg-white border border-gray-200' },
  { label: 'Tối', value: 'dark', preview: 'bg-gray-900' },
  { label: 'Sepia', value: 'sepia', preview: 'bg-yellow-50' }
]

// Computed
const sanitizedContent = computed(() => {
  return DOMPurify.sanitize(currentChapter.value.content)
})

const readingProgress = computed(() => {
  const currentIndex = chapters.value.findIndex(ch => ch.id === currentChapter.value.id)
  return ((currentIndex + 1) / chapters.value.length) * 100
})

const previousChapter = computed(() => {
  const currentIndex = chapters.value.findIndex(ch => ch.id === currentChapter.value.id)
  return currentIndex > 0 ? chapters.value[currentIndex - 1] : null
})

const nextChapter = computed(() => {
  const currentIndex = chapters.value.findIndex(ch => ch.id === currentChapter.value.id)
  return currentIndex < chapters.value.length - 1 ? chapters.value[currentIndex + 1] : null
})

const isPlayingOrTTSPlaying = computed(() => {
  return isTTSMode.value ? isTTSPlaying.value : isPlaying.value
})

// Methods
const toggleAudioOrTTSMode = () => {
  isAudioMode.value = !isAudioMode.value
  if (!isAudioMode.value) {
    isPlaying.value = false
    stopTTS()
    isTTSMode.value = false
  } else if (currentChapter.value.hasAudio) {
    isTTSMode.value = false
  } else {
    isTTSMode.value = true
    sentences.value = splitIntoSentences(currentChapter.value.content)
    currentSentenceIndex.value = 0
  }
}

const toggleAudioOrTTS = () => {
  if (isTTSMode.value) {
    toggleTTS()
  } else {
    toggleAudio()
  }
}

const toggleAudio = () => {
  isPlaying.value = !isPlaying.value
  if (isPlaying.value) {
    duration.value = 15 * 60 // 15 minutes in seconds
    simulateAudioProgress()
  }
}

const simulateAudioProgress = () => {
  if (isPlaying.value && currentTime.value < duration.value) {
    setTimeout(() => {
      currentTime.value += 1
      simulateAudioProgress()
    }, 1000)
  }
}

const skipBackward = () => {
  currentTime.value = Math.max(0, currentTime.value - 15)
}

const skipForward = () => {
  currentTime.value = Math.min(duration.value, currentTime.value + 15)
}

const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

const selectChapter = (chapter) => {
  currentChapter.value = chapter
  currentTime.value = 0
  isPlaying.value = false
  stopTTS()
  sidebarOpen.value = false
  prepareTTS(chapter.content)
}

const saveSettings = () => {
  // Save settings to localStorage or API
  localStorage.setItem('settings', JSON.stringify({
    fontSize: fontSize.value,
    lineHeight: lineHeight.value,
    fontFamily: fontFamily.value,
    selectedTheme: selectedTheme.value,
    playbackSpeed: playbackSpeed.value,
    volume: volume.value,
    selectedVoice: selectedVoice.value,
    ttsRate: ttsRate.value,
    ttsPitch: ttsPitch.value,
    ttsVolume: ttsVolume.value,
    ttsAutoScroll: ttsAutoScroll.value,
    autoNextChapter: autoNextChapter.value
  }))
  showSettings.value = false
}

// TTS Methods
const initializeTTS = () => {
  if ('speechSynthesis' in window) {
    speechSynthesis.value = window.speechSynthesis
    loadTTSVoices()
  }
}

const loadTTSVoices = () => {
  const voices = speechSynthesis.value.getVoices()
  ttsVoices.value = voices.filter(voice =>
    voice.lang.includes('vi') || voice.lang.includes('en')
  )

  if (ttsVoices.value.length > 0 && !selectedTTSVoice.value) {
    selectedTTSVoice.value = ttsVoices.value.find(voice =>
      voice.lang.includes('vi')
    ) || ttsVoices.value[0]
  }
}

const splitIntoSentences = (text) => {
  const cleanText = text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
  const sentences = cleanText.split(/[.!?]+/).filter(s => s.trim().length > 0)
  return sentences.map(s => s.trim() + '.')
}

const toggleTTS = () => {
  if (isTTSPlaying.value) {
    pauseTTS()
  } else {
    startTTS()
  }
}

const startTTS = () => {
  if (!selectedTTSVoice.value || currentSentenceIndex.value >= sentences.value.length) {
    return
  }

  isTTSPlaying.value = true
  speakSentence(currentSentenceIndex.value)
}

const pauseTTS = () => {
  isTTSPlaying.value = false
  if (speechSynthesis.value) {
    speechSynthesis.value.pause()
  }
}

const stopTTS = () => {
  isTTSPlaying.value = false
  if (speechSynthesis.value) {
    speechSynthesis.value.cancel()
  }
  currentUtterance.value = null
}

const restartTTS = () => {
  stopTTS()
  currentSentenceIndex.value = 0
  if (sentences.value.length > 0) {
    startTTS()
  }
}

const speakSentence = (index) => {
  if (!sentences.value[index] || !selectedTTSVoice.value) return

  const utterance = new SpeechSynthesisUtterance(sentences.value[index])
  utterance.voice = selectedTTSVoice.value
  utterance.rate = ttsRate.value
  utterance.pitch = ttsPitch.value
  utterance.volume = ttsVolume.value

  utterance.onend = () => {
    if (isTTSPlaying.value) {
      currentSentenceIndex.value++

      if (currentSentenceIndex.value < sentences.value.length) {
        setTimeout(() => {
          if (isTTSPlaying.value) {
            speakSentence(currentSentenceIndex.value)
          }
        }, 500)
      } else {
        isTTSPlaying.value = false

        if (autoNextChapter.value && nextChapter.value) {
          setTimeout(() => {
            selectChapter(nextChapter.value)
            currentSentenceIndex.value = 0
            if (isTTSMode.value) {
              sentences.value = splitIntoSentences(currentChapter.value.content)
              startTTS()
            }
          }, 2000)
        }
      }
    }
  }

  utterance.onerror = () => {
    isTTSPlaying.value = false
  }

  currentUtterance.value = utterance

  if (speechSynthesis.value) {
    speechSynthesis.value.speak(utterance)
  }

  if (ttsAutoScroll.value) {
    scrollToCurrentSentence()
  }
}

const previousSentence = () => {
  if (currentSentenceIndex.value > 0) {
    stopTTS()
    currentSentenceIndex.value--
    if (isTTSPlaying.value) {
      speakSentence(currentSentenceIndex.value)
    }
  }
}

const nextSentence = () => {
  if (currentSentenceIndex.value < sentences.value.length - 1) {
    stopTTS()
    currentSentenceIndex.value++
    if (isTTSPlaying.value) {
      speakSentence(currentSentenceIndex.value)
    }
  }
}

const jumpToSentence = (index) => {
  stopTTS()
  currentSentenceIndex.value = index
  if (isTTSPlaying.value) {
    speakSentence(index)
  }
}

const scrollToCurrentSentence = () => {
  nextTick(() => {
    const currentElement = document.querySelector('.current-sentence')
    if (currentElement) {
      currentElement.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      })
    }
  })
}

const prepareTTS = (content) => {
  sentences.value = splitIntoSentences(content)
  currentSentenceIndex.value = 0
}

// Lifecycle
onMounted(() => {
  initializeTTS()

  const savedSettings = localStorage.getItem('settings')
  if (savedSettings) {
    const settings = JSON.parse(savedSettings)
    fontSize.value = settings.fontSize || 18
    lineHeight.value = settings.lineHeight || '1.6'
    fontFamily.value = settings.fontFamily || 'system-ui'
    selectedTheme.value = settings.selectedTheme || 'light'
    playbackSpeed.value = settings.playbackSpeed || '1.0x'
    volume.value = settings.volume || 80
    selectedVoice.value = settings.selectedVoice || 'vi-VN-female'
    ttsRate.value = settings.ttsRate || 1.0
    ttsPitch.value = settings.ttsPitch || 1.0
    ttsVolume.value = settings.ttsVolume || 0.8
    ttsAutoScroll.value = settings.ttsAutoScroll !== false
    autoNextChapter.value = settings.autoNextChapter !== false
  }

  if (speechSynthesis.value) {
    speechSynthesis.value.onvoiceschanged = loadTTSVoices
  }
})

watch(currentChapter, () => {
  if (isTTSMode.value) {
    stopTTS()
    sentences.value = splitIntoSentences(currentChapter.value.content)
    currentSentenceIndex.value = 0
  }
})

useHead({
  title: `${currentChapter.value.title} - ${currentNovel.value.title}`,
  meta: [
    { name: 'description', content: `Đọc chương ${currentChapter.value.number}: ${currentChapter.value.title}` }
  ]
})
</script>

<style scoped>
.prose {
  color: inherit;
}

.prose p {
  margin-bottom: 1.5em;
  text-align: justify;
}

.prose p:first-child {
  margin-top: 0;
}

.prose p:last-child {
  margin-bottom: 0;
}

.tts-content .sentence {
  cursor: pointer;
  padding: 2px 4px;
  border-radius: 4px;
  transition: all 0.3s ease;
}

.tts-content .sentence:hover {
  background-color: rgba(59, 130, 246, 0.1);
}

.tts-content .current-sentence {
  background-color: rgba(59, 130, 246, 0.2);
  border: 2px solid rgb(59, 130, 246);
  font-weight: 600;
  animation: pulse 2s infinite;
}

.tts-content .read-sentence {
  opacity: 0.6;
  background-color: rgba(34, 197, 94, 0.1);
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.8;
  }
}
</style>
