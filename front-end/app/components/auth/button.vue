<script setup>
import { useAuth } from '~/composables/auth/useAuth'
import { useAuthStore } from '~/stores/auth.store'

const authStore = useAuthStore()
const { logout } = useAuth()

const handleLogout = async () => {
  await logout()
}
</script>

<template>
  <div>
    <UButton
      v-if="authStore.isAuthenticated"
      color="gray"
      variant="ghost"
      icon="i-lucide-log-out"
      @click="handleLogout"
    >
      Đăng xuất
    </UButton>

    <UButton
      v-else
      color="primary"
      variant="ghost"
      icon="i-lucide-log-in"
      to="/auth/login"
    >
      Đăng nhập
    </UButton>
  </div>
</template>
