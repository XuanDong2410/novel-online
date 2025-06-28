// middleware/layout.global.ts

export default defineNuxtRouteMiddleware(() => {
  const currentLayout = useState<'default' | 'admin' | 'user' | 'mod'>('currentLayout', () => 'default')
  const auth = useAuthStore()

  // Ưu tiên theo role
  if (auth.isAuthenticated && auth.user?.role === 'admin') {
    currentLayout.value = 'admin'
  } else if (auth.isAuthenticated && auth.user?.role === 'moderator') {
    currentLayout.value = 'mod'
  } else if (auth.isAuthenticated) {
    currentLayout.value = 'user'
  } else {
    currentLayout.value = 'default'
  }
})
