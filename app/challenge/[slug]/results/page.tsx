'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, CheckCircle2, XCircle, Trophy, Share2, RotateCcw } from 'lucide-react'
import { toast } from 'sonner'
import { getMonument } from '@/lib/data/index'
import type { Monument, Question } from '@/lib/data/index'
import { getActiveAttempt, clearActiveAttempt, getBestAttempt, getAttemptHistory, getCumulativeScore, getAttemptCount, type QuizAttempt } from '@/lib/storage'
import { getClientSession } from '@/lib/session-client'
import { calculateScore, MAX_ATTEMPTS, MAX_SCORE_PER_ATTEMPT } from '@/lib/quiz'
import ScorecardPreview, { renderScorecard, ELECTION_CONFIG, daysUntil } from '@/components/ScorecardPreview'
import SiteHeader from '@/components/SiteHeader'

export default function ResultsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = React.use(params)
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
  const [sharing, setSharing] = useState(false)
  const [previousBest, setPreviousBest] = useState<QuizAttempt | null>(null)
  const [isNewBest, setIsNewBest] = useState(false)
  const [attemptCount, setAttemptCount] = useState(0)
  const [cumulativeScore, setCumulativeScore] = useState(0)

  useEffect(() => {
    const player = getClientSession()
    const m = getMonument(slug)
    if (!m) { router.replace('/monuments'); return }

    const a = getActiveAttempt(slug)
    if (!a || a.status !== 'completed') {
      router.replace(`/challenge/${slug}/instructions`)
      return
    }

    if (player) {
      setDisplayName(player.displayName)
      // Fix: fetch leaderboard and find MY entry by player_id correctly
      fetch(`/api/leaderboard?slug=${slug}`)
        .then((r) => r.json())
        .then(({ entries }) => {
          if (!entries?.length || !player?.id) return
          // Find the entry that belongs to this player
          const myEntry = entries.find((e: { player_id: string }) => e.player_id === player.id)
          if (!myEntry) return
          // Rank = count of entries with a strictly higher score + 1
          const myScore = myEntry.score
          const rank = entries.filter((e: { score: number }) => e.score > myScore).length + 1
          setRank(rank)
        })
        .catch(() => {})
    }

    const qMap = Object.fromEntries(m.questions.map((q) => [q.id, q]))
    const qs = a.assignedQuestionIds.map((id) => qMap[id]).filter(Boolean)
    const { results: r } = calculateScore(qs, a.answers)

    // Persona D: compute personal best from history (excluding current attempt)
    const history = getAttemptHistory(slug).filter(
      (h) => h.status === 'completed' && h.id !== a.id
    )
    const best = history.length > 0
      ? history.reduce((b, h) => {
          if (h.score > b.score) return h
          if (h.score === b.score && h.correctCount > b.correctCount) return h
          return b
        })
      : null
    setPreviousBest(best)
    setIsNewBest(!best || a.score > best.score || (a.score === best.score && a.correctCount > best.correctCount))
    setAttemptCount(history.length + 1) // total including this one
    setCumulativeScore(getCumulativeScore(slug))

    setMonument(m)
    setAttempt(a)
    setQuestions(qs)
    setResults(r)
    setReady(true)
  }, [slug, router])

  function handleReplay() {
    if (!monument) return
    if (getAttemptCount(monument.slug) >= MAX_ATTEMPTS) {
      toast.error('You have used all 10 attempts for this challenge.')
      return
    }
    clearActiveAttempt(monument.slug)
    router.push(`/challenge/${monument.slug}/quiz`)
  }

  async function handleShare() {
    if (!monument || !attempt) return
    setSharing(true)
    try {
      const accentColor  = monument.accent === 'green' ? '#168447' : '#46a9d8'
      const electionCfg  = ELECTION_CONFIG[monument.slug as keyof typeof ELECTION_CONFIG]
                        ?? ELECTION_CONFIG.tinubu
      const completionSecs = attempt.submittedAt
        ? Math.round((new Date(attempt.submittedAt).getTime() - new Date(attempt.startedAt).getTime()) / 1000)
        : 0
      const countdown = daysUntil(electionCfg.electionDate)

      const blob = await renderScorecard({
        monument,
        displayName,
        score: attempt.score,
        correctCount: attempt.correctCount,
        completionSeconds: completionSecs,
        rank,
        accentColor,
        electionCfg,
        countdown,
        cumulativeScore,
        attemptNumber: attemptCount,
      })

      const shareText = [
        `🏛 ${monument.name}`,
        ``,
        `I scored ${attempt.score}/100 pts this attempt · ${cumulativeScore}/1,000 total — ${attempt.correctCount}/10 correct${rank ? ` · Ranked #${rank}` : ''}.`,
        ``,
        `🗳 ${electionCfg.cta} — ${countdown}`,
        ``,
        `Can you beat my score?`,
        `${window.location.origin}/monuments/${monument.slug}`,
      ].join('\n')

      const file = new File([blob], 'modexx-scorecard.png', { type: 'image/png' })

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ title: `My ${monument.name} result`, text: shareText, files: [file] })
      } else if (navigator.share) {
        await navigator.share({ title: `My ${monument.name} result`, text: shareText })
      } else {
        await navigator.clipboard.writeText(shareText)
        setCopied(true)
        toast.success('Copied to clipboard!')
        setTimeout(() => setCopied(false), 2500)
      }
    } catch (e) {
      if ((e as Error).name !== 'AbortError') {
        toast.error('Could not share. Try downloading the scorecard instead.')
      }
    } finally {
      setSharing(false)
    }
  }

  if (!ready || !monument || !attempt) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
        <span className="spinner spinner--lg" aria-label="Loading results…" />
      </div>
    )
  }

  const accentColor = monument.accent === 'green' ? '#168447' : '#46a9d8'
  const completionSeconds = attempt.submittedAt
    ? Math.round((new Date(attempt.submittedAt).getTime() - new Date(attempt.startedAt).getTime()) / 1000)
    : 0
  const mins = Math.floor(completionSeconds / 60)
  const secs = completionSeconds % 60

  return (
    <main className="results-page">
      <SiteHeader
        className="detail-header"
        left={<Link href={`/challenge/${monument.slug}/instructions`} className="text-link"><ArrowLeft size={16} /> Challenge</Link>}
        right={<Link href={`/leaderboard/${monument.slug}`} className="text-link" style={{ fontSize: 12 }}>Leaderboard <ArrowRight size={14} /></Link>}
      />

      <div className="results-body">
        <div className="results-inner">
          <div className="results-hero" style={{ borderColor: accentColor }}>
            <p className="eyebrow" style={{ color: accentColor, justifyContent: 'center' }}>
              <span className="eyebrow-line" style={{ background: accentColor }} />{monument.name}
            </p>
            <p className="results-player">@{displayName}</p>

            {/* Per-attempt score */}
            <div className="results-score-display">
              <span className="results-score-number" style={{ color: accentColor }}>{attempt.score}</span>
              <span className="results-score-denom">/ {MAX_SCORE_PER_ATTEMPT}</span>
            </div>
            <div className="results-meta-row">
              <span>{attempt.correctCount}/10 correct</span><span>·</span>
              <span>{mins}m {secs}s</span>
              {rank && <><span>·</span><span>Rank #{rank}</span></>}
            </div>

            {/* Cumulative score progress bar */}
            <div style={{ marginTop: 16, padding: '12px 16px', borderRadius: 10, background: accentColor + '12', border: `1px solid ${accentColor}30` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: accentColor }}>Cumulative total</span>
                <span style={{ fontSize: 13, color: 'var(--muted)' }}>Attempt {attemptCount} of {MAX_ATTEMPTS}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 8 }}>
                <span style={{ fontSize: 28, fontWeight: 700, color: accentColor }}>{cumulativeScore}</span>
                <span style={{ fontSize: 14, color: 'var(--muted)' }}>/ 1,000 pts</span>
              </div>
              <div style={{ height: 6, borderRadius: 3, background: 'var(--line)' }}>
                <div style={{ height: '100%', borderRadius: 3, background: accentColor, width: `${(cumulativeScore / 1000) * 100}%`, transition: 'width 0.5s ease' }} />
              </div>
              {attemptCount < MAX_ATTEMPTS && (
                <p style={{ margin: '6px 0 0', fontSize: 12, color: 'var(--muted)' }}>{MAX_ATTEMPTS - attemptCount} retake{MAX_ATTEMPTS - attemptCount !== 1 ? 's' : ''} remaining · +{MAX_SCORE_PER_ATTEMPT} pts possible per retake</p>
              )}
              {attemptCount >= MAX_ATTEMPTS && (
                <p style={{ margin: '6px 0 0', fontSize: 12, color: 'var(--muted)' }}>Maximum attempts reached</p>
              )}
            </div>

            {/* Persona D: personal best comparison */}
            {attemptCount > 1 && (
              <div className="results-personal-best" style={{ marginTop: 12, padding: '8px 14px', borderRadius: 8, background: isNewBest ? accentColor + '18' : 'var(--soft)', border: `1px solid ${isNewBest ? accentColor : 'var(--line)'}`, display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                {isNewBest ? (
                  <>
                    <Trophy size={15} style={{ color: accentColor, flexShrink: 0 }} />
                    <span style={{ color: accentColor, fontWeight: 600 }}>New best this attempt!</span>
                    {previousBest && <span style={{ color: 'var(--muted)' }}>Previous best: {previousBest.score}/100 pts</span>}
                  </>
                ) : (
                  <>
                    <Trophy size={15} style={{ color: 'var(--muted)', flexShrink: 0 }} />
                    <span style={{ color: 'var(--muted)' }}>Attempt {attemptCount} · Best single attempt: {previousBest?.score ?? attempt.score}/100 pts</span>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="results-actions">
            <button className="button button-primary" onClick={() => setShowScorecard(true)}><Share2 size={16} /> Create scorecard</button>
            <button className="button" style={{ background: 'var(--soft)' }} onClick={handleShare} disabled={sharing}>
              {sharing ? <><span className="spinner spinner--sm" aria-hidden /> Sharing…</> : copied ? 'Copied!' : <><Share2 size={16} /> Share result</>}
            </button>
            {attemptCount < MAX_ATTEMPTS && (
              <button className="button" style={{ background: 'var(--soft)' }} onClick={handleReplay}><RotateCcw size={16} /> Retake ({MAX_ATTEMPTS - attemptCount} left)</button>
            )}
            <Link href={`/leaderboard/${monument.slug}`} className="button" style={{ background: 'var(--soft)' }}><Trophy size={16} /> Leaderboard</Link>
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
                      {isCorrect ? <CheckCircle2 size={18} style={{ color: accentColor }} /> : <XCircle size={18} style={{ color: '#d92e35' }} />}
                      <span className="answer-score">{isCorrect ? '+10 pts' : '0 pts'}</span>
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
            <Link href={`/leaderboard/${monument.slug}`} className="button button-dark"><Trophy size={16} /> View leaderboard <ArrowRight size={16} /></Link>
            {attemptCount < MAX_ATTEMPTS && (
              <button className="button" style={{ background: 'var(--soft)' }} onClick={handleReplay}><RotateCcw size={16} /> Try again ({MAX_ATTEMPTS - attemptCount} left)</button>
            )}
            <Link href="/monuments" className="text-link">Explore more monuments <ArrowRight size={15} /></Link>
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
          cumulativeScore={cumulativeScore}
          attemptNumber={attemptCount}
          onClose={() => setShowScorecard(false)} />
      )}
    </main>
  )
}
