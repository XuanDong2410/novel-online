<script setup lang="ts">
import { useDashboard } from '~/composables/useDashboard'
import { useNovels } from '~/composables/useNovels'

definePageMeta({
  middleware: 'auth'
})
const { isNotificationsSlideoverOpen } = useDashboard()
const { fetchNovels } = useNovels()

// Fetch novels
const { data, pending, error } = await fetchNovels()
console.log('Novels data:', data, data.value)
</script>

<template>
  <UDashboardPanel id="novelHome">
    <template #header>
      <UDashboardNavbar title="Truyện của tôi" :ui="{ right: 'gap-3' }">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #right>
          <UButton
            color="primary"
            @click="$router.push('/novels/create')"
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
        <!-- Novels Component -->
        <Novel :data="data" :status="pending ? 'pending' : error ? 'error' : 'success'" />
      </div>
    </template>
  </UDashboardPanel>
</template>
