<script setup lang="ts">
definePageMeta({
  layout: 'user'
})
</script>

<template>
  <UDashboardPanel id="create">
    <template #header>
      <UDashboardNavbar title="Novel Create" :ui="{ right: 'gap-3' }">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
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
    </template>
  </UDashboardPanel>
</template>
