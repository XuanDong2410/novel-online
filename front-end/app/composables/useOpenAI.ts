interface AutoModerationResult {
  id: string
  category: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  line: number
  start: number
  end: number
}

export function useModeration() {
  const toast = useToast()
  const runtimeConfig = useRuntimeConfig()

  const runAutoModeration = async (content: string, chapterId: string): Promise<AutoModerationResult[]> => {
    try {
      const response = await $fetch<{ results: AutoModerationResult[] }>(`${runtimeConfig.public.apiBaseUrl}/api/v1/moderation/chapters/${chapterId}`, {
        method: 'PATCH',
        credentials: 'include',
        body: { content }
      })
      toast.add({ title: 'Thành công', description: 'Đã chạy kiểm duyệt tự động', color: 'success' })
      return response.results
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Lỗi khi chạy kiểm duyệt tự động'
      toast.add({ title: 'Lỗi', description: errorMessage, color: 'error' })
      throw err
    }
  }

  return { runAutoModeration }
}
