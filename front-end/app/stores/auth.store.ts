import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User } from '~/types/user'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const isAuthenticated = computed(() => !!user.value)
  console.log('User', user)
  const setUser = (userData: User | null) => {
    user.value = userData
  }

  const setLoading = (value: boolean) => {
    loading.value = value
  }

  const setError = (err: string | null) => {
    error.value = err
  }

  const clearError = () => {
    error.value = null
  }

  const reset = () => {
    user.value = null
    error.value = null
    loading.value = false
  }

  return {
    user,
    isAuthenticated,
    loading,
    error,
    setUser,
    setLoading,
    setError,
    clearError,
    reset
  }
})
