<template>
  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
    <!-- Left Panel: Novel Information -->
    <div class="space-y-6">
      <UCard class="w-full mx-auto pb-3 space-y-6">
        <!-- Non-editable alert -->
        <UAlert
          v-if="!isEditable"
          title="Chế độ xem"
          description="Truyện này không thể chỉnh sửa vì không ở trạng thái Nháp hoặc Đang chỉnh sửa. Bạn có thể yêu cầu chỉnh sửa bằng nút bên dưới."
          color="warning"
          icon="i-lucide-info"
        />
        <UForm :state="formState" class="space-y-4" @submit.prevent="submitUpdateNovel">
          <!-- Tiêu đề truyện -->
          <div name="title" class="w-full">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tên truyện</label>
            <UInput
              v-model="formState.title"
              placeholder="Nhập tên truyện"
              class="w-full"
              :error="errors.title"
              :disabled="!isEditable || isSubmitting"
              :class="{ 'bg-gray-100 text-gray-500': !isEditable }"
            />
            <span v-if="errors.title" class="text-sm text-red-500">{{ errors.title }}</span>
          </div>

          <!-- Tác giả -->
          <div name="author" class="w-full">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tác giả</label>
            <UInput
              v-model="formState.author"
              placeholder="Nhập tên tác giả"
              class="w-full"
              :error="errors.author"
              :disabled="!isEditable || isSubmitting"
              :class="{ 'bg-gray-100 text-gray-500': !isEditable }"
            />
            <span v-if="errors.author" class="text-sm text-red-500">{{ errors.author }}</span>
          </div>

          <!-- Giới thiệu -->
          <div name="description" class="w-full">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Giới thiệu</label>
            <UTextarea
              v-model="formState.description"
              placeholder="Giới thiệu sơ lược nội dung truyện..."
              class="w-full"
              :rows="4"
              :error="errors.description"
              :disabled="!isEditable || isSubmitting"
              :class="{ 'bg-gray-100 text-gray-500': !isEditable }"
            />
            <span v-if="errors.description" class="text-sm text-red-500">{{ errors.description }}</span>
          </div>

          <!-- Tình trạng -->
          <div name="status" class="w-full">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tình trạng</label>
            <USelect
              v-model="formState.status"
              :items="statusItems"
              value-attribute="value"
              option-attribute="label"
              placeholder="Chọn tình trạng"
              class="w-full"
              :disabled="!isEditable || isSubmitting"
              :class="{ 'bg-gray-100 text-gray-500': !isEditable }"
            />
            <span v-if="errors.status" class="text-sm text-red-500">{{ errors.status }}</span>
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
              :error="errors.audience"
              :disabled="!isEditable || isSubmitting"
              :class="{ 'bg-gray-100 text-gray-500': !isEditable }"
            />
            <span v-if="errors.audience" class="text-sm text-red-500">{{ errors.audience }}</span>
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
              :error="errors.genre"
              :disabled="!isEditable || isSubmitting"
              :class="{ 'bg-gray-100 text-gray-500': !isEditable }"
            />
            <span v-if="errors.genre" class="text-sm text-red-500">{{ errors.genre }}</span>
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
              :error="errors.subGenre"
              :disabled="!isEditable || isSubmitting"
              :class="{ 'bg-gray-100 text-gray-500': !isEditable }"
            />
            <span v-if="errors.subGenre" class="text-sm text-red-500">{{ errors.subGenre }}</span>
          </div>

          <!-- Tính cách nhân vật chính (Character) -->
          <div name="characterTrait" class="w-full">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tính cách nhân vật chính</label>
            <USelectMenu
              v-model="formState.characterTrait"
              :search-input="{ placeholder: 'Tìm kiếm...', icon: 'i-lucide-search' }"
              :items="characterItems"
              value-attribute="value"
              option-attribute="label"
              class="w-full"
              :error="errors.characterTrait"
              :disabled="!isEditable || isSubmitting"
              :class="{ 'bg-gray-100 text-gray-500': !isEditable }"
            />
            <span v-if="errors.characterTrait" class="text-sm text-red-500">{{ errors.characterTrait }}</span>
          </div>

          <!-- Bối cảnh thế giới (World) -->
          <div name="worldBuilding" class="w-full">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bối cảnh thế giới</label>
            <USelectMenu
              v-model="formState.worldBuilding"
              :search-input="{ placeholder: 'Tìm kiếm...', icon: 'i-lucide-search' }"
              :items="worldItems"
              value-attribute="value"
              option-attribute="label"
              class="w-full"
              :error="errors.worldBuilding"
              :disabled="!isEditable || isSubmitting"
              :class="{ 'bg-gray-100 text-gray-500': !isEditable }"
            />
            <span v-if="errors.worldBuilding" class="text-sm text-red-500">{{ errors.worldBuilding }}</span>
          </div>

          <!-- Đồng ý điều khoản -->
          <div class="flex items-center space-x-2 pt-4 border-t border-gray-200 dark:border-gray-700">
            <UCheckbox
              v-model="formState.agreed"
              :disabled="!isEditable || isSubmitting"
              :class="{ 'opacity-50': !isEditable }"
            />
            <span class="text-sm text-gray-700 dark:text-gray-300">
              Tôi đồng ý với
              <strong class="text-blue-500 hover:text-blue-400">Điều khoản Dịch vụ</strong>
            </span>
          </div>

          <!-- Nút submit -->
          <div class="flex justify-end space-x-2">
            <UButton color="neutral" :disabled="isSubmitting" @click="resetForm">
              Hủy
            </UButton>
            <UButton
              v-if="isEditable"
              type="submit"
              color="primary"
              :disabled="!formState.agreed || isSubmitting"
              :loading="isSubmitting"
            >
              Cập nhật
            </UButton>
            <UButton
              v-else
              color="primary"
              :disabled="isSubmitting"
              @click="isRequestEditModalOpen = true"
            >
              Yêu cầu chỉnh sửa
            </UButton>
          </div>
        </UForm>
      </UCard>
    </div>

    <!-- Right Panel: Cover Image -->
    <div class="space-y-6">
      <UCard class="w-full space-y-4 py-4 px-6">
        <div class="text-lg text-center my-2 font-semibold text-gray-800 dark:text-white">
          Cập nhật ảnh bìa
        </div>
        <p class="text-sm mb-2 text-gray-500 dark:text-gray-400">
          <span class="italic">Lưu ý:</span> file ảnh không nặng quá <strong>2MB</strong>. Đừng lo lắng nếu không tìm được ảnh bìa ưng ý, chúng tôi sẽ hỗ trợ làm giúp bạn ảnh bìa đẹp khi truyện được xuất bản.
        </p>
        <div>
          <label
            for="cover-upload"
            class="block w-full text-sm text-gray-500 dark:text-gray-400 border border-dashed border-gray-300 dark:border-gray-600 rounded px-4 py-2 cursor-pointer text-center hover:bg-gray-50 dark:hover:bg-gray-800"
            :class="{ 'pointer-events-none opacity-50': !isEditable }"
          >
            Chọn ảnh bìa từ máy
          </label>
          <input
            id="cover-upload"
            ref="fileRef"
            type="file"
            class="hidden"
            accept="image/*"
            :disabled="!isEditable"
            @change="onFileChange"
          >
        </div>
        <div class="pt-4 w-full flex items-center">
          <img
            :src="formState?.coverImage || fallbackImages[Math.floor(Math.random() * fallbackImages.length)]"
            alt="Ảnh bìa"
            class="w-48 h-auto m-auto object-cover rounded shadow"
            @error="handleImgError"
          >
        </div>
        <span v-if="errors.coverImage" class="text-sm text-red-500">{{ errors.coverImage }}</span>
      </UCard>
    </div>
  </div>

  <!-- Request Edit Modal -->
  <UModal
    v-model:open="isRequestEditModalOpen"
    title="Yêu cầu chỉnh sửa"
    description="Gửi yêu cầu chỉnh sửa truyện đến quản trị viên."
  >
    <template #body>
      <UForm
        :state="requestEditForm"
        class="space-y-4"
        @submit.prevent="submitRequestEdit"
      >
        <div name="message" class="w-full">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Lý do yêu cầu</label>
          <UTextarea
            v-model="requestEditForm.message"
            placeholder="Vui lòng nhập lý do bạn muốn chỉnh sửa truyện..."
            class="w-full"
            :rows="4"
            :error="requestEditForm.errors.message"
          />
          <span v-if="requestEditForm.errors.message" class="text-sm text-red-500">{{ requestEditForm.errors.message }}</span>
        </div>
        <div class="flex justify-end space-x-2">
          <UButton color="neutral" @click="isRequestEditModalOpen = false">
            Hủy
          </UButton>
          <UButton
            type="submit"
            color="primary"
            :disabled="isSubmittingRequest"
            :loading="isSubmittingRequest"
          >
            Gửi yêu cầu
          </UButton>
        </div>
      </UForm>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import type { AvatarProps } from '@nuxt/ui'
