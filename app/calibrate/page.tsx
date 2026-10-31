'use client'

import { useState } from 'react'

const MONUMENTS = {
  tinubu: {
    image: '/tinubu.png',
    alt: 'President Bola Ahmed Tinubu',
    // Actual dimensions: 759×1024px — ratio 0.741 (portrait)
    width: 759,
    height: 1024,
    hotspots: [
      { id: 'tinubu-h1',  order: 1,  metaphor: 'Cap',          label: 'The Beginning'          },
      { id: 'tinubu-h2',  order: 2,  metaphor: 'Glasses',      label: 'Economic Direction'      },
      { id: 'tinubu-h3',  order: 3,  metaphor: 'Wristwatch',   label: 'The Timeline'            },
      { id: 'tinubu-h4',  order: 4,  metaphor: 'Torso/Agbada', label: 'Governance'              },
      { id: 'tinubu-h5',  order: 5,  metaphor: 'Hands',        label: 'Decisions & Agreements'  },
      { id: 'tinubu-h6',  order: 6,  metaphor: 'Ring',         label: 'The Finer Details'       },
      { id: 'tinubu-h7',  order: 7,  metaphor: 'Lapel',        label: 'National Priorities'     },
      { id: 'tinubu-h8',  order: 8,  metaphor: 'Belt',         label: 'Connecting Policies'     },
      { id: 'tinubu-h9',  order: 9,  metaphor: 'Shoes',        label: 'The National Journey'    },
      { id: 'tinubu-h10', order: 10, metaphor: 'Full Figure',  label: 'Presidency in Context'   },
    ],
  },
  'sanwo-olu': {
    image: '/sanwo-olu.png',
    alt: 'Governor Babajide Sanwo-Olu',
    // Actual dimensions: 757×1024px — ratio 0.739 (portrait)
    width: 757,
    height: 1024,
    hotspots: [
      { id: 'sanwo-h1',  order: 1,  metaphor: 'Cap',           label: 'Journey to Alausa'    },
      { id: 'sanwo-h2',  order: 2,  metaphor: 'Glasses',       label: 'The Lagos Vision'     },
      { id: 'sanwo-h3',  order: 3,  metaphor: 'Wristwatch',    label: 'Years of Governance'  },
      { id: 'sanwo-h4',  order: 4,  metaphor: 'Torso/Outfit',  label: 'Public Administration'},
      { id: 'sanwo-h5',  order: 5,  metaphor: 'Hands',         label: 'Serving Lagosians'    },
      { id: 'sanwo-h6',  order: 6,  metaphor: 'Ring',          label: 'The Finer Details'    },
      { id: 'sanwo-h7',  order: 7,  metaphor: 'Lapel/Pocket',  label: 'People & Services'    },
      { id: 'sanwo-h8',  order: 8,  metaphor: 'Belt',          label: 'Connecting the City'  },
      { id: 'sanwo-h9',  order: 9,  metaphor: 'Shoes',         label: 'Moving Lagos'         },
      { id: 'sanwo-h10', order: 10, metaphor: 'Full Figure',   label: 'The Lagos Story'      },
    ],
  },
}

type MonumentKey = keyof typeof MONUMENTS
interface Point { id: string; label: string; metaphor: string; x: number; y: number; order: number }

