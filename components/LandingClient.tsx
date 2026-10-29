"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Menu,
  User,
  LogOut,
  Compass,
  Trophy,
  Info,
  Zap,
} from "lucide-react";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetClose,
} from "@/components/ui/sheet";
import type { SessionUser } from "@/lib/session";

const steps = [
  {
    number: "01",
    title: "Discover",
    text: "Choose a monument from a living collection of remarkable stories.",
  },
  {
    number: "02",
    title: "Explore",
    text: "Move through interactive hotspots and uncover the chapters within.",
  },
  {
    number: "03",
    title: "Challenge",
    text: "Test what you learned with a focused trivia experience.",
  },
  {
    number: "04",
    title: "Share",
    text: "Turn your result into a scorecard worth keeping and sharing.",
  },
];

const audiences = [
  [
    "01",
    "Individuals",
    "Preserve a legacy, a journey, or a life's work in a form people can truly explore.",
  ],
  [
    "02",
    "Brands",
    "Make milestones, products, and cultural memory feel close, tangible, and memorable.",
  ],
  [
    "03",
    "Institutions",
    "Open up heritage, programmes, and achievements through connected storytelling.",
  ],
  [
    "04",
    "Communities",
    "Give meaningful places, movements, and shared histories a space to be discovered.",
  ],
];

interface Props {
  user: SessionUser | null;
}

