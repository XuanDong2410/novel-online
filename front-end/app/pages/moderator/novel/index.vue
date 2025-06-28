<script setup lang="ts">
import { useDashboard } from '~/composables/useDashboard'

definePageMeta({
  layout: 'mod',
  middleware: 'auth'
})

const { isNotificationsSlideoverOpen } = useDashboard()
const auth = useAuthStore()
const { fetchPendingNovels } = useNovels()
const role = computed(() => auth.user?.role)
// console.log('User Role:', role.value)

// Fetch novels based on role

const { data, pending, refresh, error } = await fetchPendingNovels()
// console.log('Novels fetch:', data)
async function handleNovelChange() {
  await refresh()
  // console.log('Novel list refreshed after changes')
}
</script>

<template>
  <ClientOnly>
    <UDashboardPanel id="novelHome">
      <template #header>
        <UDashboardNavbar
          title="Kiểm duyệt truyện"
          :ui="{ right: 'gap-3' }"
        >
          <template #leading>
            <UDashboardSidebarCollapse />
          </template>
          <template #right>
            <UButton @click="handleNovelChange">
              Refresh
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
          <ModeratorTable
            :role="role"
            :data="data"
            :loading="pending"
            :error="error"
            @update:novels="handleNovelChange"
          />
        </div>
      </template>
    </UDashboardPanel>
  </ClientOnly>
</template>
