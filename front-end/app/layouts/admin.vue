<script setup lang="ts">
useHead({
  titleTemplate: title => title ? `${title} - Novel Audio` : 'Novel Audio'
})
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <header class="bg-white dark:bg-gray-800 shadow">
      <div class="container mx-auto px-4 py-4 flex justify-between items-center">
        <NuxtLink to="/" class="text-xl font-bold">NovelAudio</NuxtLink>
        <nav class="flex gap-4">
          <NuxtLink to="/library">Thư viện</NuxtLink>
          <ColorScheme>
            <template #default="{ colorMode }">
              <button @click="colorMode.preference = colorMode === 'dark' ? 'light' : 'dark'">
                {{ colorMode === 'dark' ? '🌞' : '🌙' }}
              </button>
            </template>
          </ColorScheme>
        </nav>
      </div>
    </header>

    <main class="container mx-auto px-4 py-8">
      <NuxtPage />
    </main>

    <footer class="bg-white dark:bg-gray-800 py-4 mt-8">
      <div class="container mx-auto px-4 text-center">
        © 2024 NovelAudio - All rights reserved
      </div>
    </footer>
  </div>
</template>
