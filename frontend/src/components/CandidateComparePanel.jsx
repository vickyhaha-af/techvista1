import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ArrowRight, BarChart2, Zap, GraduationCap, Briefcase, RefreshCw } from 'lucide-react'
import { compareCandidates } from '../utils/api'

/**
 * CandidateComparePanel — supports 2-4 candidates.
 * Tries the API first; falls back to client-side score comparison for demo mode.
 */
export default function CandidateComparePanel({ isOpen, onClose, sessionId, candidates = [] }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (isOpen && candidates.length >= 2) {
      fetchComparison()
    }
  }, [isOpen, candidates.length])

  const buildClientSideComparison = () => {
    // Build comparison data entirely from the candidate score objects
    const dims = ['skills', 'experience', 'education']
    const dimScoreKey = { skills: 'skills_score', experience: 'experience_score', education: 'education_score' }
    
    // For each candidate, build a profile
    const profiles = candidates.map(c => ({
      candidate_name: c.candidate_name,
      composite_score: c.composite_score || 0,
      skills_score: c.skills_score || 0,
      experience_score: c.experience_score || 0,
      education_score: c.education_score || 0,
      experience_years: c.experience_years || 0,
      experience_cohort: c.experience_cohort || 'N/A',
      institution_tier: c.institution_tier || 'tier_3',
      matched_skills: c.matched_skills || [],
    }))

    // Find highest scorer
    const best = profiles.reduce((a, b) => a.composite_score > b.composite_score ? a : b)
    const worst = profiles.reduce((a, b) => a.composite_score < b.composite_score ? a : b)
    const gap = best.composite_score - worst.composite_score
    
    // Score comparison table
    const dimComparison = dims.map(dim => {
      const key = dimScoreKey[dim]
      const scores = profiles.map(p => ({ name: p.candidate_name, score: p[key] }))
      const maxScore = Math.max(...scores.map(s => s.score))
      const minScore = Math.min(...scores.map(s => s.score))
      return { dimension: dim, scores, gap: maxScore - minScore, maxScore, minScore }
    })

    // Primary driver
    const primaryDriver = dimComparison.reduce((a, b) => a.gap > b.gap ? a : b).dimension

    // Generate narrative
    const narrative = gap > 15
      ? `${best.candidate_name} leads with a composite score of ${best.composite_score.toFixed(1)}%, outperforming the group by ${gap.toFixed(1)}pp. The primary differentiator is ${primaryDriver}, where ${best.candidate_name} demonstrates a clear advantage. ${worst.candidate_name} trails at ${worst.composite_score.toFixed(1)}% — the gap suggests fundamentally different levels of alignment with the role requirements.`
      : gap > 5
      ? `The candidates are competitive, with ${best.candidate_name} (${best.composite_score.toFixed(1)}%) holding a modest ${gap.toFixed(1)}pp edge over ${worst.candidate_name} (${worst.composite_score.toFixed(1)}%). The ${primaryDriver} dimension shows the most variance. A technical interview would be recommended to differentiate further.`
      : `These candidates are closely matched (within ${gap.toFixed(1)}pp). No single dimension strongly separates them. Cultural fit, communication skills, and growth potential should be weighted more heavily in the final decision.`

    return { profiles, dimComparison, primaryDriver, narrative, gap }
  }

  const fetchComparison = async () => {
    setLoading(true)
    setError(null)
    try {
      // Only try API for 2-candidate comparison (API supports 2 only)
      if (candidates.length === 2) {
        const res = await compareCandidates(sessionId, candidates[0].candidate_name, candidates[1].candidate_name)
        setData({ type: 'api', ...res.data })
        setLoading(false)
        return
      }
    } catch (err) {
      // Fall through to client-side
    }
    
    // Client-side fallback for demo mode or >2 candidates
    try {
      const result = buildClientSideComparison()
      setData({ type: 'client', ...result })
    } catch (err) {
      setError('Failed to compare candidates')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  const getDimColor = (dim) => {
    switch (dim) {
      case 'skills': return 'var(--accent-skills)'
      case 'experience': return 'var(--accent-experience)'
      case 'education': return 'var(--accent-education)'
      default: return 'var(--slate)'
    }
  }

  const getDimIcon = (dim) => {
    switch (dim) {
      case 'skills': return <Zap size={14} />
      case 'experience': return <Briefcase size={14} />
      case 'education': return <GraduationCap size={14} />
      default: return <BarChart2 size={14} />
    }
  }

  const renderClientComparison = () => {
    if (!data || data.type !== 'client') return null
    const { profiles, dimComparison, narrative } = data

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
        {/* Candidate Cards Row */}
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${profiles.length}, 1fr)`, gap: 12 }}>
          {profiles.map((p, idx) => {
            const isTop = p.composite_score === Math.max(...profiles.map(x => x.composite_score))
            return (
              <motion.div key={p.candidate_name}
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.08 }}
                style={{
                  background: isTop ? 'var(--sage-pale)' : 'var(--white)',
                  border: `1px solid ${isTop ? 'var(--sage)' : 'var(--border)'}`,
                  borderRadius: 12, padding: 18, textAlign: 'center'
                }}
              >
                <div style={{
                  width: 36, height: 36, borderRadius: '50%', margin: '0 auto 10px',
                  background: isTop ? 'var(--sage)' : 'var(--slate-light)',
                  color: 'var(--white)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 16, fontWeight: 700, fontFamily: 'var(--font-display)'
                }}>
                  {p.candidate_name.charAt(0)}
                </div>
                <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 14, color: 'var(--ink)', marginBottom: 4 }}>
                  {p.candidate_name}
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 26, color: isTop ? 'var(--sage)' : 'var(--ink)', fontWeight: 600 }}>
                  {p.composite_score.toFixed(1)}%
                </div>
                <div style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: 'var(--slate-mid)', marginTop: 4 }}>
                  {p.experience_years.toFixed(1)} yrs · {(p.experience_cohort || '').replace('_', ' ')}
                </div>
                {isTop && (
                  <div style={{
                    marginTop: 8, fontFamily: 'var(--font-sans)', fontSize: 10, fontWeight: 600,
                    color: 'var(--sage)', textTransform: 'uppercase', letterSpacing: '0.08em'
                  }}>★ Top Scorer</div>
                )}
              </motion.div>
            )
          })}
        </div>

        {/* AI Narrative */}
        <div style={{
          background: 'var(--sage-pale)', padding: 20, borderRadius: 12,
          borderLeft: '4px solid var(--sage)', fontFamily: 'var(--font-sans)', fontSize: 14, lineHeight: 1.6, color: 'var(--ink)'
        }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--sage)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Analysis Summary</div>
          {narrative}
        </div>

        {/* Dimension Comparison Table */}
        <div>
          <h3 style={{ fontFamily: 'var(--font-sans)', fontSize: 15, fontWeight: 600, color: 'var(--ink)', marginBottom: 16 }}>
            Dimension-by-Dimension Breakdown
          </h3>
          {dimComparison.map(({ dimension, scores, gap }) => (
            <div key={dimension} style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10, fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>
                <span style={{ color: getDimColor(dimension) }}>{getDimIcon(dimension)}</span>
                <span style={{ textTransform: 'capitalize' }}>{dimension}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--slate-mid)', fontWeight: 400, marginLeft: 'auto' }}>
                  Spread: {gap.toFixed(1)}pp
                </span>
              </div>
              {scores.map((s, i) => {
                const maxScore = Math.max(...scores.map(x => x.score))
                const isMax = s.score === maxScore
                return (
                  <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <span style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--slate-mid)', width: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flexShrink: 0 }}>
                      {s.name.split(' ')[0]}
                    </span>
                    <div style={{ flex: 1, height: 8, borderRadius: 4, background: 'var(--cream-deep)', overflow: 'hidden' }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${s.score}%` }}
                        transition={{ duration: 0.6, delay: i * 0.05 }}
                        style={{ height: '100%', borderRadius: 4, background: isMax ? getDimColor(dimension) : 'var(--slate-light)' }}
                      />
                    </div>
                    <span style={{
                      fontFamily: 'var(--font-mono)', fontSize: 12, width: 38, textAlign: 'right', flexShrink: 0,
                      color: isMax ? getDimColor(dimension) : 'var(--slate-mid)', fontWeight: isMax ? 700 : 400
                    }}>
                      {s.score.toFixed(0)}%
                    </span>
                  </div>
                )
              })}
            </div>
          ))}
        </div>

        {/* Skills Overlap */}
        <div>
          <h3 style={{ fontFamily: 'var(--font-sans)', fontSize: 15, fontWeight: 600, color: 'var(--ink)', marginBottom: 16 }}>
            Skills Overlap
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${profiles.length}, 1fr)`, gap: 12 }}>
            {profiles.map(p => (
              <div key={p.candidate_name}>
                <div style={{ fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 600, color: 'var(--slate-mid)', marginBottom: 8 }}>
                  {p.candidate_name.split(' ')[0]}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {(p.matched_skills || []).slice(0, 6).map(sk => (
                    <span key={sk} style={{
                      background: 'rgba(74,124,111,0.1)', border: '1px solid rgba(74,124,111,0.25)',
                      borderRadius: 4, fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--moss)', padding: '2px 6px'
                    }}>{sk}</span>
                  ))}
                  {(!p.matched_skills || p.matched_skills.length === 0) && (
                    <span style={{ fontSize: 11, color: 'var(--slate-light)', fontFamily: 'var(--font-sans)' }}>No matched skills</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const renderApiComparison = () => {
    if (!data || data.type !== 'api') return null
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
        {/* Header Matchup */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--white)', padding: 24, borderRadius: 12, border: '1px solid var(--border)' }}>
          <div style={{ textAlign: 'center', flex: 1 }}>
            <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 16, color: 'var(--ink)' }}>{data.candidate_A.candidate_name}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 28, color: 'var(--moss)' }}>{data.candidate_A.composite_score.toFixed(1)}%</div>
          </div>
          <div style={{ fontSize: 14, color: 'var(--slate-light)', fontFamily: 'var(--font-serif)', fontStyle: 'italic', padding: '0 16px' }}>vs</div>
          <div style={{ textAlign: 'center', flex: 1 }}>
            <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 16, color: 'var(--ink)' }}>{data.candidate_B.candidate_name}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 28, color: 'var(--moss)' }}>{data.candidate_B.composite_score.toFixed(1)}%</div>
          </div>
        </div>

        {/* Narrative */}
        <div style={{
          background: 'var(--sage-pale)', padding: 20, borderRadius: 12,
          borderLeft: '4px solid var(--sage)', fontFamily: 'var(--font-sans)', fontSize: 14, lineHeight: 1.6, color: 'var(--ink)'
        }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--sage)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>AI Analyst Insight</div>
          {data.narrative}
        </div>

        {/* Dimension Gaps — reuse existing data.dimensions */}
        {data.dimensions && Object.entries(data.dimensions).map(([dim, stats]) => {
          const MAX_GAP = 50
          const gapWidth = Math.abs((stats.gap / MAX_GAP) * 50)
          return (
            <div key={dim} style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontFamily: 'var(--font-sans)', fontWeight: 600, color: 'var(--ink)' }}>
                  <span style={{ color: getDimColor(dim) }}>{getDimIcon(dim)}</span>
                  <span style={{ textTransform: 'capitalize' }}>{dim} Gap</span>
                </div>
                <div style={{ fontSize: 13, fontFamily: 'var(--font-mono)', color: stats.significant ? 'var(--moss)' : 'var(--slate-mid)', fontWeight: stats.significant ? 600 : 400 }}>
                  {stats.gap > 0 ? '+' : ''}{stats.gap.toFixed(1)}pp{stats.significant && ' (Sig.*)'}
                </div>
              </div>
              <div style={{ position: 'relative', height: 24, background: 'var(--cream-mid)', borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, bottom: 0, left: '50%', width: 1, background: 'var(--border-dark)', zIndex: 1 }} />
                <motion.div initial={{ width: 0 }} animate={{ width: `${gapWidth}%` }} transition={{ duration: 0.6 }}
                  style={{ position: 'absolute', top: 6, bottom: 6, left: stats.gap > 0 ? '50%' : `${50 - gapWidth}%`, background: getDimColor(dim), borderRadius: 4 }} />
              </div>
            </div>
          )
        })}

        {/* Stacked bar */}
        {data.composite && (
          <div>
            <h3 style={{ fontFamily: 'var(--font-sans)', fontSize: 15, fontWeight: 600, color: 'var(--ink)', marginBottom: 8 }}>
              Delta Decomposition
            </h3>
            <div style={{ display: 'flex', height: 32, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border)' }}>
              {[
                { pct: data.composite.skills_share_pct, color: 'var(--accent-skills)', label: 'Skills' },
                { pct: data.composite.exp_share_pct, color: 'var(--accent-experience)', label: 'Exp' },
                { pct: data.composite.edu_share_pct, color: 'var(--accent-education)', label: 'Edu' },
              ].map(({ pct, color, label }) => (
                <motion.div key={label} initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                  style={{ background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 11, fontFamily: 'var(--font-mono)' }}>
                  {pct > 10 && `${pct.toFixed(0)}%`}
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(21, 26, 24, 0.4)', backdropFilter: 'blur(4px)',
          zIndex: 1000, display: 'flex', justifyContent: 'flex-end'
        }}
        onClick={onClose}
      >
        <motion.div
          initial={{ x: '100%', opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          style={{
            width: '90%', maxWidth: 760, background: 'var(--cream)',
            borderLeft: '1px solid var(--border)', height: '100%',
            display: 'flex', flexDirection: 'column'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--border)', background: 'var(--white)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div className="section-label">EXPLAINABLE AI</div>
              <h2 className="text-h2" style={{ margin: '4px 0 0 0', fontSize: 22 }}>
                Comparing {candidates.length} Candidates
              </h2>
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--slate)', padding: 8, borderRadius: '50%' }}>
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div style={{ flex: 1, overflowY: 'auto', padding: 32 }}>
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--sage)' }}>
                <RefreshCw size={24} className="spin-anim" style={{ marginBottom: 16 }} />
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>Analyzing candidates...</div>
              </div>
            ) : error ? (
              <div style={{ color: 'var(--blush)', fontFamily: 'var(--font-sans)', fontSize: 14 }}>{error}</div>
            ) : data ? (
              data.type === 'api' ? renderApiComparison() : renderClientComparison()
            ) : null}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
