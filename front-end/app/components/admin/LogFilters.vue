<script setup lang="ts">
import { ref, watch } from 'vue'
import type { LogsQuery, ModerationAction } from '~/types/log'
import { ModerationAction as Actions } from '~/types/log'

const props = defineProps<{
  modelValue: LogsQuery
}>()

const emit = defineEmits<{
  'update:modelValue': [value: LogsQuery]
  'apply': [filters: LogsQuery]
}>()

const filters = ref<LogsQuery>({ ...props.modelValue })

// Helper function
const getActionText = (action: ModerationAction): string => {
  const actionTexts: Record<string, string> = {
    APPROVE_NOVEL: 'Duyệt truyện',
    APPROVE_CHAPTER: 'Duyệt chương',
    REJECT_NOVEL: 'Từ chối truyện',
    REJECT_CHAPTER: 'Từ chối chương',
    DELETE_NOVEL: 'Xóa truyện',
    DELETE_CHAPTER: 'Xóa chương',
    SUSPEND_USER: 'Tạm khóa người dùng',
    UNSUSPEND_USER: 'Mở khóa người dùng',
    BAN_USER: 'Cấm người dùng',
    UNBAN_USER: 'Bỏ cấm người dùng',
    WARN_USER: 'Cảnh báo người dùng',
    SYSTEM_AUTO_REJECT: 'Hệ thống tự động từ chối',
    SYSTEM_AUTO_APPROVE: 'Hệ thống tự động duyệt'
  }
  return actionTexts[action] || action
}
// Options
const actionOptions = Object.values(Actions).map(action => ({
  label: getActionText(action),
  value: action
}))

const systemActionOptions = [
  { label: 'Tất cả', value: undefined },
  { label: 'Hệ thống', value: true },
  { label: 'Thủ công', value: false }
]

const limitOptions = [
  { label: '10', value: 10 },
  { label: '20', value: 20 },
  { label: '50', value: 50 },
  { label: '100', value: 100 }
]

// Methods
const applyFilters = () => {
  emit('update:modelValue', { ...filters.value })
  emit('apply', { ...filters.value })
}

const resetFilters = () => {
  filters.value = {
    page: 1,
    limit: { label: '20', value: 10 }
  }
  applyFilters()
}

// Watch for external changes
watch(() => props.modelValue, (newValue) => {
  filters.value = { ...newValue }
}, { deep: true })
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex justify-between items-center">
        <h3 class="text-lg font-semibold">
          Bộ lọc
        </h3>
        <UButton variant="ghost" size="sm" @click="resetFilters">
          <UIcon name="i-lucide-x" class="size-4" />
          Xóa bộ lọc
        </UButton>
      </div>
    </template>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <!-- Action Filter -->
      <UFormGroup label="Hành động">
        <USelectMenu
          v-model="filters.action"
          :items="actionOptions"
          placeholder="Chọn hành động"
          searchable
          clear-search-on-close
        />
      </UFormGroup>

      <!-- System Action Filter -->
      <UFormGroup label="Loại hành động">
        <USelectMenu
          v-model="filters.isSystemAction"
          :items="systemActionOptions"
          placeholder="Tất cả"
        />
      </UFormGroup>

      <!-- Date Range -->
      <UFormGroup label="Khoảng thời gian">
        <div class="flex gap-2">
          <UInput
            v-model="filters.startDate"
            type="date"
            placeholder="Từ ngày"
          />
          <UInput
            v-model="filters.endDate"
            type="date"
            placeholder="Đến ngày"
          />
        </div>
      </UFormGroup>

      <!-- Search -->
      <UFormGroup label="Tìm kiếm">
        <UInput
          v-model="filters.search"
          placeholder="Tìm kiếm trong ghi chú..."
          icon="i-lucide-search"
        />
      </UFormGroup>

      <!-- Page Size -->
      <UFormGroup label="Số lượng hiển thị">
        <USelectMenu
          v-model="filters.limit"
          :items="limitOptions"
        />
      </UFormGroup>
    </div>

    <template #footer>
      <div class="flex justify-end gap-2">
        <UButton variant="outline" @click="resetFilters">
          Đặt lại
        </UButton>
        <UButton @click="applyFilters">
          Áp dụng bộ lọc
        </UButton>
      </div>
    </template>
  </UCard>
</template>
