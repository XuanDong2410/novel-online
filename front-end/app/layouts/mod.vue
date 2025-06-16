<!-- layouts/default.vue -->
<script lang="ts" setup>
// import { storeToRefs } from 'pinia'
import { useAuthStore } from '~/stores/auth.store'

const { isAuthenticated } = useAuthStore()

// const logout = () => {
//   authStore.logout()
// }
</script>

<template>
  <header>
    <nav>
      <nuxt-link to="/">Home</nuxt-link>
      <nuxt-link to="/about">About</nuxt-link>
      <li v-if="!isAuthenticated">
        <button>
          Login
        </button>
      </li>
      <li v-if="isAuthenticated">
        <button>
          Logout
        </button>
      </li>
    </nav>
  </header>
  <slot />
</template>