export default function LandingClient({ user }: Props) {
  const router = useRouter();
  const [activeHotspot, setActiveHotspot] = useState(1);
  const [sheetOpen, setSheetOpen] = useState(false);

  const demoStories = [
    "A monument is more than an object. It is a way into the moments, choices, and people that shaped a story.",
    "Each chapter gives context a shape — helping visitors move from a name or date into a fuller understanding.",
    "Explore at your own pace, then see what stayed with you when the story becomes a challenge.",
  ];

  async function handleSignOut() {
    await fetch("/api/auth", { method: "DELETE" });
    setSheetOpen(false);
    router.refresh();
  }

  const monumentsHref = user ? "/monuments" : "/signin?redirect=/monuments";

  const navLinks = [
    { label: "How it works", href: "#how-it-works", icon: <Zap size={16} /> },
    { label: "For whom", href: "#for", icon: <Compass size={16} /> },
    { label: "About Modexx", href: "#about", icon: <Info size={16} /> },
  ];

  return (
    <main className="modexx-site">
      {/* ── Sticky header ─────────────────────────────────────────────── */}
      <header className="landing-header">
        <div className="landing-header-inner">
          {/* Wordmark */}
          <Link href="/" className="wordmark" aria-label="Modexx home">
            <span>mod</span>exx<span className="wordmark-dot">.</span>
          </Link>

          {/* Desktop nav */}
          <nav className="desktop-nav" aria-label="Main navigation">
            <a href="#how-it-works" className="desktop-nav-link">
              How it works
            </a>
            <a href="#for" className="desktop-nav-link">
              For whom
            </a>
            <a href="#about" className="desktop-nav-link">
              About
            </a>

            {user ? (
              <>
                <Link href="/monuments" className="desktop-nav-link">
                  Monuments
                </Link>
                <div className="desktop-user-pill">
                  <User size={13} />
                  <span>@{user.displayName}</span>
                </div>
                <button
                  className="desktop-signout-btn"
                  onClick={handleSignOut}
                  aria-label="Sign out"
                  title="Sign out"
                >
                  <LogOut size={15} />
                </button>
              </>
            ) : (
              <>
                <Link href="/signin" className="desktop-nav-link">
                  Sign in
                </Link>
                <Link href={monumentsHref} className="desktop-cta-btn">
                  Get started <ArrowRight size={14} />
                </Link>
              </>
            )}
          </nav>

          {/* Mobile hamburger */}
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <button className="mobile-menu-btn" aria-label="Open menu">
                <Menu size={22} />
              </button>
            </SheetTrigger>

            <SheetContent side="right">
              {/* Sheet header */}
              <div className="sheet-top">
                <Link
                  href="/"
                  className="wordmark sheet-wordmark"
                  onClick={() => setSheetOpen(false)}
                >
                  <span>mod</span>exx<span className="wordmark-dot">.</span>
                </Link>
              </div>

              {/* Nav links */}
              <nav className="sheet-nav" aria-label="Mobile navigation">
                {navLinks.map(({ label, href, icon }) => (
                  <a
                    key={label}
                    href={href}
                    className="sheet-link"
                    onClick={() => setSheetOpen(false)}
                  >
                    <span className="sheet-link-icon">{icon}</span>
                    {label}
                  </a>
                ))}

                <div className="sheet-divider" />

                <Link
                  href={monumentsHref}
                  className="sheet-link sheet-link--primary"
                  onClick={() => setSheetOpen(false)}
                >
                  <span className="sheet-link-icon">
                    <Compass size={16} />
                  </span>
                  Explore monuments
                  <ArrowRight size={15} className="sheet-link-arrow" />
                </Link>
              </nav>

              {/* User section */}
              <div className="sheet-footer">
                {user ? (
                  <>
                    <div className="sheet-user-row">
                      <div className="sheet-avatar">
                        <User size={16} />
                      </div>
                      <div>
                        <p className="sheet-user-name">@{user.displayName}</p>
                        <p className="sheet-user-label">Signed in</p>
                      </div>
                    </div>
                    <button
                      className="sheet-signout-btn"
                      onClick={handleSignOut}
                    >
                      <LogOut size={15} />
                      Sign out
                    </button>
                  </>
                ) : (
                  <div className="sheet-auth-row">
                    <Link
                      href="/signin"
                      className="sheet-signin-btn"
                      onClick={() => setSheetOpen(false)}
                    >
                      Sign in
                    </Link>
                    <Link
                      href={monumentsHref}
                      className="sheet-getstarted-btn"
                      onClick={() => setSheetOpen(false)}
                    >
                      Get started <ArrowRight size={14} />
                    </Link>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className="hero" id="about">
        <div className="hero-copy">
          <p className="eyebrow">
            <span className="eyebrow-line" /> Digital monumental experiences
          </p>
          <h1>
            Stories made
            <br />
            <em>worth exploring.</em>
          </h1>
          <p className="hero-lede">
            Modexx transforms the stories of people, brands, institutions, and
            communities into interactive digital monuments where discovery,
            storytelling, and knowledge come together.
          </p>
          <div className="hero-actions">
            <Link className="button button-primary" href={monumentsHref}>
              Explore monuments <ArrowRight size={17} />
            </Link>
            <a className="text-link" href="#how-it-works">
              Discover how it works <ArrowDownRight size={17} />
            </a>
          </div>
        </div>
        <div
          className="hero-art"
          aria-label="Abstract digital monument illustration"
        >
          <div className="art-grid" />
          <div className="monument-form">
            <div className="form-cutout" />
            <div className="form-line line-one" />
            <div className="form-line line-two" />
            <div className="form-line line-three" />
          </div>
          <div className="marker marker-one">
            <span>01</span>
          </div>
          <div className="marker marker-two">
            <span>02</span>
          </div>
          <div className="marker marker-three">
            <span>03</span>
          </div>
          <p className="art-caption">
            A story is
            <br />
            <strong>never one-dimensional.</strong>
          </p>
          <span className="art-index">MX / 001</span>
        </div>
      </section>

      {/* ── Statement ─────────────────────────────────────────────────── */}
      <section className="statement" aria-labelledby="statement-title">
        <p className="eyebrow">The Modexx point of view</p>
        <h2 id="statement-title">
          A digital monument is a story you can <span>step inside.</span>
        </h2>
        <p>
          We create structured, interactive experiences that make meaningful
          stories easier to enter, understand, and remember.
        </p>
      </section>

      {/* ── Process ───────────────────────────────────────────────────── */}
      <section className="process section-shell" id="how-it-works">
        <div className="section-intro">
          <p className="eyebrow">The experience</p>
          <h2>
            From first impression
            <br />
            to lasting memory.
          </h2>
        </div>
        <div className="steps">
          {steps.map((step) => (
            <div className="step" key={step.number}>
              <span className="step-number">{step.number}</span>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
              <ArrowUpRight />
            </div>
          ))}
        </div>
      </section>

      {/* ── Preview ───────────────────────────────────────────────────── */}
      <section className="preview section-shell">
        <div className="preview-copy">
          <p className="eyebrow">Try the format</p>
          <h2>
            Every detail opens
            <br />
            another door.
          </h2>
          <p>
            Tap a marker on this small preview to see how a story can unfold.
            The real monuments hold ten chapters, each connected to a bigger
            picture.
          </p>
          <Link className="text-link" href={monumentsHref}>
            Enter the collection <ArrowRight size={17} />
          </Link>
        </div>
        <div className="preview-card">
          <div className="preview-visual">
            <div className="preview-sculpture">
              <span />
              <span />
              <span />
            </div>
            {[1, 2, 3].map((n) => (
              <button
                key={n}
                className={`preview-marker marker-${n} ${
                  activeHotspot === n ? "active" : ""
                }`}
                onClick={() => setActiveHotspot(n)}
                aria-label={`Show sample story ${n}`}
              >
                {`0${n}`}
              </button>
            ))}
          </div>
          <div className="preview-story">
            <div>
              <span className="story-label">Chapter 0{activeHotspot}</span>
              <p>{demoStories[activeHotspot - 1]}</p>
            </div>
            <span className="story-progress">0{activeHotspot} / 03</span>
          </div>
        </div>
      </section>

      {/* ── Audience ──────────────────────────────────────────────────── */}
      <section className="audience section-shell" id="for">
        <div className="audience-heading">
          <p className="eyebrow">Made for meaningful stories</p>
          <h2>
            One platform.
            <br />
            <span>Many ways in.</span>
          </h2>
        </div>
        <div className="audience-list">
          {audiences.map(([number, title, text]) => (
            <div className="audience-row" key={number}>
              <span>{number}</span>
              <h3>{title}</h3>
              <p>{text}</p>
              <ArrowUpRight />
            </div>
          ))}
        </div>
      </section>

      {/* ── Closing ───────────────────────────────────────────────────── */}
      <section className="closing">
        <p className="eyebrow">Begin with curiosity</p>
        <h2>
          Your next discovery
          <br />
          <em>starts here.</em>
        </h2>
        <Link className="button button-light" href={monumentsHref}>
          {user ? "Explore monuments" : "Get started — it's free"}{" "}
          <ArrowRight size={17} />
        </Link>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────── */}
      <footer className="site-footer">
        <Link href="/" className="wordmark">
          mod<span>exx</span>
          <span className="wordmark-dot">.</span>
        </Link>
        <p>Digital monumental experiences for stories worth remembering.</p>
        <div className="footer-links">
          <a href="#how-it-works">How it works</a>
          <Link href={monumentsHref}>Monuments</Link>
          <a href="#for">Use cases</a>
          {!user && <Link href="/signin">Sign in</Link>}
        </div>
        <small>© 2026 Modexx. Built for meaningful stories.</small>
      </footer>
    </main>
  );
}
