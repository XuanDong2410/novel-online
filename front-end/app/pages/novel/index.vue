<script setup lang="ts">
import { useDashboard } from '~/composables/useDashboard'
import { useAuthStore } from '~/stores/auth.store'
import { useNovels } from '~/composables/useNovels'

definePageMeta({
  layout: 'user',
  middleware: 'auth'
})
const { isNotificationsSlideoverOpen } = useDashboard()
const auth = useAuthStore()
const { fetchNovels } = useNovels()
// Determine user role
const role = computed(() => auth.user?.role)
console.log('User Novel:', role.value)

// Fetch novels
const { data, pending, error } = await fetchNovels()
console.log('Novel data:', data)
</script>

<template>
  <UDashboardPanel id="novelHome">
    <template #header>
      <UDashboardNavbar :title="role === 'admin' ? 'Quản lý truyện' : role === 'moderator' ? 'Kiểm duyệt truyện' : 'Truyện của tôi'" :ui="{ right: 'gap-3' }">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <UButton
            v-if="role === 'user'"
            color="primary"
            @click="$router.push('/user/mystory/addnew')"
          >
            <UIcon name="i-lucide-plus" class="size-4" />
            Tạo truyện mới
          </UButton>

          <UTooltip text="Notifications" :shortcuts="['N']">
            <UButton
              color="neutral"
              variant="ghost"
              square
              @click="isNotificationsSlideoverOpen = true"
            >
              <UChip color="error" inset>
                <UIcon name="i-lucide-bell" class="size-5 shrink-0" />
              </UChip>
            </UButton>
          </UTooltip>
        </template>
      </UDashboardNavbar>
    </template>
    <template #body>
      <div class="space-y-6">
        <NovelTable
          :role="role"
          :data="data"
          :loading="pending"
          :error="error"
        />
      </div>
    </template>
  </UDashboardPanel>
</template>
