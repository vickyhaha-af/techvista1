import React, { useEffect, useRef, useState } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'
import {
  ArrowRight, Shield, BarChart3, Target, Play, Zap, Scale,
  Github, ArrowUpRight, CheckCircle
} from 'lucide-react'

/* ─── Spring button ─────────────────────────────────────────── */
function SpringBtn({ children, onClick, variant = 'primary', size = 'md', style = {} }) {
  const sizes = {
    sm: { h: 36, px: 16, fs: 13 },
    md: { h: 46, px: 24, fs: 15 },
    lg: { h: 56, px: 36, fs: 16 },
  }
  const s = sizes[size]
  const base = {
    display: 'inline-flex', alignItems: 'center', gap: 8,
    height: s.h, padding: `0 ${s.px}px`,
    fontSize: s.fs, fontFamily: 'var(--font-sans)', fontWeight: 600,
    border: 'none', borderRadius: 10, cursor: 'pointer',
    outline: 'none', whiteSpace: 'nowrap', letterSpacing: '-0.01em',
    ...style
  }
  const styles = {
    primary: {
      background: 'linear-gradient(135deg, #00E5A0 0%, #00B87A 100%)',
      color: '#050D0A',
      boxShadow: '0 0 30px rgba(0,229,160,0.35), 0 4px 16px rgba(0,229,160,0.2)',
    },
    ghost: {
      background: 'rgba(255,255,255,0.06)',
      color: 'rgba(255,255,255,0.85)',
      border: '1px solid rgba(255,255,255,0.12)',
    },
  }
  return (
    <motion.button
      style={{ ...base, ...styles[variant] }}
      whileHover={{ scale: 1.03, y: -1 }}
      whileTap={{ scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      onClick={onClick}
    >
      {children}
    </motion.button>
  )
}

/* ─── Count-up ──────────────────────────────────────────────── */
function CountUp({ to, suffix = '' }) {
  const [val, setVal] = useState(0)
  const ref = useRef(null)
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return
      let v = 0; const step = to / 50
      const t = setInterval(() => { v = Math.min(v + step, to); setVal(Math.round(v)); if (v >= to) clearInterval(t) }, 24)
    }, { threshold: 0.4 })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [to])
  return <span ref={ref}>{val}{suffix}</span>
}

/* ─── Spotlight card ────────────────────────────────────────── */
function GlowCard({ children, style = {}, delay = 0 }) {
  const ref = useRef(null)
  const mx = useMotionValue(0.5)
  const my = useMotionValue(0.5)
  const gx = useSpring(mx, { stiffness: 200, damping: 30 })
  const gy = useSpring(my, { stiffness: 200, damping: 30 })
  const [hover, setHover] = useState(false)

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.5 }}
      onMouseMove={e => {
        const r = ref.current.getBoundingClientRect()
        mx.set((e.clientX - r.left) / r.width)
        my.set((e.clientY - r.top) / r.height)
        setHover(true)
      }}
      onMouseLeave={() => { mx.set(0.5); my.set(0.5); setHover(false) }}
      style={{
        position: 'relative', borderRadius: 16, overflow: 'hidden',
        background: 'rgba(255,255,255,0.035)',
        border: '1px solid rgba(255,255,255,0.08)',
        transition: 'border-color 200ms',
        ...(hover ? { borderColor: 'rgba(0,229,160,0.25)' } : {}),
        ...style,
      }}
    >
      {/* Spotlight */}
      <motion.div
        style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: `radial-gradient(400px circle at ${gx.get() * 100}% ${gy.get() * 100}%, rgba(0,229,160,0.10), transparent 60%)`,
          opacity: hover ? 1 : 0, transition: 'opacity 250ms',
        }}
      />
      <div style={{ position: 'relative', zIndex: 1 }}>{children}</div>
    </motion.div>
  )
}

