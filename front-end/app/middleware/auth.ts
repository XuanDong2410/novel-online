import { useAuth } from '~/composables/auth/useAuth'

export default defineNuxtRouteMiddleware(async (to) => {
  const { requireAuth, requireGuest } = useAuthRedirect()
  const authStore = useAuthStore()
  const { checkAuth } = useAuth()

  // Chỉ kiểm tra auth nếu chưa có dữ liệu
  if (authStore.isAuthenticated === null) {
    await checkAuth()
  }

  if (to.meta.requiresAuth) {
    return requireAuth()
  }

  if (to.meta.requiresGuest) {
    return requireGuest()
  }
})
