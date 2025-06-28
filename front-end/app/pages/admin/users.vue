<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- Header -->
    <div class="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div class="px-6 py-4">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
              Quản lý người dùng
            </h1>
            <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Quản lý tài khoản và quyền hạn người dùng
            </p>
          </div>
          <div class="flex items-center gap-3">
            <UButton
              icon="i-lucide-download"
              variant="outline"
              @click="exportUsers"
            >
              Xuất dữ liệu
            </UButton>
            <UButton
              icon="i-lucide-plus"
              @click="showCreateModal = true"
            >
              Thêm người dùng
            </UButton>
          </div>
        </div>
      </div>
    </div>

    <div class="p-6">
      <!-- Statistics Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <UCard>
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600 dark:text-gray-400">
                Tổng người dùng
              </p>
              <p class="text-2xl font-bold text-gray-900 dark:text-white">
                {{ statistics.totalUsers }}
              </p>
            </div>
            <div class="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-full">
              <Icon name="i-lucide-users" class="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </UCard>

        <UCard>
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600 dark:text-gray-400">
                Hoạt động
              </p>
              <p class="text-2xl font-bold text-green-600 dark:text-green-400">
                {{ statistics.activeUsers }}
              </p>
            </div>
            <div class="p-3 bg-green-100 dark:bg-green-900/20 rounded-full">
              <Icon name="i-lucide-user-check" class="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </UCard>

        <UCard>
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600 dark:text-gray-400">
                Bị cấm
              </p>
              <p class="text-2xl font-bold text-red-600 dark:text-red-400">
                {{ statistics.bannedUsers }}
              </p>
            </div>
            <div class="p-3 bg-red-100 dark:bg-red-900/20 rounded-full">
              <Icon name="i-lucide-user-x" class="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
          </div>
        </UCard>

        <UCard>
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600 dark:text-gray-400">
                Vi phạm
              </p>
              <p class="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {{ statistics.violationUsers }}
              </p>
            </div>
            <div class="p-3 bg-orange-100 dark:bg-orange-900/20 rounded-full">
              <Icon name="i-lucide-alert-triangle" class="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </UCard>
      </div>

      <!-- Filters and Search -->
      <UCard class="mb-6">
        <div class="flex flex-col lg:flex-row gap-4">
          <div class="flex-1">
            <UInput
              v-model="searchQuery"
              icon="i-lucide-search"
              placeholder="Tìm kiếm theo tên, email..."
              @input="debouncedSearch"
            />
          </div>
          <div class="flex gap-3">
            <USelectMenu
              v-model="selectedRole"
              :options="roleOptions"
              placeholder="Vai trò"
              class="w-40"
            />
            <USelectMenu
              v-model="selectedStatus"
              :options="statusOptions"
              placeholder="Trạng thái"
              class="w-40"
            />
            <UButton
              icon="i-lucide-filter-x"
              variant="outline"
              @click="clearFilters"
            >
              Xóa bộ lọc
            </UButton>
          </div>
        </div>
      </UCard>

      <!-- Users Table -->
      <UCard>
        <div class="overflow-x-auto">
          <UTable
            :rows="filteredUsers"
            :columns="columns"
            :loading="loading"
            class="w-full"
          >
            <template #avatar-data="{ row }">
              <UAvatar
                :src="row.image"
                :alt="row.username"
                size="sm"
              />
            </template>

            <template #username-data="{ row }">
              <div class="flex flex-col">
                <span class="font-medium text-gray-900 dark:text-white">{{ row.username }}</span>
                <span class="text-sm text-gray-500 dark:text-gray-400">{{ row.email }}</span>
              </div>
            </template>

            <template #role-data="{ row }">
              <UBadge
                :color="getRoleColor(row.role)"
                variant="subtle"
              >
                {{ getRoleLabel(row.role) }}
              </UBadge>
            </template>

            <template #status-data="{ row }">
              <div class="flex gap-2">
                <UBadge
                  :color="row.isActive ? 'green' : 'gray'"
                  variant="subtle"
                >
                  {{ row.isActive ? 'Hoạt động' : 'Không hoạt động' }}
                </UBadge>
                <UBadge
                  v-if="row.isBanned"
                  color="red"
                  variant="subtle"
                >
                  Bị cấm
                </UBadge>
              </div>
            </template>

            <template #violation-data="{ row }">
              <div class="flex items-center gap-2">
                <span class="text-sm">{{ row.violation.count }}</span>
                <UBadge
                  v-if="row.violation.count > 0"
                  :color="row.violation.count >= 5 ? 'red' : row.violation.count >= 3 ? 'orange' : 'yellow'"
                  variant="subtle"
                  size="xs"
                >
                  {{ row.violation.count >= 5 ? 'Nghiêm trọng' : row.violation.count >= 3 ? 'Cảnh báo' : 'Nhẹ' }}
                </UBadge>
              </div>
            </template>

            <template #lastLogin-data="{ row }">
              <span class="text-sm text-gray-600 dark:text-gray-400">
                {{ row.lastLogin ? formatDate(row.lastLogin) : 'Chưa đăng nhập' }}
              </span>
            </template>

            <template #actions-data="{ row }">
              <UDropdown :items="getActionItems(row)">
                <UButton
                  icon="i-lucide-more-horizontal"
                  variant="ghost"
                  size="sm"
                />
              </UDropdown>
            </template>
          </UTable>
        </div>

        <!-- Pagination -->
        <div class="flex justify-between items-center mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div class="text-sm text-gray-600 dark:text-gray-400">
            Hiển thị {{ (currentPage - 1) * pageSize + 1 }} - {{ Math.min(currentPage * pageSize, totalUsers) }}
            trong tổng số {{ totalUsers }} người dùng
          </div>
          <UPagination
            v-model="currentPage"
            :page-count="Math.ceil(totalUsers / pageSize)"
            :total="totalUsers"
          />
        </div>
      </UCard>
    </div>

    <!-- User Detail Modal -->
    <UModal v-model:open="showDetailModal" :class="{ width: 'max-w-4xl' }">
      <template #header>
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold">
            Chi tiết người dùng
          </h3>
          <UButton
            icon="i-lucide-x"
            variant="ghost"
            size="sm"
            @click="showDetailModal = false"
          />
        </div>
      </template>
      <template #content>
        <UCard>
          <div v-if="selectedUser" class="space-y-6">
            <!-- User Info -->
            <div class="flex items-start gap-6">
              <UAvatar
                :src="selectedUser.image"
                :alt="selectedUser.username"
                size="xl"
              />
              <div class="flex-1">
                <h4 class="text-xl font-semibold text-gray-900 dark:text-white">
                  {{ selectedUser.username }}
                </h4>
                <p class="text-gray-600 dark:text-gray-400">
                  {{ selectedUser.email }}
                </p>
                <div class="flex gap-2 mt-2">
                  <UBadge :color="getRoleColor(selectedUser.role)">
                    {{ getRoleLabel(selectedUser.role) }}
                  </UBadge>
                  <UBadge :color="selectedUser.isActive ? 'green' : 'gray'">
                    {{ selectedUser.isActive ? 'Hoạt động' : 'Không hoạt động' }}
                  </UBadge>
                </div>
              </div>
            </div>

            <!-- Statistics -->
            <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div class="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div class="text-2xl font-bold text-blue-600">
                  {{ selectedUser.statistics.totalUploaded }}
                </div>
                <div class="text-sm text-gray-600 dark:text-gray-400">
                  Truyện đăng
                </div>
              </div>
              <div class="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div class="text-2xl font-bold text-green-600">
                  {{ selectedUser.statistics.totalFavoriteNovels }}
                </div>
                <div class="text-sm text-gray-600 dark:text-gray-400">
                  Yêu thích
                </div>
              </div>
              <div class="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div class="text-2xl font-bold text-orange-600">
                  {{ selectedUser.statistics.totalReports }}
                </div>
                <div class="text-sm text-gray-600 dark:text-gray-400">
                  Báo cáo
                </div>
              </div>
              <div class="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div class="text-2xl font-bold text-red-600">
                  {{ selectedUser.violation.count }}
                </div>
                <div class="text-sm text-gray-600 dark:text-gray-400">
                  Vi phạm
                </div>
              </div>
            </div>

            <!-- Bio -->
            <div v-if="selectedUser.bio">
              <h5 class="font-medium text-gray-900 dark:text-white mb-2">
                Tiểu sử
              </h5>
              <p class="text-gray-600 dark:text-gray-400">
                {{ selectedUser.bio }}
              </p>
            </div>

            <!-- Actions -->
            <div class="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <UButton
                v-if="!selectedUser.isBanned"
                color="error"
                variant="outline"
                @click="banUser(selectedUser)"
              >
                Cấm người dùng
              </UButton>
              <UButton
                v-else
                color="success"
                variant="outline"
                @click="unbanUser(selectedUser)"
              >
                Bỏ cấm
              </UButton>
              <UButton
                variant="outline"
                @click="resetViolations(selectedUser)"
              >
                Reset vi phạm
              </UButton>
              <UButton
                variant="outline"
                @click="showEditModal = true"
              >
                Chỉnh sửa
              </UButton>
            </div>
          </div>
        </UCard>
      </template>
    </UModal>

    <!-- Create/Edit User Modal -->
    <UModal v-model:open="showCreateModal">
      <template #header>
        <h3 class="text-lg font-semibold">
          {{ editingUser ? 'Chỉnh sửa người dùng' : 'Thêm người dùng mới' }}
        </h3>
      </template>
      <template #body>
        <UCard>
          <UForm
            :schema="userSchema"
            :state="userForm"
            class="space-y-4"
            @submit="submitUser"
          >
            <UFormGroup label="Tên người dùng" name="username">
              <UInput v-model="userForm.username" />
            </UFormGroup>

            <UFormGroup label="Email" name="email">
              <UInput v-model="userForm.email" type="email" />
            </UFormGroup>

            <UFormGroup v-if="!editingUser" label="Mật khẩu" name="password">
              <UInput v-model="userForm.password" type="password" />
            </UFormGroup>

            <UFormGroup label="Vai trò" name="role">
              <USelectMenu
                v-model="userForm.role"
                :options="roleOptions"
              />
            </UFormGroup>

            <UFormGroup label="Tiểu sử" name="bio">
              <UTextarea v-model="userForm.bio" />
            </UFormGroup>

            <div class="flex gap-3 pt-4">
              <UButton type="submit" :loading="submitting">
                {{ editingUser ? 'Cập nhật' : 'Tạo mới' }}
              </UButton>
              <UButton
                variant="outline"
                @click="closeCreateModal"
              >
                Hủy
              </UButton>
            </div>
          </UForm>
        </UCard>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { z } from 'zod'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import { useDebounceFn } from '@vueuse/core'
