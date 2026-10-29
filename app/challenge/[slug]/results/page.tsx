'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, CheckCircle2, XCircle, Trophy, Share2, RotateCcw } from 'lucide-react'
import { getMonument } from '@/lib/data/index'
import type { Monument, Question } from '@/lib/data/index'
import {
  getActiveAttempt,
  clearActiveAttempt,
  getRankedLeaderboard,
  type QuizAttempt,
} from '@/lib/storage'
import { getClientSession } from '@/lib/session-client'
import { calculateScore } from '@/lib/quiz'
import ScorecardPreview from '@/components/ScorecardPreview'

export default function ResultsPage({ params }: { params: { slug: string } }) {
  const router = useRouter()
  const [monument, setMonument] = useState<Monument | null>(null)
  const [attempt, setAttempt] = useState<QuizAttempt | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [results, setResults] = useState<Record<string, boolean>>({})
  const [rank, setRank] = useState<number | null>(null)
  const [displayName, setDisplayName] = useState('Explorer')
  const [ready, setReady] = useState(false)
  const [showScorecard, setShowScorecard] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const player = getClientSession()

    const m = getMonument(params.slug)
    if (!m) { router.replace('/monuments'); return }

    const a = getActiveAttempt(params.slug)
    if (!a || a.status !== 'completed') {
      router.replace(`/challenge/${params.slug}/instructions`)
      return
    }

    if (player) {
      setDisplayName(player.displayName)
      const leaderboard = getRankedLeaderboard(params.slug)
      const myEntry = leaderboard.find((e) => e.playerId === player.id)
      setRank(myEntry?.rank ?? null)
    }

    const qMap = Object.fromEntries(m.questions.map((q) => [q.id, q]))
    const qs = a.assignedQuestionIds.map((id) => qMap[id]).filter(Boolean)
    const { results: r } = calculateScore(qs, a.answers)

    setMonument(m)
    setAttempt(a)
    setQuestions(qs)
    setResults(r)
    setReady(true)
  }, [params.slug, router])

  function handleReplay() {
    if (!monument) return
    clearActiveAttempt(monument.slug)
    router.push(`/challenge/${monument.slug}/quiz`)
  }

  async function handleShare() {
    const text = `I completed ${monument?.name} on Modexx.\n10 hotspots explored. ${attempt?.correctCount}/10 correct. ${attempt?.score}/1,000 points.\nCan you beat my score?\nmodexx.app/monuments/${monument?.slug}`
    if (navigator.share) {
      try { await navigator.share({ title: `My ${monument?.name} result`, text }) } catch {}
    } else {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    }
  }

  if (!ready || !monument || !attempt) {
    return <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}><p style={{ color: 'var(--muted)', fontSize: 14 }}>Loading results…</p></div>
  }

  const accentColor = monument.accent === 'green' ? '#168447' : '#46a9d8'
  const completionSeconds = attempt.submittedAt
    ? Math.round((new Date(attempt.submittedAt).getTime() - new Date(attempt.startedAt).getTime()) / 1000)
    : 0
  const mins = Math.floor(completionSeconds / 60)
  const secs = completionSeconds % 60

  return (
    <main className="results-page">
      <header className="site-header detail-header">
        <Link href={`/challenge/${monument.slug}/instructions`} className="text-link">
          <ArrowLeft size={16} /> Challenge
        </Link>
        <Link href="/" className="wordmark"><span>mod</span>exx<span className="wordmark-dot">.</span></Link>
        <Link href={`/leaderboard/${monument.slug}`} className="text-link" style={{ fontSize: 12 }}>
          Leaderboard <ArrowRight size={14} />
        </Link>
      </header>

      <div className="results-body">
        <div className="results-inner">
          <div className="results-hero" style={{ borderColor: accentColor }}>
            <p className="eyebrow" style={{ color: accentColor, justifyContent: 'center' }}>
              <span className="eyebrow-line" style={{ background: accentColor }} />
              {monument.name}
            </p>
            <p className="results-player">@{displayName}</p>
            <div className="results-score-display">
              <span className="results-score-number" style={{ color: accentColor }}>{attempt.score}</span>
              <span className="results-score-denom">/ 1,000</span>
            </div>
            <div className="results-meta-row">
              <span>{attempt.correctCount}/10 correct</span>
              <span>·</span>
              <span>{mins}m {secs}s</span>
              {rank && <><span>·</span><span>Rank #{rank}</span></>}
            </div>
          </div>

          <div className="results-actions">
            <button className="button button-primary" onClick={() => setShowScorecard(true)}>
              <Share2 size={16} /> Create scorecard
            </button>
            <button className="button" style={{ background: 'var(--soft)' }} onClick={handleShare}>
              {copied ? 'Copied!' : <><Share2 size={16} /> Share result</>}
            </button>
            <button className="button" style={{ background: 'var(--soft)' }} onClick={handleReplay}>
              <RotateCcw size={16} /> Replay
            </button>
            <Link href={`/leaderboard/${monument.slug}`} className="button" style={{ background: 'var(--soft)' }}>
              <Trophy size={16} /> Leaderboard
            </Link>
          </div>

          <div className="answer-review">
            <h2 className="answer-review-title">Answer review</h2>
            <div className="answer-list">
              {questions.map((q, i) => {
                const isCorrect = results[q.id]
                const selected = attempt.answers[q.id]
                return (
                  <div key={q.id} className={`answer-item${isCorrect ? ' answer-correct' : ' answer-wrong'}`} style={{ borderLeftColor: isCorrect ? accentColor : '#d92e35' }}>
                    <div className="answer-item-header">
                      <span className="answer-q-number" style={{ color: isCorrect ? accentColor : '#d92e35' }}>Q{i + 1}</span>
                      {isCorrect
                        ? <CheckCircle2 size={18} style={{ color: accentColor }} aria-label="Correct" />
                        : <XCircle size={18} style={{ color: '#d92e35' }} aria-label="Incorrect" />}
                      <span className="answer-score">{isCorrect ? '+100 pts' : '0 pts'}</span>
                    </div>
                    <p className="answer-question">{q.questionText}</p>
                    <div className="answer-options-review">
                      {q.options.map((opt, optIdx) => {
                        const isSelected = selected === optIdx
                        const isCorrectOpt = q.correctIndex === optIdx
                        let cls = 'answer-opt'
                        if (isCorrectOpt) cls += ' answer-opt--correct'
                        if (isSelected && !isCorrectOpt) cls += ' answer-opt--wrong'
                        return (
                          <div key={optIdx} className={cls}>
                            <span className="answer-opt-letter">{String.fromCharCode(65 + optIdx)}</span>
                            <span>{opt}</span>
                            {isCorrectOpt && <span className="answer-opt-tag" style={{ color: accentColor }}>Correct</span>}
                            {isSelected && !isCorrectOpt && <span className="answer-opt-tag" style={{ color: '#d92e35' }}>Your answer</span>}
                          </div>
                        )
                      })}
                    </div>
                    <div className="answer-explanation"><strong>Explanation:</strong> {q.explanation}</div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="results-bottom-cta">
            <Link href={`/leaderboard/${monument.slug}`} className="button button-dark">
              <Trophy size={16} /> View leaderboard <ArrowRight size={16} />
            </Link>
            <button className="button" style={{ background: 'var(--soft)' }} onClick={handleReplay}>
              <RotateCcw size={16} /> Try again
            </button>
            <Link href="/monuments" className="text-link">
              Explore more monuments <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </div>

      {showScorecard && (
        <ScorecardPreview
          monument={monument}
          displayName={displayName}
          score={attempt.score}
          correctCount={attempt.correctCount}
          completionSeconds={completionSeconds}
          rank={rank}
          onClose={() => setShowScorecard(false)}
        />
      )}
    </main>
  )
}
