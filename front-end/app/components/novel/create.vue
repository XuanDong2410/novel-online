<template>
  <UCard class="max-w-2xl mx-auto py-3 space-y-6">
    <UForm :state="formState" class="space-y-4" @submit="createNovel">
      <!-- Tiêu đề truyện -->
      <div name="title" class="w-full">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tên truyện</label>
        <UInput v-model="formState.title" placeholder="Nhập tên truyện" class="w-full" />
      </div>

      <!-- Tác giả -->
      <div name="author" class="w-full">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tác giả</label>
        <UInput v-model="formState.author" placeholder="Nhập tên tác giả" class="w-full" />
      </div>

      <!-- Giới thiệu -->
      <div name="description" class="w-full">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Giới thiệu</label>
        <UTextarea
          v-model="formState.description"
          placeholder="Giới thiệu sơ lược nội dung truyện..."
          class="w-full"
          :rows="4"
        />
      </div>

      <!-- Giới tính (Audience) -->
      <div name="audience" class="w-full">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Giới tính</label>
        <USelectMenu
          v-model="formState.audience"
          :search-input="{ placeholder: 'Tìm kiếm...', icon: 'i-lucide-search' }"
          :items="audienceItems"
          value-attribute="value"
          option-attribute="label"
          class="w-full"
        />
      </div>

      <!-- Thể loại (Genre) -->
      <div name="genre" class="w-full">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Thể loại</label>
        <USelectMenu
          v-model="formState.genre"
          :search-input="{ placeholder: 'Tìm kiếm...', icon: 'i-lucide-search' }"
          :items="genreItems"
          value-attribute="value"
          option-attribute="label"
          class="w-full"
        />
      </div>

      <!-- Lưu phái (Subgenre) -->
      <div name="subGenre" class="w-full">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Lưu phái</label>
        <USelectMenu
          v-model="formState.subGenre"
          :search-input="{ placeholder: 'Tìm kiếm...', icon: 'i-lucide-search' }"
          :items="subGenreItems"
          value-attribute="value"
          option-attribute="label"
          class="w-full"
        />
      </div>

      <!-- Tính cách nhân vật chính (Character) -->
      <div name="characterTrait" class="w-full">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tính cách nhân vật chính</label>
        <USelectMenu
          v-model="formState.character"
          :search-input="{ placeholder: 'Tìm kiếm...', icon: 'i-lucide-search' }"
          :items="characterItems"
          value-attribute="value"
          option-attribute="label"
          class="w-full"
        />
      </div>

      <!-- Bối cảnh thế giới (World) -->
      <div name="worldBuilding" class="w-full">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bối cảnh thế giới</label>
        <USelectMenu
          v-model="formState.world"
          :search-input="{ placeholder: 'Tìm kiếm...', icon: 'i-lucide-search' }"
          :items="worldItems"
          value-attribute="value"
          option-attribute="label"
          class="w-full"
        />
      </div>

      <!-- Thẻ (Tags) -->
      <!-- <div name="tags" class="w-full">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Thẻ</label>
        <UInput v-model="tagsInput" placeholder="Nhập các thẻ, cách nhau bằng dấu phẩy" class="w-full" />
      </div> -->

      <!-- Ảnh bìa (Cover Image) -->
      <div name="coverImage" class="w-full">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ảnh bìa (URL)</label>
        <UInput v-model="formState.coverImage" placeholder="Nhập URL ảnh bìa" class="w-full" />
      </div>

      <!-- Đồng ý điều khoản -->
      <div class="flex items-center space-x-2 pt-4 border-t border-gray-200 dark:border-gray-700">
        <UCheckbox v-model="formState.agreed" />
        <span class="text-sm text-gray-700 dark:text-gray-300">
          Tôi đồng ý với
          <strong class="text-blue-500 hover:text-blue-400">Điều khoản Dịch vụ</strong>
          khi đăng truyện
        </span>
      </div>

      <!-- Nút submit -->
      <div class="flex justify-end">
        <UButton
          type="submit"
          color="primary"
          :disabled="!formState.agreed"
          :loading="isSubmitting"
        >
          Tiếp Theo
        </UButton>
      </div>
    </UForm>
  </UCard>
</template>

<script setup lang="ts">
import type { Novel, ApiResponse } from '@/types/novel'

// Khởi tạo toast
const toast = useToast()

// Trạng thái form
const formState = reactive({
  title: '',
  author: '',
  description: '',
  audience: undefined as string | undefined,
  genre: undefined as string | undefined,
  subGenre: undefined as string | undefined,
  character: undefined as string | undefined,
  world: undefined as string | undefined,
  coverImage: '',
  agreed: false
})

const tagsInput = ref('')
const isSubmitting = ref(false)

// Dữ liệu cho USelectMenu
interface SelectItem {
  label: string
  value: string
  type: string
}

