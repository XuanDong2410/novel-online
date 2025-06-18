import { useNotificationStore } from '~/stores/notification.store'

export const useNotifications = () => {
  const notificationsStore = useNotificationStore()

  const fetchNotifications = async () => {
    await notificationsStore.fetchNotifications()
    return {
      data: computed(() => notificationsStore.notifications),
      message: computed(() => notificationsStore.error || ''),
      pending: computed(() => notificationsStore.loading),
      error: computed(() => notificationsStore.error),
      refresh: async () => notificationsStore.fetchNotifications()
    }
  }
  const markNotificationRead = async (id: string) => {
    await notificationsStore.markNotificationRead(id)
    return {
      data: computed(() => notificationsStore.notifications),
      message: computed(() => notificationsStore.error || ''),
      pending: computed(() => notificationsStore.loading),
      error: computed(() => notificationsStore.error),
      refresh: async () => notificationsStore.fetchNotifications()
    }
  }
  const markAllNotificationsRead = async () => {
    await notificationsStore.markAllNotificationsRead()
    return {
      data: computed(() => notificationsStore.notifications),
      message: computed(() => notificationsStore.error || ''),
      pending: computed(() => notificationsStore.loading),
      error: computed(() => notificationsStore.error),
      refresh: async () => notificationsStore.fetchNotifications()
    }
  }

  const deleteNotification = async (id: string) => {
    await notificationsStore.deleteNotification(id)
    return {
      data: computed(() => notificationsStore.notifications),
      message: computed(() => notificationsStore.error || ''),
      pending: computed(() => notificationsStore.loading),
      error: computed(() => notificationsStore.error),
      refresh: async () => notificationsStore.fetchNotifications()
    }
  }

  const deleteAllNotifications = async () => {
    await notificationsStore.deleteAllNotifications()
    return {
      data: computed(() => notificationsStore.notifications),
      message: computed(() => notificationsStore.error || ''),
      pending: computed(() => notificationsStore.loading),
      error: computed(() => notificationsStore.error),
      refresh: async () => notificationsStore.fetchNotifications()
    }
  }
  return {
    fetchNotifications,
    markNotificationRead,
    markAllNotificationsRead,
    deleteNotification,
    deleteAllNotifications
  }
}
