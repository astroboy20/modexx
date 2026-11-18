'use client'

import { useState, useRef, useCallback, useEffect } from 'react'

// ── Monument definitions ───────────────────────────────────────────────────

const MONUMENTS = {
  tinubu: {
    image: '/tinubu-president.jpg',
    alt: 'President Bola Ahmed Tinubu',
    portraitFit: 'cover' as const,
    aspectRatio: 3 / 4,   // width/height — tinubu portrait is roughly 3:4
    dataFile: 'lib/data/tinubu.ts',
    hotspots: [
      { id: 'tinubu-h1',  order: 1,  metaphor: 'Cap',           label: 'The Beginning'           },
      { id: 'tinubu-h2',  order: 2,  metaphor: 'Glasses',       label: 'Economic Direction'       },
      { id: 'tinubu-h3',  order: 3,  metaphor: 'Wristwatch',    label: 'The Timeline'             },
      { id: 'tinubu-h4',  order: 4,  metaphor: 'Torso/Agbada',  label: 'Governance'               },
      { id: 'tinubu-h5',  order: 5,  metaphor: 'Hands',         label: 'Decisions & Agreements'   },
      { id: 'tinubu-h6',  order: 6,  metaphor: 'Ring',          label: 'The Finer Details'        },
      { id: 'tinubu-h7',  order: 7,  metaphor: 'Lapel',         label: 'National Priorities'      },
      { id: 'tinubu-h8',  order: 8,  metaphor: 'Belt',          label: 'Connecting Policies'      },
      { id: 'tinubu-h9',  order: 9,  metaphor: 'Shoes',         label: 'The National Journey'     },
      { id: 'tinubu-h10', order: 10, metaphor: 'Full Figure',   label: 'Presidency in Context'    },
    ],
  },
  hamzat: {
    image: '/hamzat-potrait.png',
    alt: 'Dr. Kadri Obafemi Hamzat',
    portraitFit: 'cover' as const,
    aspectRatio: 1024 / 1536,  // 2:3
    dataFile: 'lib/data/hamzat.ts',
    hotspots: [
      { id: 'hamzat-h1',  order: 1,  metaphor: 'Cap',           label: 'Lagos Roots'              },
      { id: 'hamzat-h2',  order: 2,  metaphor: 'Glasses',       label: 'The Systems Lens'         },
      { id: 'hamzat-h3',  order: 3,  metaphor: 'Wristwatch',    label: 'Timeline of Service'      },
      { id: 'hamzat-h4',  order: 4,  metaphor: 'Torso/Agbada',  label: "The Engineer's Blueprint" },
      { id: 'hamzat-h5',  order: 5,  metaphor: 'Hands',         label: 'Decisions & Institutions' },
      { id: 'hamzat-h6',  order: 6,  metaphor: 'Collar',        label: 'The Political Journey'    },
      { id: 'hamzat-h7',  order: 7,  metaphor: 'Lapel/Pocket',  label: 'People & Public Services' },
      { id: 'hamzat-h8',  order: 8,  metaphor: 'Belt',          label: 'Connecting Lagos'         },
      { id: 'hamzat-h9',  order: 9,  metaphor: 'Shoes',         label: 'Everyday Lagos'           },
      { id: 'hamzat-h10', order: 10, metaphor: 'Full Figure',   label: 'Record & The Lagos Promise'},
    ],
  },
  oyebanji: {
    image: '/oyebanji-portrait.png',
    alt: 'Governor Biodun Oyebanji',
    portraitFit: 'contain' as const,
    aspectRatio: 1024 / 1536,  // 2:3
    dataFile: 'lib/data/oyebanji.ts',
    hotspots: [
      { id: 'oye-h1',  order: 1,  metaphor: 'Cap',           label: 'Ikogosi Beginnings'       },
      { id: 'oye-h2',  order: 2,  metaphor: 'Glasses',       label: 'The Policy Lens'           },
      { id: 'oye-h3',  order: 3,  metaphor: 'Wristwatch',    label: 'Timeline of Service'       },
      { id: 'oye-h4',  order: 4,  metaphor: 'Torso/Outfit',  label: 'The Governing Framework'   },
      { id: 'oye-h5',  order: 5,  metaphor: 'Hands',         label: 'Institutions & Decisions'  },
      { id: 'oye-h6',  order: 6,  metaphor: 'Collar',        label: 'Statehood & Identity'      },
      { id: 'oye-h7',  order: 7,  metaphor: 'Lapel/Pocket',  label: 'Human Capital'             },
      { id: 'oye-h8',  order: 8,  metaphor: 'Belt',          label: 'Agriculture & Livelihoods' },
      { id: 'oye-h9',  order: 9,  metaphor: 'Shoes',         label: 'Connecting Ekiti'          },
      { id: 'oye-h10', order: 10, metaphor: 'Full Figure',   label: 'Record & Accountability'   },
    ],
  },
  'ekiti-logo': {
    image: '/ekiti-logo.jfif',
    alt: 'Ekiti State Official Emblem',
    portraitFit: 'contain' as const,
    aspectRatio: 1,  // square logo
    dataFile: 'lib/data/ekiti-logo.ts',
    hotspots: [
      { id: 'ekiti-h1', order: 1, metaphor: 'Outer Border',    label: 'The Woven Cord'   },
      { id: 'ekiti-h2', order: 2, metaphor: 'Rising Sun',      label: 'The New Dawn'     },
      { id: 'ekiti-h3', order: 3, metaphor: 'Hills/Landscape', label: 'The Rolling Hills'},
      { id: 'ekiti-h4', order: 4, metaphor: 'Green Trees',     label: 'The Vegetation'   },
      { id: 'ekiti-h5', order: 5, metaphor: 'Ikogosi Spring',  label: 'The Water'        },
      { id: 'ekiti-h6', order: 6, metaphor: 'Book at Base',    label: 'The Open Book'    },
    ],
  },
} as const

