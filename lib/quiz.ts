import type { Question } from './data/index'

// Select N distinct questions without replacement from the question bank
export function selectQuestions(questions: Question[], count: number = 10): Question[] {
  const shuffled = [...questions].sort(() => Math.random() - 0.5)
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