import type { Novel, NovelAttribute } from '~/types/novel'
import { useNovels } from '~/composables/useNovels'
import coverImg1 from '~/assets/novel/coverImg_1.png'
import coverImg2 from '~/assets/novel/coverImg_2.png'
import coverImg3 from '~/assets/novel/coverImg_3.png'
import coverImg4 from '~/assets/novel/coverImg_4.png'

const props = defineProps<{
  novelId: string
}>()
const emit = defineEmits<{
  (e: 'edit', data: Novel): void
}>()

const toast = useToast()
const { fetchNovelById, updateNovel, requestEdit } = useNovels()
const runtimeConfig = useRuntimeConfig()

// Form state
interface SelectItem {
  label: string
  value: string
  type: string
}

const formState = reactive<{
  _id: string
  title: string
  author: string
  description: string
  status: 'ongoing' | 'completed' | 'hiatus'
  statusPublish: 'draft' | 'pending' | 'editing' | 'warning' | 'approved' | 'rejected'
  audience: SelectItem | undefined
  genre: SelectItem | undefined
  subGenre: SelectItem | undefined
  characterTrait: SelectItem | undefined
  worldBuilding: SelectItem | undefined
  coverImage: AvatarProps | undefined
  agreed: boolean
  tags: string[]
}>({
  _id: '',
  title: '',
  author: '',
  description: '',
  status: 'ongoing',
  statusPublish: 'draft',
  audience: undefined,
  genre: undefined,
  subGenre: undefined,
  characterTrait: undefined,
  worldBuilding: undefined,
  coverImage: undefined,
  agreed: false,
  tags: []
})

