<script setup lang="ts">
// import { toInteger } from 'lodash'
// import type { Novel, ApiResponse } from '~/types/novel'

// const novels = await $fetch<ApiResponse<Novel>>(`http://localhost:5000/api/v1/novel`, {
//   method: 'GET',
//   credentials: 'include'
// })
// const featuredStories = [
//   {
//     _id: 1,
//     title: 'Thế Giới Hoàn Mỹ',
//     author: 'Thần Đông',
//     description: 'Một thế giới nơi mà mọi sinh vật đều có thể tu luyện để trở nên hoàn hảo...',
//     image: 'https://truyenhdt.com/wp-content/uploads/2020/12/the-gioi-hoan-my.jpg',
//     rating: 4.8,
//     chapters: 1250,
//     category: 'Tiên Hiệp',
//     status: 'Đang cập nhật',
//     views: '2.5M'
//   },
//   {
//     _id: 2,
//     title: 'Đấu Phá Thương Khung',
//     author: 'Thiên Tằm Thổ Đậu',
//     description: 'Câu chuyện về Tiêu Viêm và hành trình tu luyện đầy gian khó của anh...',
//     image: 'https://truyenhdt.com/wp-content/uploads/2019/12/cuong-ngao-dau-pha-thuong-khung.jpg?height=300&width=200',
//     rating: 4.9,
//     chapters: 1648,
//     category: 'Tiên Hiệp',
//     status: 'Hoàn thành',
//     views: '5.2M'
//   },
//   {
//     _id: 3,
//     title: 'Toàn Chức Pháp Sư',
//     author: 'Loạn',
//     description: 'Thế giới ma pháp nơi mà sức mạnh quyết định tất cả...',
//     image: 'https://truyenhdt.com/wp-content/uploads/2021/01/toan-chuc-phap-su.jpg?height=300&width=200',
//     rating: 4.7,
//     chapters: 3169,
//     category: 'Huyền Hương',
//     status: 'Đang cập nhật',
//     views: '3.8M'
//   },
//   {
//     _id: 4,
//     title: 'Ngã Là Chí Tôn',
//     author: 'Mộng Nhập Thần Cơ',
//     description: 'Hành trình tu tiên đầy thử thách và bí ẩn...',
//     image: 'https://truyenhdt.com/wp-content/uploads/2025/02/12735269.jpg?height=300&width=200',
//     rating: 4.6,
//     chapters: 892,
//     category: 'Tiên Hiệp',
//     status: 'Đang cập nhật',
//     views: '1.9M'
//   }
// ]

const categories = ['Tiên Hiệp', 'Huyền Hương', 'Đô Thị', 'Lịch Sử', 'Quân Sự', 'Khoa Huyền', 'Linh Dị', 'Đồng Nhân']
// const formatNumber = (num: number): string => {
//   if (num >= 1000000) {
//     return (num / 1000000).toFixed(1) + 'M'
//   } else if (num >= 1000) {
//     return (num / 1000).toFixed(1) + 'K'
//   }
//   return num.toString()
// }
</script>

