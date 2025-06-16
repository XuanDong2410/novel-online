<script setup lang="ts">
import { useRoute } from 'vue-router'
import { ref } from 'vue'

definePageMeta({
  layout: 'guest'
})

const route = useRoute()
const storyId = route.params.id

const storyData = {
  id: 1,
  title: 'Thế Giới Hoàn Mỹ',
  author: 'Thần Đông',
  description:
    'Một thế giới nơi mà mọi sinh vật đều có thể tu luyện để trở nên hoàn hảo. Câu chuyện kể về hành trình của một thiếu niên từ làng quê hẻo lánh, với ý chí kiên cường và tài năng thiên bẩm, bước vào con đường tu luyện đầy gian khó. Anh sẽ phải đối mặt với vô số thử thách, từ những kẻ thù mạnh mẽ đến những bí ẩn cổ xưa được chôn vùi trong lịch sử.',
  image: 'https://truyenhdt.com/wp-content/uploads/2020/12/the-gioi-hoan-my.jpg?height=400&width=300',
  rating: 4.8,
  totalRatings: 15420,
  chapters: 1250,
  category: 'Tiên Hiệp',
  status: 'Đang cập nhật',
  views: '2.5M',
  favorites: '45.2K',
  publishDate: '2020-03-15',
  lastUpdate: '2 giờ trước',
  tags: ['Tu Tiên', 'Hệ Thống', 'Mạnh Mẽ', 'Harem', 'Phiêu Lưu'],
  wordCount: '3.2M từ'
}

const chapters = [
  { id: 1, title: 'Chương 1: Khởi đầu', publishDate: '2 giờ trước', wordCount: '2.5K từ', isNew: true },
  { id: 2, title: 'Chương 2: Tu luyện', publishDate: '1 ngày trước', wordCount: '2.8K từ', isNew: false },
  { id: 3, title: 'Chương 3: Đột phá', publishDate: '2 ngày trước', wordCount: '3.1K từ', isNew: false },
  { id: 4, title: 'Chương 4: Thử thách', publishDate: '3 ngày trước', wordCount: '2.9K từ', isNew: false },
  { id: 5, title: 'Chương 5: Bí ẩn', publishDate: '4 ngày trước', wordCount: '3.3K từ', isNew: false }
]

const reviews = [
  {
    id: 1,
    user: 'NguyenVanA',
    avatar: '/placeholder.svg?height=40&width=40',
    rating: 5,
    date: '1 ngày trước',
    content:
      'Truyện hay lắm, cốt truyện hấp dẫn, nhân vật được xây dựng rất tốt. Đặc biệt là hệ thống tu luyện rất logic và thú vị.',
    likes: 24
  },
  {
    id: 2,
    user: 'TranThiB',
    avatar: '/placeholder.svg?height=40&width=40',
    rating: 4,
    date: '2 ngày trước',
    content: 'Nội dung khá ổn, tuy nhiên có một số chỗ hơi dài dòng. Nhìn chung vẫn đáng đọc và theo dõi.',
    likes: 12
  },
  {
    id: 3,
    user: 'LeVanC',
    avatar: '/placeholder.svg?height=40&width=40',
    rating: 5,
    date: '3 ngày trước',
    content: 'Xuất sắc! Đây là một trong những truyện tiên hiệp hay nhất mình từng đọc. Tác giả viết rất cuốn hút.',
    likes: 31
  }
]

const activeTab = ref('chapters')
</script>