/* ─── Data ───────────────────────────────────────────────────── */
const FEATURES = [
  { icon: Zap, title: 'Semantic AI Scoring', desc: 'Gemini embeddings rank by meaning, not keywords — across Skills, Experience, and Education.', large: true },
  { icon: Shield, title: 'Statistical Bias Audit', desc: 'Mann-Whitney U & Kruskal-Wallis tests detect institution-tier and experience-cohort bias.', large: false },
  { icon: Target, title: 'Skill Gap Analysis', desc: 'Per-candidate breakdown of matched, adjacent, and missing JD requirements.', large: false },
  { icon: BarChart3, title: 'Explainable AI', desc: 'Every score has a plain-English rationale from Gemini Flash — no black-box decisions.', large: true },
  { icon: Scale, title: 'HR-in-the-Loop Weights', desc: 'Adjust Skills / Experience / Education weighting in real-time.', large: false },
  { icon: ArrowRight, title: 'DPDPA-Compliant Exports', desc: 'PDF reports and CSV exports strip raw resume text — data minimisation built in.', large: false },
]

const STEPS = [
  { n: '01', title: 'Upload JD + Resumes', desc: 'Paste or upload any PDF / DOCX. Up to 50 resumes at once.' },
  { n: '02', title: 'AI Analyses & Scores', desc: 'Gemini parses, embeds, and ranks all candidates in ~60 seconds.' },
  { n: '03', title: 'Bias Audit Runs', desc: 'Statistical tests detect systemic bias and normalise if flagged.' },
  { n: '04', title: 'Export & Share', desc: 'Download a branded PDF report or CSV.' },
]

const BADGES = ['No signup required', 'Works in your browser', 'Results in <90s', 'DPDPA 2023 Compliant']

