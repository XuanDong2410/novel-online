<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'

import type { Novel } from '~/types/novel'

defineProps<{
  novel: Novel | undefined
}>()

const schema = z.object({
  topic: z.string().min(1, 'Vui lòng chọn vấn đề'),
  message: z.string().min(1, 'Nội dung không được để trống')
})

type Schema = z.output<typeof schema>

const state = reactive<Partial<Schema>>({
  topic: '',
  message: ''
})

const issues = [
  'Yêu cầu quảng cáo truyện',
  'Báo lỗi hệ thống',
  'Góp ý giao diện',
  'Vấn đề khác'
]

const toast = useToast()

async function onSubmit(_event: FormSubmitEvent<Schema>) {
  toast.add({
    title: 'Yêu cầu đã được gửi',
    description: 'Chúng tôi sẽ phản hồi trong thời gian sớm nhất.',
    color: 'success'
  })
}
</script>

<template>
  <UForm
    :schema="schema"
    :state="state"
    class="space-y-4"
    @submit="onSubmit"
  >
    <!-- Trường liên quan đến truyện (disabled) -->
    <UFormField label="Liên quan đến truyện" name="novel">
      <UInput :model-value="novel?.title ?? ''" disabled class="w-full" />
    </UFormField>

    <!-- Chọn vấn đề cần hỗ trợ -->
    <UFormField label="Vấn đề cần hỗ trợ" name="topic">
      <USelect
        v-model="state.topic"
        :items="issues"
        :options="issues"
        placeholder="Vui lòng chọn vấn đề"
        class="w-full"
      />
    </UFormField>

    <!-- Trường nội dung -->
    <UFormField label="Nội dung" name="message">
      <UTextarea
        v-model="state.message"
        placeholder="Nhập nội dung yêu cầu..."
        class="w-full"
      />
    </UFormField>

    <!-- Tải lên hình ảnh
    <div>
      <label
        class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
      >
        Đính kèm hình ảnh (tối đa 3)
      </label>
      <UInput type="file" multiple class="w-full" />
    </div> -->
    <UCard class="flex text-center">
      <h2 class="text-xl font-semibold mb-2">
        Gửi yêu cầu
      </h2>
      <p class="text-sm text-gray-600 dark:text-gray-400">
        Trước khi đặt câu hỏi, vui lòng đọc hết mục
        <strong class="font-semibold">Kiến Thức Cơ Bản</strong>, nếu
        không tìm thấy câu trả lời, hãy gửi yêu cầu cho chúng tôi.
      </p>
    </UCard>
    <!-- Nút gửi -->
    <div class="flex justify-end">
      <UButton type="submit" class="px-6 py-2 rounded" color="primary">
        Gửi Yêu Cầu
      </UButton>
    </div>
  </UForm>
</template>