const errors = ref<Record<string, string>>({})
const isSubmitting = ref(false)
const fileRef = ref<HTMLInputElement>()
const isRequestEditModalOpen = ref(false)
const isSubmittingRequest = ref(false)

// Request edit form
const requestEditForm = reactive<{
  message: string
  errors: Record<string, string>
}>({
  message: '',
  errors: {}
})

// Computed: Check if novel is editable
const isEditable = computed(() => {
  // console.log('Current statusPublish:', formState.statusPublish) // Debug log
  return ['draft', 'editing'].includes(formState.statusPublish)
})

// Status options
const statusItems = ref([
  { value: 'ongoing', label: 'Còn tiếp' },
  { value: 'completed', label: 'Hoàn thành' },
  { value: 'hiatus', label: 'Tạm ngưng' }
])

// Fallback images
const fallbackImages = [coverImg1, coverImg2, coverImg3, coverImg4]

// Attribute options
const audienceItems = ref<SelectItem[]>([])
const genreItems = ref<SelectItem[]>([])
const subGenreItems = ref<SelectItem[]>([])
const characterItems = ref<SelectItem[]>([])
const worldItems = ref<SelectItem[]>([])

// Fetch attributes
async function fetchAttributes(type: string): Promise<SelectItem[]> {
  interface AttributeResponse {
    success: boolean
    data: { name: string, _id: string }[]
  }
  try {
    const response = await $fetch<AttributeResponse>(`${runtimeConfig.public.apiBaseUrl}/api/v1/attribute/${type}`, {
      credentials: 'include',
      timeout: 5000
    })
    if (response.success) {
      return response.data.map(attr => ({
        label: attr.name,
        value: attr._id,
        type
      }))
    }
    return []
  } catch (error) {
    console.error(`Error fetching ${type} attributes:`, error)
    toast.add({
      title: 'Lỗi',
      description: `Không thể tải danh sách ${type}.`,
      color: 'error'
    })
    return []
  }
}

const findAttribute = (type: string, attrId: string) =>
  (
    {
      audience: audienceItems.value,
      genre: genreItems.value,
      subgenre: subGenreItems.value,
      character: characterItems.value,
      world: worldItems.value
    }[type] || []
  ).find(item => item.value === attrId)