import type { User } from '~/types/user'
// Types
// interface User {
//   _id: string
//   username: string
//   email: string
//   role: 'user' | 'moderator' | 'admin' | 'system'
//   isActive: boolean
//   isBanned: boolean
//   image?: string
//   bio?: string
//   lastLogin?: Date
//   violation: {
//     userReports: number
//     modConfirmed: boolean
//     details: any
//     count: number
//   }
//   statistics: {
//     totalUploaded: number
//     totalReports: number
//     totalAppeals: number
//     totalFavoriteNovels: number
//   }
//   createdAt: Date
//   updatedAt: Date
// }

interface Statistics {
  totalUsers: number
  activeUsers: number
  bannedUsers: number
  violationUsers: number
}

// Schema validation
const userSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email(),
  password: z.string().min(6).optional(),
  role: z.enum(['user', 'moderator', 'admin', 'system']),
  bio: z.string().max(500).optional()
})

// Reactive data
const loading = ref(false)
const submitting = ref(false)
const searchQuery = ref('')
const selectedRole = ref('')
const selectedStatus = ref('')
const currentPage = ref(1)
const pageSize = ref(20)
const totalUsers = ref(0)

const showDetailModal = ref(false)
const showCreateModal = ref(false)
const showEditModal = ref(false)
const selectedUser = ref<User | null>(null)
const editingUser = ref<User | null>(null)

