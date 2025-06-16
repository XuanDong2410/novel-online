<script setup lang="ts">
const route = useRoute()
const toast = useToast()

const open = ref(false)

const links = [[{
  label: 'Home',
  icon: 'i-lucide-house',
  to: '/',
  onSelect: () => {
    open.value = false
  }
}, {
  label: 'Inbox',
  icon: 'i-lucide-inbox',
  to: '/admin/inbox',
  badge: '4',
  onSelect: () => {
    open.value = false
  }
}, {
  label: 'Customers',
  icon: 'i-lucide-users',
  to: '/admin/customers',
  onSelect: () => {
    open.value = false
  }
}, {
  label: 'Settings',
  to: '/admin/settings',
  icon: 'i-lucide-settings',
  defaultOpen: false,
  children: [{
    label: 'General',
    to: '/settings',
    exact: true,
    onSelect: () => {
      open.value = false
    }
  }, {
    label: 'Members',
    to: '/settings/members',
    onSelect: () => {
      open.value = false
    }
  }, {
    label: 'Notifications',
    to: '/settings/notifications',
    onSelect: () => {
      open.value = false
    }
  }, {
    label: 'Security',
    to: '/settings/security',
    onSelect: () => {
      open.value = false
    }
  }]
},
{
  label: 'TRUYỆN CỦA TÔI',
  to: '/',
  icon: 'i-lucide-blocks',
  defaultOpen: true,
  children: [{
    label: 'Đã đăng',
    to: '/user/mystory',
    icon: 'i-lucide-server',
    onSelect: () => {
      open.value = false
    }
  }, {
    label: 'Thêm mới',
    to: '/user/mystory/addnew',
    icon: 'i-lucide-file-plus',
    onSelect: () => {
      open.value = false
    }
  }, {
    label: 'Thống kê',
    to: '/user/mystory/thongke',
    icon: 'i-lucide-chart-pie',
    onSelect: () => {
      open.value = false
    }
  }]
}, {
  label: 'BÁO CÁO & HỖ TRỢ',
  to: '/',
  icon: 'i-lucide-bug',
  defaultOpen: false,
  children: [{
    label: 'Xử lý báo cáo',
    to: '/user/reports/baocao',
    onSelect: () => {
      open.value = false
    }
  }, {
    label: 'Yêu cầu hỗ trợ',
    to: '/user/reports/hotro',
    onSelect: () => {
      open.value = false
    }
  }]
}, {
  label: 'TƯ LIỆU',
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
  label: 'THÔNG TIN',
  to: '/',
  icon: 'i-lucide-file-question',
  defaultOpen: false,
  children: [{
    label: 'Kiến thức cơ bản',
    to: '/user/informations/basicknowledge',
    onSelect: () => {
      open.value = false
    }
  }, {
    label: 'Các danh hiệu',
    to: '/user/informations/awards',
    icon: 'i-lucide-award',
    onSelect: () => {
      open.value = false
    }
  }]
}], [{
  label: 'Feedback',
  icon: 'i-lucide-message-circle',
  to: 'https://github.com/nuxt-ui-pro/dashboard',
  target: '_blank'
}, {
  label: 'Help & Support',
  icon: 'i-lucide-info',
  to: 'https://github.com/nuxt/ui-pro',
  target: '_blank'
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
</script>

<template>
  <UDashboardGroup>
    <UDashboardSearch :groups="groups" />

    <UDashboardSidebar
      v-model:open="open"
      mode="drawer"
      collapsible
      resizable
      class="bg-(--ui-bg-elevated)/25"
      :ui="{ footer: 'lg:border-t lg:border-(--ui-border)' }"
    >
      <template #header="{ collapsed }">
        <TeamsMenu :collapsed="collapsed" />
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
        <UserMenu :collapsed="collapsed" />
      </template>
    </UDashboardSidebar>

    <slot />

    <NotificationsSlideover />
  </UDashboardGroup>
</template>