type MonumentKey = keyof typeof MONUMENTS

interface Point {
  id: string
  label: string
  metaphor: string
  order: number
  // dot position as % of image dimensions
  x: number
  y: number
  // label anchor position as % of image dimensions (draggable)
  lx: number
  ly: number
}

const ACCENT: Record<MonumentKey, string> = {
  tinubu:      '#168447',
  hamzat:      '#46a9d8',
  oyebanji:    '#168447',
  'ekiti-logo':'#168447',
}

// Default label offset from the dot (in % of image size)
const DEFAULT_OFFSET_X = 18
const DEFAULT_OFFSET_Y = -8

export default function CalibratePage() {
  const [selected, setSelected] = useState<MonumentKey>('ekiti-logo')
  const [points, setPoints] = useState<Point[]>([])
  const [draggingId, setDraggingId] = useState<string | null>(null)
  // ID of a dot selected for repositioning (click dot → select, click image → move it)
  const [repositionId, setRepositionId] = useState<string | null>(null)

  const imgRef = useRef<HTMLDivElement>(null)
  const dragStart = useRef<{ mx: number; my: number; lx: number; ly: number } | null>(null)
  const didDragRef = useRef(false) // true if the mouse moved enough to count as a drag

  const monument = MONUMENTS[selected]
  const hotspots = monument.hotspots
  const currentIdx = points.length
  const done = currentIdx >= hotspots.length
  const accent = ACCENT[selected]

  // ── Place a new dot on click ─────────────────────────────────────────────
  function handleImageClick(e: React.MouseEvent<HTMLDivElement>) {
    // If the mouse moved during this interaction (drag), ignore the click
    if (didDragRef.current) { didDragRef.current = false; return }
    const rect = e.currentTarget.getBoundingClientRect()
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100)
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100)

    // Reposition mode — move the selected dot to this new position
    if (repositionId) {
      setPoints(prev => prev.map(p => {
        if (p.id !== repositionId) return p
        // Shift the label by the same delta so relative arrow direction is preserved
        const dx = x - p.x
        const dy = y - p.y
        const newLx = Math.min(98, Math.max(2, p.lx + dx))
        const newLy = Math.min(98, Math.max(2, p.ly + dy))
        return { ...p, x, y, lx: newLx, ly: newLy }
      }))
      setRepositionId(null)
      return
    }

    if (done || draggingId) return
    const hs = hotspots[currentIdx]
    // Default label position: offset from dot
    const lx = Math.min(95, Math.max(5, x + DEFAULT_OFFSET_X))
    const ly = Math.min(95, Math.max(5, y + DEFAULT_OFFSET_Y))
    setPoints(prev => [...prev, { ...hs, x, y, lx, ly }])
  }

  // ── Drag label ────────────────────────────────────────────────────────────
  function handleLabelMouseDown(e: React.MouseEvent, id: string) {
    e.preventDefault()
    e.stopPropagation()
    const pt = points.find(p => p.id === id)
    if (!pt) return
    setDraggingId(id)
    dragStart.current = { mx: e.clientX, my: e.clientY, lx: pt.lx, ly: pt.ly }
  }

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!draggingId || !dragStart.current || !imgRef.current) return
    const rect = imgRef.current.getBoundingClientRect()
    const dx = ((e.clientX - dragStart.current.mx) / rect.width) * 100
    const dy = ((e.clientY - dragStart.current.my) / rect.height) * 100
    const newLx = Math.min(98, Math.max(2, dragStart.current.lx + dx))
    const newLy = Math.min(98, Math.max(2, dragStart.current.ly + dy))
    didDragRef.current = true
    setPoints(prev => prev.map(p => p.id === draggingId ? { ...p, lx: newLx, ly: newLy } : p))
  }, [draggingId])

  const handleMouseUp = useCallback(() => {
    setDraggingId(null)
    dragStart.current = null
    // Keep didDragRef.current = true so the subsequent click event is suppressed.
    // Reset it on the next animation frame (after the click fires).
    requestAnimationFrame(() => { didDragRef.current = false })
  }, [])

  // Also handle touch drag for mobile
  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!draggingId || !dragStart.current || !imgRef.current) return
    const touch = e.touches[0]
    const rect = imgRef.current.getBoundingClientRect()
    const dx = ((touch.clientX - dragStart.current.mx) / rect.width) * 100
    const dy = ((touch.clientY - dragStart.current.my) / rect.height) * 100
    const newLx = Math.min(98, Math.max(2, dragStart.current.lx + dx))
    const newLy = Math.min(98, Math.max(2, dragStart.current.ly + dy))
    didDragRef.current = true
    setPoints(prev => prev.map(p => p.id === draggingId ? { ...p, lx: newLx, ly: newLy } : p))
  }, [draggingId])

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    window.addEventListener('touchmove', handleTouchMove, { passive: true })
    window.addEventListener('touchend', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('touchend', handleMouseUp)
    }
  }, [handleMouseMove, handleMouseUp, handleTouchMove])

  function undoLast() { setRepositionId(null); setPoints(prev => prev.slice(0, -1)) }

  function reset() { setRepositionId(null); setPoints([]) }

  function switchMonument(key: MonumentKey) { setSelected(key); setPoints([]); setRepositionId(null) }

  const output = points.map(p =>
    `    { id: '${p.id}', label: '${p.label}', metaphor: '${p.metaphor}', chapter: 'Chapter ${String(p.order).padStart(2, '0')}', x: ${p.x}, y: ${p.y}, displayOrder: ${p.order}, lx: ${p.lx}, ly: ${p.ly} },`
  ).join('\n')

  return (
    <div style={{ fontFamily: 'monospace', background: '#0c0c0e', minHeight: '100vh', color: '#e8e8e8' }}>

      {/* Header */}
      <div style={{ padding: '14px 20px', borderBottom: '1px solid #1e1e1e', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 15, fontWeight: 700, color: accent }}>🎯 Hotspot Calibration</span>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {(Object.keys(MONUMENTS) as MonumentKey[]).map(key => (
            <button key={key} onClick={() => switchMonument(key)} style={{
              padding: '5px 14px', fontSize: 12, fontFamily: 'monospace', cursor: 'pointer',
              borderRadius: 4, border: 'none',
              background: selected === key ? ACCENT[key] : '#222',
              color: selected === key ? '#fff' : '#888',
              fontWeight: selected === key ? 700 : 400,
            }}>
              {key}
            </button>
          ))}
        </div>
        <span style={{ fontSize: 12, color: '#555', marginLeft: 'auto' }}>
          {done ? '✅ All points captured' : `${currentIdx} / ${hotspots.length} placed`}
        </span>
      </div>

      {/* Instruction banner */}
      <div style={{ padding: '9px 20px', background: repositionId ? '#1a1200' : (done ? '#0d2b1a' : '#121208'), borderBottom: '1px solid #1e1e1e' }}>
        {repositionId ? (
          <span style={{ fontSize: 13, color: '#f59e0b' }}>
            <span style={{ fontWeight: 700 }}>🔁 Reposition mode:</span> click anywhere on the image to move dot {points.find(p => p.id === repositionId)?.order} to the new position.
            <button onClick={() => setRepositionId(null)} style={{ marginLeft: 14, fontSize: 12, background: 'none', border: '1px solid #f59e0b55', color: '#f59e0b', padding: '1px 10px', borderRadius: 4, cursor: 'pointer', fontFamily: 'monospace' }}>Cancel</button>
          </span>
        ) : done ? (
          <span style={{ fontSize: 13, color: '#4ade80' }}>
            ✅ Done! Copy the output → paste into <code style={{ color: accent }}>{monument.dataFile}</code>.
            <span style={{ color: '#555', marginLeft: 12 }}>Click any dot to reposition it. Drag labels to adjust arrows.</span>
          </span>
        ) : (
          <span style={{ fontSize: 13 }}>
            <span style={{ color: accent, fontWeight: 700 }}>👆 Click on: </span>
            <span style={{ color: '#fff', fontWeight: 700 }}>{hotspots[currentIdx].metaphor}</span>
            <span style={{ color: '#777' }}> — {hotspots[currentIdx].label}</span>
            <span style={{ color: '#444' }}> ({currentIdx + 1}/{hotspots.length})</span>
            <span style={{ color: '#555', marginLeft: 14 }}>Click a dot to reposition it. Drag labels to adjust arrows.</span>
          </span>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-start', minHeight: 'calc(100vh - 95px)' }}>

        {/* ── Image panel ── */}
        <div style={{ padding: 20, flexShrink: 0, userSelect: 'none' }}>
          <div
            ref={imgRef}
            onClick={handleImageClick}
            style={{
              position: 'relative',
              cursor: repositionId ? 'crosshair' : (done ? 'default' : 'crosshair'),
              display: 'inline-block',
              border: `2px solid ${repositionId ? '#f59e0b' : accent}`,
              borderRadius: 4,
              boxShadow: `0 0 24px ${repositionId ? '#f59e0b22' : accent + '22'}`,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={monument.image}
              alt={monument.alt}
              style={{
                display: 'block',
                height: 'calc(100vh - 100px)',
                width: `calc((100vh - 100px) * ${monument.aspectRatio})`,
                maxWidth: '46vw',
                objectFit: monument.portraitFit,
                objectPosition: 'center top',
                background: '#111',
                pointerEvents: 'none',
              }}
              draggable={false}
            />

            {/* SVG overlay — draws arrow lines from dot to label */}
            <svg
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', overflow: 'visible' }}
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
              <defs>
                {/* Arrowhead marker pointing toward the dot */}
                <marker id="arrowhead" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
                  <path d="M0,0 L6,3 L0,6 Z" fill={accent} />
                </marker>
                <marker id="arrowhead-last" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
                  <path d="M0,0 L6,3 L0,6 Z" fill="#fff" />
                </marker>
              </defs>
              {points.map((p, i) => {
                const isLast = i === points.length - 1
                const col = isLast ? '#fff' : accent
                const markerId = isLast ? 'arrowhead-last' : 'arrowhead'
                // Arrow goes from label center → toward dot, stopping just before the dot
                // We compute direction vector and shorten the end by ~1.5 units
                const dx = p.x - p.lx
                const dy = p.y - p.ly
                const len = Math.sqrt(dx * dx + dy * dy) || 1
                // End point: stop 1.5% before the dot so arrowhead tip touches the dot
                const ex = p.x - (dx / len) * 1.5
                const ey = p.y - (dy / len) * 1.5
                return (
                  <line
                    key={p.id}
                    x1={p.lx} y1={p.ly}
                    x2={ex} y2={ey}
                    stroke={col}
                    strokeWidth="0.4"
                    strokeOpacity={isLast ? 1 : 0.75}
                    markerEnd={`url(#${markerId})`}
                  />
                )
              })}
            </svg>

            {/* Dots at exact click positions — click to enter reposition mode */}
            {points.map((p, i) => {
              const isLast = i === points.length - 1
              const isSelected = repositionId === p.id
              return (
                <div
                  key={`dot-${p.id}`}
                  onClick={(e) => {
                    e.stopPropagation()
                    // Toggle: click again to deselect
                    setRepositionId(prev => prev === p.id ? null : p.id)
                  }}
                  title={`Click to reposition dot ${p.order}`}
                  style={{
                    position: 'absolute',
                    left: `${p.x}%`, top: `${p.y}%`,
                    transform: 'translate(-50%, -50%)',
                    width: isSelected ? 14 : 9,
                    height: isSelected ? 14 : 9,
                    borderRadius: '50%',
                    background: isSelected ? '#f59e0b' : (isLast ? '#fff' : `${accent}cc`),
                    border: `2px solid ${isSelected ? '#fff' : (isLast ? accent : '#ffffffaa')}`,
                    boxShadow: isSelected
                      ? '0 0 0 3px #f59e0b55, 0 2px 8px rgba(0,0,0,0.6)'
                      : `0 0 0 2px ${accent}44`,
                    cursor: 'pointer',
                    zIndex: 8,
                    transition: 'all 0.15s',
                  }}
                />
              )
            })}

            {/* Draggable number labels */}
            {points.map((p, i) => {
              const isLast = i === points.length - 1
              const isDragging = draggingId === p.id
              return (
                <div
                  key={`label-${p.id}`}
                  onMouseDown={(e) => handleLabelMouseDown(e, p.id)}
                  onTouchStart={(e) => {
                    e.stopPropagation()
                    const touch = e.touches[0]
                    const pt2 = points.find(pt => pt.id === p.id)
                    if (!pt2) return
                    setDraggingId(p.id)
                    dragStart.current = { mx: touch.clientX, my: touch.clientY, lx: pt2.lx, ly: pt2.ly }
                  }}
                  style={{
                    position: 'absolute',
                    left: `${p.lx}%`, top: `${p.ly}%`,
                    transform: 'translate(-50%, -50%)',
                    cursor: isDragging ? 'grabbing' : 'grab',
                    zIndex: isDragging ? 20 : 10,
                    background: isLast ? '#fff' : `${accent}ee`,
                    color: isLast ? accent : '#fff',
                    fontSize: 11, fontWeight: 800,
                    padding: '2px 7px', borderRadius: 4,
                    border: `1.5px solid ${isLast ? accent : '#ffffff33'}`,
                    boxShadow: isDragging
                      ? `0 4px 16px rgba(0,0,0,0.7), 0 0 0 2px ${accent}`
                      : '0 1px 5px rgba(0,0,0,0.6)',
                    whiteSpace: 'nowrap', lineHeight: '18px',
                    transition: isDragging ? 'none' : 'box-shadow 0.1s',
                    WebkitUserSelect: 'none',
                  }}
                >
                  {p.order}
                </div>
              )
            })}

            {/* Next point hint */}
            {!done && (
              <div style={{
                position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)',
                background: 'rgba(0,0,0,0.88)', padding: '5px 14px',
                fontSize: 12, borderRadius: 20, whiteSpace: 'nowrap',
                pointerEvents: 'none', zIndex: 10,
                border: `1px solid ${accent}55`, color: '#fff',
              }}>
                <span style={{ color: accent }}>▶</span> {hotspots[currentIdx].metaphor} — {hotspots[currentIdx].label}
              </div>
            )}
          </div>

          {/* Controls under image */}
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button onClick={undoLast} disabled={points.length === 0} style={{
              padding: '6px 14px', fontSize: 12, fontFamily: 'monospace',
              cursor: points.length === 0 ? 'not-allowed' : 'pointer',
              background: points.length === 0 ? '#1a1a1a' : '#3a2200',
              color: points.length === 0 ? '#444' : '#f59e0b',
              border: `1px solid ${points.length === 0 ? '#333' : '#f59e0b55'}`, borderRadius: 4,
            }}>↩ Undo last</button>
            <button onClick={reset} disabled={points.length === 0} style={{
              padding: '6px 14px', fontSize: 12, fontFamily: 'monospace',
              cursor: points.length === 0 ? 'not-allowed' : 'pointer',
              background: points.length === 0 ? '#1a1a1a' : '#2a0a0a',
              color: points.length === 0 ? '#444' : '#f87171',
              border: `1px solid ${points.length === 0 ? '#333' : '#f8717155'}`, borderRadius: 4,
            }}>✕ Reset all</button>
          </div>
        </div>

        {/* ── Right panel ── */}
        <div style={{ flex: 1, padding: 20, minWidth: 0, borderLeft: '1px solid #1a1a1a', overflowY: 'auto', maxHeight: '100vh' }}>

          {/* Point list */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: '#444', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Points</div>
            {hotspots.map((hs, idx) => {
              const placed = points[idx]
              const isCurrent = idx === currentIdx
              return (
                <div key={hs.id} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '5px 8px', borderRadius: 4, marginBottom: 2,
                  background: isCurrent ? `${accent}14` : 'transparent',
                  border: isCurrent ? `1px solid ${accent}33` : '1px solid transparent',
                }}>
                  <span style={{
                    display: 'grid', placeItems: 'center',
                    width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                    fontSize: 10, fontWeight: 700,
                    background: placed ? accent : (isCurrent ? `${accent}33` : '#222'),
                    color: placed ? '#fff' : (isCurrent ? accent : '#444'),
                    border: isCurrent && !placed ? `1.5px solid ${accent}` : 'none',
                  }}>{hs.order}</span>
                  <span style={{ fontSize: 12, color: placed ? '#ccc' : (isCurrent ? '#fff' : '#444'), flex: 1 }}>
                    {hs.metaphor} — {hs.label}
                  </span>
                  {placed && (
                    <span style={{ fontSize: 10, color: accent }}>x:{placed.x} y:{placed.y}</span>
                  )}
                  {isCurrent && !placed && (
                    <span style={{ fontSize: 11, color: accent }}>← click</span>
                  )}
                </div>
              )
            })}
          </div>

          {/* Output */}
          {output && (
            <div>
              <div style={{ fontSize: 11, color: '#444', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Output</div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                <button onClick={() => navigator.clipboard.writeText(output)} style={{
                  padding: '6px 16px', background: accent, color: '#fff',
                  border: 'none', cursor: 'pointer', borderRadius: 4,
                  fontSize: 12, fontFamily: 'monospace', fontWeight: 700,
                }}>Copy</button>
                <span style={{ fontSize: 11, color: '#444' }}>
                  → <code style={{ color: accent }}>{monument.dataFile}</code>
                </span>
              </div>
              <textarea readOnly value={output} style={{
                width: '100%', height: 260,
                background: '#080f0a', color: accent,
                border: `1px solid ${accent}22`,
                padding: 12, fontSize: 11, fontFamily: 'monospace',
                resize: 'vertical', borderRadius: 4, lineHeight: 1.6,
              }} />
            </div>
          )}

          {!output && (
            <div style={{ padding: 18, background: '#111', borderRadius: 8, border: '1px solid #1e1e1e' }}>
              <div style={{ fontSize: 12, color: '#555', lineHeight: 1.9 }}>
                <div style={{ color: '#888', fontWeight: 700, marginBottom: 6 }}>How to use:</div>
                <div>1. Click the exact spot on the portrait.</div>
                <div>2. A numbered label appears with an arrow pointing at the spot.</div>
                <div>3. <span style={{ color: '#f59e0b' }}>Drag the number label</span> anywhere to reposition the arrow.</div>
                <div>4. Work through all {hotspots.length} points, then copy the output.</div>
                <div>5. Paste into <code style={{ color: accent }}>{monument.dataFile}</code> → hotspots array.</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
