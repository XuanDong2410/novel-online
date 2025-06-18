import { defineStore } from 'pinia'
import type { Notification } from '~/types/notification'
import { useToast } from '#imports'

export const useNotificationStore = defineStore('notifications', () => {
  const notifications = ref<Notification[]>([])
  const currentNotification = ref<Notification>()
  const loading = ref(false)
  const error = ref<string | null>(null)
  const toast = useToast()

  const fetchNotifications = async () => {
    loading.value = true
    error.value = null
    try {
      const data = await $fetch<Notification[]>('http://localhost:5000/api/v1/notification', {
        method: 'GET',
        credentials: 'include'
      })
      notifications.value = data
      console.log('[✅ Notification fetch success]', notifications.value)
    } catch (error) {
      console.error('[❌ Notification fetch error]', error)
      toast.add({
        title: 'Error',
        description: 'Failed to fetch notifications',
        color: 'error'
      })
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
      toast.add({
        title: 'Success',
        description: 'Notification marked as read',
        color: 'success'
      })
    } catch (error) {
      console.error('[❌ Mark notification read error]', error)
      toast.add({
        title: 'Error',
        description: 'Failed to mark notification as read',
        color: 'error'
      })
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
      toast.add({
        title: 'Success',
        description: 'All notifications marked as read',
        color: 'success'
      })
    } catch (error) {
      console.error('[❌ Mark all notifications read error]', error)
      toast.add({
        title: 'Error',
        description: 'Failed to mark all notifications as read',
        color: 'error'
      })
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
      // notifications.value = notifications.value.filter(n => n._id !== id)
      toast.add({
        title: 'Success',
        description: 'Notification deleted',
        color: 'success'
      })
    } catch (error) {
      console.error('[❌ Delete notification error]', error)
      toast.add({
        title: 'Error',
        description: 'Failed to delete notification',
        color: 'error'
      })
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
      toast.add({
        title: 'Success',
        description: 'All notifications deleted',
        color: 'success'
      })
    } catch (error) {
      console.error('[❌ Delete all notifications error]', error)
      toast.add({
        title: 'Error',
        description: 'Failed to delete all notifications',
        color: 'error'
      })
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
