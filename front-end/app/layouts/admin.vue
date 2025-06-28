<script setup lang="ts">
import { useCurrentLayout } from '~/composables/useCurrentLayout'
import { useAuthStore } from '~/stores/auth.store'

const route = useRoute()
const toast = useToast()

const layout = useCurrentLayout()
layout.value = 'admin'
const open = ref(false)

const links = [[{
  label: 'Trang chủ',
  icon: 'i-lucide-house',
  to: '/',
  onSelect: () => {
    open.value = false
  }
},
{
  label: 'Quản lý',
  to: '/',
  icon: 'i-lucide-globe',
  defaultOpen: true,
  children: [{
    label: 'Truyện',
    to: '/admin/audio',
    icon: 'i-lucide-book-open',
    onSelect: () => {
      open.value = false
    }
  },
  {
    label: 'Người dùng',
    to: '/admin/users',
    icon: 'i-lucide-users',
    defaultOpen: false
  },
  {
    label: 'Báo cáo & vi phạm',
    to: '/admin/violation',
    icon: 'i-lucide-flag',
    defaultOpen: false
  },
  {
    label: 'Nhật ký',
    to: '/admin/logs',
    icon: 'i-lucide-calendar-cog',
    defaultOpen: false
  },
  {
    label: 'Thống kê',
    to: '/',
    icon: 'i-lucide-chart-line',
    onSelect: () => {
      open.value = false
    }
  }]
},
{
  label: 'Truyện của tôi',
  to: '/',
  icon: 'i-lucide-blocks',
  defaultOpen: false,
  children: [{
    label: 'Đã đăng',
    to: '/',
    icon: 'i-lucide-server',
    onSelect: () => {
      open.value = false
    }
  }, {
    label: 'Thêm mới',
    to: '/',
    icon: 'i-lucide-file-plus',
    onSelect: () => {
      open.value = false
    }
  }, {
    label: 'Thống kê',
    to: '/',
    icon: 'i-lucide-chart-pie',
    onSelect: () => {
      open.value = false
    }
  }]
},
{
  label: 'Tư liệu',
  to: '/',
  icon: 'i-lucide-sticky-note',
  defaultOpen: false,
  children: [{
    label: 'Bản thảo',
    to: '/',
    onSelect: () => {
      open.value = false
    }
  }, {
    label: 'Đại cương',
    to: '/',
    onSelect: () => {
      open.value = false
    }
  }]
}, {
  label: 'Thông tin',
  to: '/',
  icon: 'i-lucide-file-question',
  defaultOpen: false,
  children: [{
    label: 'Kiến thức cơ bản',
    to: '/information/basicKnowledge',
    onSelect: () => {
      open.value = false
    }
  }, {
    label: 'Các danh hiệu',
    to: '/information/awards',
    icon: 'i-lucide-award',
    onSelect: () => {
      open.value = false
    }
  }]
}]]

const groups = computed(() => [{
  id: 'links',
  label: 'Go to',
  items: links.flat()
}, {
  id: 'code',
  label: 'Code',
  items: [{
    id: 'source',
    label: 'View page source',
    icon: 'i-simple-icons-github',
    to: `https://github.com/nuxt-ui-pro/dashboard/blob/v3/app/pages${route.path === '/' ? '/index' : route.path}.vue`,
    target: '_blank'
  }]
}])

onMounted(async () => {
  const cookie = useCookie('cookie-consent')
  if (cookie.value === 'accepted') {
    return
  }

  toast.add({
    title: 'We use first-party cookies to enhance your experience on our website.',
    duration: 0,
    close: false,
    actions: [{
      label: 'Accept',
      color: 'neutral',
      variant: 'outline',
      onClick: () => {
        cookie.value = 'accepted'
      }
    }, {
      label: 'Opt out',
      color: 'neutral',
      variant: 'ghost'
    }]
  })
})
const auth = useAuthStore()
const user = {
  name: auth.user?.username ? auth.user.username : 'No Name',
  avatar: {
    src: auth.user?.image.src ? auth.user.image.src : 'https://avatars.githubusercontent.com/u/5968485?v=4',
    alt: auth.user?.image.alt ? auth.user.image.alt : 'Ảnh đại diện'
  },
  role: auth.user?.role ? auth.user.role : 'User'
}
</script>

<template>
  <UDashboardGroup>
    <UDashboardSearch :groups="groups" />

    <!-- mode="drawer" -->
    <UDashboardSidebar
      v-model:open="open"
      collapsible
      resizable
      class="bg-(--ui-bg-elevated)/25"
      :ui="{ footer: 'lg:border-t lg:border-(--ui-border)' }"
    >
      <template #header>
        <NuxtLink to="/" class="flex items-center gap-3 transition-transform hover:scale-105 overflow-hidden">
          <UIcon name="i-lucide-book-open" class="text-primary-400 text-2xl" />
          <span class="text-1xl font-extrabold tracking-tight">NOVEL ONLINE</span>
        </NuxtLink>
      </template>

      <template #default="{ collapsed }">
        <UDashboardSearchButton :collapsed="collapsed" class="bg-transparent ring-(--ui-border)" />

        <UNavigationMenu
          :collapsed="collapsed"
          :items="links[0]"
          orientation="vertical"
        />

        <UNavigationMenu
          :collapsed="collapsed"
          :items="links[1]"
          orientation="vertical"
          class="mt-auto"
        />
      </template>

      <template #footer="{ collapsed }">
        <UserMenu :user="user" :collapsed="collapsed" />
      </template>
    </UDashboardSidebar>

    <slot />

    <NotificationsSlideover />
  </UDashboardGroup>
</template>
