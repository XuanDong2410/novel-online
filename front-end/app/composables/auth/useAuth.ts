// composables/auth/useAuth.ts
import { useAuthStore } from '~/stores/auth.store'
import type { User } from '~/types/user'

interface LoginResponse {
  success: boolean
  message: string
  user?: User
}
interface SignupResponse {
  success: boolean
  message: string
  user?: User
}

interface AuthRespone {
  success: boolean
  message: string
  user: User
}

export function useAuth() {
  const authStore = useAuthStore()
  // console.log('Auth Store: ', authStore)
  const router = useRouter()

  // Kiểm tra trạng thái đăng nhập
  const checkAuth = async () => {
    try {
      authStore.setLoading(true)
      const response = await $fetch<AuthRespone>('http://localhost:5000/api/v1/auth/authCheck', {
        credentials: 'include' // BẮT BUỘC
      })
      // console.log('Auth check error:', error.value)
      // if (error.value) {
      //   authStore.setUser(null)
      //   console.error('Auth check error:', error.value)
      // } else if (data.value?.user) {
      // console.log('Check res success', response)
      // console.log('Check res user', response.user)
      authStore.setUser(response.user)
      // console.log(authStore)
      // } else {
      //   console.log('Auth check failed', data.value)
      //   authStore.setUser(null)
      // }
    } catch (err) {
      authStore.setUser(null)
      console.error('Auth check failed:', err)
    } finally {
      authStore.setLoading(false)
    }
  }

  // Đăng nhập
  const login = async (credentials: { email: string, password: string }) => {
    try {
      authStore.setLoading(true)
      authStore.clearError()

      const { data, error } = await useFetch<LoginResponse>(
        'http://localhost:5000/api/v1/auth/login',
        {
          method: 'POST',
          body: credentials,
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          credentials: 'include' // nếu backend set cookie
        }
      )
      console.log('Login response:', data.value, error.value)
      if (error.value) {
        throw new Error(error.value.message || 'Login failed')
      }

      if (data.value?.user) {
        authStore.setUser(data.value?.user)
        console.log('Auth Store Login: ', authStore)
        await router.push('/')
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        authStore.setError(err.message || 'Login failed')
        throw err
      } else {
        authStore.setError('Login failed')
        throw new Error('Login failed')
      }
    } finally {
      authStore.setLoading(false)
    }
  }

  // Đăng ký
  const signup = async (userData: {
    email: string
    password: string
    name: string
  }) => {
    try {
      authStore.setLoading(true)
      authStore.clearError()

      const { data, error } = await useFetch<SignupResponse>(
        'http://localhost:5000/api/v1/auth/signup',
        {
          method: 'POST',
          body: userData,
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          credentials: 'include'
        }
      )

      if (error.value) {
        throw new Error(error.value.message || 'Signup failed')
      }

      if (data.value?.user) {
        authStore.setUser(data.value.user)
        await router.push('/')
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        authStore.setError(err.message || 'Login failed')
        throw err
      } else {
        authStore.setError('Login failed')
        throw new Error('Login failed')
      }
    } finally {
      authStore.setLoading(false)
    }
  }

  // Đăng xuất
  const logout = async () => {
    try {
      authStore.setLoading(true)
      await $fetch('http://localhost:5000/api/v1/auth/logout', {
        method: 'POST',
        headers: {
          Accept: 'application/json'
        },
        credentials: 'include'
      })
      authStore.setUser(null)
      await router.push('/')
    } catch (err) {
      console.error('Logout failed:', err)
    } finally {
      authStore.setLoading(false)
    }
  }

  return {
    checkAuth,
    login,
    signup,
    logout
  }
}
