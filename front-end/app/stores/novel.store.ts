import { defineStore } from 'pinia'
import { $fetch } from 'ofetch'
import type { Novel, NovelQuery, ApiResponse } from '~/types/novel' // Đảm bảo type Novel có các trường statusPublish, status, isHidden
import { useAuthStore } from '~/stores/auth.store'

export const useNovelsStore = defineStore('novels', () => {
  const authStore = useAuthStore()
  const runtimeConfig = useRuntimeConfig()

  // State
  const novels = ref<Novel[]>([])
  const currentNovel = ref<Novel | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const pagination = ref({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  })

  // Helper to get endpoint based on role
  const getEndpoint = (role: string) => {
    const roleEndpoints: Record<string, string> = {
      user: 'api/v1/novels', // Đã sửa để khớp với cấu trúc router /api/v1/user/novels
      moderator: 'api/v2/moderator/novels',
      admin: 'api/v2/admin/novels'
      // Không cần 'admin/all' ở đây vì nó là một endpoint cụ thể, không phải base endpoint
    }
    return roleEndpoints[role] || roleEndpoints.user
  }
  // Fetch novels based on role (user's own novels, public novels if user role is 'user' and endpoint is /api/v1/novels)
  const fetchMyNovels = async (query: NovelQuery = {}) => {
    loading.value = true
    error.value = null
    try {
      // const role = authStore.user?.role || 'user'
      // let endpoint = ''
      // // Xử lý logic đặc biệt cho endpoint:
      // if (role === 'moderator') {
      //   // Mod sử dụng fetchPendingNovels, fetchHiddenNovels
      //   // fetchNovels với role moderator có thể dùng cho tổng quan các truyện đã duyệt
      //   endpoint = getEndpoint(role) ?? ''
      // }
      // console.log('Fetching novels (general/user):', { endpoint, query })
      const response = await $fetch<ApiResponse<Novel[]>>(
        `${runtimeConfig.public.apiBaseUrl}/api/v1/novels`,
        {
          method: 'GET',
          query: {
            page: query.page || 1,
            limit: query.limit || 10,
            sort: query.sort || 'createdAt',
            direction: query.direction || 'desc',
            // Thêm các tham số lọc khác nếu cần cho user/general list
            // Ví dụ: query.statusPublish, query.status, query.title, query.author, ...
            statusPublish: query.statusPublish, // Thêm để có thể lọc theo trạng thái
            status: query.status,
            isHidden: query.isHidden,
            author: query.author,
            title: query.title,
            attribute: query.attribute
          },
          credentials: 'include',
          timeout: 5000
        }
      )
      novels.value = response.data
      if (response.pagination) {
        pagination.value = response.pagination
      }
    } catch (err: unknown) {
      const errorMessage
        = err instanceof Error
          ? err.message.includes('CORS')
            ? 'Lỗi CORS: Không thể tải danh sách truyện.'
            : err.message
          : 'Có lỗi xảy ra khi tải danh sách truyện'
      error.value = errorMessage
      console.error('Error fetching novels:', err)
      throw new Error(errorMessage)
    } finally {
      loading.value = false
    }
  }

  // --- PUBLIC NOVELS (Accessed by anyone, usually from novel.route.js) ---
  // Lưu ý: Endpoint này không sử dụng `getEndpoint` vì nó là public và không yêu cầu authStore.user?.role
  const getPublicNovelById = async (id: string) => { // Đổi tên để phân biệt với fetchNovelById (có role check)
    loading.value = true
    error.value = null
    try {
      const response = await $fetch<ApiResponse<Novel>>(
        `${runtimeConfig.public.apiBaseUrl}/api/v1/novel/${id}`, // Endpoint public: /api/v1/novel/:id
        {
          method: 'GET',
          credentials: 'include', // Có thể bỏ nếu đây là public route không yêu cầu cookie
          timeout: 5000
        }
      )
      currentNovel.value = response.data
    } catch (err: unknown) {
      const errorMessage
        = err instanceof Error
          ? err.message.includes('CORS')
            ? 'Lỗi CORS: Không thể tải thông tin truyện.'
            : err.message
          : 'Có lỗi xảy ra khi tải thông tin truyện'
      error.value = errorMessage
      console.error('Error fetching public novel by ID:', err)
      throw new Error(errorMessage) // Ném lỗi để component có thể bắt
    } finally {
      loading.value = false
    }
  }

  // --- ACTIONS (GENERAL & USER-SPECIFIC) ---

  // Fetch novels based on role (user's own novels, public novels if user role is 'user' and endpoint is /api/v1/novels)
  const fetchNovels = async (query: NovelQuery = {}) => {
    loading.value = true
    error.value = null
    try {
      // const role = authStore.user?.role || 'user'
      // let endpoint = ''
      // // Xử lý logic đặc biệt cho endpoint:
      // if (role === 'moderator') {
      //   // Mod sử dụng fetchPendingNovels, fetchHiddenNovels
      //   // fetchNovels với role moderator có thể dùng cho tổng quan các truyện đã duyệt
      //   endpoint = getEndpoint(role) ?? ''
      // }
      // console.log('Fetching novels (general/user):', { endpoint, query })
      const response = await $fetch<ApiResponse<Novel[]>>(
        `${runtimeConfig.public.apiBaseUrl}/api/v1/novels`,
        {
          method: 'GET',
          query: {
            page: query.page || 1,
            limit: query.limit || 10,
            sort: query.sort || 'createdAt',
            direction: query.direction || 'desc',
            // Thêm các tham số lọc khác nếu cần cho user/general list
            // Ví dụ: query.statusPublish, query.status, query.title, query.author, ...
            statusPublish: query.statusPublish, // Thêm để có thể lọc theo trạng thái
            status: query.status,
            isHidden: query.isHidden,
            author: query.author,
            title: query.title,
            attribute: query.attribute
          },
          credentials: 'include',
          timeout: 5000
        }
      )
      novels.value = response.data
      if (response.pagination) {
        pagination.value = response.pagination
      }
    } catch (err: unknown) {
      const errorMessage
        = err instanceof Error
          ? err.message.includes('CORS')
            ? 'Lỗi CORS: Không thể tải danh sách truyện.'
            : err.message
          : 'Có lỗi xảy ra khi tải danh sách truyện'
      error.value = errorMessage
      console.error('Error fetching novels:', err)
      throw new Error(errorMessage)
    } finally {
      loading.value = false
    }
  }

  const fetchNovelById = async (id: string) => {
    loading.value = true
    error.value = null
    try {
      const role = authStore.user?.role || 'user'
      const endpoint = getEndpoint(role)
      console.log('Fetching novel by ID (role-based):', { id, role, endpoint })
      const response = await $fetch<ApiResponse<Novel>>(
        `${runtimeConfig.public.apiBaseUrl}/${endpoint}/${id}`,
        {
          method: 'GET',
          credentials: 'include',
          timeout: 5000
        }
      )
      currentNovel.value = response.data
    } catch (err: unknown) {
      const errorMessage
        = err instanceof Error
          ? err.message.includes('CORS')
            ? 'Lỗi CORS: Không thể tải truyện.'
            : err.message
          : 'Có lỗi xảy ra khi tải chi tiết truyện'
      error.value = errorMessage
      console.error('Error fetching novel:', err)
      throw new Error(errorMessage)
    } finally {
      loading.value = false
    }
  }

  const updateNovel = async (id: string, novelData: Partial<Novel>) => {
    loading.value = true
    error.value = null
    try {
      const role = authStore.user?.role || 'user'
      const endpoint = getEndpoint(role) // Sẽ là api/v1/user/novels cho user, api/v2/moderator/novels cho mod, api/v2/admin/novels cho admin
      console.log('Sending PATCH request for novel:', { id, novelData, role, endpoint })
      const response = await $fetch<ApiResponse<Novel>>(
        `${runtimeConfig.public.apiBaseUrl}/${endpoint}/${id}`,
        {
          method: 'PATCH',
          credentials: 'include',
          body: novelData,
          timeout: 5000
        }
      )
      console.log('Update novel response:', response)
      currentNovel.value = response.data
      // // Cập nhật novels list nếu đang hiển thị danh sách
      // const index = novels.value.findIndex(n => n._id === id)
      // if (index !== -1) {
      //   novels.value[index] = response.data as Novel
      // }
      // return response.data
    } catch (err: unknown) {
      const errorMessage
        = err instanceof Error
          ? err.message.includes('CORS')
            ? 'Lỗi CORS: Không thể cập nhật truyện.'
            : `Không thể cập nhật truyện: ${err.message}`
          : 'Có lỗi xảy ra khi cập nhật truyện'
      error.value = errorMessage
      console.error('Error updating novel:', err)
      throw new Error(errorMessage)
    } finally {
      loading.value = false
    }
  }

  const requestEditNovel = async (id: string, message: string) => {
    loading.value = true
    error.value = null
    try {
      const response = await $fetch<ApiResponse<null>>(
        `${runtimeConfig.public.apiBaseUrl}/api/v1/user/novels/${id}/request-edit`,
        {
          method: 'POST',
          body: { message },
          credentials: 'include',
          timeout: 5000
        }
      )
      return response
    } catch (err: unknown) {
      const errorMessage
        = err instanceof Error
          ? err.message.includes('CORS')
            ? 'Lỗi CORS: Không thể gửi yêu cầu chỉnh sửa.'
            : `Không thể gửi yêu cầu chỉnh sửa: ${err.message}`
          : 'Có lỗi xảy ra khi gửi yêu cầu chỉnh sửa'
      error.value = errorMessage
      console.error('Error requesting edit:', err)
      throw new Error(errorMessage)
    } finally {
      loading.value = false
    }
  }

  const requestPublishNovel = async (id: string) => {
    loading.value = true
    error.value = null
    try {
      const response = await $fetch<ApiResponse<null>>(
        `${runtimeConfig.public.apiBaseUrl}/api/v1/novels/${id}/request-publish`, // Đã sửa endpoint user
        {
          method: 'POST',
          credentials: 'include',
          timeout: 5000
        }
      )
      return response
    } catch (err: unknown) {
      const errorMessage
        = err instanceof Error
          ? err.message.includes('CORS')
            ? 'Lỗi CORS: Không thể gửi yêu cầu xuất bản.'
            : `Không thể gửi yêu cầu xuất bản: ${err.message}`
          : 'Có lỗi xảy ra khi gửi yêu cầu xuất bản'
      error.value = errorMessage
      console.error('Error requesting publish:', err)
      throw new Error(errorMessage)
    } finally {
      loading.value = false
    }
  }

  // --- MODERATOR-SPECIFIC ACTIONS ---

  const fetchPendingNovels = async (query: NovelQuery = {}) => {
    loading.value = true
    error.value = null
    try {
      const endpoint = getEndpoint('moderator')
      console.log('Fetching pending novels:', { query })
      const response = await $fetch<ApiResponse<Novel[]>>(
        `${runtimeConfig.public.apiBaseUrl}/${endpoint}/pending`,
        {
          method: 'GET',
          query: { // Đảm bảo truyền query params cho phân trang, lọc
            page: query.page || 1,
            limit: query.limit || 10,
            sortBy: query.sort || 'createdAt', // Sửa thành sortOrder thay vì direction để match backend
            // Thêm các tham số lọc khác cho moderator nếu cần (ví dụ: title, author)
            title: query.title,
            author: query.author
          },
          credentials: 'include',
          timeout: 5000
        }
      )
      novels.value = response.data
      if (response.pagination) {
        pagination.value = response.pagination
      }
    } catch (err: unknown) {
      const errorMessage
        = err instanceof Error
          ? err.message.includes('CORS')
            ? 'Lỗi CORS: Không thể tải danh sách truyện đang chờ duyệt.'
            : err.message
          : 'Có lỗi xảy ra khi tải danh sách truyện đang chờ duyệt'
      error.value = errorMessage
      console.error('Error fetching pending novels:', err)
      throw new Error(errorMessage)
    } finally {
      loading.value = false
    }
  }

  const fetchNovelForModeration = async (id: string) => { // Đổi tên để rõ ràng hơn
    loading.value = true
    error.value = null
    try {
      const endpoint = getEndpoint('moderator')
      console.log('Fetching novel for moderation:', id)
      const response = await $fetch<ApiResponse<Novel>>(
        `${runtimeConfig.public.apiBaseUrl}/${endpoint}/${id}`,
        {
          method: 'GET',
          credentials: 'include',
          timeout: 5000
        }
      )
      currentNovel.value = response.data
    } catch (err: unknown) {
      const errorMessage
        = err instanceof Error
          ? err.message.includes('CORS')
            ? 'Lỗi CORS: Không thể tải truyện để kiểm duyệt.'
            : err.message
          : 'Có lỗi xảy ra khi tải truyện để kiểm duyệt'
      error.value = errorMessage
      console.error('Error fetching novel for moderation:', err)
      throw new Error(errorMessage)
    } finally {
      loading.value = false
    }
  }

  const fetchHiddenNovels = async (query: NovelQuery = {}) => {
    loading.value = true
    error.value = null
    try {
      const endpoint = getEndpoint('moderator')
      console.log('Fetching hidden novels (moderator):', { query })
      const response = await $fetch<ApiResponse<Novel[]>>(
        `${runtimeConfig.public.apiBaseUrl}/${endpoint}/hide-toggle?isHidden=true`, // Thêm query param isHidden=true nếu backend yêu cầu cụ thể
        {
          method: 'GET',
          query: { // Đảm bảo truyền query params cho phân trang, lọc
            page: query.page || 1,
            limit: query.limit || 10,
            sortBy: query.sort || 'createdAt',
            title: query.title,
            author: query.author
          },
          credentials: 'include',
          timeout: 5000
        }
      )
      novels.value = response.data
      if (response.pagination) {
        pagination.value = response.pagination
      }
    } catch (err: unknown) {
      const errorMessage
        = err instanceof Error
          ? err.message.includes('CORS')
            ? 'Lỗi CORS: Không thể tải danh sách truyện bị ẩn.'
            : err.message
          : 'Có lỗi xảy ra khi tải danh sách truyện bị ẩn'
      error.value = errorMessage
      console.error('Error fetching hidden novels (moderator):', err)
      throw new Error(errorMessage)
    } finally {
      loading.value = false
    }
  }

  const approveNovel = async (id: string) => {
    loading.value = true
    error.value = null
    try {
      const endpoint = getEndpoint('moderator')
      console.log('Approving novel:', { id })
      const response = await $fetch<ApiResponse<Novel>>(
        `${runtimeConfig.public.apiBaseUrl}/${endpoint}/${id}/approve`,
        {
          method: 'PATCH',
          credentials: 'include',
          timeout: 5000
        }
      )
      currentNovel.value = response.data
      // Cập nhật novels list sau khi approve
      const index = novels.value.findIndex(n => n._id === id)
      if (index !== -1) {
        novels.value.splice(index, 1) // Xóa khỏi danh sách pending
      }
      return response
    } catch (err: unknown) {
      const errorMessage
        = err instanceof Error
          ? err.message.includes('CORS')
            ? 'Lỗi CORS: Không thể phê duyệt truyện.'
            : `Không thể phê duyệt truyện: ${err.message}`
          : 'Có lỗi xảy ra khi phê duyệt truyện'
      error.value = errorMessage
      console.error('Error approving novel:', err)
      throw new Error(errorMessage)
    } finally {
      loading.value = false
    }
  }

  const rejectNovel = async (id: string) => { // Thêm hàm rejectNovel cho moderator
    loading.value = true
    error.value = null
    try {
      const endpoint = getEndpoint('moderator')
      console.log('Rejecting novel:', { id })
      const response = await $fetch<ApiResponse<Novel>>(
        `${runtimeConfig.public.apiBaseUrl}/${endpoint}/${id}/reject`,
        {
          method: 'PATCH',
          credentials: 'include',
          timeout: 5000
        }
      )
      currentNovel.value = response.data
      const index = novels.value.findIndex(n => n._id === id)
      if (index !== -1) {
        novels.value.splice(index, 1) // Xóa khỏi danh sách pending
      }
      return response
    } catch (err: unknown) {
      const errorMessage
        = err instanceof Error
          ? err.message.includes('CORS')
            ? 'Lỗi CORS: Không thể từ chối truyện.'
            : `Không thể từ chối truyện: ${err.message}`
          : 'Có lỗi xảy ra khi từ chối truyện'
      error.value = errorMessage
      console.error('Error rejecting novel:', err)
      throw new Error(errorMessage)
    } finally {
      loading.value = false
    }
  }

  const toggleHideNovel = async (id: string, isHidden: boolean) => { // Hàm toggleHideNovel cho moderator
    loading.value = true
    error.value = null
    try {
      const endpoint = getEndpoint('moderator')
      console.log('Toggling novel hidden status:', { id, isHidden })
      const response = await $fetch<ApiResponse<Novel>>(
        `${runtimeConfig.public.apiBaseUrl}/${endpoint}/${id}/hide-toggle`,
        {
          method: 'PATCH',
          credentials: 'include',
          body: { isHidden }, // Gửi trạng thái ẩn/hiện
          timeout: 5000
        }
      )
      currentNovel.value = response.data
      // Cập nhật trạng thái trong danh sách novels nếu có
      // const index = novels.value.findIndex(n => n._id === id)
      // if (index !== -1) {
      //   novels.value[index] = response.data
      // }
      return response
    } catch (err: unknown) {
      const errorMessage
        = err instanceof Error
          ? err.message.includes('CORS')
            ? 'Lỗi CORS: Không thể thay đổi trạng thái ẩn của truyện.'
            : `Không thể thay đổi trạng thái ẩn của truyện: ${err.message}`
          : 'Có lỗi xảy ra khi thay đổi trạng thái ẩn của truyện'
      error.value = errorMessage
      console.error('Error toggling hide novel:', err)
      throw new Error(errorMessage)
    } finally {
      loading.value = false
    }
  }

  // --- ADMIN-SPECIFIC ACTIONS ---

  // Bổ sung hàm fetchAllNovelsForAdmin
  const fetchAllNovelsForAdmin = async () => {
    loading.value = true
    error.value = null
    try {
      const response = await $fetch<ApiResponse<Novel[]>>(
        `${runtimeConfig.public.apiBaseUrl}/api/v2/admin/novels/all`, // Endpoint chính xác cho admin
        {
          method: 'GET',

          credentials: 'include',
          timeout: 5000
        }
      )
      novels.value = response.data
      if (response.pagination) {
        pagination.value = response.pagination
      }
    } catch (err: unknown) {
      const errorMessage
        = err instanceof Error
          ? err.message.includes('CORS')
            ? 'Lỗi CORS: Không thể tải danh sách tất cả truyện cho admin.'
            : err.message
          : 'Có lỗi xảy ra khi tải danh sách tất cả truyện cho admin'
      error.value = errorMessage
      console.error('Error fetching all novels for admin:', err)
      throw new Error(errorMessage)
    } finally {
      loading.value = false
    }
  }

  // Bổ sung hàm updateNovelStatusByAdmin
  // Hàm này có thể được sử dụng để cập nhật bất kỳ trường trạng thái nào (statusPublish, status, isHidden)
  const updateNovelStatusByAdmin = async (id: string, updateData: { statusPublish?: string, status?: string, isHidden?: boolean }) => {
    loading.value = true
    error.value = null
    try {
      console.log('Updating novel status by admin:', { id, updateData })
      const response = await $fetch<ApiResponse<Novel>>(
        `${runtimeConfig.public.apiBaseUrl}/api/v2/admin/novels/${id}/status`, // Endpoint chính xác cho admin cập nhật trạng thái
        {
          method: 'PATCH',
          credentials: 'include',
          body: updateData,
          timeout: 5000
        }
      )
      currentNovel.value = response.data
      // Cập nhật novels list sau khi update
      // const index = novels.value.findIndex(n => n._id === id)
      // if (index !== -1) {
      //   novels.value[index] = response.data
      // }
      return response.data
    } catch (err: unknown) {
      const errorMessage
        = err instanceof Error
          ? err.message.includes('CORS')
            ? 'Lỗi CORS: Không thể cập nhật trạng thái truyện bởi admin.'
            : `Không thể cập nhật trạng thái truyện bởi admin: ${err.message}`
          : 'Có lỗi xảy ra khi cập nhật trạng thái truyện bởi admin'
      error.value = errorMessage
      console.error('Error updating novel status by admin:', err)
      throw new Error(errorMessage)
    } finally {
      loading.value = false
    }
  }

  // Getters
  const hasNovels = computed(() => novels.value.length > 0)
  const isLoading = computed(() => loading.value)
  const hasError = computed(() => !!error.value)

  return {
    // State
    novels,
    currentNovel,
    pagination,
    error,

    // Getters
    hasNovels,
    isLoading,
    hasError,

    // ALL ROLES NOVELS (Public)
    getPublicNovelById, // Đổi tên để phân biệt rõ ràng
    fetchMyNovels,
    // Actions (General & User)
    fetchNovels, // Sử dụng cho truyện của user và public (nếu điều chỉnh logic)
    fetchNovelById, // Sử dụng cho truyện của user (có kiểm tra role qua getEndpoint)
    updateNovel,
    requestEditNovel,
    requestPublishNovel,

    // Moderator actions
    fetchPendingNovels,
    fetchNovelForModeration, // Đổi tên
    fetchHiddenNovels,
    // warnNovelViolation,
    // flagNovel,
    approveNovel,
    rejectNovel, // Bổ sung
    toggleHideNovel, // Bổ sung

    // Admin actions
    fetchAllNovelsForAdmin, // Bổ sung
    updateNovelStatusByAdmin, // Bổ sung

    // Utility actions
    // clearCurrentNovel,
    clearError
  }
})
