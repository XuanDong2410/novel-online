import { useAuthStore } from '~/stores/auth.store'

export const useAuthRedirect = () => {
  const authStore = useAuthStore()
  const router = useRouter()

  // Middleware cho route yêu cầu đăng nhập
  const requireAuth = () => {
    if (!authStore.isAuthenticated) {
      return router.push('/login')
    }
  }

  // Middleware cho route yêu cầu chưa đăng nhập
  const requireGuest = () => {
    if (authStore.isAuthenticated) {
      return router.push('/')
    }
  }

  return {
    requireAuth,
    requireGuest
  }
}
