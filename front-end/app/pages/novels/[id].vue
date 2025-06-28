<template>
  <div class="px-4 py-6">
    <div v-if="pending">
      <USkeleton />
    </div>
    <div v-else-if="error">
      <p class="text-red-500">
        Có lỗi xảy ra: {{ error.message }}
      </p>
    </div>
    <div v-else-if="novel">
      <div class="bg-white rounded-lg shadow-md p-6 mb-6">
        <div class="flex items-start space-x-6">
          <div class="w-32 h-48 bg-gray-200 rounded-lg flex items-center justify-center">
            <div v-if="novel.coverImage" class="w-full h-full">
              <img :src="novel.coverImage" :alt="`Bìa truyện ${novel.title}`" class="w-full h-full object-cover rounded-lg" >
            </div>
            <div v-else>
              <BookOpen class="w-16 h-16 text-gray-400" />
            </div>
          </div>
          <div class="flex-1">
            <h2 class="text-3xl font-bold text-gray-900 mb-2">
              {{ novel.title }}
            </h2>
            <p class="text-lg text-gray-600 mb-4">
              {{ novel.author }}
            </p>
            <p class="text-gray-700 mb-4">
              {{ novel.description }}
            </p>
            <div class="flex items-center space-x-4 text-sm text-gray-500">
              <!-- <span>{{ chapters.length }} chương</span> -->
              <span>{{ novel.status }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Chapters List -->
      <div class="bg-white rounded-lg shadow-md">
        <div class="px-6 py-4 border-b">
          <h3 class="text-xl font-semibold text-gray-900">
            Danh sách chương
          </h3>
        </div>
        <div class="divide-y divide-gray-200">
          <div
            v-for="chapter in chapters"
            :key="chapter._id"
            class="px-6 py-4 hover:bg-gray-50 cursor-pointer flex items-center justify-between"
          >
            <NuxtLink :to="`/novel/${novelId}/${chapter._id}`" class="flex-1 flex items-center space-x-4">
              <div class="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <span class="text-sm font-medium text-blue-600">{{ chapter.chapterNumber }}</span>
              </div>
              <div>
                <h4 class="text-lg font-medium text-gray-900">
                  {{ chapter.title }}
                </h4>
                <p class="text-sm text-gray-500">
                  {{ chapter.wordCount }} từ
                </p>
              </div>
            </NuxtLink>
            <div class="flex items-center space-x-2">
              <Volume2 v-if="chapter.audios && chapter.audios.length > 0" class="w-5 h-5 text-green-500" />
              <ChevronRight class="w-5 h-5 text-gray-400" />
            </div>
          </div>
        </div>
      </div>
    </div>
    <div v-else>
      <p class="text-gray-500">
        Không tìm thấy truyện.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { BookOpen, Volume2, ChevronRight } from 'lucide-vue-next'
import type { Novel, ApiResponse } from '~/types/novel'
import type { Chapter, IAudio } from '~/types/chapter'
import { useChapters } from '~/composables/useChapters'

const route = useRoute()
const novelId = route.params.id as string

const { data: response, pending, error } = await useFetch<ApiResponse<Novel>>(`http://localhost:5000/api/v1/novel/${novelId}`, {
  method: 'GET',
  credentials: 'include'
})
const novel = computed(() => response.value?.data)

const { getChaptersByNovelId } = useChapters()
const { data: chapters } = await useAsyncData<Chapter[]>('chapters', async (): Promise<Chapter[]> => {
  const result = await getChaptersByNovelId(novelId)
  return (result.data.value || []).map((chapter: any) => ({
    ...chapter,
    audios: Array.isArray(chapter.audios) ? chapter.audios.filter((a: IAudio) => typeof a === 'object') : []
  })) as Chapter[]
})
</script>
