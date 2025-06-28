<script lang="ts" setup>
import { useAuthStore } from '~/stores/auth.store'
import { useCurrentLayout } from '~/composables/useCurrentLayout'

const route = useRoute()
const toast = useToast()

const layout = useCurrentLayout()
layout.value = 'mod'
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
  label: 'Kiểm duyêt',
  to: '/',
  icon: 'i-lucide-shield-user',
  defaultOpen: true,
  children: [{
    label: 'Chờ duyệt',
    to: '/moderator/novel',
    icon: 'i-lucide-file-input',
    onSelect: () => {
      open.value = false
    }
  },
  {
    label: 'Yêu cầu sửa',
    to: '/moderator/novel/editing',
    icon: 'i-lucide-file-pen',
    onSelect: () => {
      open.value = false
    }
  },
  {
    label: 'Vi phạm',
    to: '/moderator/novel/violation',
    icon: 'i-lucide-file-x-2',
    onSelect: () => {
      open.value = false
    }
  }]
},
{
  label: 'Báo cáo & hỗ trợ',
  to: '/',
  icon: 'i-lucide-bug',
  defaultOpen: false,
  children: [{
    label: 'Xử lý báo cáo',
    to: '/moderator/reports',
    onSelect: () => {
      open.value = false
    }
  }, {
    label: 'Yêu cầu hỗ trợ',
    to: '/moderator/reports/hotro',
    onSelect: () => {
      open.value = false
    }
  }]
},
{
  label: 'Lịch sử',
  to: '/moderator/history',
  icon: 'i-lucide-file-clock',
  onSelect: () => {
    open.value = false
  }
},
{
  label: 'Tư liệu',
  to: '/',
  icon: 'i-lucide-sticky-note',
  defaultOpen: false,
  children: [{
    label: 'Bản thảo',
    to: '/user/documents/draft',
    onSelect: () => {
      open.value = false
    }
  }, {
    label: 'Đại cương',
    to: '/user/documents/conspectus',
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
  <ClientOnly>
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
            <span class="text-1xl font-extrabold tracking-tight truncate lg:block" :class="{ hidden: true }">NOVEL ONLINE</span>
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
  </ClientOnly>
</template>