<template>
  <div>
    <!-- Hero Section -->
    <section class="py-12 md:py-20 bg-gradient-to-b from-primary-50 to-white dark:from-primary-950 dark:to-gray-950">
      <UContainer class="text-center">
        <h1 class="text-4xl md:text-6xl font-bold tracking-tight mb-6">
          Khám phá thế giới
          <span class="text-primary block">truyện không giới hạn</span>
        </h1>
        <p class="text-xl text-gray-500 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
          Hàng nghìn câu chuyện hấp dẫn đang chờ bạn khám phá. Đọc hoặc nghe truyện mọi lúc, mọi nơi.
        </p>
        <!-- Search Bar -->
        <div class="max-w-3xl mx-auto mb-10">
          <form action="/search" method="GET" class="flex items-center gap-3">
            <UInput
              name="q"
              placeholder="Tìm kiếm truyện, tác giả..."
              icon="i-lucide-search"
              size="lg"
              class="flex-1"
              color="primary"
              variant="outline"
            />
            <UButton type="submit" size="lg" color="primary">
              Tìm kiếm
            </UButton>
          </form>
        </div>

        <div class="flex flex-wrap justify-center gap-2">
          <UBadge
            v-for="category in categories"
            :key="category"
            variant="subtle"
            color="neutral"
            class="cursor-pointer"
          >
            <!-- <NuxtLink :to="`/category/${category}`">{{ category }}</NuxtLink> -->
            <NuxtLink :to="`/`">{{ category }}</NuxtLink>
          </UBadge>
        </div>
      </UContainer>
    </section>

    <!-- Featured Stories -->
    <section class="py-16">
      <UContainer>
        <NovelReader />
        <!-- <div class="flex items-center justify-between mb-8">
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-trending-up" class="text-primary" />
            <h2 class="text-3xl font-bold">
              Truyện mới đăng
            </h2>
          </div>
          <UButton to="/featured" variant="outline">
          <UButton to="/" variant="outline">
            Xem tất cả
          </UButton>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 py-2">
          <div
            v-for="novel in novels.data"
            :key="novel?._id"
            class="group relative bg-white dark:bg-slate-800 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 cursor-pointer"
          >
            Cover Image with Overlay
            <div class="relative aspect-[5/4] overflow-hidden">
              <img
                :src="novel?.coverImage || '/placeholder.svg?height=320&width=240'"
                :alt="novel?.title"
                class="w-full h-full object-contains transition-transform duration-300 group-hover:scale-105"
              >
              <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div class="absolute top-3 right-3">
                <UBadge
                  :label="novel.category"
                  color="primary"
                  variant="subtle"
                  class="shadow-lg"
                />
              </div>
            </div>

            Card Content
            <div class="p-5 space-y-3">
              <div>
                <h3 class="font-semibold text-slate-900 dark:text-white line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {{ novel.title }}
                </h3>
                <p class="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  by {{ novel.author }}
                </p>
              </div>

              <p class="text-xs text-slate-500 dark:text-slate-500 line-clamp-2 leading-relaxed">
                {{ novel.description }}
              </p>

              Stats Row
              <div class="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700">
                <div class="flex items-center space-x-3">
                  <div class="flex items-center space-x-1">
                    <UIcon name="i-heroicons-document-text" class="w-3 h-3 text-slate-400" />
                   <span class="text-xs text-slate-600 dark:text-slate-400">{{ novel. }}</span>
                  </div>
                  <div class="flex items-center space-x-1">
                    <UIcon name="i-heroicons-eye" class="w-3 h-3 text-slate-400" />
                    <span class="text-xs text-slate-600 dark:text-slate-400">{{ formatNumber(toInteger(novel.viewCount)) }}</span>
                  </div>
                </div>

                <div class="flex items-center space-x-1">
                  <div class="flex space-x-2">
                    <UButton
                      icon="i-heroicons-play-circle"
                      size="xs"
                      variant="solid"
                      class="flex-1 cursor-pointer text-white hover:bg-indigo-500 bg-transparent mt-2"
                      :to="`/novels/${novel._id}`"
                    >
                      Đọc ngay
                    </UButton>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div> -->
      </UContainer>
    </section>

    <!-- Quick Actions -->
    <section class="py-5 bg-gray-50 dark:bg-gray-900">
      <UContainer>
        <h2 class="text-3xl font-bold text-center mb-12">
          Trải nghiệm đa dạng
        </h2>
        <UPageGrid :cols="4" gap="8" class=" mx-auto">
          <!-- Đọc truyện -->
          <UCard class="text-center p-4">
            <UIcon name="i-lucide-book-open" class="h-12 w-12 text-primary mx-auto mb-4" />
            <h3 class="text-xl font-semibold mb-2">
              Đọc truyện
            </h3>
            <p class="text-gray-500 dark:text-gray-400 mb-4">
              Thưởng thức câu chuyện với giao diện đọc tối ưu, tùy chỉnh font chữ và màu nền
            </p>
            <UButton>Bắt đầu đọc</UButton>
          </UCard>

          <!-- Nghe truyện -->
          <UCard class="text-center p-4">
            <UIcon name="i-lucide-headphones" class="h-12 w-12 text-primary mx-auto mb-4" />
            <h3 class="text-xl font-semibold mb-2">
              Nghe truyện
            </h3>
            <p class="text-gray-500 dark:text-gray-400 mb-4">
              Thư giãn với audiobook chất lượng cao, giọng đọc tự nhiên và sinh động
            </p>
            <UButton>Bắt đầu nghe</UButton>
          </UCard>

          <!-- Viết và chia sẻ -->
          <UCard class="text-center p-4">
            <UIcon name="i-lucide-pencil-line" class="h-12 w-12 text-primary mx-auto mb-4" />
            <h3 class="text-xl font-semibold mb-2">
              Viết & chia sẻ
            </h3>
            <p class="text-gray-500 dark:text-gray-400 mb-4">
              Trở thành tác giả, đăng tải tác phẩm của bạn và chia sẻ cùng cộng đồng
            </p>
            <UButton>Viết ngay</UButton>
          </UCard>
        </UPageGrid>
      </UContainer>
    </section>
    <!-- Footer -->
    <UFooter class="border-t py-12 w-full">
      <UContainer class="w-full items-start">
        <!-- Logo và mô tả (Full width trên cùng) -->
        <div class="mb-10">
          <div class="flex items-center gap-2 mb-4">
            <UIcon name="i-lucide-book-open" class="text-primary w-6 h-6" />
            <span class="text-xl font-bold text-gray-800 dark:text-white">NovelOnline</span>
          </div>
          <p class="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
            Nền tảng đọc và nghe truyện hàng đầu Việt Nam.
          </p>
        </div>

        <!-- Grid 3 cột: Thể loại - Hỗ trợ - Kết nối -->
        <UPageGrid :cols="{ default: 1, md: 3 }" gap="10" class="w-full mb-10">
          <!-- Thể loại -->
          <div>
            <h4 class="text-base font-semibold text-gray-800 dark:text-white mb-4">
              Thể loại
            </h4>
            <ul class="space-y-2 text-sm text-gray-500 dark:text-gray-400">
              <li><NuxtLink to="/" class="hover:text-primary transition-colors">Tiên Hiệp</NuxtLink></li>
              <li><NuxtLink to="/" class="hover:text-primary transition-colors">Huyền Huyễn</NuxtLink></li>
              <li><NuxtLink to="/" class="hover:text-primary transition-colors">Đô Thị</NuxtLink></li>
              <li><NuxtLink to="/" class="hover:text-primary transition-colors">Lịch Sử</NuxtLink></li>
            </ul>
          </div>

          <!-- Hỗ trợ -->
          <div>
            <h4 class="text-base font-semibold text-gray-800 dark:text-white mb-4">
              Hỗ trợ
            </h4>
            <ul class="space-y-2 text-sm text-gray-500 dark:text-gray-400">
              <li><NuxtLink to="/" class="hover:text-primary transition-colors">Trung tâm trợ giúp</NuxtLink></li>
              <li><NuxtLink to="/" class="hover:text-primary transition-colors">Liên hệ</NuxtLink></li>
              <li><NuxtLink to="/" class="hover:text-primary transition-colors">Góp ý</NuxtLink></li>
              <li><NuxtLink to="/" class="hover:text-primary transition-colors">Điều khoản</NuxtLink></li>
            </ul>
          </div>

          <!-- Kết nối -->
          <div>
            <h4 class="text-base font-semibold text-gray-800 dark:text-white mb-4">
              Kết nối
            </h4>
            <ul class="space-y-2 text-sm text-gray-500 dark:text-gray-400">
              <li><NuxtLink to="#" class="hover:text-primary transition-colors">Facebook</NuxtLink></li>
              <li><NuxtLink to="#" class="hover:text-primary transition-colors">Twitter</NuxtLink></li>
              <li><NuxtLink to="#" class="hover:text-primary transition-colors">Instagram</NuxtLink></li>
              <li><NuxtLink to="#" class="hover:text-primary transition-colors">YouTube</NuxtLink></li>
            </ul>
          </div>
        </UPageGrid>

        <!-- Bản quyền -->
        <div class="text-center text-sm text-gray-500 dark:text-gray-400">
          &copy; 2025 NovelOnline. Tất cả quyền được bảo lưu.
        </div>
      </UContainer>
    </UFooter>
  </div>
</template>
