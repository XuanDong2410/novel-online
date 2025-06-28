<!-- eslint-disable vue/no-v-html -->
<template>
  <!-- Main card container for the VTT previewer, styled with Tailwind CSS via Nuxt UI Pro UCard -->
  <!-- This UCard now serves as the content of the modal, hence no mx-auto or my-8 -->
  <UCard class="w-full flex flex-col">
    <!-- Header section of the card -->
    <!-- Body section with loading, error, or parsed VTT content -->
    <div class="flex-grow space-y-6 overflow-hidden">
      <div v-if="isLoading" class="text-center py-6 text-gray-500 dark:text-gray-400">
        <UIcon name="i-heroicons-arrow-path-solid" class="w-8 h-8 mb-2 animate-spin" />
        <p class="text-lg">
          Đang tải nội dung VTT...
        </p>
        <p class="text-sm mt-1">
          Vui lòng đợi trong giây lát.
        </p>
      </div>
      <div v-else-if="error" class="text-center py-4 text-red-500 dark:text-red-400">
        <UIcon name="i-heroicons-exclamation-circle-solid" class="w-6 h-6 inline-block mr-2" />
        <p class="inline-block">
          {{ error }}
        </p>
      </div>
      <div v-else-if="cues.length > 0">
        <!-- List of parsed VTT cues with scrollable area -->
        <ul class="space-y-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg shadow-inner max-h-[calc(100vh-200px)] overflow-y-auto custom-scrollbar">
          <li v-for="(cue, index) in cues" :key="index" class="p-4 bg-white dark:bg-gray-900 rounded-md shadow-sm border border-gray-200 dark:border-gray-700 transition-all hover:shadow-md">
            <!-- Display cue timestamps and optional ID -->
            <p class="font-mono text-sm text-gray-600 dark:text-gray-400 mb-1">
              <UIcon name="i-heroicons-clock-solid" class="mr-1" />
              <span class="font-semibold">{{ cue.startTime }}</span>
              <UIcon name="i-heroicons-arrow-right-solid" class="mx-1" />
              <span class="font-semibold">{{ cue.endTime }}</span>
              <span v-if="cue.id" class="text-xs text-gray-500 dark:text-gray-500 ml-3 bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded-full">
                ID: {{ cue.id }}
              </span>
            </p>
            <!-- Display sanitized cue text using v-html for potential formatting -->
            <p class="text-base text-gray-800 dark:text-gray-200" v-html="sanitizeHtml(cue.text)" />
          </li>
        </ul>
      </div>
      <div v-else class="text-center py-6 text-gray-500 dark:text-gray-400">
        <UIcon name="i-heroicons-document-text-solid" class="w-10 h-10 mb-3" />
        <p class="text-lg">
          Không có nội dung VTT để hiển thị.
        </p>
        <p class="text-sm mt-1">
          Vui lòng cung cấp nội dung VTT.
        </p>
      </div>
    </div>
  </UCard>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue' // Import watch
import DOMPurify from 'dompurify'

/**
 * @interface VttCue
 * @description Định nghĩa cấu trúc cho một "cue" (phụ đề) trong file VTT.
 * @property {string} [id] - ID tùy chọn của cue.
 * @property {string} startTime - Thời gian bắt đầu của cue (ví dụ: "00:00:01.000").
 * @property {string} endTime - Thời gian kết thúc của cue (ví dụ: "00:00:03.000").
 * @property {string} text - Nội dung văn bản của cue.
 */
interface VttCue {
  id?: string
  startTime: string
  endTime: string
  text: string
}

// Định nghĩa props mà component này sẽ nhận
const props = defineProps<{
  vttSourceContent: string | null // Nội dung VTT thô được truyền từ component cha
}>()

// ref để lưu trữ các cue VTT đã được phân tích cú pháp
const cues = ref<VttCue[]>([])
// ref để hiển thị trạng thái tải (nếu có logic tải nội bộ, nhưng giờ sẽ do cha quản lý)
const isLoading = ref<boolean>(false)
// ref để hiển thị thông báo lỗi
const error = ref<string | null>(null)

/**
 * @function parseVtt
 * @description Phân tích cú pháp một chuỗi VTT thành một mảng các đối tượng VttCue.
 * Hàm này xử lý các khối cue, thời gian và nội dung văn bản.
 * @param {string} vttString - Chuỗi chứa nội dung của file VTT.
 * @returns {VttCue[]} - Một mảng các cue đã được phân tích.
 */
