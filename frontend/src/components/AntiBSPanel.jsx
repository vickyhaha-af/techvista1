import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ShieldCheck, AlertTriangle, Github, ExternalLink, Sparkles, CheckCircle, XCircle } from 'lucide-react'
import { analyzeAuthenticity } from '../utils/api'
import MagneticButton from './MagneticButton'
import NumberTicker from './NumberTicker'

function CircularProgress({ value, size = 100, strokeWidth = 8, color = 'var(--sage)' }) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (value / 100) * circumference

  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--cream-deep)" strokeWidth={strokeWidth} />
        <motion.circle
          cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke={color} strokeWidth={strokeWidth} strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column',
      }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 24, color: 'var(--ink)' }}>
          <NumberTicker value={value} />
        </span>
        <span style={{
          fontFamily: 'var(--font-sans)', fontSize: 11, color: 'var(--slate-mid)',
          textTransform: 'uppercase', letterSpacing: '0.05em',
        }}>Authentic</span>
      </div>
    </div>
  )
}

export default function AntiBSPanel({ resumeText, candidateName }) {
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [githubUrl, setGithubUrl] = useState('')
  const [kaggleUrl, setKaggleUrl] = useState('')

  const handleAnalyze = async () => {
    if (!resumeText) return
    setLoading(true)
    try {
      const res = await analyzeAuthenticity(resumeText, candidateName, githubUrl, kaggleUrl)
      setResult(res.data)
    } catch (err) {
      console.error('Authenticity analysis failed:', err)
    }
    setLoading(false)
  }

  const getScoreColor = (score) => {
    if (score >= 70) return 'var(--moss)'
    if (score >= 40) return 'var(--accent-education)'
    return 'var(--blush)'
  }

  return (
    <div className="card" style={{ padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 9,
          background: 'var(--sage-light)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <ShieldCheck size={18} style={{ color: 'var(--sage)' }} />
        </div>
        <div>
          <div className="text-h3">Anti-BS Authenticator</div>
          <div className="text-body-sm">Signal-to-noise analysis</div>
        </div>
      </div>

      {!result ? (
        <>
          <div style={{ marginBottom: 16 }}>
            <div className="section-label" style={{ marginBottom: 8 }}>PROOF OF WORK (OPTIONAL)</div>
            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <Github size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--slate-light)' }} />
                <input
                  className="input-field"
                  type="url"
                  placeholder="GitHub URL"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  style={{ paddingLeft: 36, fontSize: 13 }}
                />
              </div>
              <div style={{ flex: 1, position: 'relative' }}>
                <ExternalLink size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--slate-light)' }} />
                <input
                  className="input-field"
                  type="url"
                  placeholder="Kaggle URL"
                  value={kaggleUrl}
                  onChange={(e) => setKaggleUrl(e.target.value)}
                  style={{ paddingLeft: 36, fontSize: 13 }}
                />
              </div>
            </div>
          </div>

          <MagneticButton
            className="btn-primary"
            glow
            onClick={handleAnalyze}
            disabled={loading || !resumeText}
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
              <><Sparkles size={16} /> Analyze Proof of Work</>
            )}
          </MagneticButton>
        </>
      ) : (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 24,
            marginBottom: 20, paddingBottom: 20, borderBottom: '1px solid var(--border)'
          }}>
            <CircularProgress value={result.authenticity_score || 0} color={getScoreColor(result.authenticity_score || 0)} />
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--slate-mid)', marginBottom: 8 }}>
                Signal-to-Noise Ratio
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ flex: 1, height: 8, background: 'var(--cream-deep)', borderRadius: 4, overflow: 'hidden' }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(result.signal_to_noise_ratio || 0) * 100}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    style={{ height: '100%', background: 'linear-gradient(90deg, var(--blush), var(--sage))', borderRadius: 4 }}
                  />
                </div>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--ink)', minWidth: 40 }}>
                  {Math.round((result.signal_to_noise_ratio || 0) * 100)}%
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                <XCircle size={14} style={{ color: 'var(--blush)' }} />
                <span className="section-label" style={{ marginBottom: 0 }}>
                  FLUFF DETECTED ({result.fluff_words?.length || 0})
                </span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {(result.fluff_words || []).slice(0, 8).map((word, i) => (
                  <span key={i} className="chip gap" style={{ fontSize: 11 }}>{word}</span>
                ))}
              </div>
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                <CheckCircle size={14} style={{ color: 'var(--moss)' }} />
                <span className="section-label" style={{ marginBottom: 0 }}>
                  HARD OUTCOMES ({result.hard_outcomes?.length || 0})
                </span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {(result.hard_outcomes || []).slice(0, 8).map((outcome, i) => (
                  <span key={i} className="chip" style={{ fontSize: 11 }}>{outcome}</span>
                ))}
              </div>
            </div>
          </div>

          {result.verification_notes && (
            <div style={{
              marginTop: 16, padding: 12,
              background: 'var(--cream-mid)', borderRadius: 8,
              fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--slate)', lineHeight: 1.5
            }}>
              {result.verification_notes}
            </div>
          )}

          <MagneticButton
            className="btn-ghost"
            onClick={() => setResult(null)}
            style={{ marginTop: 16, width: '100%', justifyContent: 'center' }}
          >
            Analyze Again
          </MagneticButton>
        </motion.div>
      )}
    </div>
  )
}
