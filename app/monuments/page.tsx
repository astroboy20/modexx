import Link from 'next/link'
import { ArrowRight, ArrowUpRight, Trophy } from 'lucide-react'
import { allMonuments } from '@/lib/data/index'

export default function MonumentsPage() {
  return (
    <main className="directory">
      <header className="site-header directory-header">
        <Link href="/" className="wordmark"><span>mod</span>exx<span className="wordmark-dot">.</span></Link>
        <Link className="text-link" href="/">Back to Modexx <ArrowRight size={16} /></Link>
      </header>

      <section className="directory-hero">
        <p className="eyebrow"><span className="eyebrow-line" /> The collection</p>
        <h1>Explore the<br /><em>monuments.</em></h1>
        <p>Discover the stories, milestones, decisions, and historical context behind the people featured in the Modexx collection.</p>
      </section>

      <section className="monument-grid">
        {allMonuments.map((monument, idx) => (
          <div key={monument.id} className={`monument-card ${monument.accent}`}>
            <Link href={`/monuments/${monument.slug}`}>
              <div className="card-visual">
                <span className="card-number">{String(idx + 1).padStart(2, '0')}</span>
                <div className="card-figure" />
                <ArrowUpRight className="card-arrow" />
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
