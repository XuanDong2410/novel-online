<script setup lang="ts">
// import { sub } from 'date-fns'
// import type { Period, Range } from '~/types'

// const { isNotificationsSlideoverOpen } = useDashboard()

// const items = [[{
//   label: 'New mail',
//   icon: 'i-lucide-send',
//   to: '/inbox'
// }, {
//   label: 'New customer',
//   icon: 'i-lucide-user-plus',
//   to: '/customers'
// }]]

// const range = shallowRef<Range>({
//   start: sub(new Date(), { days: 14 }),
//   end: new Date()
// })
// const period = ref<Period>('daily')
</script>

<template>
  <UDashboardPanel id="create">
    <template #header>
      <UDashboardNavbar title="Novel Create" :ui="{ right: 'gap-3' }">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <!-- <template #right>
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

          <UDropdownMenu :items="items">
            <UButton icon="i-lucide-plus" size="md" class="rounded-full" />
          </UDropdownMenu>
        </template> -->
      </UDashboardNavbar>

      <!-- <UDashboardToolbar>
        <template #left>
            NOTE: The `-ms-1` class is used to align with the `DashboardSidebarCollapse` button here.
          <HomeDateRangePicker v-model="range" class="-ms-1" />

          <HomePeriodSelect v-model="period" :range="range" />
        </template>
      </UDashboardToolbar> -->
    </template>

    <template #body>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <NovelCreate />
        </div>
        <div>
          <NovelTermsOfServices />
        </div>
      </div>
      <!-- <HomeStats :period="period" :range="range" />
      <HomeChart :period="period" :range="range" />
      <HomeSales :period="period" :range="range" /> -->
    </template>
  </UDashboardPanel>
</template>
