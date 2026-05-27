export type AgeId = 'a02' | 'a24' | 'a47' | 'a710' | 'a1013'

export interface AgeCategory {
  id: AgeId
  label: string
  range: string
  emoji: string
  color: string
  blurb: string
  values: string[]
}

export interface StoryPage {
  type: 'chapter' | 'end'
  heading?: string
  body?: string[]
  moral?: string
  art?: string
}

export interface Story {
  id: string
  title: string
  age_id: AgeId
  theme: string
  emoji: string
  cover_a: string
  cover_b: string
  minutes: number
  pages: StoryPage[]
  author?: string
  generated_by?: 'openai' | 'grok' | 'manual'
  status: 'draft' | 'published'
  published_at: string
  created_at: string
}

export interface Topic {
  id: string
  age_id: AgeId
  theme: string
  keywords?: string
  moral_lesson?: string
  used: boolean
  priority: number
  created_at: string
}

export interface Subscriber {
  id: string
  email: string
  age_preference?: AgeId | 'all'
  active: boolean
  unsubscribe_token: string
  subscribed_at: string
}

export interface DailySend {
  id: string
  story_id: string
  sent_at: string
  recipient_count: number
}