// Mock data - replace with actual API calls
const users = ref<User[]>([
  {
    _id: '1',
    username: 'admin_user',
    email: 'admin@example.com',
    role: 'admin',
    isActive: true,
    isBanned: false,
    image: 'https://i.pravatar.cc/150?img=1',
    bio: 'Quản trị viên hệ thống',
    lastLogin: new Date(),
    violation: { userReports: 0, modConfirmed: false, details: null, count: 0 },
    statistics: { totalUploaded: 5, totalReports: 0, totalAppeals: 0, totalFavoriteNovels: 12 },
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: '2',
    username: 'john_doe',
    email: 'john@example.com',
    role: 'user',
    isActive: true,
    isBanned: false,
    image: 'https://i.pravatar.cc/150?img=2',
    bio: 'Người dùng thường xuyên',
    lastLogin: new Date(Date.now() - 86400000),
    violation: { userReports: 2, modConfirmed: false, details: null, count: 1 },
    statistics: { totalUploaded: 3, totalReports: 1, totalAppeals: 0, totalFavoriteNovels: 8 },
    createdAt: new Date(),
    updatedAt: new Date()
  }
])

const statistics = ref<Statistics>({
  totalUsers: 1250,
  activeUsers: 1180,
  bannedUsers: 25,
  violationUsers: 45
})

const userForm = ref({
  username: '',
  email: '',
  password: '',
  role: 'user',
  bio: ''
})

