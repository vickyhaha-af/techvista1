import React from 'react'
import { motion } from 'framer-motion'
import { Check, Award } from 'lucide-react'

function ScoringTable({
  scores,
  selectedCandidate,
  selectedIndex,
  onSelect,
  comparisonCandidates, // array of max 2 cands
  onToggleComparison
}) {
  const getScoreColor = (score) => {
    if (score >= 80) return 'score-excellent'
    if (score >= 60) return 'score-good'
    if (score >= 40) return 'score-moderate'
    return 'score-low'
  }

  const getRankBadgeProps = (rank) => {
    if (rank === 1) return { color: '#fbbf24', bg: 'rgba(251, 191, 36, 0.15)' } 
    if (rank === 2) return { color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.15)' }
    if (rank === 3) return { color: '#b45309', bg: 'rgba(180, 83, 9, 0.15)' } 
    return { color: 'var(--slate-mid)', bg: 'var(--cream-mid)' }
  }

  return (
    <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ overflowX: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: 60, textAlign: 'center' }}>Rank</th>
              <th style={{ width: 80, textAlign: 'center', color: 'var(--sage)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                  <Award size={12} /> AI Compare
                </div>
              </th>
              <th>Candidate Name</th>
              <th>Match Score</th>
              <th>Skills</th>
              <th>Exp</th>
              <th>Edu</th>
              <th>Bias Audit</th>
            </tr>
          </thead>
          <tbody>
            {scores.map((c, i) => {
              const isSelected = selectedIndex === i
              const isComparing = comparisonCandidates.some(comp => comp.candidate_name === c.candidate_name)
              const rb = getRankBadgeProps(c.rank)
              
              return (
                <motion.tr
                  key={c.candidate_name}
                  onClick={() => onSelect(c, i)}
                  className={isSelected ? 'selected' : ''}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <td style={{ textAlign: 'center' }}>
                    <motion.div 
                      whileHover={{ scale: 1.1 }}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        background: rb.bg,
                        color: rb.color,
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                      }}>
                      {c.rank}
                    </motion.div>
                  </td>
                  <td onClick={e => {
                    e.stopPropagation()
                    onToggleComparison(c)}
                  } style={{ cursor: 'pointer' }}>
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      title={isComparing ? "Remove from comparison" : "Select for 1v1 comparison"}
                      style={{
                        width: 22, height: 22, borderRadius: 6,
                        border: `2px solid ${isComparing ? 'var(--sage)' : 'var(--border-dark)'}`,
                        background: isComparing ? 'var(--sage)' : 'var(--white)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer',
                        boxShadow: isComparing ? '0 0 8px rgba(74,124,111,0.3)' : 'none',
                        transition: 'all 0.2s ease',
                        margin: '0 auto'
                      }}
                    >
                      {isComparing && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}><Check size={14} color="var(--cream)" strokeWidth={3} /></motion.div>}
                    </motion.div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--ink)' }}>
                      {c.candidate_name.replace('.pdf', '')}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className={getScoreColor(c.composite_score)} style={{ fontWeight: 800, fontSize: '1.1rem' }}>
                        {c.composite_score.toFixed(1)}%
                      </span>
                      {c.adjusted ? (
                        <div className="tooltip" data-tip="Auto-normalized for bias correction">
                          <Award size={14} style={{ color: 'var(--accent-primary)' }} />
                        </div>
                      ) : null}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '80px' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{c.skills_score.toFixed(1)}</span>
                      <div className="score-bar">
                        <div className="score-bar-fill" style={{ width: `${c.skills_score}%`, background: '#6366f1' }} />
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '80px' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{c.experience_score.toFixed(1)}</span>
                      <div className="score-bar">
                        <div className="score-bar-fill" style={{ width: `${c.experience_score}%`, background: '#10b981' }} />
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '80px' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{c.education_score.toFixed(1)}</span>
                      <div className="score-bar">
                        <div className="score-bar-fill" style={{ width: `${c.education_score}%`, background: '#f59e0b' }} />
                      </div>
                    </div>
                  </td>
                  <td>
                    {c.adjusted ? (
                      <span style={{ 
                        background: 'var(--blush-pale)', color: 'var(--blush)', 
                        padding: '2px 8px', borderRadius: 12, fontSize: 11, fontFamily: 'var(--font-mono)' 
                      }}>Adjusted</span>
                    ) : (
                      <span style={{ 
                        background: 'var(--moss-pale)', color: 'var(--moss)', 
                        padding: '2px 8px', borderRadius: 12, fontSize: 11, fontFamily: 'var(--font-mono)' 
                      }}>Clear</span>
                    )}
                  </td>
                </motion.tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default ScoringTable
