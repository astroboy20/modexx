import type { Question } from './data/index'

// Select N distinct questions without replacement using Fisher-Yates shuffle.
// Each call produces an independent, uniformly random permutation — so two users
// starting at the same millisecond still get different question sets.
export function selectQuestions(questions: Question[], count: number = 10): Question[] {
  const pool = [...questions]
  // Fisher-Yates: iterate from the end, swap each element with a random earlier index
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[pool[i], pool[j]] = [pool[j], pool[i]]
  }
  return pool.slice(0, Math.min(count, pool.length))
}

// Calculate score: 100 points per correct answer
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
    score: correctCount * 100,
    correctCount,
    results,
  }
}
