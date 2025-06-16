<template>
  <UCard class="max-w-2xl mx-auto py-3 space-y-6">
    <UForm :state="novel" class="space-y-4" @submit.prevent="createNovel">
      <UFormGroup name="title" class="w-full">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tên truyện</label>
        <UInput
          v-model="novel.title"
          placeholder="Nhập tên truyện"
          class="w-full"
        />
      </UFormGroup>

      <UFormGroup name="gender" class="w-full">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Giới tính</label>
        <USelect
          v-model="novel.gender"
          :options="genders"
          :items="genders"
          class="w-full"
        />
      </UFormGroup>

      <UFormGroup name="description" class="w-full">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Giới thiệu</label>
        <UTextarea
          v-model="novel.description"
          placeholder="Giới thiệu sơ lược nội dung truyện..."
          class="w-full"
          :rows="4"
        />
      </UFormGroup>

      <UFormGroup name="genre" class="w-full">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Thể loại</label>
        <USelect
          v-model="novel.genre"
          :options="genres"
          :items="genres"
          placeholder="Vui lòng chọn"
          class="w-full"
        />
      </UFormGroup>

      <UFormGroup
        name="characterTrait"
        class="w-full"
      >
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tính cách nhân vật chính</label>
        <USelect
          v-model="novel.characterTrait"
          :options="characterTraits"
          :items="characterTraits"
          placeholder="Vui lòng chọn"
          class="w-full"
        />
      </UFormGroup>

      <UFormGroup name="worldView" class="w-full">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bối cảnh thế giới</label>
        <USelect
          v-model="novel.worldView"
          :options="worldViews"
          :items="worldViews"
          placeholder="Vui lòng chọn"
          class="w-full"
        />
      </UFormGroup>

      <UFormGroup name="sect" class="w-full">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Lưu phái</label>
        <USelect
          v-model="novel.sect"
          :options="sects"
          :items="sects"
          placeholder="Vui lòng chọn"
          class="w-full"
        />
      </UFormGroup>

      <div
        class="flex items-center space-x-2 pt-4 border-t border-gray-200 dark:border-gray-700"
      >
        <UCheckbox v-model="agreed" />
        <span class="text-sm text-gray-700 dark:text-gray-300">
          Tôi đồng ý với
          <strong
            class=" text-blue-500 hover:text-blue-400"
          >
            Điều Khoản Dịch Vụ
          </strong>
          khi đăng truyện
        </span>
      </div>

      <div class="flex justify-end">
        <UButton type="submit" color="primary" :disabled="!agreed">
          Tiếp Theo
        </UButton>
      </div>
    </UForm>
  </UCard>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const novel = ref({
  title: '',
  gender: 'Truyện nam',
  description: '',
  genre: '',
  characterTrait: '',
  worldView: '',
  sect: ''
})

const genders = ['Truyện nam', 'Truyện nữ']
const genres = ['Hành động', 'Phiêu lưu', 'Tình cảm', 'Hài hước']
const characterTraits = ['Lạnh lùng', 'Nhiệt huyết', 'IQ cao']
const worldViews = ['Hiện đại', 'Cổ đại', 'Huyễn huyễn']
const sects = ['Tu tiên', 'Ma pháp', 'Công nghệ', 'Ẩn thế']

const agreed = ref(false)

function createNovel() {
  if (!agreed.value) return
  console.log('Submitting novel:', novel.value)
  // TODO: Gửi dữ liệu hoặc chuyển sang bước tiếp theo
}
</script>
