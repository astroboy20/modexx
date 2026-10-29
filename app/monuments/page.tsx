import Link from 'next/link'
import { ArrowRight, ArrowUpRight } from 'lucide-react'

const monuments = [
  { id: '01', slug: 'tinubu', title: 'The Tinubu Challenge', subject: 'Bola Ahmed Tinubu', scope: 'Presidency · 2023—present', accent: 'green' },
  { id: '02', slug: 'sanwo-olu', title: 'The Sanwo-Olu Challenge', subject: 'Babajide Sanwo-Olu', scope: 'Lagos State · 2019—present', accent: 'blue' },
]

export default function MonumentsPage() {
  return <main className="directory"><header className="site-header directory-header"><Link href="/" className="wordmark"><span>mod</span>exx<span className="wordmark-dot">.</span></Link><Link className="text-link" href="/">Back to Modexx <ArrowRight size={16} /></Link></header><section className="directory-hero"><p className="eyebrow"><span className="eyebrow-line" /> The collection</p><h1>Explore the<br /><em>monuments.</em></h1><p>Discover the stories, milestones, decisions, and historical context behind the people featured in the Modexx collection.</p></section><section className="monument-grid">{monuments.map((monument) => <Link href={`/monuments/${monument.slug}`} className={`monument-card ${monument.accent}`} key={monument.id}><div className="card-visual"><span className="card-number">{monument.id}</span><div className="card-figure" /><ArrowUpRight className="card-arrow" /></div><div className="card-meta"><span>{monument.scope}</span><h2>{monument.title}</h2><p>{monument.subject}</p><span className="card-link">View monument <ArrowRight size={15} /></span></div></Link>)}</section></main>
}