<template>
  <div>
    <!-- Header -->

    <UContainer class="py-8">
      <!-- Story Header -->
      <UPageGrid :cols="{ default: 1, lg: 3 }" gap="8" class="mb-8">
        <div class="lg:col-span-1">
          <div class="sticky top-24">
            <div class="aspect-[3/4] relative overflow-hidden rounded-lg mb-4">
              <img
                :src="storyData.image || '/placeholder.svg'"
                :alt="storyData.title"
                class="object-cover w-full h-full"
              >
            </div>

            <!-- Action Buttons -->
            <div class="space-y-3">
              <UButton class="w-full" size="lg">
                <UIcon name="i-lucide-book-open" class="mr-2" />
                Đọc truyện
              </UButton>
              <UButton variant="outline" class="w-full" size="lg">
                <UIcon name="i-lucide-headphones" class="mr-2" />
                Nghe truyện
              </UButton>

              <UButtonGroup class="w-full">
                <UButton variant="outline" size="sm" class="flex-1">
                  <UIcon name="i-lucide-heart" />
                </UButton>
                <UButton variant="outline" size="sm" class="flex-1">
                  <UIcon name="i-lucide-share-2" />
                </UButton>
                <UButton variant="outline" size="sm" class="flex-1">
                  <UIcon name="i-lucide-download" />
                </UButton>
              </UButtonGroup>
            </div>
          </div>
        </div>

        <div class="lg:col-span-2">
          <div class="space-y-4">
            <div>
              <h1 class="text-3xl md:text-4xl font-bold mb-2">
                {{ storyData.title }}
              </h1>
              <div class="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-4">
                <UIcon name="i-lucide-user" class="h-4 w-4" />
                <span class="font-medium">{{ storyData.author }}</span>
                <span>•</span>
                <UIcon name="i-lucide-calendar" class="h-4 w-4" />
                <span>{{ storyData.publishDate }}</span>
              </div>
            </div>

            <!-- Stats -->
            <UPageGrid :cols="{ default: 2, md: 4 }" gap="4">
              <UCard class="text-center p-3">
                <div class="flex items-center justify-center gap-1 mb-1">
                  <UIcon name="i-lucide-star" class="h-4 w-4 text-yellow-400" />
                  <span class="font-semibold">{{ storyData.rating }}</span>
                </div>
                <div class="text-xs text-gray-500 dark:text-gray-400">
                  {{ storyData.totalRatings }} đánh giá
                </div>
              </UCard>

              <UCard class="text-center p-3">
                <div class="font-semibold mb-1">
                  {{ storyData.chapters }}
                </div>
                <div class="text-xs text-gray-500 dark:text-gray-400">
                  Chương
                </div>
              </UCard>

              <UCard class="text-center p-3">
                <div class="font-semibold mb-1">
                  {{ storyData.views }}
                </div>
                <div class="text-xs text-gray-500 dark:text-gray-400">
                  Lượt xem
                </div>
              </UCard>

              <UCard class="text-center p-3">
                <div class="font-semibold mb-1">
                  {{ storyData.favorites }}
                </div>
                <div class="text-xs text-gray-500 dark:text-gray-400">
                  Yêu thích
                </div>
              </UCard>
            </UPageGrid>

            <!-- Tags and Status -->
            <div class="space-y-3">
              <div class="flex items-center gap-2">
                <UBadge>{{ storyData.category }}</UBadge>
                <UBadge variant="subtle" color="neutral">
                  {{ storyData.status }}
                </UBadge>
                <span class="text-sm text-gray-500 dark:text-gray-400">• {{ storyData.wordCount }}</span>
              </div>

              <div class="flex flex-wrap gap-2">
                <UBadge
                  v-for="tag in storyData.tags"
                  :key="tag"
                  variant="outline"
                  size="xs"
                >
                  {{ tag }}
                </UBadge>
              </div>
            </div>

            <!-- Description -->
            <div>
              <h3 class="font-semibold mb-2">
                Giới thiệu
              </h3>
              <p class="text-gray-500 dark:text-gray-400 leading-relaxed">
                {{ storyData.description }}
              </p>
            </div>

            <!-- Reading Progress -->
            <UCard>
              <template #header>
                <div class="pb-3">
                  <div class="text-lg">
                    Tiến độ đọc
                  </div>
                </div>
              </template>
              <div class="space-y-2">
                <div class="flex justify-between text-sm">
                  <span>Chương 45 / {{ storyData.chapters }}</span>
                  <span>3.6%</span>
                </div>
                <UProgress value="3.6" class="h-2" />
                <div class="text-xs text-gray-500 dark:text-gray-400">
                  Cập nhật lần cuối: {{ storyData.lastUpdate }}
                </div>
              </div>
            </UCard>
          </div>
        </div>
      </UPageGrid>

      <!-- Tabs Content -->
      <UTabs
        v-model="activeTab"
        :items="[
          { slot: 'chapters', label: 'Danh sách chương' },
          { slot: 'reviews', label: `Đánh giá (${storyData.totalRatings})` },
          { slot: 'similar', label: 'Truyện tương tự' }
        ]"
      >
        <template #chapters>
          <div class="space-y-4 mt-6">
            <div class="flex items-center justify-between">
              <h3 class="text-xl font-semibold">
                Danh sách chương
              </h3>
              <UButtonGroup>
                <UButton variant="outline" size="sm">
                  Mới nhất
                </UButton>
                <UButton variant="outline" size="sm">
                  Cũ nhất
                </UButton>
              </UButtonGroup>
            </div>

            <div class="space-y-2">
              <UCard
                v-for="chapter in chapters"
                :key="chapter.id"
                class="hover:shadow-md transition-shadow cursor-pointer"
                :to="`/story/${storyData.id}/chapter/${chapter.id}`"
              >
                <div class="p-4">
                  <div class="flex items-center justify-between">
                    <div class="flex-1">
                      <div class="flex items-center gap-2 mb-1">
                        <h4 class="font-medium hover:text-primary transition-colors">
                          {{ chapter.title }}
                        </h4>
                        <UBadge
                          v-if="chapter.isNew"
                          color="error"
                          variant="subtle"
                          size="xs"
                        >
                          Mới
                        </UBadge>
                      </div>
                      <div class="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                        <div class="flex items-center gap-1">
                          <UIcon name="i-lucide-clock" class="h-3 w-3" />
                          {{ chapter.publishDate }}
                        </div>
                        <div class="flex items-center gap-1">
                          <UIcon name="i-lucide-book-open" class="h-3 w-3" />
                          {{ chapter.wordCount }}
                        </div>
                      </div>
                    </div>
                    <div class="flex items-center gap-2">
                      <UButton variant="ghost" size="sm">
                        <UIcon name="i-lucide-book-open" class="h-4 w-4" />
                      </UButton>
                      <UButton variant="ghost" size="sm">
                        <UIcon name="i-lucide-headphones" class="h-4 w-4" />
                      </UButton>
                    </div>
                  </div>
                </div>
              </UCard>
            </div>

            <div class="flex justify-center">
              <UButton variant="outline">
                Xem thêm chương
              </UButton>
            </div>
          </div>
        </template>

        <template #reviews>
          <div class="space-y-6 mt-6">
            <div class="flex items-center justify-between">
              <h3 class="text-xl font-semibold">
                Đánh giá từ độc giả
              </h3>
              <UButton>Viết đánh giá</UButton>
            </div>

            <div class="space-y-4">
              <UCard v-for="review in reviews" :key="review.id">
                <UCardBody class="p-4">
                  <div class="flex items-start gap-3">
                    <UAvatar :src="review.avatar || '/placeholder.svg'" :alt="review.user" />

                    <div class="flex-1">
                      <div class="flex items-center gap-2 mb-2">
                        <span class="font-medium">{{ review.user }}</span>
                        <div class="flex items-center">
                          <UIcon
                            v-for="i in 5"
                            :key="i"
                            name="i-lucide-star"
                            class="h-3 w-3"
                            :class="i <= review.rating ? 'text-yellow-400' : 'text-gray-300'"
                          />
                        </div>
                        <span class="text-sm text-gray-500 dark:text-gray-400">{{ review.date }}</span>
                      </div>

                      <p class="text-gray-500 dark:text-gray-400 mb-3">
                        {{ review.content }}
                      </p>

                      <div class="flex items-center gap-4">
                        <UButton variant="ghost" size="sm" class="h-8 px-2">
                          <UIcon name="i-lucide-thumbs-up" class="h-3 w-3 mr-1" />
                          {{ review.likes }}
                        </UButton>
                        <UButton variant="ghost" size="sm" class="h-8 px-2">
                          <UIcon name="i-lucide-message-circle" class="h-3 w-3 mr-1" />
                          Trả lời
                        </UButton>
                      </div>
                    </div>
                  </div>
                </UCardBody>
              </UCard>
            </div>
          </div>
        </template>

        <template #similar>
          <div class="space-y-6 mt-6">
            <h3 class="text-xl font-semibold">
              Truyện tương tự
            </h3>
            <UPageGrid :cols="{ default: 1, md: 2, lg: 3 }" gap="6">
              <!-- Similar stories would be rendered here -->
              <div class="text-center text-gray-500 dark:text-gray-400 py-8">
                Đang tải truyện tương tự...
              </div>
            </UPageGrid>
          </div>
        </template>
      </UTabs>
    </UContainer>
  </div>
</template>
