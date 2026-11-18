import type { Question } from './data/index'

// Max points per attempt (10 questions × 10 pts each = 100 per attempt)
// Up to 10 retakes × 100 pts/attempt = 1,000 cumulative max
export const POINTS_PER_QUESTION = 10
export const QUESTIONS_PER_ATTEMPT = 10
export const MAX_ATTEMPTS = 10
export const MAX_SCORE_PER_ATTEMPT = POINTS_PER_QUESTION * QUESTIONS_PER_ATTEMPT   // 100
export const MAX_CUMULATIVE_SCORE   = MAX_SCORE_PER_ATTEMPT * MAX_ATTEMPTS          // 1000

// Select N distinct questions without replacement using Fisher-Yates shuffle.
// Excludes questions in `usedIds` so retakes surface fresh questions.
// If the remaining pool is smaller than count, it wraps by pulling from usedIds too.
export function selectQuestions(
  questions: Question[],
  count: number = QUESTIONS_PER_ATTEMPT,
  usedIds: string[] = [],
): Question[] {
  const usedSet = new Set(usedIds)
  const fresh = questions.filter((q) => !usedSet.has(q.id))
  const fallback = questions.filter((q) => usedSet.has(q.id))

  // shuffle both pools independently, then fill from fresh first
  shuffle(fresh)
  shuffle(fallback)

  const pool = [...fresh, ...fallback]
  return pool.slice(0, Math.min(count, pool.length))
}

function shuffle<T>(arr: T[]): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
}

// Calculate score: POINTS_PER_QUESTION points per correct answer (10 pts × 10 qs = 100 max)
export function calculateScore(
  questions: Question[],
  answers: Record<string, number>
): { score: number; correctCount: number; results: Record<string, boolean> } {
  const results: Record<string, boolean> = {}
  let correctCount = 0

  for (const question of questions) {
    const selected = answers[question.id]
    const isCorrect = selected === question.correctIndex
    results[question.id] = isCorrect
    if (isCorrect) correctCount++
  }

  return {
    score: correctCount * POINTS_PER_QUESTION,
    correctCount,
    results,
  }
}
