<script setup lang="ts">
import { ref, computed } from 'vue'
import { Howl } from 'howler'
import { formatTime } from '~/utils/timeFormatter'

const props = defineProps({
  audioUrl: {
    type: String,
    required: true
  },
  subtitles: {
    type: Array as () => Array<{ text: string, start: number, end: number }>,
    default: () => []
  }
})

const player = ref<Howl | null>(null)
const isPlaying = ref(false)
const duration = ref(0)
const currentTime = ref(0)
const currentSubtitle = ref('')

const formattedTime = computed(() => formatTime(currentTime.value))
const formattedDuration = computed(() => formatTime(duration.value))

const initPlayer = () => {
  player.value = new Howl({
    src: [props.audioUrl],
    html5: true,
    format: ['mp3'],
    onplay: () => isPlaying.value = true,
    onpause: () => isPlaying.value = false,
    onend: () => isPlaying.value = false,
    onload: () => duration.value = player.value?.duration() || 0,
    onseek: () => updateCurrentSubtitle()
  })

  // Update current time every 100ms
  setInterval(() => {
    if (player.value?.playing()) {
      currentTime.value = player.value?.seek() || 0
      updateCurrentSubtitle()
    }
  }, 100)
}

const updateCurrentSubtitle = () => {
  const current = props.subtitles.find(sub =>
    currentTime.value >= sub.start && currentTime.value <= sub.end
  )
  currentSubtitle.value = current?.text || ''
}

const togglePlay = () => {
  if (!player.value) return

  if (player.value.playing()) {
    player.value.pause()
  } else {
    player.value.play()
  }
}

const seek = (time: number) => {
  player.value?.seek(time)
}

onMounted(() => initPlayer())
onBeforeUnmount(() => {
  player.value?.unload()
})
</script>

<template>
  <div class="audio-player-container">
    <div class="player-controls">
      <button @click="togglePlay">
        {{ isPlaying ? 'Pause' : 'Play' }}
      </button>
      <input
        v-model="currentTime"
        type="range"
        min="0"
        :max="duration"
        class="progress-bar"
        @change="seek(currentTime)"
      >
      <div class="time-display">
        {{ formattedTime }} / {{ formattedDuration }}
      </div>
    </div>

    <div class="subtitle-display">
      {{ currentSubtitle }}
    </div>

    <div class="speed-controls">
      <select @change="player?.rate(parseFloat($event.target.value))">
        <option value="0.5">
          0.5x
        </option>
        <option value="0.75">
          0.75x
        </option>
        <option value="1" selected>
          1x
        </option>
        <option value="1.25">
          1.25x
        </option>
        <option value="1.5">
          1.5x
        </option>
        <option value="2">
          2x
        </option>
      </select>
    </div>
  </div>
</template>

<style scoped>
.audio-player-container {
  @apply bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md;
}

.progress-bar {
  @apply w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer;
}

.subtitle-display {
  @apply text-center py-4 text-lg font-medium min-h-12;
}
</style>