const getAttributeValue = (attributes: NovelAttribute[], type: string) => {
  const attr = attributes?.find(a => a.type === type)
  return attr ? findAttribute(type, attr._id) : null
}

// Update form state with novel data
function updateFormState(novel: Novel) {
  // console.log('Updating formState with novel:', novel)
  Object.assign(formState, {
    _id: novel._id,
    title: novel.title,
    author: novel.author,
    description: novel.description,
    status: novel.status,
    statusPublish: novel.statusPublish || 'draft',
    audience: getAttributeValue(novel.attributes || [], 'audience'),
    genre: getAttributeValue(novel.attributes || [], 'genre'),
    subGenre: getAttributeValue(novel.attributes || [], 'subgenre'),
    characterTrait: getAttributeValue(novel.attributes || [], 'character'),
    worldBuilding: getAttributeValue(novel.attributes || [], 'world'),
    coverImage: novel.coverImage || null,
    agreed: false,
    tags: novel.tags || []
  })
  // console.log('Updated formState:', formState)
}

// Load attributes and novel data
onMounted(async () => {
  // Fetch attributes first
  const [audience, genre, subGenre, character, world] = await Promise.all([
    fetchAttributes('audience'),
    fetchAttributes('genre'),
    fetchAttributes('subgenre'),
    fetchAttributes('character'),
    fetchAttributes('world')
  ])
  audienceItems.value = audience
  genreItems.value = genre
  subGenreItems.value = subGenre
  characterItems.value = character
  worldItems.value = world

  // Load novel data if attributes are available
  if (props.novelId && audience.length && genre.length && subGenre.length && character.length && world.length) {
    const { data: novelData, error: fetchError } = await fetchNovelById(props.novelId)
    watch(
      () => [novelData.value, fetchError.value],
      ([novel, error]) => {
        if (error) {
          toast.add({
            title: 'Lỗi',
            description: `Không thể tải dữ liệu truyện: ${error}`,
            color: 'error'
          })
          return
        }
        if (novel && typeof novel === 'object') {
          updateFormState(novel as Novel)
        }
      },
      { immediate: true }
    )
  }
})

// Handle file change for cover image
async function onFileChange(e: Event) {
  if (!isEditable.value) return
  const input = e.target as HTMLInputElement
  if (!input.files?.length) return

  const file = input.files[0]
  if (!file) return
  if (file.size > 2 * 1024 * 1024) {
    errors.value.coverImage = 'Ảnh bìa không được vượt quá 2MB.'
    toast.add({
      title: 'Lỗi',
      description: 'Ảnh bìa không được vượt quá 2MB.',
      color: 'error'
    })
    return
  }
  formState.coverImage = { src: URL.createObjectURL(file) }
}

// Handle image error
function handleImgError(event: Event) {
  const target = event.target as HTMLImageElement
  const randomIndex = Math.floor(Math.random() * fallbackImages.length)
  target.src = fallbackImages[randomIndex] || ''
}

// Validate form
function validateForm(): boolean {
  errors.value = {}
  if (!formState.title || formState.title.length < 3 || formState.title.length > 200) {
    errors.value.title = 'Tiêu đề phải từ 3 đến 200 ký tự.'
  }
  if (!formState.author || formState.author.length < 2 || formState.author.length > 100) {
    errors.value.author = 'Tên tác giả phải từ 2 đến 100 ký tự.'
  }
  if (!formState.description || formState.description.length < 10 || formState.description.length > 2000) {
    errors.value.description = 'Mô tả phải từ 10 đến 2000 ký tự.'
  }
  if (!formState.status) {
    errors.value.status = 'Vui lòng chọn tình trạng.'
  }
  if (!formState.audience) {
    errors.value.audience = 'Vui lòng chọn giới tính độc giả.'
  }
  if (!formState.genre) {
    errors.value.genre = 'Vui lòng chọn thể loại.'
  }
  if (!formState.subGenre) {
    errors.value.subGenre = 'Vui lòng chọn lưu phái.'
  }
  if (!formState.characterTrait) {
    errors.value.characterTrait = 'Vui lòng chọn tính cách nhân vật chính.'
  }
  if (!formState.worldBuilding) {
    errors.value.worldBuilding = 'Vui lòng chọn bối cảnh thế giới.'
  }
  return Object.keys(errors.value).length === 0
}

