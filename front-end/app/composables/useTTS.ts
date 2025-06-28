import type { Chapter, IVoice } from '~/types/chapter'

// Điều chỉnh đường dẫn
export function useTTS() {
  type GeneratedAudio = {
    audioFileUrl: string
    subtitleFileUrl: string
    voiceConfig: IVoice
    duration: number
    size: number
  }
  const selectedVoiceConfig = ref<IVoice | null>(null) // Add this line to define selectedVoiceConfig

  const getVoices = async () => {
    const response = await $fetch<{ value: IVoice[] }>(`http://localhost:5000/api/v1/chapter/voices`, {
      method: 'GET',
      credentials: 'include'
    })
    return response
  }
  const generateAudio = async (chapter: Chapter, voice: IVoice) => {
    const response = await $fetch<GeneratedAudio>(`http://localhost:5000/api/v1/chapter/${chapter._id}/custom`, {
      method: 'POST',
      credentials: 'include',
      body: {
        chapter,
        voice
        // content: props.chapter.content,
        // chapterName: props.chapter.title,
        // chapterId: props.chapter._id,
        // voiceConfig: selectedVoiceConfig.value,
        // customConfig: {
        //   pitch: formState.value.pitch,
        //   speakingRate: formState.value.speakingRate
        // }
      }
    })
    return response
  }

  const previewText = ref('') // Set a default value or update as needed

  const generateAudioPreview = async (voice: IVoice) => {
    const response = await $fetch<GeneratedAudio>(`http://localhost:5000/api/v1/chapter/preview`, {
      method: 'POST',
      credentials: 'include',
      body: {
        voice,
        content: previewText.value,
        voiceConfig: selectedVoiceConfig.value
        // customConfig: {
        //   pitch: formState.value.pitch,
        //   speakingRate: formState.value.speakingRate
        // }
      }
    })
    return response
  }
  return {
    getVoices,
    generateAudio,
    generateAudioPreview
  }
}
