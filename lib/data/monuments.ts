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
  cardImage?: string   // optional image shown after the last talking-point card (URL or /public path)
}

export interface Hotspot {
  id: string
  label: string
  metaphor: string
  chapter: string
  x: number
  y: number
  displayOrder: number
  lx?: number          // label position x as % of image (for arrow display)
  ly?: number          // label position y as % of image (for arrow display)
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
  image: string            // portrait/subject image path used across all monument views
  portraitFit?: 'cover' | 'contain'   // how the image fills the portrait container (default: cover)
  imagePosition?: string   // CSS object-position override e.g. 'center 15%' (default: 'top center')
  emblem?: string          // optional state/org emblem
  hotspots: Hotspot[]
  stories: Story[]
  questions: Question[]
}
