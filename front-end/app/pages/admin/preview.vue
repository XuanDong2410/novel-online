<template>
  <div class="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
    <UCard class="w-full max-w-xl">
      <template #header>
        <h1 class="text-3xl font-bold text-center text-gray-900 dark:text-white">
          Công cụ xem trước VTT
        </h1>
      </template>

      <div class="space-y-6">
        <UFormGroup label="Nhập URL của File VTT" name="vttUrl" hint="Đảm bảo URL có thể truy cập công khai">
          <UInput
            v-model="currentVttUrl"
            placeholder="Ví dụ: https://example.com/subtitles.vtt"
            size="lg"
            variant="outline"
            type="url"
            class="font-mono"
            :disabled="isLoading"
          />
        </UFormGroup>

        <UButton
          :disabled="!currentVttUrl || isLoading"
          color="primary"
          variant="solid"
          size="lg"
          block
          icon="i-heroicons-eye-solid"
          class="mt-4"
          :loading="isLoading"
          @click="fetchAndShowModal"
        >
          <span v-if="isLoading">Đang tải...</span>
          <span v-else>Xem trước VTT trong Modal</span>
        </UButton>

        <div v-if="fetchError" class="text-center py-4 text-red-500 dark:text-red-400">
          <UIcon name="i-heroicons-exclamation-circle-solid" class="w-6 h-6 inline-block mr-2" />
          <p class="inline-block">
            {{ fetchError }}
          </p>
        </div>
      </div>
    </UCard>

    <!-- Modal để hiển thị VttPreview component -->
    <UModal v-model:open="showModal" fullscreen title="Nội dung file VTT">
      <!-- VttPreview component được truyền nội dung đã tải về -->
      <!-- 'vtt-preview-component' là ID của immersive đã được chỉnh sửa -->
      <template #body>
        <AdminAudioPreview :vtt-source-content="fetchedVttContent" />
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
// State để điều khiển việc hiển thị modal
const showModal = ref<boolean>(false)
// State để lưu trữ URL VTT từ input
const currentVttUrl = ref<string>('')
// State để lưu trữ nội dung VTT đã tải về từ URL
const fetchedVttContent = ref<string | null>(null)
// State để hiển thị trạng thái tải khi fetch
const isLoading = ref<boolean>(false)
// State để hiển thị lỗi khi fetch
const fetchError = ref<string | null>(null)

/**
 * @function fetchAndShowModal
 * @description Hàm xử lý việc tải nội dung VTT từ URL và sau đó hiển thị modal.
 */
const fetchAndShowModal = async () => {
  isLoading.value = true
  fetchError.value = null // Clear previous errors
  fetchedVttContent.value = null // Clear previous content

  try {
    const response = await fetch(currentVttUrl.value)
    if (!response.ok) {
      throw new Error(`Không thể tải VTT từ URL: ${response.statusText} (${response.status})`)
    }
    const text = await response.text()
    fetchedVttContent.value = text // Lưu nội dung đã tải
    showModal.value = true // Mở modal sau khi tải thành công
  } catch (err: unknown) {
    let errorMessage = 'Không xác định lỗi'
    if (err && typeof err === 'object' && 'message' in err) {
      errorMessage = (err as { message: string }).message
    }
    fetchError.value = `Lỗi khi tải URL: ${errorMessage}`
    console.error('Lỗi khi tải URL:', err)
  } finally {
    isLoading.value = false
  }
}

// Đặt tiêu đề cho trang
useHead({
  title: 'VTT URL Previewer - Nuxt App',
  meta: [
    { name: 'description', content: 'Xem trước nội dung file VTT từ URL trong một modal.' }
  ],
  link: [
    { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }
  ]
})
</script>
