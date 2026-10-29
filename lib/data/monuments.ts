export type Accent = 'green' | 'blue'

export interface Source {
  title: string
  publisher: string
  url: string
}

export interface Story {
  id: string
  hotspotId: string
  title: string
  headline: string
  body: string
  dateLabel: string
  sources: Source[]
  editorialNote?: string
}

export interface Hotspot {
  id: string
  label: string
  metaphor: string
  chapter: string
  x: number
  y: number
  displayOrder: number
}

export interface Question {
  id: string
  questionText: string
  options: string[]
  correctIndex: number
  explanation: string
  difficulty: 'easy' | 'medium' | 'hard'
}

export interface Monument {
  id: string
  slug: string
  name: string
  subject: string
  office: string
  scope: string
  accent: Accent
  intro: string
  hotspots: Hotspot[]
  stories: Story[]
  questions: Question[]
}
