import { defineStore } from 'pinia'
import type { Notification } from '~/types/notification'

export const useNotificationStore = defineStore('notifications', () => {
  const notifications = ref<Notification[]>([])
  const currentNotification = ref<Notification>()
  const loading = ref(false)
  const error = ref<string | null>(null)

  const fetchNotifications = async () => {
    loading.value = true
    error.value = null
    try {
      const data = await $fetch<Notification[]>('http://localhost:5000/api/v1/notification/', {
        method: 'GET',
        credentials: 'include'
      })
      notifications.value = data
      console.log('[✅ Notification fetch success]', notifications.value)
    } catch (error) {
      console.error('[❌ Notification fetch error]', error)
    } finally {
      loading.value = false
    }
  }

  const markNotificationRead = async (id: string) => {
    loading.value = true
    error.value = null
    try {
      await $fetch(`http://localhost:5000/api/v1/notification/${id}/read`, {
        method: 'PATCH',
        credentials: 'include'
      })
    } catch (error) {
      console.error('[❌ Mark notification read error]', error)
    } finally {
      loading.value = false
    }
  }

  const markAllNotificationsRead = async () => {
    loading.value = true
    error.value = null
    try {
      await $fetch('http://localhost:5000/api/v1/notification/readAll', {
        method: 'PATCH',
        credentials: 'include'
      })
    } catch (error) {
      console.error('[❌ Mark all notifications read error]', error)
    } finally {
      loading.value = false
    }
  }

  const deleteNotification = async (id: string) => {
    try {
      await $fetch(`http://localhost:5000/api/v1/notification/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      })
    } catch (error) {
      console.error('[❌ Delete notification error]', error)
    } finally {
      loading.value = false
    }
  }

  const deleteAllNotifications = async () => {
    loading.value = true
    error.value = null
    try {
      await $fetch('http://localhost:5000/api/v1/notification', {
        method: 'DELETE',
        credentials: 'include'
      })
      notifications.value = []
    } catch (error) {
      console.error('[❌ Delete all notifications error]', error)
    } finally {
      loading.value = false
    }
  }

  return {
    notifications,
    currentNotification,
    loading,
    error,

    fetchNotifications,
    markNotificationRead,
    markAllNotificationsRead,
    deleteNotification,
    deleteAllNotifications
  }
})
