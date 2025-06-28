<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { formatTimeAgo } from '@vueuse/core'
import { useDashboard } from '~/composables/useDashboard'

const { isNotificationsSlideoverOpen } = useDashboard()
const { fetchNotifications, markNotificationRead, markAllNotificationsRead, deleteNotification, deleteAllNotifications } = useNotifications()
const { data: notifications, pending, error } = await fetchNotifications()

const isDeletingAll = ref(false)
const isMarkingAll = ref(false)

// Fetch notifications when slideover opens
watch(isNotificationsSlideoverOpen, async (isOpen) => {
  if (isOpen) {
    await fetchNotifications()
  }
})

// Move initial fetch to onMounted
onMounted(async () => {
  if (isNotificationsSlideoverOpen.value) {
    await fetchNotifications()
  }
})

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

async function confirmDeleteAll() {
  isDeletingAll.value = true
  const confirmed = await confirm('Are you sure you want to delete all notifications?')
  if (confirmed) {
    await deleteAllNotifications()
  }
  isDeletingAll.value = false
}

async function confirmReadAll() {
  isMarkingAll.value = true
  const confirmed = await confirm('Are you sure you want to read all notifications?')
  if (confirmed) {
    await markAllNotificationsRead()
  }
  isMarkingAll.value = false
}
</script>

<template>
  <ClientOnly>
    <USlideover
      v-model:open="isNotificationsSlideoverOpen"
      title="Notifications"
      class=""
      aria-describedby="undefined"
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
              :loading="pending"
              :disabled="!notifications.length"
              @click="confirmReadAll"
            />
            <UButton
              label="Clear all"
              color="error"
              variant="ghost"
              size="sm"
              :loading="pending"
              :disabled="!notifications.length"
              @click="confirmDeleteAll"
            />
          </div>
        </div>
      </template>

      <template #body>
        <div v-if="pending" class="text-center py-4">
          <UIcon name="i-lucide-loader" class="animate-spin text-2xl text-gray-400" />
        </div>
        <div v-else-if="error" class="text-center py-4 text-red-500 dark:text-red-400">
          {{ error }}
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
                icon="i-lucide-check"
                color="neutral"
                variant="ghost"
                size="xs"
                title="Mark as read"
                @click.prevent="markNotificationRead(notification._id)"
              />
              <UButton
                icon="i-lucide-trash"
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
  </ClientOnly>
</template>

<style scoped>
a:hover {
  @apply transition-colors duration-200;
}
</style>
