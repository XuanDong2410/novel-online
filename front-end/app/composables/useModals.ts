// composables/useModalActionHandler.ts
import { ref } from 'vue'
import type { StatusAction } from './useStatus'
import { useToast } from '#imports'

export function useModalActionHandler() {
  const activeAction = ref<StatusAction | null>(null)
  const isModalOpen = ref(false)
  const toast = useToast()

  function openActionModal(action: StatusAction) {
    activeAction.value = action
    isModalOpen.value = true
  }

  async function handleSubmitAction(chapterId: string) {
    if (!activeAction.value) return

    try {
      switch (activeAction.value.key) {
        case 'requestEdit':
          await $fetch(`/api/v1/user/chapters/${chapterId}/request-edit`, { method: 'POST' })
          toast.add({ title: 'Yêu cầu thành công', color: 'success' })
          break
        case 'appeal':
          await $fetch(`/api/v1/user/chapters/${chapterId}/appeal`, { method: 'POST' })
          toast.add({ title: 'Đã gửi kháng cáo', color: 'success' })
          break
        case 'resubmit':
          await $fetch(`/api/v1/chapters/${chapterId}/resubmit`, { method: 'POST' })
          toast.add({ title: 'Gửi lại thành công', color: 'success' })
          break
        default:
          toast.add({ title: 'Hành động không hỗ trợ', color: 'warning' })
      }
    } catch (err) {
      toast.add({ title: 'Lỗi', description: (err as Error).message, color: 'error' })
    } finally {
      isModalOpen.value = false
    }
  }

  return {
    activeAction,
    isModalOpen,
    openActionModal,
    handleSubmitAction
  }
}
