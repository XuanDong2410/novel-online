import { useAuth } from '~/composables/auth/useAuth'

export default defineNuxtPlugin(async () => {
  const { checkAuth } = useAuth()
  const authStore = useAuthStore()
  if (!authStore.user) {
    await checkAuth()
  }
})