// Computed
const filteredUsers = computed(() => {
  let filtered = users.value

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(user =>
      user.username.toLowerCase().includes(query)
      || user.email.toLowerCase().includes(query)
    )
  }

  if (selectedRole.value) {
    filtered = filtered.filter(user => user.role === selectedRole.value)
  }

  if (selectedStatus.value) {
    if (selectedStatus.value === 'active') {
      filtered = filtered.filter(user => user.isActive && !user.isBanned)
    } else if (selectedStatus.value === 'banned') {
      filtered = filtered.filter(user => user.isBanned)
    } else if (selectedStatus.value === 'inactive') {
      filtered = filtered.filter(user => !user.isActive)
    }
  }

  return filtered
})

// Options
const roleOptions = [
  { label: 'Tất cả vai trò', value: '' },
  { label: 'Người dùng', value: 'user' },
  { label: 'Kiểm duyệt viên', value: 'moderator' },
  { label: 'Quản trị viên', value: 'admin' },
  { label: 'Hệ thống', value: 'system' }
]

const statusOptions = [
  { label: 'Tất cả trạng thái', value: '' },
  { label: 'Hoạt động', value: 'active' },
  { label: 'Không hoạt động', value: 'inactive' },
  { label: 'Bị cấm', value: 'banned' }
]

const columns = [
  { id: 'avatar', label: '' },
  { id: 'username', label: 'Người dùng' },
  { id: 'role', label: 'Vai trò' },
  { id: 'status', label: 'Trạng thái' },
  { id: 'violation', label: 'Vi phạm' },
  { id: 'lastLogin', label: 'Đăng nhập cuối' },
  { id: 'actions', label: '' }
]

// Methods
const debouncedSearch = useDebounceFn(() => {
  // Implement search logic
}, 300)

const clearFilters = () => {
  searchQuery.value = ''
  selectedRole.value = ''
  selectedStatus.value = ''
}

const getRoleColor = (role: string) => {
  const colors = {
    admin: 'red',
    moderator: 'orange',
    user: 'blue',
    system: 'purple'
  }
  return colors[role as keyof typeof colors] || 'gray'
}

const getRoleLabel = (role: string) => {
  const labels = {
    admin: 'Quản trị viên',
    moderator: 'Kiểm duyệt viên',
    user: 'Người dùng',
    system: 'Hệ thống'
  }
  return labels[role as keyof typeof labels] || role
}

const formatDate = (date: Date) => {
  return format(new Date(date), 'dd/MM/yyyy HH:mm', { locale: vi })
}

const getActionItems = (user: User) => [
  [{
    label: 'Xem chi tiết',
    icon: 'i-lucide-eye',
    click: () => viewUser(user)
  }],
  [{
    label: 'Chỉnh sửa',
    icon: 'i-lucide-edit',
    click: () => editUser(user)
  }],
  [{
    label: user.isBanned ? 'Bỏ cấm' : 'Cấm người dùng',
    icon: user.isBanned ? 'i-lucide-user-check' : 'i-lucide-user-x',
    click: () => user.isBanned ? unbanUser(user) : banUser(user)
  }]
]

const viewUser = (user: User) => {
  selectedUser.value = user
  showDetailModal.value = true
}

const editUser = (user: User) => {
  editingUser.value = user
  userForm.value = {
    username: user.username,
    email: user.email,
    password: '',
    role: user.role,
    bio: user.bio || ''
  }
  showCreateModal.value = true
}

const banUser = async (user: User) => {
  // Implement ban user logic
  console.log('Banning user:', user.username)
}

const unbanUser = async (user: User) => {
  // Implement unban user logic
  console.log('Unbanning user:', user.username)
}

const resetViolations = async (user: User) => {
  // Implement reset violations logic
  console.log('Resetting violations for user:', user.username)
}

const submitUser = async (data: any) => {
  submitting.value = true
  try {
    if (editingUser.value) {
      // Update user
      console.log('Updating user:', data)
    } else {
      // Create user
      console.log('Creating user:', data)
    }
    closeCreateModal()
  } catch (error) {
    console.error('Error submitting user:', error)
  } finally {
    submitting.value = false
  }
}

const closeCreateModal = () => {
  showCreateModal.value = false
  editingUser.value = null
  userForm.value = {
    username: '',
    email: '',
    password: '',
    role: 'user',
    bio: ''
  }
}

const exportUsers = () => {
  // Implement export functionality
  console.log('Exporting users...')
}

// Page meta
definePageMeta({
  layout: 'admin'
})

// SEO
useSeoMeta({
  title: 'Quản lý người dùng - Admin Dashboard',
  description: 'Giao diện quản lý người dùng cho admin'
})
</script>

<style scoped>
/* Custom styles if needed */
</style>
