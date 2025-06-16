<template>
  <div class="loading-spinner">
    <div class="spinner"/>
  </div>
</template>

<style scoped>
.loading-spinner {
  @apply flex justify-center items-center py-12;
}

.spinner {
  @apply w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin;
}
</style>
