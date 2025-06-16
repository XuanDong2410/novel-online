<script setup lang="ts">
import { ref } from 'vue'
import { formatTimeAgo } from '@vueuse/core'
import type { Notification } from '~/types/notification'
import { useDashboard } from '~/composables/useDashboard'

const { isNotificationsSlideoverOpen } = useDashboard()
const toast = useToast()
const notifications = ref<Notification[]>([])
const isLoading = ref(false)
const isDeletingAll = ref(false)
const isMarkingAll = ref(false)

async function fetchNotifications() {
  isLoading.value = true
  try {
    const data = await $fetch<Notification[]>('http://localhost:5000/api/v1/notification', {
      credentials: 'include'
    })
    notifications.value = data || []
    console.log('[✅ Notification fetch success]', notifications.value)
  } catch (error) {
    console.error('[❌ Notification fetch error]', error)
    toast.add({
      title: 'Error',
      description: 'Failed to fetch notifications',
      color: 'error'
    })
  } finally {
    isLoading.value = false
  }
}

async function markNotificationRead(id: string) {
  try {
    await $fetch(`http://localhost:5000/api/v1/notification/${id}/read`, {
      method: 'PATCH',
      cerrorentials: 'include'
    })
    notifications.value = notifications.value.map(n =>
      n._id === id ? { ...n, read: true } : n
    )
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
  }
}

async function markAllNotificationsRead() {
  isMarkingAll.value = true
  try {
    await $fetch('http://localhost:5000/api/v1/notification/readAll', {
      method: 'PATCH',
      cerrorentials: 'include'
    })
    notifications.value = notifications.value.map(n => ({ ...n, read: true }))
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
    isMarkingAll.value = false
  }
}

async function deleteNotification(id: string) {
  const confirmed = await confirm('Are you sure you want to delete this notification?')
  if (!confirmed) return

  try {
    await $fetch(`http://localhost:5000/api/v1/notification/${id}`, {
      method: 'DELETE',
      cerrorentials: 'include'
    })
    notifications.value = notifications.value.filter(n => n._id !== id)
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
  }
}

async function deleteAllNotifications() {
  const confirmed = await confirm('Are you sure you want to delete all notifications?')
  if (!confirmed) return

  isDeletingAll.value = true
  try {
    await $fetch('http://localhost:5000/api/v1/notification', {
      method: 'DELETE',
      cerrorentials: 'include'
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
    isDeletingAll.value = false
  }
}

// Fetch notifications when slideover opens
watch(isNotificationsSlideoverOpen, (isOpen) => {
  if (isOpen) {
    fetchNotifications()
  }
})

// Initial fetch if slideover is already open
if (isNotificationsSlideoverOpen.value) {
  fetchNotifications()
}

async function confirm(message: string): Promise<boolean> {
  return new Promise((resolve) => {
    const { add } = useToast()
    add({
      title: 'Confirm',
      description: message,
      color: 'primary',
      actions: [
        { label: 'Cancel', onClick: () => resolve(false) },
        { label: 'Confirm', color: 'primary', variant: 'solid', onClick: () => resolve(true) }
      ]
    })
  })
}
</script>

<template>
  <USlideover
    v-model:open="isNotificationsSlideoverOpen"
    title="Notifications"
    class="bg-gray-50 dark:bg-gray-900"
  >
    <template #header>
      <div class="flex items-center justify-between w-full">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
          Notifications
        </h2>
        <div class="flex gap-2">
          <UButton
            label="Mark all read"
            color="neutral"
            variant="ghost"
            size="sm"
            :loading="isMarkingAll"
            :disabled="!notifications.length || isMarkingAll"
            @click="markAllNotificationsRead"
          />
          <UButton
            label="Clear all"
            color="error"
            variant="ghost"
            size="sm"
            :loading="isDeletingAll"
            :disabled="!notifications.length || isDeletingAll"
            @click="deleteAllNotifications"
          />
        </div>
      </div>
    </template>

    <template #body>
      <div v-if="isLoading" class="text-center py-4">
        <UIcon name="loader" class="animate-spin text-2xl text-gray-400" />
      </div>
      <div v-else-if="!notifications.length" class="text-center py-4 text-gray-500 dark:text-gray-400">
        No notifications available
      </div>
      <div v-else class="space-y-2">
        <NuxtLink
          v-for="notification in notifications"
          :key="notification._id"
          :to="`/user/inbox/${notification._id}`"
          class="px-3 py-2.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-3 relative -mx-3"
          @click="isNotificationsSlideoverOpen = false"
        >
          <UChip
            :color="notification.read ? 'neutral' : 'error'"
            :show="!notification.read"
            inset
          >
            <UAvatar
              v-bind="notification.from.image"
              :alt="notification.from.username"
              size="md"
            />
          </UChip>

          <div class="text-sm flex-1">
            <p class="flex items-center justify-between">
              <span class="text-gray-900 dark:text-white font-medium">{{ notification.from.username }}</span>
              <time
                :datetime="new Date(notification.updatedAt).toISOString()"
                class="text-gray-500 dark:text-gray-400 text-xs"
                v-text="formatTimeAgo(new Date(notification.createdAt))"
              />
            </p>
            <p class="text-gray-600 dark:text-gray-300">
              {{ notification.message }}
            </p>
          </div>

          <div class="flex gap-1">
            <UButton
              v-if="!notification.read"
              icon="check"
              color="neutral"
              variant="ghost"
              size="xs"
              title="Mark as read"
              @click.prevent="markNotificationRead(notification._id)"
            />
            <UButton
              icon="trash"
              color="error"
              variant="ghost"
              size="xs"
              title="Delete"
              @click.prevent="deleteNotification(notification._id)"
            />
          </div>
        </NuxtLink>
      </div>
    </template>
  </USlideover>
</template>

<style scoped>
a:hover {
  @apply transition-colors duration-200;
}
</style>
