// composables/useViolationManager.ts
import { ref, computed, watch, onMounted } from 'vue'
import { debounce } from 'lodash'
import type { SelectMenuItem as BaseSelectMenuItem, ChipProps } from '@nuxt/ui'

export interface SelectMenuItem extends BaseSelectMenuItem {
  value: string
  chip?: ChipProps
}

export interface HighlightedViolation {
  id: string
  index: number
  text: string
  type: string
  start: number
  end: number
  note?: string
  context?: string
}

export interface Chapter {
  index: number
  title: string
  content: string
}

export function useViolationManager(chapter: Chapter) {
  const toast = useToast()
  const showRightPanel = ref(true)
  const selectedSentenceIndex = ref<number | null>(null)
  const selectedViolationType = ref<SelectMenuItem | undefined>(undefined)
  const violationNote = ref('')
  const highlights = ref<HighlightedViolation[]>([])
  const undoStack = ref<HighlightedViolation[]>([])
  const redoStack = ref<HighlightedViolation[]>([])

  const violationTypes: SelectMenuItem[] = [
    { label: 'Ngôn từ không phù hợp', value: 'language', chip: { color: 'warning' } },
    { label: 'Nội dung nhạy cảm', value: 'sensitive', chip: { color: 'error' } },
    { label: 'Spam / nội dung rác', value: 'spam', chip: { color: 'info' } },
    { label: 'Khác', value: 'other', chip: { color: 'neutral' } }
  ]

  const sentences = computed(() => {
    return chapter.content
      .split(/(?<=[.!?])\s+|[\n\r]+/)
      .filter(s => s.trim().length > 0)
      .map((s, index) => ({
        id: `${chapter.index}-${index}-${s.slice(0, 10)}-${Date.now()}`,
        text: s.trim(),
        index,
        context: getContext(index)
      }))
  })

  const getContext = (index: number) => {
    const allSentences = chapter.content.split(/(?<=[.!?])\s+|[\n\r]+/).filter(s => s.trim().length > 0)
    const prev = index > 0 ? allSentences[index - 1]?.slice(0, 20) + '...' : ''
    const next = index < allSentences.length - 1 ? allSentences[index + 1]?.slice(0, 20) + '...' : ''
    return prev || next ? `${prev} ${next}`.trim() : 'Không có ngữ cảnh'
  }

  const sentenceClasses = computed(() => {
    const classes: Record<number, string> = {}
    highlights.value.forEach((v) => {
      const type = violationTypes.find(t => t.value === v.type)
      classes[v.index] = type?.chip?.color ? `bg-${type.chip.color}-200` : ''
    })
    return classes
  })

  const getSelectedRange = debounce(() => {
    const sel = window.getSelection()
    if (!sel || sel.isCollapsed) return

    const range = sel.getRangeAt(0)
    const text = sel.toString()
    const contentElement = document.querySelector('.whitespace-pre-line.break-words')
    if (!contentElement || !contentElement.contains(range.commonAncestorContainer)) {
      toast.add({ title: 'Vui lòng chọn văn bản trong nội dung chương.' })
      return
    }

    const index = chapter.content.indexOf(text)
    if (index === -1) {
      toast.add({ title: 'Văn bản được chọn không tìm thấy trong nội dung chương.' })
      return
    }

    const end = index + text.length
    const isDuplicate = highlights.value.some(h => h.start === index && h.end === end)
    if (isDuplicate) {
      toast.add({ title: 'Văn bản này đã được đánh dấu.' })
      return
    }

    const highlight: HighlightedViolation = {
      id: `${chapter.index}-${index}-${text.slice(0, 10)}-${Date.now()}`,
      index,
      text,
      type: selectedViolationType.value?.value || 'other',
      start: index,
      end,
      note: violationNote.value || undefined,
      context: getContext(index)
    }
    highlights.value.push(highlight)
    undoStack.value.push(highlight)
    redoStack.value = []
  }, 300)

  function removeHighlight(index: number) {
    const removed = highlights.value.splice(index, 1)[0]
    if (removed) {
      undoStack.value.push(removed)
      redoStack.value = []
    }
  }

  function undo() {
    const lastHighlight = highlights.value.pop()
    if (lastHighlight) {
      redoStack.value.push(lastHighlight)
    }
  }

  function redo() {
    const lastRedo = redoStack.value.pop()
    if (lastRedo) {
      highlights.value.push(lastRedo)
      undoStack.value.push(lastRedo)
    }
  }

  async function sendHighlightItem(hl: HighlightedViolation, index: number) {
    try {
      const response = await fetch('/api/highlights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(hl)
      })
      if (response.ok) {
        highlights.value.splice(index, 1)
        toast.add({ title: 'Đã gửi đánh dấu thành công!' })
      } else {
        throw new Error('Gửi đánh dấu thất bại')
      }
    } catch (error) {
      console.error('Lỗi khi gửi đánh dấu:', error)
      toast.add({ title: 'Gửi đánh dấu thất bại.' })
    }
  }

  async function sendAllHighlights() {
    try {
      const response = await fetch('/api/submit-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(highlights.value)
      })
      if (response.ok) {
        highlights.value = []
        toast.add({ title: 'Gửi xét duyệt thành công!' })
      } else {
        throw new Error('Gửi xét duyệt thất bại')
      }
    } catch (error) {
      console.error('Lỗi khi gửi xét duyệt:', error)
      toast.add({ title: 'Gửi xét duyệt thất bại.' })
    }
  }

  const assignViolation = () => {
    if (selectedSentenceIndex.value === null || !selectedViolationType.value) {
      toast.add({ title: 'Vui lòng chọn câu và loại vi phạm' })
      return { success: false, error: 'Vui lòng chọn câu và loại vi phạm' }
    }

    const index = selectedSentenceIndex.value
    const sentence = sentences.value[index]
    if (!sentence) {
      toast.add({ title: 'Không tìm thấy câu được chọn' })
      return { success: false, error: 'Không tìm thấy câu được chọn' }
    }

    const existing = highlights.value.find(v => v.id === sentence.id)
    if (existing) {
      existing.type = selectedViolationType.value.value
      existing.note = violationNote.value || undefined
    } else {
      highlights.value.push({
        id: sentence.id,
        index: sentence.index,
        text: sentence.text,
        type: selectedViolationType.value.value,
        start: sentence.text.indexOf(sentence.text),
        end: sentence.text.indexOf(sentence.text) + sentence.text.length,
        note: violationNote.value || undefined,
        context: sentence.context
      })
    }

    selectedSentenceIndex.value = null
    selectedViolationType.value = undefined
    violationNote.value = ''
    return { success: true }
  }

  const removeViolation = (index: number) => {
    const idx = highlights.value.findIndex(v => v.index === index)
    if (idx !== -1) highlights.value.splice(idx, 1)
  }

  const submitViolation = async () => {
    if (!highlights.value.length) {
      toast.add({ title: 'Không có vi phạm nào được gán' })
      return { success: false, error: 'Không có vi phạm nào được gán' }
    }

    const payload = {
      chapterId: chapter.index,
      violations: highlights.value,
      note: violationNote.value.trim() || undefined
    }

    try {
      console.log('Gửi báo cáo:', payload)
      return { success: true }
    } catch (error: unknown) {
      console.error('Lỗi khi gửi báo cáo:', error)
      const errorMessage = error instanceof Error ? error.message : 'Không xác định'
      toast.add({ title: `Lỗi khi gửi báo cáo: ${errorMessage}` })
      return { success: false, error: `Lỗi khi gửi báo cáo: ${errorMessage}` }
    }
  }

  watch(highlights, (newHighlights) => {
    localStorage.setItem('highlights', JSON.stringify(newHighlights))
  }, { deep: true })

  onMounted(() => {
    const saved = localStorage.getItem('highlights')
    if (saved) {
      highlights.value = JSON.parse(saved)
    }
  })

  function validateComment(hl: HighlightedViolation) {
    if (hl.note && hl.note.length > 500) {
      hl.note = hl.note.slice(0, 500)
      toast.add({ title: 'Ghi chú không được vượt quá 500 ký tự.' })
    }
  }

  function validateNote() {
    if (violationNote.value.length > 500) {
      violationNote.value = violationNote.value.slice(0, 500)
      toast.add({
        title: 'Ghi chú không được vượt quá 500 ký tự.'
      })
    }
  }

  return {
    showRightPanel,
    selectedSentenceIndex,
    selectedViolationType,
    violationNote,
    highlights,
    violationTypes,
    sentences,
    sentenceClasses,
    getSelectedRange,
    removeHighlight,
    undo,
    redo,
    sendHighlightItem,
    sendAllHighlights,
    assignViolation,
    removeViolation,
    submitViolation,
    validateComment,
    validateNote
  }
}
