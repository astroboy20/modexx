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
        {allMonuments.map((monument, idx) => (
          <div key={monument.id} className={`monument-card ${monument.accent}`}>
            <Link href={`/monuments/${monument.slug}`}>
              <div className="card-visual" style={{ background: monument.accent === 'green' ? '#eaf2ee' : '#e7f2f8', overflow: 'hidden' }}>
                <span className="card-number">{String(idx + 1).padStart(2, '0')}</span>
                <ArrowUpRight className="card-arrow" />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={monument.slug === 'tinubu' ? '/tinubu-president.jpg' : '/sanwo-olu.png'}
                  alt={monument.subject}
                  style={{
                    position: 'absolute', inset: 0,
                    width: '100%', height: '100%',
                    objectFit: 'cover', objectPosition: 'top center',
                    display: 'block',
                  }}
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
        ))}
      </section>
    </main>
  )
}