/* ─── Main Component ────────────────────────────────────────── */
export default function LandingPage({ onStart }) {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])

  return (
    <div style={{ background: '#080B14', color: '#E8EBF0', minHeight: '100vh', overflowX: 'hidden' }}>

      {/* ── Navbar ─────────────────────────────────────────── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, height: 60, zIndex: 1000,
        background: scrolled ? 'rgba(8,11,20,0.88)' : 'transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(255,255,255,0.07)' : '1px solid transparent',
        display: 'flex', alignItems: 'center', padding: '0 48px',
        justifyContent: 'space-between',
        transition: 'all 300ms ease',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'linear-gradient(135deg, #00E5A0 0%, #00897B 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12, color: '#050D0A',
            boxShadow: '0 0 16px rgba(0,229,160,0.4)',
          }}>TV</div>
          <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 16, color: '#fff', letterSpacing: '-0.02em' }}>
            Tech Vista
          </span>
          <span style={{
            fontFamily: 'var(--font-sans)', fontSize: 11, color: 'rgba(255,255,255,0.35)',
            marginLeft: 2, letterSpacing: '0.02em'
          }}>by M S Vikram</span>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <a href="http://localhost:8000/docs" target="_blank" rel="noopener noreferrer" style={{
            fontFamily: 'var(--font-sans)', fontSize: 13, color: 'rgba(255,255,255,0.55)',
            textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4,
            padding: '6px 12px', borderRadius: 8,
          }}>API Docs <ArrowUpRight size={12} /></a>
          <SpringBtn onClick={onStart} size="sm">
            Get Started <ArrowRight size={14} />
          </SpringBtn>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section style={{ position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', overflow: 'hidden' }}>

        {/* Mesh grid */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 0,
          backgroundImage: `linear-gradient(rgba(0,229,160,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,229,160,0.04) 1px, transparent 1px)`,
          backgroundSize: '64px 64px',
          maskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, black 0%, transparent 80%)',
        }} />

        {/* Aurora blobs — VISIBLE on dark bg */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
          <motion.div animate={{ x: [0, 80, 40, 0], y: [0, 60, 120, 0], scale: [1, 1.15, 0.9, 1] }}
            transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
            style={{ position: 'absolute', width: '55vw', height: '55vw', borderRadius: '50%', filter: 'blur(100px)', opacity: 0.18, background: 'radial-gradient(circle, #00E5A0 0%, transparent 65%)', top: '-15%', left: '-10%' }} />
          <motion.div animate={{ x: [0, -60, -30, 0], y: [0, 80, 40, 0], scale: [1, 0.85, 1.1, 1] }}
            transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut', delay: 2.5 }}
            style={{ position: 'absolute', width: '45vw', height: '45vw', borderRadius: '50%', filter: 'blur(100px)', opacity: 0.15, background: 'radial-gradient(circle, #6C63FF 0%, transparent 65%)', top: '5%', right: '-10%' }} />
          <motion.div animate={{ x: [0, 50, -20, 0], y: [0, -50, -80, 0], scale: [1, 1.05, 0.95, 1] }}
            transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut', delay: 5 }}
            style={{ position: 'absolute', width: '40vw', height: '40vw', borderRadius: '50%', filter: 'blur(120px)', opacity: 0.12, background: 'radial-gradient(circle, #00B4D8 0%, transparent 65%)', bottom: '-5%', left: '25%' }} />
        </div>

        {/* Hero content */}
        <div style={{ position: 'relative', zIndex: 10, maxWidth: 800, padding: '0 24px' }}>

          {/* Badge row */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
            style={{ display: 'flex', justifyContent: 'center', marginBottom: 32 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: 'rgba(0,229,160,0.1)', border: '1px solid rgba(0,229,160,0.25)',
              borderRadius: 999, padding: '6px 16px',
              fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 12,
              color: '#00E5A0', letterSpacing: '0.06em', textTransform: 'uppercase',
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#00E5A0', boxShadow: '0 0 8px #00E5A0' }} />
              Powered by Gemini Flash · DPDPA 2023 Compliant
            </div>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            style={{
              fontFamily: 'var(--font-display)', fontWeight: 700,
              fontSize: 'clamp(42px, 6.5vw, 76px)',
              lineHeight: 1.04, letterSpacing: '-2.5px',
              marginBottom: 24, color: '#fff',
            }}
          >
            Resume screening that<br />
            <span style={{
              background: 'linear-gradient(135deg, #00E5A0 0%, #00B4D8 50%, #6C63FF 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              audits its own bias
            </span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.35 }}
            style={{
              fontFamily: 'var(--font-sans)', fontSize: 18, lineHeight: 1.7,
              color: 'rgba(255,255,255,0.5)', maxWidth: 520, margin: '0 auto 40px',
            }}
          >
            Upload a JD and up to 50 resumes. Gemini AI scores candidates
            semantically, then statistical tests flag bias before the shortlist leaves your desk.
          </motion.p>

          {/* CTA buttons */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 40 }}
          >
            <SpringBtn onClick={onStart} size="lg">
              Start Screening <ArrowRight size={18} />
            </SpringBtn>
            <SpringBtn variant="ghost" size="lg" onClick={() => {
              window.dispatchEvent(new CustomEvent('load-demo'))
              onStart()
            }}>
              <Play size={15} /> See Demo Results
            </SpringBtn>
          </motion.div>

          {/* Trust badges */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            style={{ display: 'flex', gap: 20, justifyContent: 'center', flexWrap: 'wrap' }}
          >
            {BADGES.map(b => (
              <span key={b} style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                fontFamily: 'var(--font-sans)', fontSize: 13, color: 'rgba(255,255,255,0.4)',
              }}>
                <CheckCircle size={13} color="#00E5A0" /> {b}
              </span>
            ))}
          </motion.div>
        </div>

        {/* Bottom fade */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 160, zIndex: 5,
          background: 'linear-gradient(to bottom, transparent, #080B14)',
          pointerEvents: 'none',
        }} />
      </section>

      {/* ── Stats strip ──────────────────────────────────────── */}
      <section style={{
        borderTop: '1px solid rgba(255,255,255,0.07)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        padding: '36px 48px',
        background: 'rgba(255,255,255,0.02)',
      }}>
        <div style={{
          maxWidth: 860, margin: '0 auto',
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
        }}>
          {[
            { to: 50, suffix: '+', label: 'Resumes per batch' },
            { to: 60, suffix: 's', label: 'Avg. processing time' },
            { to: 3, suffix: ' dims', label: 'Scoring dimensions' },
            { to: 2, suffix: ' tests', label: 'Bias audit tests' },
          ].map((s, i) => (
            <div key={i} style={{
              textAlign: 'center', padding: '8px 0',
              borderRight: i < 3 ? '1px solid rgba(255,255,255,0.07)' : 'none'
            }}>
              <div style={{
                fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 38,
                background: 'linear-gradient(135deg, #00E5A0, #00B4D8)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                backgroundClip: 'text', lineHeight: 1
              }}>
                <CountUp to={s.to} suffix={s.suffix} />
              </div>
              <div style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 6, letterSpacing: '0.04em' }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────── */}
      <section style={{ padding: '100px 48px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{
            display: 'inline-block', fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 11,
            color: '#00E5A0', letterSpacing: '0.1em', textTransform: 'uppercase',
            marginBottom: 16, textAlign: 'center', width: '100%'
          }}>HOW IT WORKS</div>
          <h2 style={{
            fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 38,
            color: '#fff', textAlign: 'center', marginBottom: 64,
            letterSpacing: '-1px',
          }}>
            From upload to shortlist<br />
            <span style={{ color: 'rgba(255,255,255,0.4)' }}>in four steps</span>
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 2, position: 'relative' }}>
            {/* Connector line */}
            <div style={{
              position: 'absolute', top: 22, left: '12.5%', right: '12.5%', height: 1,
              background: 'linear-gradient(90deg, transparent, rgba(0,229,160,0.3), rgba(0,229,160,0.3), transparent)',
            }} />
            {STEPS.map((s, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.45 }}
                style={{ padding: '0 16px', textAlign: 'center' }}
              >
                <div style={{
                  width: 44, height: 44, borderRadius: '50%', margin: '0 auto 20px',
                  background: 'rgba(0,229,160,0.08)', border: '1px solid rgba(0,229,160,0.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 13, color: '#00E5A0',
                  position: 'relative', zIndex: 1,
                }}>{s.n}</div>
                <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 14, color: '#fff', marginBottom: 8 }}>{s.title}</div>
                <div style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'rgba(255,255,255,0.38)', lineHeight: 1.6 }}>{s.desc}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features — Glassmorphism Bento ───────────────────── */}
      <section style={{
        padding: '0 48px 100px',
        background: 'linear-gradient(180deg, #080B14 0%, #0C1020 100%)',
      }}>
        <div style={{ maxWidth: 1040, margin: '0 auto' }}>
          <div style={{
            fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 11,
            color: '#00E5A0', letterSpacing: '0.1em', textTransform: 'uppercase',
            marginBottom: 16, textAlign: 'center'
          }}>FEATURES</div>
          <h2 style={{
            fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 38,
            color: '#fff', textAlign: 'center', marginBottom: 52,
            letterSpacing: '-1px',
          }}>Everything a fair hiring team needs</h2>

          {/* Bento grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 16 }}>
            {/* Large card 7 cols */}
            <GlowCard style={{ gridColumn: 'span 7', padding: 36 }} delay={0}>
              <div style={{
                width: 48, height: 48, borderRadius: 12,
                background: 'rgba(0,229,160,0.1)', border: '1px solid rgba(0,229,160,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#00E5A0', marginBottom: 20
              }}><Zap size={22} /></div>
              <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 20, color: '#fff', marginBottom: 10, letterSpacing: '-0.3px' }}>Semantic AI Scoring</div>
              <div style={{ fontFamily: 'var(--font-sans)', fontSize: 14, color: 'rgba(255,255,255,0.45)', lineHeight: 1.7 }}>
                Gemini <code style={{ background: 'rgba(0,229,160,0.1)', color: '#00E5A0', borderRadius: 4, padding: '1px 6px', fontSize: 12 }}>text-embedding-004</code> ranks candidates by semantic meaning — not keyword frequency — across Skills, Experience and Education dimensions.
              </div>
            </GlowCard>

            {/* Medium 5 cols */}
            <GlowCard style={{ gridColumn: 'span 5', padding: 28 }} delay={0.06}>
              <div style={{ width: 44, height: 44, borderRadius: 11, background: 'rgba(108,99,255,0.15)', border: '1px solid rgba(108,99,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#A78BFF', marginBottom: 16 }}><Shield size={20} /></div>
              <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 17, color: '#fff', marginBottom: 8 }}>Statistical Bias Audit</div>
              <div style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'rgba(255,255,255,0.4)', lineHeight: 1.65 }}>Mann-Whitney U & Kruskal-Wallis tests detect institution-tier and experience-cohort bias. Scores are normalised if flagged.</div>
            </GlowCard>

            {/* Medium 5 cols */}
            <GlowCard style={{ gridColumn: 'span 5', padding: 28 }} delay={0.1}>
              <div style={{ width: 44, height: 44, borderRadius: 11, background: 'rgba(0,180,216,0.12)', border: '1px solid rgba(0,180,216,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38D1F5', marginBottom: 16 }}><Target size={20} /></div>
              <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 17, color: '#fff', marginBottom: 8 }}>Skill Gap Analysis</div>
              <div style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'rgba(255,255,255,0.4)', lineHeight: 1.65 }}>Per-candidate matched, adjacent, and missing skill breakdown with AI reasoning — instantly visible.</div>
            </GlowCard>

            {/* Large 7 cols */}
            <GlowCard style={{ gridColumn: 'span 7', padding: 36 }} delay={0.14}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(255,184,0,0.1)', border: '1px solid rgba(255,184,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFB800', marginBottom: 20 }}><BarChart3 size={22} /></div>
              <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 20, color: '#fff', marginBottom: 10, letterSpacing: '-0.3px' }}>Explainable AI</div>
              <div style={{ fontFamily: 'var(--font-sans)', fontSize: 14, color: 'rgba(255,255,255,0.45)', lineHeight: 1.7 }}>Gemini Flash generates plain-English rationale for every score decision. Every hire/reject recommendation is backed by a human-readable explanation, not just a number.</div>
            </GlowCard>

            {/* Small 6 cols */}
            <GlowCard style={{ gridColumn: 'span 6', padding: 24 }} delay={0.18}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(0,229,160,0.08)', border: '1px solid rgba(0,229,160,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00E5A0', marginBottom: 14 }}><Scale size={18} /></div>
              <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 15, color: '#fff', marginBottom: 6 }}>HR-in-the-Loop Weights</div>
              <div style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'rgba(255,255,255,0.38)', lineHeight: 1.6 }}>Adjust dimension weights in real-time. Scores recalculate server-side instantly.</div>
            </GlowCard>

            <GlowCard style={{ gridColumn: 'span 6', padding: 24 }} delay={0.22}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(255,100,100,0.08)', border: '1px solid rgba(255,100,100,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FF7A7A', marginBottom: 14 }}><ArrowRight size={18} /></div>
              <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 15, color: '#fff', marginBottom: 6 }}>DPDPA-Compliant Exports</div>
              <div style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'rgba(255,255,255,0.38)', lineHeight: 1.6 }}>PDF & CSV exports strip raw resume text. Data minimisation is enforced, not optional.</div>
            </GlowCard>
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────── */}
      <section style={{
        padding: '100px 48px',
        textAlign: 'center',
        background: 'radial-gradient(ellipse 80% 60% at 50% 100%, rgba(0,229,160,0.07) 0%, transparent 70%)',
        borderTop: '1px solid rgba(255,255,255,0.06)',
      }}>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#00E5A0', marginBottom: 20, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Get Started
          </div>
          <h2 style={{
            fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 46,
            color: '#fff', marginBottom: 16, lineHeight: 1.1, letterSpacing: '-1.5px',
          }}>
            Screen smarter.<br />
            <span style={{ color: 'rgba(255,255,255,0.3)' }}>Ship fair shortlists.</span>
          </h2>
          <p style={{
            fontFamily: 'var(--font-sans)', fontSize: 16, color: 'rgba(255,255,255,0.4)',
            marginBottom: 40,
          }}>No signup. No credit card. In your browser in 30 seconds.</p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <SpringBtn onClick={onStart} size="lg">
              Start Free Screening <ArrowRight size={18} />
            </SpringBtn>
            <SpringBtn variant="ghost" size="lg" onClick={() => {
              window.dispatchEvent(new CustomEvent('load-demo'))
              onStart()
            }}>
              <Play size={15} /> View Demo Results
            </SpringBtn>
          </div>
        </motion.div>
      </section>

      {/* ── Footer ─────────────────────────────────────────── */}
      <footer style={{
        borderTop: '1px solid rgba(255,255,255,0.07)',
        padding: '24px 48px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: '#060810',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 20, height: 20, borderRadius: 5, background: 'linear-gradient(135deg, #00E5A0, #00897B)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 700, color: '#050D0A' }}>TV</div>
          <span style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'rgba(255,255,255,0.25)' }}>
            Tech Vista · Built by M S Vikram · Bias-Aware AI Resume Screening
          </span>
        </div>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'rgba(255,255,255,0.2)' }}>
          v2.0.0 · Gemini Flash 2.0 + text-embedding-004
        </span>
      </footer>
    </div>
  )
}
