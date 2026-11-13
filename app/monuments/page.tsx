import Link from 'next/link'
import { ArrowRight, ArrowUpRight, Trophy } from 'lucide-react'
import { allMonuments } from '@/lib/data/index'
import SiteHeader from '@/components/SiteHeader'

export default function MonumentsPage() {
  return (
    <main className="directory">
      <SiteHeader
        className="directory-header"
        left={<Link href="/" className="text-link" style={{ fontSize: 13 }}><ArrowRight size={15} style={{ transform: 'rotate(180deg)' }} /> Home</Link>}
      />

      <section className="directory-hero">
        <h1>Explore the<br /><em>monuments.</em></h1>
      </section>

      <section className="monument-grid">
        {allMonuments.map((monument, idx) => {
          const isLogoCard = monument.portraitFit === 'contain'
          return (
            <div key={monument.id} className={`monument-card ${monument.accent}`}>
              <Link href={`/monuments/${monument.slug}`}>
                <div
                  className="card-visual"
                  style={{
                    background: isLogoCard ? '#004d26' : monument.accent === 'green' ? '#eaf2ee' : '#e7f2f8',
                    overflow: 'hidden',
                  }}
                >
                  <span className="card-number" style={isLogoCard ? { color: '#FFD700' } : undefined}>
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  <ArrowUpRight className="card-arrow" style={isLogoCard ? { color: '#FFD700' } : undefined} />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={monument.image}
                    alt={monument.subject}
                    style={
                      isLogoCard
                        ? {
                            position: 'absolute',
                            top: '50%', left: '50%',
                            transform: 'translate(-50%,-50%)',
                            width: '72%', height: 'auto',
                            display: 'block',
                          }
                        : {
                            position: 'absolute', inset: 0,
                            width: '100%', height: '100%',
                            objectFit: 'cover', objectPosition: 'top center',
                            display: 'block',
                          }
                    }
                  />
                </div>
                <div className="card-meta">
                  <span>{monument.scope}</span>
                  <h2>{monument.name}</h2>
                  <p>{monument.subject} · {monument.office}</p>
                  <span className="card-link">View monument <ArrowRight size={15} /></span>
                </div>
              </Link>
              <div className="card-leaderboard-link">
                <Link href={`/leaderboard/${monument.slug}`} className="text-link" style={{ fontSize: 12 }}>
                  <Trophy size={13} /> View leaderboard
                </Link>
              </div>
            </div>
          )
        })}
      </section>
    </main>
  )
}
