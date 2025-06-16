<script setup lang="ts">
import type { ChapterModeration } from '~/types/moderationType'

defineProps<{
  chapter: ChapterModeration
}>()

defineEmits<{
  (e: 'approve' | 'reject' | 'edit', chapter: ChapterModeration): void
}>()
</script>

<template>
  <div class="flex space-x-2">
    <UButton color="success" @click="$emit('approve', chapter)">
      Duyệt
    </UButton>
    <UButton color="error" @click="$emit('reject', chapter)">
      Từ chối
    </UButton>
    <UButton color="warning" @click="$emit('edit', chapter)">
      Yêu cầu chỉnh sửa
    </UButton>
  </div>
</template>
