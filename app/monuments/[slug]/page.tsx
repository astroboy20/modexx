import Link from 'next/link'
import { ArrowLeft, ArrowRight, LockKeyhole, Play } from 'lucide-react'
import { notFound } from 'next/navigation'

const monumentData = {
  tinubu: {
    title: 'The Tinubu Challenge',
    subject: 'Bola Ahmed Tinubu',
    scope: 'Presidency · 2023—present',
    accent: 'green',
    intro: 'A guided monument through the moments, movements, and milestones shaping a new chapter in Nigeria’s story.',
    chapters: ['The early years', 'Lagos to the centre', 'A new mandate'],
  },
  'sanwo-olu': {
    title: 'The Sanwo-Olu Challenge',
    subject: 'Babajide Sanwo-Olu',
    scope: 'Lagos State · 2019—present',
    accent: 'blue',
    intro: 'Explore the people, places, and public decisions behind Lagos’ evolving story of leadership and possibility.',
    chapters: ['The Lagos context', 'Building momentum', 'The city ahead'],
  },
} as const

export function generateStaticParams() {
  return Object.keys(monumentData).map((slug) => ({ slug }))
}

export default async function MonumentPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const monument = monumentData[slug as keyof typeof monumentData]

  if (!monument) notFound()

  return (
    <main className={`monument-detail ${monument.accent}`}>
      <header className="site-header detail-header">
        <Link href="/monuments" className="text-link"><ArrowLeft size={16} /> All monuments</Link>
        <Link href="/" className="wordmark"><span>mod</span>exx<span className="wordmark-dot">.</span></Link>
        <span className="detail-index">Monument 0{slug === 'tinubu' ? '1' : '2'}</span>
      </header>

      <section className="detail-hero">
        <div className="detail-copy">
          <p className="eyebrow"><span className="eyebrow-line" /> {monument.scope}</p>
          <h1>{monument.title}</h1>
          <p className="detail-subject">{monument.subject}</p>
          <p className="detail-intro">{monument.intro}</p>
          <Link href={`/monuments/${slug}/explore`} className="button button-dark">Explore this monument <ArrowRight size={17} /></Link>
        </div>
        <div className="detail-art" aria-label={`${monument.subject} monument artwork`} role="img">
          <span className="detail-art-number">0{slug === 'tinubu' ? '1' : '2'}</span>
          <div className="detail-art-figure" />
          <span className="detail-art-caption">A digital monumental experience by Modexx</span>
        </div>
      </section>

      <section className="chapter-preview">
        <div><p className="eyebrow"><span className="eyebrow-line" /> Inside the monument</p><h2>Stories, not<br /><em>statues.</em></h2></div>
        <div className="chapter-list">
          {monument.chapters.map((chapter, index) => <div className="chapter-row" key={chapter}><span>0{index + 1}</span><strong>{chapter}</strong><LockKeyhole size={16} /></div>)}
          <p className="chapter-note"><Play size={14} /> Sign up to unlock the full experience, then test what you remember.</p>
        </div>
      </section>
    </main>
  )
}
