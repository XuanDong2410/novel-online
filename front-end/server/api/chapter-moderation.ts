export const chapterModeration = [
  // 1. Vi phạm nặng (sexual + violence)
  {
    id: 1,
    novelId: 1,
    index: 1,
    title: 'Chapter 1: The Forbidden Encounter',
    novelTitle: 'Forbidden Desires',
    content: 'She closed the door behind them. What followed was a violent, unfiltered act of lust...',
    result: [{
      flagged: true,
      categories: {
        'sexual': true,
        'violence': true,
        'harassment': false,
        'hate': false,
        'self-harm': false,
        'sexual/minors': false,
        'violence/graphic': true,
        'harassment/threatening': false,
        'hate/threatening': false,
        'illicit': false,
        'illicit/violent': false,
        'self-harm/intent': false,
        'self-harm/instructions': false
      },
      category_scores: {
        'sexual': 0.93,
        'violence': 0.81,
        'violence/graphic': 0.66,
        'sexual/minors': 0.02,
        'harassment': 0.01,
        'hate': 0.01,
        'self-harm': 0.0,
        'harassment/threatening': 0,
        'hate/threatening': 0,
        'illicit': 0,
        'illicit/violent': 0,
        'self-harm/intent': 0,
        'self-harm/instructions': 0
      },
      category_applied_input_types: textOnly()
    }],
    status: 'PENDING_REVIEW',
    createdAt: '2025-05-24T10:00:00Z',
    updatedAt: '2025-05-24T10:00:00Z',
    creator: 'user123'
  },

  // 2. Nhạy cảm nhẹ (sexual score thấp)
  {
    id: 2,
    novelId: 1,
    index: 2,
    title: 'Chapter 2: The Night Gets Closer',
    content: 'He held her hand, and their eyes locked in a moment filled with passion.',
    result: [{
      flagged: true,
      categories: {
        'sexual': true,
        'violence': false,
        'harassment': false,
        'hate': false,
        'self-harm': false,
        'sexual/minors': false,
        'violence/graphic': false,
        'harassment/threatening': false,
        'hate/threatening': false,
        'illicit': false,
        'illicit/violent': false,
        'self-harm/intent': false,
        'self-harm/instructions': false
      },
      category_scores: {
        'sexual': 0.31,
        'violence': 0.02,
        'harassment': 0.01,
        'hate': 0.01,
        'self-harm': 0.01,
        'sexual/minors': 0.0,
        'violence/graphic': 0.0,
        'harassment/threatening': 0,
        'hate/threatening': 0,
        'illicit': 0,
        'illicit/violent': 0,
        'self-harm/intent': 0,
        'self-harm/instructions': 0
      },
      category_applied_input_types: textOnly()
    }],
    status: 'SAFE',
    createdAt: '2025-05-24T10:00:00Z',
    updatedAt: '2025-05-24T10:00:00Z',
    creator: 'user123'
  },

  // 3. Bị flag nhầm
  {
    id: 3,
    novelId: 2,
    index: 1,
    title: 'Chapter 1: The Red Apple',
    content: 'The red apple fell from the tree. It hit the ground with a thud.',
    result: [{
      flagged: true,
      categories: {
        'sexual': false,
        'violence': false,
        'harassment': false,
        'hate': false,
        'self-harm': false,
        'sexual/minors': false,
        'violence/graphic': false,
        'harassment/threatening': false,
        'hate/threatening': false,
        'illicit': false,
        'illicit/violent': false,
        'self-harm/intent': false,
        'self-harm/instructions': false
      },
      category_scores: {
        'sexual': 0.04,
        'violence': 0.03,
        'harassment': 0.01,
        'hate': 0.01,
        'self-harm': 0.01,
        'sexual/minors': 0.0,
        'violence/graphic': 0.0,
        'harassment/threatening': 0,
        'hate/threatening': 0,
        'illicit': 0,
        'illicit/violent': 0,
        'self-harm/intent': 0,
        'self-harm/instructions': 0
      },
      category_applied_input_types: textOnly()
    }],
    status: 'FLAGGED_SENSITIVE',
    createdAt: '2025-05-24T10:00:00Z',
    updatedAt: '2025-05-24T10:00:00Z',
    creator: 'user123'
  },

  // 4. Không vi phạm
  {
    id: 4,
    novelId: 2,
    index: 2,
    title: 'Chapter 2: A New Beginning',
    content: 'She started her new job with enthusiasm and hope for a better future.',
    result: [{
      flagged: false,
      categories: {
        'sexual': false,
        'violence': false,
        'harassment': false,
        'hate': false,
        'self-harm': false,
        'sexual/minors': false,
        'violence/graphic': false,
        'harassment/threatening': false,
        'hate/threatening': false,
        'illicit': false,
        'illicit/violent': false,
        'self-harm/intent': false,
        'self-harm/instructions': false
      },
      category_scores: {
        'sexual': 0.01,
        'violence': 0.01,
        'harassment': 0.0,
        'hate': 0.0,
        'self-harm': 0.0,
        'sexual/minors': 0.0,
        'violence/graphic': 0.0,
        'harassment/threatening': 0,
        'hate/threatening': 0,
        'illicit': 0,
        'illicit/violent': 0,
        'self-harm/intent': 0,
        'self-harm/instructions': 0
      },
      category_applied_input_types: textOnly()
    }],
    status: 'REPORTED_BY_USER',
    createdAt: '2025-05-24T10:00:00Z',
    updatedAt: '2025-05-24T10:00:00Z',
    creator: 'user123'
  },

  // 5. Tự hại
  {
    id: 5,
    novelId: 3,
    index: 1,
    title: 'Chapter 1: The Silent Struggle',
    content: 'He stared at the mirror, contemplating if life was still worth it.',
    result: [{
      flagged: true,
      categories: {
        'self-harm': true,
        'self-harm/intent': true,
        'sexual': false,
        'violence': false,
        'harassment': false,
        'hate': false,
        'sexual/minors': false,
        'violence/graphic': false,
        'harassment/threatening': false,
        'hate/threatening': false,
        'illicit': false,
        'illicit/violent': false,
        'self-harm/instructions': false
      },
      category_scores: {
        'self-harm': 0.52,
        'self-harm/intent': 0.49,
        'self-harm/instructions': 0.01,
        'sexual': 0.0,
        'violence': 0.0,
        'harassment': 0.0,
        'hate': 0.0,
        'sexual/minors': 0.0,
        'violence/graphic': 0.0,
        'harassment/threatening': 0,
        'hate/threatening': 0,
        'illicit': 0,
        'illicit/violent': 0
      },
      category_applied_input_types: textOnly()
    }],
    status: 'LOCKED_BY_SYSTEM',
    createdAt: '2025-05-24T10:00:00Z',
    updatedAt: '2025-05-24T10:00:00Z',
    creator: 'user123'
  },

  // 6. Vi phạm pháp luật
  {
    id: 6,
    novelId: 4,
    index: 1,
    title: 'Chapter 1: The Trade',
    content: 'They met in the alley and exchanged small bags for cash, no words spoken.',
    result: [{
      flagged: true,
      categories: {
        'illicit': true,
        'illicit/violent': true,
        'sexual': false,
        'violence': false,
        'harassment': false,
        'hate': false,
        'self-harm': false,
        'sexual/minors': false,
        'violence/graphic': false,
        'harassment/threatening': false,
        'hate/threatening': false,
        'self-harm/intent': false,
        'self-harm/instructions': false
      },
      category_scores: {
        'illicit': 0.84,
        'illicit/violent': 0.66,
        'sexual': 0.01,
        'violence': 0.02,
        'harassment': 0.0,
        'hate': 0.0,
        'self-harm': 0.0,
        'sexual/minors': 0.0,
        'violence/graphic': 0.0,
        'harassment/threatening': 0,
        'hate/threatening': 0,
        'self-harm/intent': 0,
        'self-harm/instructions': 0
      },
      category_applied_input_types: textOnly()
    }],
    status: 'REJECTED',
    createdAt: '2025-05-24T10:00:00Z',
    updatedAt: '2025-05-24T10:00:00Z',
    creator: 'user123'
  },

  // 7. Người dùng báo cáo
  {
    id: 7,
    novelId: 5,
    index: 3,
    title: 'Chapter 3: The Teacher’s Touch',
    content: 'Mr. K slowly walked over to the student and placed a hand on her shoulder...',
    result: [{
      flagged: false,
      categories: {
        'sexual': false,
        'violence': false,
        'harassment': false,
        'hate': false,
        'self-harm': false,
        'sexual/minors': false,
        'violence/graphic': false,
        'harassment/threatening': false,
        'hate/threatening': false,
        'illicit': false,
        'illicit/violent': false,
        'self-harm/intent': false,
        'self-harm/instructions': false
      },
      category_scores: {
        'sexual': 0.12,
        'sexual/minors': 0.15,
        'harassment': 0.02,
        'violence': 0.01,
        'self-harm': 0.0
      },
      category_applied_input_types: textOnly()
    }],
    status: 'REJEPENDING_REVIEW',
    createdAt: '2025-05-24T10:00:00Z',
    updatedAt: '2025-05-24T10:00:00Z',
    creator: 'user123'
  }
]

function textOnly() {
  return {
    text: ['text']
  }
}

export default eventHandler(async () => {
  return chapterModeration
})
