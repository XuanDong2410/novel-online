export interface Rate {
  id: number
  rate: number
  comment: string
  user: string
  book: string
  createdAt: string
  updatedAt: string
}

export interface RateResponse {
  rate: number
  comment: string
  user: string
  book: string
  createdAt: string
  updatedAt: string
}

export interface RateRequest {
  rate: number
  comment: string
  user: string
  book: string
}
