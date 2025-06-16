<script setup lang="ts">
definePageMeta({
  layout: false,
  middleware: 'auth',
  requiresGuest: true // hoặc false tùy logic
})
</script>

<template>
  <div class="flex items-center justify-center min-h-screen">
    <AuthLoginForm />
  </div>
</template>
