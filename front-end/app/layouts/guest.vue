<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'
import { useAuthStore } from '~/stores/auth.store'
import { useAuth } from '~/composables/auth/useAuth'

const { logout } = useAuth()
const auth = useAuthStore()
const showMenu = ref(false)

const navItems = [
  { label: 'Trang chủ', icon: 'i-lucide-home', to: '/novel' },
  { label: 'Thể loại', icon: 'i-lucide-book', to: '/novel' },
  { label: 'Bảng xếp hạng', icon: 'i-lucide-trophy', to: '/novel' },
  { label: 'Mới cập nhật', icon: 'i-lucide-sparkles', to: '/novel', slot: '/' }
] satisfies NavigationMenuItem[]

async function Out() {
  console.log('Logout')
  // auth.logout()
  try {
    await logout()
    showMenu.value = false
  } catch {
    console.log('Error logout')
  }
}
</script>

<template>
  <UHeader
    class="bg-gradient-to-rshadow-lg"
    :toggle="showMenu"
  >
    <!-- :toggle="undefined" -->
    <template #title>
      <NuxtLink to="/" class="flex items-center gap-3 transition-transform hover:scale-105">
        <UIcon name="i-lucide-book-open" class="text-primary-400 text-2xl" />
        <span class="text-1xl font-extrabold tracking-tight">NOVEL ONLINE</span>
      </NuxtLink>
    </template>

    <template #right>
      <!-- Menu Button for Mobile or Auth Controls -->
      <UColorModeSwitch />
      <div class="ml-3">
        <UButton
          v-if="!auth.isAuthenticated"
          icon="i-lucide-menu"
          color="neutral"
          variant="ghost"
          @click="showMenu = true"
        />
        <UAvatar
          v-else
          :src="auth.user?.image.src || 'https://ui-avatars.com/api/?name=User'"
          alt="User avatar"
          size="md"
          class="cursor-pointer ring-2 ring-primary-200 hover:ring-primary-400 transition-all"
          @click="showMenu = true"
        />
      </div>
    </template>
  </UHeader>

  <!-- Slideover Menu -->
  <USlideover v-model:open="showMenu">
    <template #content>
      <UCard class="overflow-y-auto flex flex-col p-1 cursor-pointer">
        <!-- Authenticated User Panel -->
        <template v-if="auth.isAuthenticated">
          <div class="flex items-center justify-between mb-6">
            <div class="flex items-center gap-3">
              <UAvatar
                :src="auth.user?.image.src || 'https://ui-avatars.com/api/?name=User'"
                size="lg"
                class="ring-2 ring-primary-200"
              />
              <div>
                <div class="text-lg font-semibold text-gray-900 dark:text-white">
                  {{ auth.user?.username || 'Tôi tên Đông' }}
                </div>
                <UBadge
                  color="error"
                  label="25"
                  size="xs"
                  class="mt-1"
                />
              </div>
            </div>
            <UButton
              icon="i-lucide-log-out"
              variant="ghost"
              color="neutral"
              size="sm"
              @click="Out"
            >
              Thoát
            </UButton>
          </div>

          <!-- User Menu Items -->
          <ul class="space-y-4 text-gray-700 dark:text-gray-200 mb-8">
            <li class="flex items-center gap-2 hover:text-primary-600 transition-colors">
              <UIcon name="i-lucide-arrow-up-circle" /> Nâng cấp tài khoản
              <UBadge color="success" label="NEW" size="xs" />
            </li>
            <li class="flex items-center gap-2 hover:text-primary-600 transition-colors">
              <NuxtLink to="/user/mystory">
                <UIcon name="i-lucide-library" /> Tủ truyện của tôi
              </NuxtLink>
            </li>
            <li class="flex items-center gap-2 hover:text-primary-600 transition-colors">
              <UIcon name="i-lucide-history" /> Lịch sử giao dịch
            </li>
            <li class="flex items-center gap-2 hover:text-primary-600 transition-colors">
              <UIcon name="i-lucide-settings" /> Cài đặt cá nhân
            </li>
            <li class="flex items-center gap-2 hover:text-primary-600 transition-colors">
              <UIcon name="i-lucide-help-circle" /> Yêu cầu hỗ trợ
            </li>
          </ul>

          <!-- User Stats -->
          <div class="grid grid-cols-3 gap-4 text-center mb-8">
            <div class="flex flex-col items-center">
              <UIcon name="i-lucide-coins" class="text-yellow-400 text-xl mb-1" />
              <span class="text-sm font-medium">10,617</span>
              <span class="text-xs text-gray-500">Xu</span>
            </div>
            <div class="flex flex-col items-center">
              <UIcon name="i-lucide-key" class="text-gray-600 text-xl mb-1" />
              <span class="text-sm font-medium">0</span>
              <span class="text-xs text-gray-500">Khóa</span>
            </div>
            <div class="flex flex-col items-center">
              <UIcon name="i-lucide-gift" class="text-pink-400 text-xl mb-1" />
              <span class="text-sm font-medium">1</span>
              <span class="text-xs text-gray-500">Vật phẩm</span>
            </div>
          </div>

          <div class="my-3">
            <NuxtLink to="/user/mystory/addnew" class="text-sm text-gray-700 dark:text-gray-300 hover:text-primary-600">
              <h4 class="font-semibold text-gray-900 dark:text-white mb-3">
                Đăng truyện
              </h4>
              Tạo và chia sẻ câu chuyện của bạn
            </NuxtLink>
          </div>
        </template>

        <!-- Unauthenticated User Panel -->
        <template v-else>
          <div class="text-center mb-8">
            <UIcon name="i-lucide-user" class="text-4xl text-primary-400 mb-4" />
            <h3 class="text-xl font-semibold text-gray-900 dark:text-white">
              Chào mừng đến với NovelOnline
            </h3>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Đăng nhập hoặc đăng ký để trải nghiệm tốt hơn!
            </p>
          </div>
          <div class="space-y-4">
            <UButton
              label="Đăng nhập"
              color="primary"
              variant="solid"
              block
              to="/auth/login"
            />
            <UButton
              label="Đăng ký"
              color="neutral"
              variant="outline"
              block
              to="/auth/signup"
            />
          </div>
        </template>

        <!-- Navigation Links for Mobile -->
        <div class="space-y-6 mt-3">
          <div>
            <h4 class="font-semibold text-gray-900 dark:text-white mb-3">
              Khám phá
            </h4>
            <ul class="space-y-3 text-sm text-gray-700 dark:text-gray-300">
              <li v-for="item in navItems" :key="item.label" class="flex items-center gap-2">
                <UIcon :name="item.icon" />
                <NuxtLink :to="item.to" @click="showMenu = false">
                  {{ item.label }}
                  <UBadge
                    v-if="item.slot === 'rankings'"
                    label="44"
                    variant="solid"
                    color="error"
                    size="xs"
                    class="ml-2"
                  />
                </NuxtLink>
              </li>
            </ul>
          </div>

          <div>
            <h4 class="font-semibold text-gray-900 dark:text-white mb-3">
              Kho truyện
            </h4>
            <ul class="ml-2 list-disc text-sm text-gray-700 dark:text-gray-300 space-y-2">
              <li><NuxtLink to="/search" @click="showMenu = false">Truyện mới</NuxtLink></li>
              <li><NuxtLink to="/search" @click="showMenu = false">Truyện full</NuxtLink></li>
            </ul>
          </div>

          <div>
            <h4 class="font-semibold text-gray-900 dark:text-white mb-3">
              Xếp hạng
            </h4>
            <ul class="ml-2 list-disc text-sm text-gray-700 dark:text-gray-300 space-y-2">
              <li><NuxtLink to="/search" @click="showMenu = false">Lượt đọc</NuxtLink></li>
              <li><NuxtLink to="/search" @click="showMenu = false">Đề cử</NuxtLink></li>
              <li><NuxtLink to="/search" @click="showMenu = false">Tặng thưởng</NuxtLink></li>
            </ul>
          </div>
        </div>
      </UCard>
    </template>
  </USlideover>
  <slot />
</template>

<style scoped>
/* Custom transitions and hover effects */
.slideover {
  @apply transition-all duration-300;
}

/* Enhance navigation link hover states */
a:hover {
  @apply transition-colors duration-200;
}

/* Smooth scaling for logo */
.logo:hover {
  @apply scale-105 transition-transform duration-200;
}
</style>
