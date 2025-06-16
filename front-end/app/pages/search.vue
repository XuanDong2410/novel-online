<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { defineStore } from 'pinia'
import { z } from 'zod'
import { formatDistanceToNow } from 'date-fns'
import DOMPurify from 'dompurify'
import { vi } from 'date-fns/locale'

definePageMeta({
  layout: 'guest'
})

// Định nghĩa interface cho kết quả tìm kiếm
interface Story {
  id: string
  title: string
  author: string
  description: string
  image: string
  rating: number
  chapters: number
  category: string
  status: string
  views: number
  lastUpdate: string
}

// Định nghĩa schema validation với zod
const searchSchema = z.object({
  q: z.string().min(1, 'Từ khóa tìm kiếm không được để trống').max(100),
  category: z.string().optional(),
  status: z.string().optional(),
  sort: z.string().optional(),
  page: z.number().int().positive().optional(),
  limit: z.number().int().positive().optional()
})

// Pinia store cho search
const useSearchStore = defineStore('search', () => {
  const results = ref<Story[]>([])
  const total = ref(0)
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function search(params: { q: string, category?: string, status?: string, sort?: string, page?: number, limit?: number }) {
    loading.value = true
    error.value = null
    try {
      const response = await $fetch('/api/v1/search', {
        query: {
          q: params.q,
          category: params.category !== 'all' ? params.category : undefined,
          status: params.status !== 'all' ? params.status : undefined,
          sort: params.sort !== 'relevance' ? params.sort : undefined,
          page: params.page || 1,
          limit: params.limit || 12
        },
        credentials: 'include'
      })
      results.value = response.data || []
      total.value = response.pagination?.total || 0
      console.log('Search results:', results.value)
    } catch (err) {
      error.value = err.message || 'Lỗi khi tìm kiếm'
      console.error('Search error:', err)
    } finally {
      loading.value = false
    }
  }

  return { results, total, loading, error, search }
})

const route = useRoute()
const router = useRouter()
const toast = useToast()
const searchStore = useSearchStore()

// Trạng thái tìm kiếm
const searchQuery = ref(route.query.q?.toString() || '')
const category = ref('all')
const status = ref('all')
const sort = ref('relevance')
const page = ref(1)
const viewMode = ref('grid')

// Options cho filters
const categoryOptions = [
  { label: 'Tất cả', value: 'all' },
  { label: 'Tiên Hiệp', value: 'tien-hiep' },
  { label: 'Huyền Huyễn', value: 'huyen-huyen' },
  { label: 'Đô Thị', value: 'do-thi' },
  { label: 'Lịch Sử', value: 'lich-su' }
]

const statusOptions = [
  { label: 'Tất cả', value: 'all' },
  { label: 'Đang cập nhật', value: 'ongoing' },
  { label: 'Hoàn thành', value: 'completed' },
  { label: 'Tạm dừng', value: 'paused' }
]

const sortOptions = [
  { label: 'Liên quan', value: 'relevance' },
  { label: 'Đánh giá', value: 'rating' },
  { label: 'Lượt xem', value: 'views' },
  { label: 'Cập nhật', value: 'updated' },
  { label: 'Số chương', value: 'chapters' }
]

// Thực hiện tìm kiếm
async function performSearch() {
  try {
    const validated = searchSchema.parse({
      q: searchQuery.value,
      category: category.value,
      status: status.value,
      sort: sort.value,
      page: page.value,
      limit: 12
    })
    await searchStore.search(validated)
    // Cập nhật URL query
    router.push({
      query: {
        q: searchQuery.value,
        category: category.value !== 'all' ? category.value : undefined,
        status: status.value !== 'all' ? status.value : undefined,
        sort: sort.value !== 'relevance' ? sort.value : undefined,
        page: page.value > 1 ? page.value : undefined
      }
    })
  } catch (err) {
    if (err instanceof z.ZodError) {
      toast.add({ title: 'Lỗi', description: err.errors[0].message, color: 'error' })
    } else {
      toast.add({ title: 'Lỗi', description: 'Không thể thực hiện tìm kiếm.', color: 'error' })
    }
  }
}

// Theo dõi thay đổi query và filters
watch([searchQuery, category, status, sort, page], () => {
  if (searchQuery.value) {
    performSearch()
  }
}, { immediate: true })

