import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Users, Puzzle, CheckCircle, AlertCircle, Sparkles } from 'lucide-react'
import { matchTeamTopology } from '../utils/api'
import MagneticButton from './MagneticButton'
import NumberTicker from './NumberTicker'

function StreamingText({ text, onComplete }) {
  const [displayedText, setDisplayedText] = useState('')

  React.useEffect(() => {
    if (!text) return
    let index = 0
    const interval = setInterval(() => {
      setDisplayedText(text.slice(0, index + 1))
      index++
      if (index >= text.length) { clearInterval(interval); onComplete?.() }
    }, 20)
    return () => clearInterval(interval)
  }, [text])

  return (
    <span style={{ fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--slate)', lineHeight: 1.6 }}>
      {displayedText}
      <motion.span
        animate={{ opacity: [1, 0] }}
        transition={{ duration: 0.5, repeat: Infinity }}
        style={{ display: 'inline-block', marginLeft: 2, color: 'var(--sage)' }}
      >|</motion.span>
    </span>
  )
}

export default function TeamTopologyPanel({ resumeText, jdText, candidateName }) {
  const [teamContext, setTeamContext] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

  const handleAnalyze = async () => {
    if (!resumeText || !jdText || !teamContext.trim()) return
    setLoading(true)
    setResult(null)
    try {
      const res = await matchTeamTopology(resumeText, jdText, teamContext, candidateName)
      setResult(res.data)
      setIsStreaming(true)
    } catch (err) {
      console.error('Topology match failed:', err)
    }
    setLoading(false)
  }

  const getFitColor = (score) => {
    if (score >= 70) return 'var(--moss)'
    if (score >= 40) return 'var(--accent-education)'
    return 'var(--blush)'
  }

  return (
    <motion.div
      initial={{ width: 48 }}
      animate={{ width: isExpanded ? 360 : 48 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      style={{
        position: 'fixed', right: 0, top: '50%', transform: 'translateY(-50%)',
        background: 'var(--white)', border: '1px solid var(--border)',
        borderRight: 'none', borderRadius: '12px 0 0 12px',
        boxShadow: 'var(--shadow-elevated)', overflow: 'hidden', zIndex: 50,
      }}
    >
      {/* Toggle Tab */}
      <motion.button
        onClick={() => setIsExpanded(!isExpanded)}
        whileHover={{ backgroundColor: 'var(--sage-light)' }}
        style={{
          position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)',
          width: 48, height: 120,
          background: 'transparent', border: 'none', cursor: 'pointer',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8,
          borderRadius: '12px 0 0 12px',
        }}
      >
        <Puzzle size={20} style={{ color: 'var(--sage)' }} />
        <span style={{
          writingMode: 'vertical-rl', textOrientation: 'mixed',
          fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 600,
          color: 'var(--slate-mid)', letterSpacing: '0.05em',
        }}>TEAM FIT</span>
      </motion.button>

      {/* Panel Content */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: isExpanded ? 1 : 0 }}
        style={{ marginLeft: 48, padding: 20, height: '100%', maxHeight: 500, overflowY: 'auto' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <Users size={20} style={{ color: 'var(--sage)' }} />
          <div className="text-h3">Team Topology</div>
        </div>

        {!result ? (
          <>
            <div className="section-label" style={{ marginBottom: 8 }}>DESCRIBE YOUR TEAM</div>
            <textarea
              className="input-field"
              placeholder="e.g., Heavy on API design, lacking DevOps. Need someone who can bridge backend and infrastructure..."
              value={teamContext}
              onChange={(e) => setTeamContext(e.target.value)}
              style={{ minHeight: 100, fontSize: 13, resize: 'none', marginBottom: 12 }}
            />
            <MagneticButton
              className="btn-primary"
              glow
              onClick={handleAnalyze}
              disabled={loading || !teamContext.trim() || !resumeText}
              style={{ width: '100%', justifyContent: 'center' }}
            >
              {loading ? (
                <>
                  <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                    <Sparkles size={16} />
                  </motion.span>
                  Analyzing...
                </>
              ) : (
                <><Sparkles size={16} /> Analyze Team Fit</>
              )}
            </MagneticButton>
          </>
        ) : (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            {/* Fit Score */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12,
              marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid var(--border)'
            }}>
              <div style={{
                width: 60, height: 60, borderRadius: '50%',
                background: `linear-gradient(135deg, ${getFitColor(result.fit_score)}22, ${getFitColor(result.fit_score)}44)`,
                border: `2px solid ${getFitColor(result.fit_score)}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 20,
                color: getFitColor(result.fit_score),
              }}>
                <NumberTicker value={result.fit_score || 0} />
              </div>
              <div>
                <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 15, color: 'var(--ink)', marginBottom: 4 }}>
                  {result.fit_score >= 70 ? 'Strong Fit' : result.fit_score >= 40 ? 'Moderate Fit' : 'Weak Fit'}
                </div>
                <div style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--slate-mid)' }}>Team topology match</div>
              </div>
            </div>

            {result.fills_gaps?.length > 0 && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <CheckCircle size={14} style={{ color: 'var(--moss)' }} />
                  <span className="section-label" style={{ marginBottom: 0 }}>FILLS GAPS</span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {result.fills_gaps.map((gap, i) => (
                    <span key={i} className="chip" style={{ fontSize: 11 }}>{gap}</span>
                  ))}
                </div>
              </div>
            )}

            {result.overlaps?.length > 0 && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <AlertCircle size={14} style={{ color: 'var(--slate-mid)' }} />
                  <span className="section-label" style={{ marginBottom: 0 }}>OVERLAPS</span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {result.overlaps.map((overlap, i) => (
                    <span key={i} className="chip gap" style={{ fontSize: 11 }}>{overlap}</span>
                  ))}
                </div>
              </div>
            )}

            <div style={{ padding: 12, background: 'var(--sage-pale)', borderRadius: 8, marginTop: 12 }}>
              {isStreaming ? (
                <StreamingText text={result.recommendation} onComplete={() => setIsStreaming(false)} />
              ) : (
                <span style={{ fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--slate)', lineHeight: 1.6 }}>
                  {result.recommendation}
                </span>
              )}
            </div>

            <MagneticButton
              className="btn-ghost"
              onClick={() => { setResult(null); setTeamContext('') }}
              style={{ marginTop: 12, width: '100%', justifyContent: 'center' }}
            >
              Analyze Again
            </MagneticButton>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  )
}
