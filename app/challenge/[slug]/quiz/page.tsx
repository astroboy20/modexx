'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { getMonument } from '@/lib/data/index'
import type { Monument, Question } from '@/lib/data/index'
import {
  getActiveAttempt,
  saveAttempt,
  addToHistory,
  generateId,
  type QuizAttempt,
} from '@/lib/storage'
import { getClientSession } from '@/lib/session-client'
import { selectQuestions, calculateScore } from '@/lib/quiz'
import SiteHeader from '@/components/SiteHeader'

export default function QuizPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = React.use(params)
  const router = useRouter()
  const [monument, setMonument] = useState<Monument | null>(null)
  const [attempt, setAttempt] = useState<QuizAttempt | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentIdx, setCurrentIdx] = useState(0)
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [selectedNow, setSelectedNow] = useState<number | null>(null)
  const [showConfirm, setShowConfirm] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const player = getClientSession()
    if (!player) { router.replace(`/signin?redirect=/challenge/${slug}/quiz`); return }

    const m = getMonument(slug)
    if (!m) { router.replace('/monuments'); return }

    const existing = getActiveAttempt(slug)
    if (existing?.status === 'completed') {
      router.replace(`/challenge/${slug}/results`)
      return
    }

    let currentAttempt = existing
    let qs: Question[]

    if (currentAttempt && currentAttempt.status === 'in_progress') {
      const qMap = Object.fromEntries(m.questions.map((q) => [q.id, q]))
      qs = currentAttempt.assignedQuestionIds.map((id) => qMap[id]).filter(Boolean)
      setAnswers(currentAttempt.answers)
    } else {
      qs = selectQuestions(m.questions, 10)
      currentAttempt = {
        id: generateId(),
        monumentSlug: slug,
        playerId: player.id,
        assignedQuestionIds: qs.map((q) => q.id),
        answers: {},
        startedAt: new Date().toISOString(),
        submittedAt: null,
        score: 0,
        correctCount: 0,
        status: 'in_progress',
      }
      saveAttempt(currentAttempt)
    }

    setMonument(m)
    setAttempt(currentAttempt)
    setQuestions(qs)
    setReady(true)
  }, [slug, router])

  function selectAnswer(qId: string, idx: number) {
    if (!attempt) return
    setSelectedNow(idx)
    const newAnswers = { ...answers, [qId]: idx }
    setAnswers(newAnswers)
    const updated = { ...attempt, answers: newAnswers }
    setAttempt(updated)
    saveAttempt(updated)
  }

  function handleNext() { setSelectedNow(null); setCurrentIdx((i) => i + 1) }
  function handlePrev() { setSelectedNow(null); setCurrentIdx((i) => i - 1) }

  function handleSubmit() {
    if (!attempt || !monument) return
    const unanswered = questions.filter((q) => answers[q.id] === undefined).length
    if (unanswered > 0) { setShowConfirm(true); return }
    finalSubmit()
  }

  function finalSubmit() {
    if (!attempt || !monument) return
    const player = getClientSession()
    if (!player) return

    const { score, correctCount } = calculateScore(questions, answers)
    const now = new Date()
    const completionSeconds = Math.round((now.getTime() - new Date(attempt.startedAt).getTime()) / 1000)

    const completed: QuizAttempt = {
      ...attempt,
      answers,
      submittedAt: now.toISOString(),
      score,
      correctCount,
      status: 'completed',
    }

    saveAttempt(completed)
    addToHistory(completed)

    fetch('/api/leaderboard', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ monumentSlug: monument.slug, score, correctCount, completionSeconds }),
    }).catch(() => {})

    router.push(`/challenge/${monument.slug}/results`)
  }

  if (!ready || !monument || !attempt || questions.length === 0) {
    return <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}><p style={{ color: 'var(--muted)', fontSize: 14 }}>Loading challenge…</p></div>
  }

  const accentColor = monument.accent === 'green' ? '#168447' : '#46a9d8'
  const question = questions[currentIdx]
  const savedAnswer = answers[question.id] ?? null
  const displayAnswer = selectedNow !== null ? selectedNow : savedAnswer
  const answeredCount = questions.filter((q) => answers[q.id] !== undefined).length
  const isLast = currentIdx === questions.length - 1

  return (
    <main className="quiz-page">
      {showConfirm && (
        <div className="confirm-overlay" role="dialog" aria-modal="true" aria-label="Submit confirmation">
          <div className="confirm-box">
            <AlertTriangle size={28} style={{ color: '#d92e35', marginBottom: 12 }} />
            <h3>Submit with unanswered questions?</h3>
            <p>You have {questions.filter((q) => answers[q.id] === undefined).length} unanswered question(s). Unanswered questions score 0 points.</p>
            <div className="confirm-actions">
              <button className="button button-dark" onClick={() => { setShowConfirm(false); finalSubmit() }}>Submit anyway</button>
              <button className="button" style={{ background: 'var(--soft)', color: 'var(--ink)' }} onClick={() => setShowConfirm(false)}>Go back</button>
            </div>
          </div>
        </div>
      )}

      <SiteHeader
        className="detail-header quiz-header"
        left={<span className="quiz-header-label" style={{ color: accentColor }}>{monument.name}</span>}
        right={<span className="quiz-header-progress">{answeredCount}/{questions.length} answered</span>}
      />

      <div className="quiz-body">
        <div className="quiz-progress-wrap">
          <div className="quiz-progress-bar">
            <div className="quiz-progress-fill" style={{ width: `${((currentIdx + 1) / questions.length) * 100}%`, background: accentColor }} />
          </div>
          <span className="quiz-progress-text">Question {currentIdx + 1} of {questions.length}</span>
        </div>

        <div className="question-card">
          <p className="question-number" style={{ color: accentColor }}>Question {currentIdx + 1}</p>
          <h2 className="question-text">{question.questionText}</h2>
          <div className="options-list" role="group" aria-label="Answer options">
            {question.options.map((option, optIdx) => {
              const isSelected = displayAnswer === optIdx
              return (
                <button
                  key={optIdx}
                  className={`option-btn${isSelected ? ' option-selected' : ''}`}
                  style={isSelected ? { borderColor: accentColor, background: monument.accent === 'green' ? '#eaf2ee' : '#e7f2f8' } : {}}
                  onClick={() => selectAnswer(question.id, optIdx)}
                  aria-pressed={isSelected}
                >
                  <span className="option-letter" style={isSelected ? { background: accentColor, color: '#fff' } : { borderColor: accentColor, color: accentColor }}>
                    {String.fromCharCode(65 + optIdx)}
                  </span>
                  <span className="option-text">{option}</span>
                  {isSelected && <CheckCircle2 size={16} style={{ color: accentColor, flexShrink: 0 }} aria-hidden="true" />}
                </button>
              )
            })}
          </div>
        </div>

        <div className="question-dots" aria-label="Question progress">
          {questions.map((q, i) => (
            <button
              key={q.id}
              className="question-dot"
              style={{
                background: i === currentIdx ? accentColor : answers[q.id] !== undefined ? accentColor + '55' : 'var(--line)',
                transform: i === currentIdx ? 'scale(1.3)' : 'none',
              }}
              onClick={() => { setSelectedNow(null); setCurrentIdx(i) }}
              aria-label={`Question ${i + 1}${answers[q.id] !== undefined ? ' (answered)' : ''}`}
              aria-current={i === currentIdx ? 'true' : undefined}
            />
          ))}
        </div>

        <div className="quiz-nav">
          <button className="button quiz-nav-prev" style={{ background: 'var(--soft)', color: 'var(--ink)' }} onClick={handlePrev} disabled={currentIdx === 0}>
            <ArrowLeft size={16} /> Previous
          </button>
          {isLast ? (
            <button
              className="button quiz-nav-submit"
              style={{ background: accentColor, color: '#fff' }}
              onClick={handleSubmit}
            >
              Submit challenge <ArrowRight size={16} />
            </button>
          ) : (
            <button
              className="button quiz-nav-next"
              style={{ background: accentColor, color: '#fff' }}
              onClick={handleNext}
            >
              Next question <ArrowRight size={16} />
            </button>
          )}
        </div>
      </div>
    </main>
  )
}
