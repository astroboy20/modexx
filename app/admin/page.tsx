'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { getClientSession } from '@/lib/session-client'

interface Entry {
  id: string
  display_name: string
  voters_card_number: string | null
  monument_slug: string | null
  score: number | null
  correct_count: number | null
  completion_seconds: number | null
  completed_at: string | null
  created_at?: string
}

type MonumentFilter = 'all' | 'tinubu' | 'sanwo-olu'
type SortKey = 'date' | 'score' | 'name'

function fmt(secs: number | null) {
  if (secs == null) return '—'
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return `${m}m ${s}s`
}

function fmtDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

const ACCENT = '#168447'

export default function AdminPage() {
  const router = useRouter()
  const [entries, setEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<MonumentFilter>('all')
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<SortKey>('date')
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)

  useEffect(() => {
    const player = getClientSession()
    if (!player || player.userRole !== 'organizer') {
      router.replace('/monuments')
      return
    }
    fetchData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/participants', { cache: 'no-store' })
      if (res.status === 403) { router.replace('/monuments'); return }
      if (!res.ok) throw new Error(`Server error (${res.status})`)
      const data = await res.json()
      setEntries(data.participants || [])
      setLastRefresh(new Date())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }, [router])

  const filtered = entries
    .filter(e => filter === 'all' || e.monument_slug === filter)
    .filter(e => {
      if (!search) return true
      const q = search.toLowerCase()
      return (
        e.display_name.toLowerCase().includes(q) ||
        (e.voters_card_number || '').toLowerCase().includes(q)
      )
    })
    .sort((a, b) => {
      if (sortBy === 'score') return (b.score ?? -1) - (a.score ?? -1)
      if (sortBy === 'name') return a.display_name.localeCompare(b.display_name)
      const da = new Date(b.completed_at || b.created_at || 0).getTime()
      const db = new Date(a.completed_at || a.created_at || 0).getTime()
      return da - db
    })

  function exportCSV() {
    const headers = ['Name', 'VIN', 'Monument', 'Score', 'Correct', 'Time', 'Submitted']
    const rows = filtered.map(e => [
      e.display_name,
      e.voters_card_number || '',
      e.monument_slug || 'Not submitted',
      e.score ?? '',
      e.correct_count != null ? `${e.correct_count}/10` : '',
      fmt(e.completion_seconds),
      fmtDate(e.completed_at),
    ])
    const csv = [headers, ...rows]
      .map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))
      .join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `modexx-participants-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  // Stats
  const submitted = entries.filter(e => e.score != null)
  const withVIN = entries.filter(e => e.voters_card_number)
  const avgScore = submitted.length
    ? Math.round(submitted.reduce((s, e) => s + (e.score ?? 0), 0) / submitted.length)
    : 0
  const tinubuCount = entries.filter(e => e.monument_slug === 'tinubu').length
  const sanwoCount = entries.filter(e => e.monument_slug === 'sanwo-olu').length

  const stats = [
    { label: 'Registered Participants', value: entries.length, color: ACCENT },
    { label: 'Submissions', value: submitted.length, color: '#46a9d8' },
    { label: 'With Voter Card', value: withVIN.length, color: '#f59e0b' },
    { label: 'Avg Score', value: submitted.length ? `${avgScore}/1000` : '—', color: '#8b5cf6' },
    { label: 'Tinubu', value: tinubuCount, color: ACCENT },
    { label: 'Sanwo-Olu', value: sanwoCount, color: '#46a9d8' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}>

      {/* Nav */}
      <div style={{
        background: '#fff', borderBottom: '1px solid #e2e8f0',
        padding: '0 24px', height: '56px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontWeight: 800, fontSize: '18px' }}>
            mod<span style={{ color: ACCENT }}>exx</span><span style={{ color: ACCENT }}>.</span>
          </span>
          <span style={{ color: '#94a3b8', fontSize: '13px', fontWeight: 500 }}>Admin Dashboard</span>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {lastRefresh && (
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>
              Updated {lastRefresh.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          <button
            onClick={() => router.push('/monuments')}
            style={{ fontSize: '13px', color: '#64748b', background: '#f1f5f9', border: 'none', borderRadius: '6px', padding: '6px 14px', cursor: 'pointer', fontWeight: 500 }}
          >
            ← Back to app
          </button>
        </div>
      </div>

      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px 16px' }}>

        {/* Stats grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '14px', marginBottom: '24px' }}>
          {stats.map(s => (
            <div key={s.label} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '18px 20px' }}>
              <p style={{ fontSize: '11px', fontWeight: 600, color: '#94a3b8', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '8px' }}>
                {s.label}
              </p>
              <p style={{ fontSize: '26px', fontWeight: 700, color: s.color, margin: 0 }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div style={{
          background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px',
          padding: '14px 16px', marginBottom: '12px',
          display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center',
        }}>
          <input
            type="text"
            placeholder="🔍  Search name or VIN…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ flex: '1 1 200px', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', outline: 'none' }}
          />
          <select value={filter} onChange={e => setFilter(e.target.value as MonumentFilter)}
            style={{ padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', cursor: 'pointer', background: '#fff' }}>
            <option value="all">All monuments</option>
            <option value="tinubu">Tinubu only</option>
            <option value="sanwo-olu">Sanwo-Olu only</option>
          </select>
          <select value={sortBy} onChange={e => setSortBy(e.target.value as SortKey)}
            style={{ padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', cursor: 'pointer', background: '#fff' }}>
            <option value="date">Latest first</option>
            <option value="score">Highest score</option>
            <option value="name">Name A–Z</option>
          </select>
          <button onClick={fetchData}
            style={{ padding: '8px 14px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', cursor: 'pointer', fontWeight: 500 }}>
            ↻ Refresh
          </button>
          <button onClick={exportCSV}
            style={{ padding: '8px 16px', background: ACCENT, color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', cursor: 'pointer', fontWeight: 600 }}>
            ↓ Export CSV
          </button>
        </div>

        {/* Table */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: '60px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>
              Loading participants…
            </div>
          ) : error ? (
            <div style={{ padding: '60px', textAlign: 'center', color: '#ef4444', fontSize: '14px' }}>{error}</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: '60px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>
              No participants found matching your filters.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    {[
                      { label: '#', w: '40px' },
                      { label: 'Display Name', w: 'auto' },
                      { label: 'Voter Card (VIN)', w: '210px' },
                      { label: 'Monument', w: '130px' },
                      { label: 'Score', w: '90px' },
                      { label: 'Correct', w: '80px' },
                      { label: 'Time', w: '80px' },
                      { label: 'Submitted', w: '170px' },
                    ].map(h => (
                      <th key={h.label} style={{
                        padding: '11px 16px', textAlign: 'left',
                        fontWeight: 600, color: '#64748b',
                        fontSize: '11px', textTransform: 'uppercase',
                        letterSpacing: '0.06em', whiteSpace: 'nowrap',
                        width: h.w,
                      }}>{h.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((e, i) => (
                    <tr key={e.id + i} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.1s' }}
                      onMouseEnter={ev => (ev.currentTarget.style.background = '#fafafa')}
                      onMouseLeave={ev => (ev.currentTarget.style.background = '')}
                    >
                      <td style={{ padding: '13px 16px', color: '#94a3b8', fontSize: '12px' }}>{i + 1}</td>
                      <td style={{ padding: '13px 16px', fontWeight: 600, color: '#111' }}>
                        @{e.display_name}
                      </td>
                      <td style={{ padding: '13px 16px' }}>
                        {e.voters_card_number ? (
                          <span style={{
                            fontFamily: 'monospace', fontSize: '12px',
                            background: '#f0fdf4', color: '#166534',
                            padding: '3px 8px', borderRadius: '4px', letterSpacing: '0.04em',
                          }}>
                            {e.voters_card_number}
                          </span>
                        ) : (
                          <span style={{ color: '#cbd5e1', fontSize: '12px' }}>Not provided</span>
                        )}
                      </td>
                      <td style={{ padding: '13px 16px' }}>
                        {e.monument_slug ? (
                          <span style={{
                            display: 'inline-block', padding: '3px 10px',
                            borderRadius: '20px', fontSize: '12px', fontWeight: 600,
                            background: e.monument_slug === 'tinubu' ? '#f0fdf4' : '#eff6ff',
                            color: e.monument_slug === 'tinubu' ? ACCENT : '#46a9d8',
                          }}>
                            {e.monument_slug === 'tinubu' ? 'Tinubu' : 'Sanwo-Olu'}
                          </span>
                        ) : (
                          <span style={{ color: '#cbd5e1', fontSize: '12px' }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: '13px 16px', fontWeight: 700, color: e.score != null ? ACCENT : '#cbd5e1' }}>
                        {e.score ?? '—'}
                      </td>
                      <td style={{ padding: '13px 16px', color: '#374151' }}>
                        {e.correct_count != null ? `${e.correct_count}/10` : '—'}
                      </td>
                      <td style={{ padding: '13px 16px', color: '#374151' }}>
                        {fmt(e.completion_seconds)}
                      </td>
                      <td style={{ padding: '13px 16px', color: '#64748b', fontSize: '12px' }}>
                        {fmtDate(e.completed_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '12px', textAlign: 'center' }}>
          Showing {filtered.length} of {entries.length} records · Access restricted to organizer accounts
        </p>
      </div>
    </div>
  )
}
