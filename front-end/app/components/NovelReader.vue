<template>
  <ClientOnly>
    <div class="mb-6">
      <h2 class="text-2xl font-bold text-gray-900 mb-4">
        Danh sách truyện
      </h2>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          v-for="novel in novels.data"
          :key="novel._id"
          class="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer p-6"
        >
          <NuxtLink :to="`/novels/${novel._id}`">
            <div class="flex items-center space-x-4">
              <div class="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center">
                <BookOpen class="w-8 h-8 text-blue-600" />
              </div>
              <div class="flex-1">
                <h3 class="text-lg font-semibold text-gray-900">
                  {{ novel.title }}
                </h3>
                <p class="text-sm text-gray-500">
                  {{ novel.author }}
                </p>
              </div>
            </div>
          </NuxtLink>
        </div>
      </div>
    </div>
  </ClientOnly>
</template>

<script setup lang="ts">
import { BookOpen } from 'lucide-vue-next'
import type { Novel, ApiResponse } from '~/types/novel'

const novels = await $fetch<ApiResponse<Novel[]>>('http://localhost:5000/api/v1/novel', {
  method: 'GET',
  credentials: 'include'
})
</script>