// Validate request edit form
function validateRequestEditForm(): boolean {
  requestEditForm.errors = {}
  if (!requestEditForm.message || requestEditForm.message.length < 10 || requestEditForm.message.length > 500) {
    requestEditForm.errors.message = 'Lý do phải từ 10 đến 500 ký tự.'
  }
  return Object.keys(requestEditForm.errors).length === 0
}

// Reset form
function resetForm() {
  Object.assign(formState, {
    _id: '',
    title: '',
    author: '',
    description: '',
    status: 'ongoing',
    statusPublish: 'draft',
    audience: null,
    genre: null,
    subGenre: null,
    characterTrait: null,
    worldBuilding: null,
    coverImage: null,
    agreed: false,
    tags: []
  })
  errors.value = {}
  if (fileRef.value) fileRef.value.value = ''
}

// Update novel
async function submitUpdateNovel() {
  if (!formState.agreed) {
    toast.add({
      title: 'Lỗi',
      description: 'Vui lòng đồng ý với điều khoản dịch vụ.',
      color: 'error'
    })
    return
  }
  if (!validateForm()) {
    toast.add({
      title: 'Lỗi',
      description: 'Vui lòng kiểm tra các trường dữ liệu.',
      color: 'error'
    })
    return
  }
  if (!props.novelId) {
    toast.add({
      title: 'Lỗi',
      description: 'ID truyện không hợp lệ.',
      color: 'error'
    })
    return
  }
  isSubmitting.value = true
  const attributes = [
    formState.audience?.value,
    formState.genre?.value,
    formState.subGenre?.value,
    formState.characterTrait?.value,
    formState.worldBuilding?.value
  ].filter(Boolean)

  const novelData: Partial<Novel> = {
    title: formState.title,
    author: formState.author,
    description: formState.description,
    status: formState.status,
    attributes: attributes.map(id => ({
      _id: id
    })) as NovelAttribute[],
    tags: formState.tags
  }
  try {
    // console.log('Updating novel with data:', novelData)
    await updateNovel(props.novelId, novelData)

    // Fetch updated novel data
    const { data: updatedNovel, error: fetchError } = await fetchNovelById(props.novelId)
    if (fetchError) {
      console.log('Error fetching updated novel:', fetchError)
    }

    if (updatedNovel.value) {
      // Update form state with fresh data
      updateFormState(updatedNovel.value)
      emit('edit', updatedNovel.value)
    }
    toast.add({
      title: 'Thành công',
      description: 'Truyện đã được cập nhật.',
      color: 'success'
    })
    // console.log('Status Publish:', formState.statusPublish, 'Check edit status: ', isEditable.value)
  } catch (err: unknown) {
    const errorMessage
      = err instanceof Error
        ? err.message.includes('CORS')
          ? 'Lỗi CORS: Không thể cập nhật truyện.'
          : err.message
        : 'Không thể cập nhật truyện.'
    toast.add({
      title: 'Lỗi',
      description: errorMessage,
      color: 'error'
    })
    console.error('Update novel error:', err)
  } finally {
    isSubmitting.value = false
  }
}

// Submit request edit
async function submitRequestEdit() {
  if (!validateRequestEditForm()) {
    toast.add({
      title: 'Lỗi',
      description: 'Vui lòng kiểm tra lý do yêu cầu.',
      color: 'error'
    })
    return
  }
  if (!props.novelId) {
    toast.add({
      title: 'Lỗi',
      description: 'ID truyện không hợp lệ.',
      color: 'error'
    })
    return
  }

  isSubmittingRequest.value = true
  try {
    await requestEdit(props.novelId, requestEditForm.message)
    toast.add({
      title: 'Thành công',
      description: 'Yêu cầu chỉnh sửa đã được gửi.',
      color: 'success'
    })
    isRequestEditModalOpen.value = false
    requestEditForm.message = ''
    requestEditForm.errors = {}
  } catch (error: unknown) {
    const errorMessage
      = error instanceof Error
        ? error.message.includes('CORS')
          ? 'Lỗi CORS: Không thể gửi yêu cầu.'
          : error.message || 'Không thể gửi yêu cầu chỉnh sửa.'
        : 'Không thể gửi yêu cầu chỉnh sửa.'
    toast.add({
      title: 'Lỗi',
      description: errorMessage,
      color: 'error'
    })
    console.error('Request edit error:', error)
  } finally {
    isSubmittingRequest.value = false
  }
}
</script>