const audienceItems = ref<SelectItem[]>([])
const genreItems = ref<SelectItem[]>([])
const subGenreItems = ref<SelectItem[]>([])
const characterItems = ref<SelectItem[]>([])
const worldItems = ref<SelectItem[]>([])

// Fetch danh sách NovelAttribute
async function fetchAttributes(type: string) {
  interface AttributeResponse {
    success: boolean
    data: { name: string, _id: string }[]
  }
  try {
    const response = await $fetch<AttributeResponse>(`http://localhost:5000/api/v1/attribute/${type}`)
    if (response.success) {
      return response.data.map((attr: { name: string, _id: string }) => ({
        label: attr.name,
        value: attr._id,
        type
      }))
    }
    return []
  } catch (error) {
    console.error(`Error fetching ${type} attributes:`, error)
    return []
  }
}

// Load dữ liệu khi component được mounted
onMounted(async () => {
  audienceItems.value = await fetchAttributes('audience')
  genreItems.value = await fetchAttributes('genre')
  subGenreItems.value = await fetchAttributes('subgenre')
  characterItems.value = await fetchAttributes('character')
  worldItems.value = await fetchAttributes('world')
})

// Hàm xử lý submit
async function createNovel() {
  if (!formState.agreed) {
    toast.add({ title: 'Lỗi', description: 'Vui lòng đồng ý với điều khoản dịch vụ.', color: 'error' })
    return
  }

  const requiredFields = [
    formState.title,
    formState.author,
    formState.description,
    formState.audience,
    formState.genre,
    formState.subGenre,
    formState.character,
    formState.world
  ]

  if (!requiredFields.every(field => field != null && field !== '')) {
    toast.add({ title: 'Lỗi', description: 'Vui lòng điền đầy đủ các trường bắt buộc.', color: 'error' })
    return
  }

  // Validate client-side
  if (formState.title.length > 200 || formState.title.length < 3) {
    toast.add({ title: 'Lỗi', description: 'Tiêu đề phải từ 3 đến 200 ký tự.', color: 'error' })
    return
  }
  if (formState.author.length > 100 || formState.author.length < 2) {
    toast.add({ title: 'Lỗi', description: 'Tên tác giả phải từ 2 đến 100 ký tự.', color: 'error' })
    return
  }
  if (formState.description.length > 2000 || formState.description.length < 10) {
    toast.add({ title: 'Lỗi', description: 'Mô tả phải từ 10 đến 2000 ký tự.', color: 'error' })
    return
  }
  if (formState.coverImage && !isValidUrl(formState.coverImage)) {
    toast.add({ title: 'Lỗi', description: 'URL ảnh bìa không hợp lệ.', color: 'error' })
    return
  }

  const tags = tagsInput.value
    .split(',')
    .map(tag => tag.trim().toLowerCase())
    .filter(tag => tag && tag.length <= 50)
  if (tags.length > 10) {
    toast.add({ title: 'Lỗi', description: 'Tối đa 10 thẻ được phép.', color: 'error' })
    return
  }

  isSubmitting.value = true
  try {
    // Đảm bảo attributes chỉ chứa chuỗi ID
    const attributes = [
      typeof formState.audience === 'object' ? formState.audience?.value : formState.audience,
      typeof formState.genre === 'object' ? formState.genre?.value : formState.genre,
      typeof formState.subGenre === 'object' ? formState.subGenre?.value : formState.subGenre,
      typeof formState.character === 'object' ? formState.character?.value : formState.character,
      typeof formState.world === 'object' ? formState.world?.value : formState.world
    ].filter(Boolean)

    const novelData = {
      title: formState.title,
      author: formState.author,
      description: formState.description,
      attributes,
      tags: tags.length ? tags : [],
      coverImage: formState.coverImage || undefined
    }

    console.log('Data create: ', JSON.parse(JSON.stringify(novelData))) // Log dữ liệu sạch
    const response = await $fetch<ApiResponse<Novel>>('http://localhost:5000/api/v1/novels', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: novelData
    })

    if (response.success) {
      toast.add({ title: 'Thành công', description: response.message || 'Tạo truyện thành công!', color: 'success' })
      console.log('Response: ', response)
      // navigateTo('/user/mystory')
    } else {
      toast.add({ title: 'Lỗi', description: response.message || 'Không thể tạo truyện.', color: 'error' })
    }
  } catch (err: unknown) {
    const errorMessage
      = err instanceof Error
        ? err.message.includes('CORS')
          ? 'Lỗi CORS: Không thể thêm mới truyện.'
          : err.message
        : 'Không thể thêm truyện.'
    toast.add({
      title: 'Lỗi',
      description: errorMessage,
      color: 'error'
    })
    console.error('Create novel error:', err)
  } finally {
    isSubmitting.value = false
  }
}

// Hàm kiểm tra URL hợp lệ
function isValidUrl(url: string) {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}
</script>
