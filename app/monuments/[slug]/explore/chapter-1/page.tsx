import Link from 'next/link'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { notFound } from 'next/navigation'

const chapters = {
  tinubu: { subject: 'Bola Ahmed Tinubu', title: 'The early years', label: 'Chapter one', accent: 'green', body: 'Every monument begins before the spotlight. Trace the formative places, choices, and convictions that shaped the story you are about to explore.' },
  'sanwo-olu': { subject: 'Babajide Sanwo-Olu', title: 'The Lagos context', label: 'Chapter one', accent: 'blue', body: 'Before a city can move forward, it must understand where it stands. Explore the context, people, and ideas that frame this Lagos story.' },
} as const

export function generateStaticParams() {
  return Object.keys(chapters).map((slug) => ({ slug }))
}

export default async function ChapterOnePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const chapter = chapters[slug as keyof typeof chapters]
  if (!chapter) notFound()

  return (
    <main className={`chapter-page ${chapter.accent}`}>
      <header className="site-header detail-header">
        <Link href={`/monuments/${slug}/explore`} className="text-link"><ArrowLeft size={16} /> Back to chapters</Link>
        <Link href="/" className="wordmark"><span>mod</span>exx<span className="wordmark-dot">.</span></Link>
        <span className="detail-index">{chapter.label}</span>
      </header>
      <section className="chapter-stage">
        <div className="chapter-stage-art" aria-hidden="true"><span>01</span><div /></div>
        <div className="chapter-stage-copy">
          <p className="eyebrow"><span className="eyebrow-line" /> {chapter.subject}</p>
          <h1>{chapter.title}</h1>
          <p>{chapter.body}</p>
          <div className="chapter-actions"><Link href={`/monuments/${slug}/explore`} className="button button-dark">Continue exploring <ArrowRight size={17} /></Link></div>
        </div>
      </section>
    </main>
  )
}