const parseVtt = (vttString: string): VttCue[] => {
  const parsedCues: VttCue[] = []
  // Tách chuỗi VTT thành các khối dựa trên hai dòng trống (hỗ trợ cả CRLF và LF)
  const blocks = vttString.split(/\r?\n\r?\n/)

  for (const block of blocks) {
    // Tách mỗi khối thành các dòng
    const lines = block.trim().split(/\r?\n/)
    // Bỏ qua các khối trống, tiêu đề WEBVTT và các ghi chú
    if (lines.length === 0 || lines[0] === 'WEBVTT' || lines[0]?.startsWith('NOTE')) {
      continue
    }

    let id: string | undefined
    let startTime: string = ''
    let endTime: string = ''
    let textLines: string[] = []

    let lineIndex = 0
    // Kiểm tra xem dòng đầu tiên có phải là ID (chỉ số) không
    if (typeof lines[lineIndex] === 'string' && lines[lineIndex]?.match(/^\d+$/)) {
      id = lines[lineIndex]
      lineIndex++ // Di chuyển đến dòng tiếp theo
    }

    // Dòng tiếp theo phải là dòng thời gian (start --> end)
    if (lines[lineIndex]) {
      const timeMatch = lines[lineIndex]?.match(/(\d{2}:\d{2}:\d{2}\.\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}\.\d{3})/)
      if (timeMatch) {
        startTime = timeMatch[1] ?? ''
        endTime = timeMatch[2] ?? ''
        // Các dòng còn lại trong khối là nội dung văn bản của cue
        textLines = lines.slice(lineIndex + 1)
      } else {
        // Cảnh báo nếu không tìm thấy dòng thời gian hợp lệ
        console.warn('Khối VTT bị lỗi (không có dòng thời gian hợp lệ):', block)
        continue
      }
    } else {
      // Cảnh báo nếu không có nội dung sau ID tiềm năng
      console.warn('Khối VTT bị lỗi (không có nội dung sau ID):', block)
      continue
    }

    // Nếu đã có đủ thông tin (thời gian bắt đầu, kết thúc và nội dung), thêm cue vào mảng
    if (startTime && endTime && textLines.length > 0) {
      parsedCues.push({
        id,
        startTime,
        endTime,
        // Nối các dòng văn bản lại và loại bỏ khoảng trắng thừa
        text: textLines.join('\n').trim()
      })
    }
  }

  return parsedCues
}

/**
 * @function sanitizeHtml
 * @description Dọn dẹp chuỗi HTML để ngăn chặn các cuộc tấn công XSS.
 * Sử dụng DOMPurify để loại bỏ các thẻ và thuộc tính không an toàn.
 * @param {string} html - Chuỗi HTML cần được dọn dẹp.
 * @returns {string} - Chuỗi HTML đã được dọn dẹp.
 */
const sanitizeHtml = (html: string) => {
  // Sử dụng DOMPurify để dọn dẹp HTML, cho phép các cấu hình HTML cơ bản
  return DOMPurify.sanitize(html, { USE_PROFILES: { html: true } })
}

// Theo dõi sự thay đổi của prop vttSourceContent và phân tích lại nội dung
watch(() => props.vttSourceContent, (newContent) => {
  error.value = null // Xóa lỗi trước khi xử lý nội dung mới
  if (newContent) {
    try {
      cues.value = parseVtt(newContent)
    } catch (e) {
      error.value = `Lỗi phân tích nội dung VTT: ${e instanceof Error ? e.message : String(e)}`
      cues.value = []
    }
  } else {
    cues.value = [] // Xóa các cue nếu không có nội dung
  }
}, { immediate: true }) // Chạy ngay lập tức khi component được mount với giá trị ban đầu của prop
</script>

<style scoped>
/* Tùy chỉnh thanh cuộn cho danh sách các cue VTT */
.custom-scrollbar::-webkit-scrollbar {
  width: 8px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: #f1f1f1; /* Light background for the scrollbar track */
  border-radius: 10px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #888; /* Darker scrollbar thumb */
  border-radius: 10px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #555; /* Even darker on hover */
}

/* Dark mode scrollbar styles */
.dark .custom-scrollbar::-webkit-scrollbar-track {
  background: #333;
}

.dark .custom-scrollbar::-webkit-scrollbar-thumb {
  background: #666;
}

.dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #999;
}
</style>
