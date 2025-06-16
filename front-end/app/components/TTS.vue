<template>
  <UCard>
    <template #header>
      <h3 class="text-lg font-semibold">
        Cài đặt Text-to-Speech
      </h3>
    </template>

    <div class="space-y-6">
      <!-- Voice Selection -->
      <div>
        <label class="block text-sm font-medium mb-2">Giọng đọc</label>
        <USelectMenu
          v-model="selectedVoice"
          :options="voiceOptions"
          option-attribute="name"
          value-attribute="voice"
        >
          <template #label>
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
          Tốc độ đọc: {{ rate }}x
        </label>
        <USlider
          v-model="rate"
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
          Cao độ: {{ pitch }}
        </label>
        <USlider
          v-model="pitch"
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
          Âm lượng: {{ Math.round(volume * 100) }}%
        </label>
        <USlider
          v-model="volume"
          :min="0"
          :max="1"
          :step="0.1"
        />
      </div>

      <!-- Auto Scroll -->
      <div class="flex items-center justify-between">
        <div>
          <label class="text-sm font-medium">Tự động cuộn</label>
          <p class="text-xs text-gray-500">
            Cuộn tự động đến câu đang đọc
          </p>
        </div>
        <USwitch v-model="autoScroll" />
      </div>

      <!-- Auto Next Chapter -->
      <div class="flex items-center justify-between">
        <div>
          <label class="text-sm font-medium">Tự động chuyển chương</label>
          <p class="text-xs text-gray-500">
            Chuyển sang chương tiếp theo khi đọc xong
          </p>
        </div>
        <USwitch v-model="autoNext" />
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

    <template #footer>
      <div class="flex justify-end gap-2">
        <UButton variant="outline" @click="cancel">
          Hủy
        </UButton>
        <UButton @click="save">
          Lưu cài đặt
        </UButton>
      </div>
    </template>
  </UCard>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  // modelValue: Boolean,
  voices: Array,
  selectedVoice: Object,
  rate: Number,
  pitch: Number,
  volume: Number,
  autoScroll: Boolean,
  autoNext: Boolean
})

const emit = defineEmits(['update:modelValue', 'save'])

const isOpen = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value)
})

// Local state
const selectedVoice = ref(props.selectedVoice)
const rate = ref(props.rate)
const pitch = ref(props.pitch)
const volume = ref(props.volume)
const autoScroll = ref(props.autoScroll)
const autoNext = ref(props.autoNext)
const isTesting = ref(false)

const voiceOptions = computed(() => {
  return props.voices.map(voice => ({
    voice,
    name: `${voice.name} (${voice.lang})`,
    label: voice.name
  }))
})

const testVoice = async () => {
  if (!selectedVoice.value || isTesting.value) return

  isTesting.value = true

  const utterance = new SpeechSynthesisUtterance('Xin chào, đây là giọng đọc thử nghiệm.')
  utterance.voice = selectedVoice.value.voice
  utterance.rate = rate.value
  utterance.pitch = pitch.value
  utterance.volume = volume.value

  utterance.onend = () => {
    isTesting.value = false
  }

  utterance.onerror = () => {
    isTesting.value = false
  }

  speechSynthesis.speak(utterance)
}

const save = () => {
  emit('save', {
    selectedVoice: selectedVoice.value,
    rate: rate.value,
    pitch: pitch.value,
    volume: volume.value,
    autoScroll: autoScroll.value,
    autoNext: autoNext.value
  })
  isOpen.value = false
}

const cancel = () => {
  // Reset to original values
  selectedVoice.value = props.selectedVoice
  rate.value = props.rate
  pitch.value = props.pitch
  volume.value = props.volume
  autoScroll.value = props.autoScroll
  autoNext.value = props.autoNext
  isOpen.value = false
}

// Watch for prop changes
watch(() => props.selectedVoice, (newVal) => {
  selectedVoice.value = newVal
})

watch(() => props.rate, (newVal) => {
  rate.value = newVal
})

watch(() => props.pitch, (newVal) => {
  pitch.value = newVal
})

watch(() => props.volume, (newVal) => {
  volume.value = newVal
})
</script>