// Format views
function formatViews(views: number): string {
  if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`
  if (views >= 1000) return `${(views / 1000).toFixed(1)}K`
  return views.toString()
}
</script>

<template>
  <UContainer class="py-8">
    <!-- Search Bar -->
    <div class="mb-8">
      <UForm class="flex gap-2" @submit.prevent="performSearch">
        <UInput
          v-model="searchQuery"
          name="q"
          placeholder="Tìm kiếm truyện, tác giả..."
          icon="i-lucide-search"
          size="lg"
          class="flex-1"
          color="primary"
          variant="outline"
          :loading="searchStore.loading"
        />
        <UButton
          type="submit"
          size="lg"
          color="primary"
          :disabled="searchStore.loading"
        >
          Tìm kiếm
        </UButton>
      </UForm>
      <div v-if="searchQuery" class="text-sm text-gray-500 dark:text-gray-400 mt-2">
        Tìm thấy
        <span class="font-semibold text-gray-900 dark:text-white">{{ searchStore.total }} kết quả</span>
        cho từ khóa
        <span class="font-semibold text-gray-900 dark:text-white">"{{ searchQuery }}"</span>
      </div>
      <div v-if="searchStore.error" class="text-sm text-red-500 mt-2">
        {{ searchStore.error }}
      </div>
    </div>

    <!-- Filters -->
    <UCard class="mb-8 p-4">
      <div class="flex flex-wrap items-center gap-4">
        <div class="flex items-center gap-2">
          <UIcon name="i-lucide-filter" class="h-4 w-4" />
          <span class="text-sm font-medium">Lọc kết quả:</span>
        </div>
        <USelect
          v-model="category"
          :items="categoryOptions"
          placeholder="Thể loại"
          class="w-[140px]"
          size="sm"
        />
        <USelect
          v-model="status"
          :items="statusOptions"
          placeholder="Trạng thái"
          class="w-[140px]"
          size="sm"
        />
        <USelect
          v-model="sort"
          :items="sortOptions"
          placeholder="Sắp xếp"
          class="w-[140px]"
          size="sm"
        />
        <div class="ml-auto flex items-center gap-2">
          <UButtonGroup>
            <UButton
              :variant="viewMode === 'grid' ? 'solid' : 'outline'"
              size="sm"
              icon="i-lucide-grid"
              @click="viewMode = 'grid'"
            />
            <UButton
              :variant="viewMode === 'list' ? 'solid' : 'outline'"
              size="sm"
              icon="i-lucide-list"
              @click="viewMode = 'list'"
            />
          </UButtonGroup>
        </div>
      </div>
    </UCard>

    <!-- Search Results -->
    <UPage
      :cols="viewMode === 'grid' ? { default: 1, md: 2, lg: 3 } : 1"
      gap="6"
      class="min-h-[50vh]"
    >
      <UCard
        v-if="searchStore.loading"
        v-for="i in 6"
        :key="i"
        class="animate-pulse"
      >
        <div class="flex gap-4">
          <div class="w-20 h-28 bg-gray-200 dark:bg-gray-700 rounded" />
          <div class="flex-1 space-y-2">
            <div class="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
            <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
            <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" />
            <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
          </div>
        </div>
      </UCard>
      <UCard
        v-for="story in searchStore.results"
        v-else-if="searchStore.results.length"
        :key="story.id"
        :to="`/story/${story.id}`"
        class="group transition-all duration-300 hover:shadow-md"
        :class="{ 'flex gap-4 p-4': viewMode === 'list', 'block': viewMode === 'grid' }"
      >
        <div
          :class="{
            'flex gap-4': viewMode === 'list',
            'block': viewMode === 'grid'
          }"
        >
          <div
            :class="{
              'w-20 h-28 flex-shrink-0': viewMode === 'list',
              'w-full h-48': viewMode === 'grid'
            }"
            class="relative overflow-hidden rounded"
          >
            <img
              :src="story.image || '/placeholder.svg'"
              :alt="story.title"
              class="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
            >
          </div>
          <div class="flex-1 min-w-0 p-4">
            <h3
              class="font-semibold text-lg line-clamp-1 group-hover:text-primary transition-colors mb-1"
            >
              {{ story.title }}
            </h3>
            <div
              class="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 mb-2"
            >
              <UIcon name="i-lucide-user" class="h-3 w-3" />
              {{ story.author }}
            </div>
            <p
              class="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-3"
              v-html="DOMPurify.sanitize(story.description)"
            />
            <div
              class="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-2"
            >
              <div class="flex items-center gap-3">
                <div class="flex items-center gap-1">
                  <UIcon name="i-lucide-star" class="h-3 w-3 text-yellow-400" />
                  {{ story.rating.toFixed(1) }}
                </div>
                <div class="flex items-center gap-1">
                  <UIcon name="i-lucide-book-open" class="h-3 w-3" />
                  {{ story.chapters }}
                </div>
              </div>
              <span>{{ formatViews(story.views) }}</span>
            </div>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <UBadge variant="outline" size="xs">
                  {{ story.category }}
                </UBadge>
                <UBadge
                  :variant="story.status === 'completed' ? 'solid' : 'subtle'"
                  :color="{
                    completed: 'success',
                    ongoing: 'warning',
                    paused: 'error'
                  }[story.status] || 'neutral'"
                  size="xs"
                >
                  {{ story.status === 'completed' ? 'Hoàn thành' : story.status === 'ongoing' ? 'Đang cập nhật' : 'Tạm dừng' }}
                </UBadge>
              </div>
              <span class="text-xs text-gray-500 dark:text-gray-400">
                {{ formatDistanceToNow(new Date(story.lastUpdate), { locale: vi, addSuffix: true }) }}
              </span>
            </div>
          </div>
        </div>
      </UCard>
      <div v-else-if="!searchStore.loading" class="col-span-full text-center py-8">
        <UIcon name="i-lucide-search-x" class="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p class="text-lg text-gray-500 dark:text-gray-400">
          Không tìm thấy kết quả cho "{{ searchQuery }}"
        </p>
      </div>
    </UPage>

    <!-- Pagination -->
    <div v-if="searchStore.results.length && !searchStore.loading" class="flex justify-center mt-12">
      <UPagination
        v-model="page"
        :total="Math.ceil(searchStore.total / 12)"
        :default-value="1"
        show-first
        show-last
      />
    </div>
  </UContainer>
</template>
