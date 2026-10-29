'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowDownRight, ArrowRight, ArrowUpRight, Menu, X } from 'lucide-react'

const steps = [
  { number: '01', title: 'Discover', text: 'Choose a monument from a living collection of remarkable stories.' },
  { number: '02', title: 'Explore', text: 'Move through interactive hotspots and uncover the chapters within.' },
  { number: '03', title: 'Challenge', text: 'Test what you learned with a focused trivia experience.' },
  { number: '04', title: 'Share', text: 'Turn your result into a scorecard worth keeping and sharing.' },
]

const audiences = [
  ['01', 'Individuals', 'Preserve a legacy, a journey, or a life’s work in a form people can truly explore.'],
  ['02', 'Brands', 'Make milestones, products, and cultural memory feel close, tangible, and memorable.'],
  ['03', 'Institutions', 'Open up heritage, programmes, and achievements through connected storytelling.'],
  ['04', 'Communities', 'Give meaningful places, movements, and shared histories a space to be discovered.'],
]

export default function Page() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [activeHotspot, setActiveHotspot] = useState(1)
  const demoStories = [
    'A monument is more than an object. It is a way into the moments, choices, and people that shaped a story.',
    'Each chapter gives context a shape — helping visitors move from a name or date into a fuller understanding.',
    'Explore at your own pace, then see what stayed with you when the story becomes a challenge.',
  ]

  return (
    <main className="modexx-site">
      <header className="site-header">
        <Link href="/" className="wordmark" aria-label="Modexx home"><span>mod</span>exx<span className="wordmark-dot">.</span></Link>
        <nav className={menuOpen ? 'main-nav is-open' : 'main-nav'} aria-label="Main navigation">
          <a href="#how-it-works" onClick={() => setMenuOpen(false)}>How it works</a>
          <a href="#for" onClick={() => setMenuOpen(false)}>For whom</a>
          <a href="#about" onClick={() => setMenuOpen(false)}>About Modexx</a>
          <Link className="nav-cta" href="/monuments" onClick={() => setMenuOpen(false)}>Explore monuments <ArrowRight size={15} /></Link>
        </nav>
        <button className="menu-toggle" aria-label={menuOpen ? 'Close menu' : 'Open menu'} onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X /> : <Menu />}</button>
      </header>

      <section className="hero" id="about">
        <div className="hero-copy">
          <p className="eyebrow"><span className="eyebrow-line" /> Digital monumental experiences</p>
          <h1>Stories made<br /><em>worth exploring.</em></h1>
          <p className="hero-lede">Modexx transforms the stories of people, brands, institutions, and communities into interactive digital monuments where discovery, storytelling, and knowledge come together.</p>
          <div className="hero-actions"><Link className="button button-primary" href="/monuments">Explore monuments <ArrowRight size={17} /></Link><a className="text-link" href="#how-it-works">Discover how it works <ArrowDownRight size={17} /></a></div>
        </div>
        <div className="hero-art" aria-label="Abstract digital monument illustration">
          <div className="art-grid" />
          <div className="monument-form"><div className="form-cutout" /><div className="form-line line-one" /><div className="form-line line-two" /><div className="form-line line-three" /></div>
          <div className="marker marker-one"><span>01</span></div><div className="marker marker-two"><span>02</span></div><div className="marker marker-three"><span>03</span></div>
          <p className="art-caption">A story is<br /><strong>never one-dimensional.</strong></p><span className="art-index">MX / 001</span>
        </div>
      </section>

      <section className="statement" aria-labelledby="statement-title"><p className="eyebrow">The Modexx point of view</p><h2 id="statement-title">A digital monument is a story you can <span>step inside.</span></h2><p>We create structured, interactive experiences that make meaningful stories easier to enter, understand, and remember.</p></section>

      <section className="process section-shell" id="how-it-works"><div className="section-intro"><p className="eyebrow">The experience</p><h2>From first impression<br />to lasting memory.</h2></div><div className="steps">{steps.map((step) => <div className="step" key={step.number}><span className="step-number">{step.number}</span><h3>{step.title}</h3><p>{step.text}</p><ArrowUpRight /></div>)}</div></section>

      <section className="preview section-shell"><div className="preview-copy"><p className="eyebrow">Try the format</p><h2>Every detail opens<br />another door.</h2><p>Tap a marker on this small preview to see how a story can unfold. The real monuments hold ten chapters, each connected to a bigger picture.</p><Link className="text-link" href="/monuments">Enter the collection <ArrowRight size={17} /></Link></div><div className="preview-card"><div className="preview-visual"><div className="preview-sculpture"><span /><span /><span /></div>{[1,2,3].map((n) => <button key={n} className={`preview-marker marker-${n} ${activeHotspot === n ? 'active' : ''}`} onClick={() => setActiveHotspot(n)} aria-label={`Show sample story ${n}`}>{`0${n}`}</button>)}</div><div className="preview-story"><div><span className="story-label">Chapter 0{activeHotspot}</span><p>{demoStories[activeHotspot - 1]}</p></div><span className="story-progress">0{activeHotspot} / 03</span></div></div></section>

      <section className="audience section-shell" id="for"><div className="audience-heading"><p className="eyebrow">Made for meaningful stories</p><h2>One platform.<br /><span>Many ways in.</span></h2></div><div className="audience-list">{audiences.map(([number, title, text]) => <div className="audience-row" key={number}><span>{number}</span><h3>{title}</h3><p>{text}</p><ArrowUpRight /></div>)}</div></section>

      <section className="closing"><p className="eyebrow">Begin with curiosity</p><h2>Your next discovery<br /><em>starts here.</em></h2><Link className="button button-light" href="/monuments">Explore monuments <ArrowRight size={17} /></Link></section>

      <footer className="site-footer"><Link href="/" className="wordmark">mod<span>exx</span><span className="wordmark-dot">.</span></Link><p>Digital monumental experiences for stories worth remembering.</p><div className="footer-links"><a href="#how-it-works">How it works</a><Link href="/monuments">Monuments</Link><a href="#for">Use cases</a></div><small>© 2026 Modexx. Built for meaningful stories.</small></footer>
    </main>
  )
}
