import Link from 'next/link'
import { ArrowLeft, ArrowRight, LockKeyhole, Play, Trophy } from 'lucide-react'
import { notFound } from 'next/navigation'
import { getMonument } from '@/lib/data/index'
import SiteHeader from '@/components/SiteHeader'

export function generateStaticParams() {
  return [{ slug: 'tinubu' }, { slug: 'sanwo-olu' }]
}

export default async function MonumentPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const monument = getMonument(slug)
  if (!monument) notFound()

  // notFound() throws — monument is defined from here
  const m = monument!
  const accentClass = m.accent === 'green' ? '' : 'blue'

  return (
    <main className={`monument-detail ${accentClass}`}>
      <SiteHeader
        className="detail-header"
        left={<Link href="/monuments" className="text-link"><ArrowLeft size={16} /> All monuments</Link>}
        right={<Link href={`/leaderboard/${slug}`} className="text-link" style={{ fontSize: 12 }}>Leaderboard <ArrowRight size={14} /></Link>}
      />

      <section className="detail-hero">
        <div className="detail-copy">
          <p className="eyebrow"><span className="eyebrow-line" /> {m.scope}</p>
          <h1>{m.name}</h1>
          <p className="detail-subject">{m.subject}</p>
          <p className="detail-subject" style={{ fontFamily: 'inherit', fontSize: 15, color: 'var(--muted)', marginBottom: 12 }}>{m.office}</p>
          <p className="detail-intro">{m.intro}</p>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
            <Link href={`/monuments/${slug}/explore`} className="button button-dark">
              Explore this monument <ArrowRight size={17} />
            </Link>
            <Link href={`/leaderboard/${slug}`} className="text-link">
              View leaderboard <ArrowRight size={15} />
            </Link>
          </div>
        </div>
        <div className="detail-art" aria-label={`${m.subject} monument artwork`} role="img">
          <span className="detail-art-number">{slug === 'tinubu' ? '01' : '02'}</span>
          <div className="detail-art-figure" />
          <span className="detail-art-caption">A digital monumental experience by Modexx</span>
        </div>
      </section>

      <section className="chapter-preview">
        <div>
          <p className="eyebrow"><span className="eyebrow-line" /> Inside the monument</p>
          <h2>Stories, not<br /><em>statues.</em></h2>
          <p style={{ color: 'var(--muted)', fontSize: 15, lineHeight: 1.6, marginTop: 16 }}>
            10 interactive chapters. Each one opens a story connected to {m.subject}&apos;s record.
            Explore all 10 to unlock the knowledge challenge.
          </p>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 28 }}>
            <Link href={`/monuments/${slug}/explore`} className="button button-dark">
              Begin exploring <ArrowRight size={16} />
            </Link>
            <Link href={`/leaderboard/${slug}`} className="text-link">
              <Trophy size={14} /> Leaderboard
            </Link>
          </div>
        </div>
        <div className="chapter-list">
          {m.hotspots.map((hotspot) => (
            <div className="chapter-row" key={hotspot.id}>
              <span>{hotspot.chapter.replace('Chapter ', '0')}</span>
              <strong>{hotspot.label}</strong>
              <LockKeyhole size={16} aria-label="Locked until explored" />
            </div>
          ))}
          <p className="chapter-note"><Play size={14} /> Begin exploring to unlock each chapter&apos;s story.</p>
        </div>
      </section>
    </main>
  )
}
