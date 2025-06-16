<script setup lang="ts">
definePageMeta({
  layout: 'guest'
})

const featuredStories = [
  {
    id: 1,
    title: 'Thế Giới Hoàn Mỹ',
    author: 'Thần Đông',
    description: 'Một thế giới nơi mà mọi sinh vật đều có thể tu luyện để trở nên hoàn hảo...',
    image: 'https://truyenhdt.com/wp-content/uploads/2020/12/the-gioi-hoan-my.jpg?height=300&width=200',
    rating: 4.8,
    chapters: 1250,
    category: 'Tiên Hiệp',
    status: 'Đang cập nhật',
    views: '2.5M'
  },
  {
    id: 2,
    title: 'Đấu Phá Thương Khung',
    author: 'Thiên Tằm Thổ Đậu',
    description: 'Câu chuyện về Tiêu Viêm và hành trình tu luyện đầy gian khó của anh...',
    image: 'https://truyenhdt.com/wp-content/uploads/2019/12/cuong-ngao-dau-pha-thuong-khung.jpg?height=300&width=200',
    rating: 4.9,
    chapters: 1648,
    category: 'Tiên Hiệp',
    status: 'Hoàn thành',
    views: '5.2M'
  },
  {
    id: 3,
    title: 'Toàn Chức Pháp Sư',
    author: 'Loạn',
    description: 'Thế giới ma pháp nơi mà sức mạnh quyết định tất cả...',
    image: 'https://truyenhdt.com/wp-content/uploads/2021/01/toan-chuc-phap-su.jpg?height=300&width=200',
    rating: 4.7,
    chapters: 3169,
    category: 'Huyền Hương',
    status: 'Đang cập nhật',
    views: '3.8M'
  },
  {
    id: 4,
    title: 'Ngã Là Chí Tôn',
    author: 'Mộng Nhập Thần Cơ',
    description: 'Hành trình tu tiên đầy thử thách và bí ẩn...',
    image: 'https://truyenhdt.com/wp-content/uploads/2025/02/12735269.jpg?height=300&width=200',
    rating: 4.6,
    chapters: 892,
    category: 'Tiên Hiệp',
    status: 'Đang cập nhật',
    views: '1.9M'
  }
]

const categories = ['Tiên Hiệp', 'Huyền Hương', 'Đô Thị', 'Lịch Sử', 'Quân Sự', 'Khoa Huyền', 'Linh Dị', 'Đồng Nhân']
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
        <div class="flex items-center justify-between mb-8">
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-trending-up" class="text-primary" />
            <h2 class="text-3xl font-bold">
              Truyện nổi bật
            </h2>
          </div>
          <!-- <UButton to="/featured" variant="outline"> -->
          <UButton to="/" variant="outline">
            Xem tất cả
          </UButton>
        </div>

        <UPageGrid :cols="{ default: 1, md: 2, lg: 4 }" gap="6">
          <UCard
            v-for="story in featuredStories"
            :key="story.id"
            class="group"
            to="/"
          >
            <!-- :to="`/story/${story.id}`" -->
            <div class="aspect-[3/4] relative overflow-hidden rounded-t-lg">
              <img
                :src="story.image"
                :alt="story.title"
                class="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
              >
              <UBadge
                class="absolute top-2 right-2"
                variant="subtle"
                color="neutral"
                :class="story.status === 'Hoàn thành' ? 'bg-green-100' : 'bg-blue-100'"
              >
                {{ story.status }}
              </UBadge>
            </div>
            <template #header>
              <div class="line-clamp-2 text-lg group-hover:text-primary transition-colors">
                {{ story.title }}
              </div>
              <div class="flex items-center gap-1">
                <UIcon name="i-lucide-user" class="h-3 w-3" />
                {{ story.author }}
              </div>
            </template>
            <p class="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-3">
              {{ story.description }}
            </p>
            <div class="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-2">
              <div class="flex items-center gap-1">
                <UIcon name="i-lucide-star" class="h-3 w-3 text-yellow-400" />
                {{ story.rating }}
              </div>
              <div class="flex items-center gap-1">
                <UIcon name="i-lucide-book-open" class="h-3 w-3" />
                {{ story.chapters }} chương
              </div>
            </div>
            <div class="flex items-center justify-between">
              <UBadge variant="outline" size="xs">
                {{ story.category }}
              </UBadge>
              <span class="text-xs text-gray-500 dark:text-gray-400">{{ story.views }} lượt xem</span>
            </div>
          </UCard>
        </UPageGrid>
      </UContainer>
    </section>

    <!-- Quick Actions -->
    <section class="py-16 bg-gray-50 dark:bg-gray-900">
      <UContainer>
        <h2 class="text-3xl font-bold text-center mb-12">
          Trải nghiệm đa dạng
        </h2>
        <UPageGrid :cols="{ default: 1, md: 2 }" gap="8" class="max-w-4xl mx-auto">
          <UCard class="text-center p-8">
            <UIcon name="i-lucide-book-open" class="h-12 w-12 text-primary mx-auto mb-4" />
            <h3 class="text-xl font-semibold mb-2">
              Đọc truyện
            </h3>
            <p class="text-gray-500 dark:text-gray-400 mb-4">
              Thưởng thức câu chuyện với giao diện đọc tối ưu, tùy chỉnh font chữ và màu nền
            </p>
            <UButton>Bắt đầu đọc</UButton>
          </UCard>

          <UCard class="text-center p-8">
            <UIcon name="i-lucide-headphones" class="h-12 w-12 text-primary mx-auto mb-4" />
            <h3 class="text-xl font-semibold mb-2">
              Nghe truyện
            </h3>
            <p class="text-gray-500 dark:text-gray-400 mb-4">
              Thư giãn với audiobook chất lượng cao, giọng đọc tự nhiên và sinh động
            </p>
            <UButton>Bắt đầu nghe</UButton>
          </UCard>
        </UPageGrid>
      </UContainer>
    </section>

    <!-- Footer -->
    <UFooter class="border-t py-12">
      <UContainer>
        <UPageGrid :cols="{ default: 1, md: 2 }" gap="10">
          <!-- Logo và mô tả -->
          <div>
            <div class="flex items-center gap-2 mb-4">
              <UIcon name="i-lucide-book-open" class="text-primary w-6 h-6" />
              <span class="text-xl font-bold text-gray-800 dark:text-white">NovelOnline</span>
            </div>
            <p class="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
              Nền tảng đọc và nghe truyện hàng đầu Việt Nam.
            </p>
          </div>

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

          <!-- Mạng xã hội -->
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

        <div class="text-center text-sm text-gray-500 dark:text-gray-400">
          &copy; 2025 NovelOnline. Tất cả quyền được bảo lưu.
        </div>
      </UContainer>
    </UFooter>
  </div>
</template>
