import type { Question } from './data/index'

// Select N distinct questions without replacement from the question bank
// Enhanced randomization: shuffle using timestamp + random for better uniqueness
export function selectQuestions(questions: Question[], count: number = 10): Question[] {
  const seed = Date.now() + Math.random() * 1000
  const shuffled = [...questions].sort(() => {
    const rand = Math.sin(seed * Math.random()) * 10000
    return rand - Math.floor(rand)
  })
  return shuffled.slice(0, Math.min(count, shuffled.length))
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
