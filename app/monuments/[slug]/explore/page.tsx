import Link from 'next/link'
import { ArrowLeft, ArrowRight, LockKeyhole } from 'lucide-react'
import { notFound } from 'next/navigation'

const monuments = {
  tinubu: {
    subject: 'Bola Ahmed Tinubu',
    label: 'The Tinubu Challenge',
    accent: 'green',
    chapters: ['The early years', 'Lagos to the centre', 'A new mandate'],
  },
  'sanwo-olu': {
    subject: 'Babajide Sanwo-Olu',
    label: 'The Sanwo-Olu Challenge',
    accent: 'blue',
    chapters: ['The Lagos context', 'Building momentum', 'The city ahead'],
  },
} as const

export function generateStaticParams() {
  return Object.keys(monuments).map((slug) => ({ slug }))
}

export default async function ExplorePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const monument = monuments[slug as keyof typeof monuments]
  if (!monument) notFound()

  return (
    <main className={`explore-page ${monument.accent}`}>
      <header className="site-header detail-header">
        <Link href={`/monuments/${slug}`} className="text-link"><ArrowLeft size={16} /> Back to monument</Link>
        <Link href="/" className="wordmark"><span>mod</span>exx<span className="wordmark-dot">.</span></Link>
        <span className="detail-index">Explore 01 / 03</span>
      </header>

      <section className="explore-hero">
        <p className="eyebrow"><span className="eyebrow-line" /> Your journey begins here</p>
        <h1>Step inside<br /><em>{monument.subject}&apos;s</em> story.</h1>
        <p className="explore-lede">Move through each chapter at your own pace. Listen closely, look again, and collect the details that make this monument yours.</p>
        <Link href={`/monuments/${slug}/explore/chapter-1`} className="button button-dark">Begin chapter one <ArrowRight size={17} /></Link>
      </section>

      <section className="explore-progress" aria-label="Monument chapters">
        {monument.chapters.map((chapter, index) => (
          <article className={`explore-chapter ${index > 0 ? 'locked' : ''}`} key={chapter}>
            <span className="chapter-number">0{index + 1}</span>
            <div><p>Chapter 0{index + 1}</p><h2>{chapter}</h2></div>
            {index > 0 && <LockKeyhole size={17} aria-label="Locked chapter" />}
          </article>
        ))}
      </section>
    </main>
  )
}
