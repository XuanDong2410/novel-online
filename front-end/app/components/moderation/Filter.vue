<script setup lang="ts">
const statusOptions = [
  { value: 'All', label: 'Tất cả' },
  { value: 'PENDING_REVIEW', label: 'Chờ kiểm duyệt' },
  { value: 'REJECTED', label: 'Từ chối' },
  { value: 'SAFE', label: 'An toàn' },
  { value: 'NEEDS_EDIT', label: 'Cần chỉnh sửa' },
  { value: 'FLAGGED_SENSITIVE', label: 'Nhạy cảm' },
  { value: 'REPORTED_BY_USER', label: 'Báo cáo người dùng' },
  { value: 'LOCKED_BY_SYSTEM', label: 'Khóa bởi hệ thống' }
]

const categoryOptions = [
  { value: 'All', label: 'Tất cả' },
  { value: 'sexual', label: 'Tình dục' },
  { value: 'violence', label: 'Bạo lực' },
  { value: 'politics', label: 'Chính trị' }
]

// const props = defineProps<{
//   status: string
//   category: string
//   search: string
// }>()
// const emit = defineEmits(['update:status', 'update:category', 'update:search'])

// const localStatus = ref(props.status)
// const localCategory = ref(props.category)

// const localSearch = ref(props.search)
// // Đồng bộ props -> local
// watch(() => props.status, (val) => {
//   localStatus.value = val
// })
// watch(() => props.category, (val) => {
//   localCategory.value = val
// })
// watch(() => props.search, (val) => {
//   localSearch.value = val
// })

// // Đồng bộ local -> emit
// watch(localStatus, (val) => {
//   emit('update:status', val)
// })
// watch(localCategory, (val) => {
//   emit('update:category', val)
// })
// watch(localSearch, (val) => {
//   emit('update:search', val)
// })

const status = defineModel<string>('status', { default: 'All' })
const category = defineModel<string>('category', { default: 'All' })
const search = defineModel<string>('search', { default: '' })

const isValidStatus = (value: string) => {
  return statusOptions.some(option => option.value === value)
}
const isValidCategory = (value: string) => {
  return categoryOptions.some(option => option.value === value)
}
if (!isValidStatus(status.value)) {
  status.value = 'All'
}
if (!isValidCategory(category.value)) {
  category.value = 'All'
}
</script>

<template>
  <UInput
    v-model="search"
    placeholder="Tìm kiếm..."
    icon="i-heroicons-magnifying-glass"
    class="max-w-sm"
  />
  <div class="flex flex-wrap items-center gap-1.5">
    <USelect
      v-model="status"
      :items="statusOptions"
      placeholder="Trạng thái kiểm duyệt"
      :ui="{ trailingIcon: 'group-data-[state=open]:rotate-180 transition-transform duration-200' }"
      class="min-w-[10rem]"
    />
    <USelect
      v-model="category"
      :items="categoryOptions"
      placeholder="Danh mục"
      :ui="{ trailingIcon: 'group-data-[state=open]:rotate-180 transition-transform duration-200' }"
      class="min-w-28"
    />
  </div>
</template>