export default function CalibratePage() {
  const [selected, setSelected] = useState<MonumentKey>('sanwo-olu')
  const [points, setPoints] = useState<Point[]>([])
  const [currentIdx, setCurrentIdx] = useState(0)

  const monument = MONUMENTS[selected]
  const hotspots = monument.hotspots
  const done = currentIdx >= hotspots.length

  function handleClick(e: React.MouseEvent<HTMLDivElement>) {
    if (done) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100)
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100)
    const hs = hotspots[currentIdx]
    setPoints(prev => [...prev, { ...hs, x, y }])
    setCurrentIdx(i => i + 1)
  }

  function reset() {
    setPoints([])
    setCurrentIdx(0)
  }

  function switchMonument(key: MonumentKey) {
    setSelected(key)
    setPoints([])
    setCurrentIdx(0)
  }

  const prefix = selected === 'tinubu' ? 'tinubu' : 'sanwo'
  const chapterPrefix = selected === 'tinubu' ? 'Chapter' : 'Chapter'

  const output = points.map(p =>
    `    { id: '${p.id}', label: '${p.label}', metaphor: '${p.metaphor}', chapter: 'Chapter ${String(p.order).padStart(2,'0')}', x: ${p.x}, y: ${p.y}, displayOrder: ${p.order} },`
  ).join('\n')

  return (
    <div style={{ fontFamily: 'monospace', padding: 20, background: '#0f0f0f', minHeight: '100vh', color: '#fff' }}>
      <h1 style={{ fontSize: 18, marginBottom: 8, color: '#4ade80' }}>🎯 Hotspot Calibration Tool</h1>

      {/* Monument switcher */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        {(Object.keys(MONUMENTS) as MonumentKey[]).map(key => (
          <button
            key={key}
            onClick={() => switchMonument(key)}
            style={{
              padding: '6px 16px',
              background: selected === key ? '#168447' : '#333',
              color: '#fff',
              border: 'none',
              cursor: 'pointer',
              borderRadius: 4,
              fontSize: 12,
              fontFamily: 'monospace',
            }}
          >
            {key}
          </button>
        ))}
      </div>

      <p style={{ fontSize: 13, color: '#aaa', marginBottom: 16 }}>
        {done
          ? '✅ All 10 points captured. Copy output below into the hotspots array.'
          : `👆 Click on: ${hotspots[currentIdx].metaphor} — ${hotspots[currentIdx].label} (${currentIdx + 1}/10)`}
      </p>

      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {/* Image */}
        <div
          onClick={handleClick}
          style={{
            position: 'relative',
            cursor: done ? 'default' : 'crosshair',
            display: 'inline-block',
            border: '2px solid #4ade80',
            userSelect: 'none',
            flexShrink: 0,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={monument.image}
            alt={monument.alt}
            style={{
              display: 'block',
              width: 500,
              height: Math.round(500 * (monument.height / monument.width)),
              maxWidth: '90vw',
            }}
            draggable={false}
          />

          {/* Placed dots */}
          {points.map(p => (
            <div
              key={p.id}
              style={{
                position: 'absolute',
                left: `${p.x}%`,
                top: `${p.y}%`,
                transform: 'translate(-50%, -50%)',
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: '#168447',
                border: '2px solid #fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 11,
                fontWeight: 700,
                color: '#fff',
                pointerEvents: 'none',
                zIndex: 5,
              }}
            >
              {p.order}
            </div>
          ))}

          {/* Next label */}
          {!done && (
            <div style={{
              position: 'absolute',
              bottom: 8,
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(0,0,0,0.85)',
              color: '#4ade80',
              padding: '4px 12px',
              fontSize: 12,
              borderRadius: 4,
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
              zIndex: 10,
            }}>
              {currentIdx + 1}/10 · Click: {hotspots[currentIdx].metaphor} — {hotspots[currentIdx].label}
            </div>
          )}
        </div>

        {/* Output panel */}
        <div style={{ flex: 1, minWidth: 300 }}>
          <div style={{ marginBottom: 12 }}>
            {points.map(p => (
              <div key={p.id} style={{ fontSize: 12, color: '#ccc', marginTop: 3 }}>
                {p.order}. {p.metaphor} — {p.label} → x:{p.x}% y:{p.y}%
              </div>
            ))}
          </div>

          {output && (
            <>
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <button
                  onClick={() => navigator.clipboard.writeText(output)}
                  style={{ padding: '6px 14px', background: '#168447', color: '#fff', border: 'none', cursor: 'pointer', borderRadius: 4, fontSize: 12 }}
                >
                  Copy output
                </button>
                <button
                  onClick={reset}
                  style={{ padding: '6px 14px', background: '#444', color: '#fff', border: 'none', cursor: 'pointer', borderRadius: 4, fontSize: 12 }}
                >
                  Reset
                </button>
              </div>
              <textarea
                readOnly
                value={output}
                style={{
                  width: '100%',
                  height: 340,
                  background: '#1a1a1a',
                  color: '#4ade80',
                  border: '1px solid #333',
                  padding: 12,
                  fontSize: 11,
                  fontFamily: 'monospace',
                  resize: 'vertical',
                  borderRadius: 4,
                }}
              />
              <p style={{ fontSize: 11, color: '#666', marginTop: 8 }}>
                Paste into <code style={{color:'#4ade80'}}>lib/data/{selected === 'tinubu' ? 'tinubu' : 'sanwo-olu'}.ts</code> → hotspots array
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
