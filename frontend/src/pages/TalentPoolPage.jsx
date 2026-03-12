import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Database, Search, ArrowRight, UserPlus, Zap } from 'lucide-react'
import { searchTalentPool, getTalentPoolStats, storeToTalentPool } from '../utils/api'
import MagneticButton from '../components/MagneticButton'

export default function TalentPoolPage({ sessionData, isActiveConfig }) {
  const [stats, setStats] = useState(null)
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  
  const [isStoring, setIsStoring] = useState(false)
  const [storeResult, setStoreResult] = useState(null)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const res = await getTalentPoolStats()
      setStats(res.data)
    } catch (err) {
      console.warn("Failed to load talent pool stats:", err)
    }
  }

  const handleSearch = async () => {
    if (!sessionData?.session_id) {
      setError("No active JD session found. Please upload a JD on the Dashboard first.")
      return
    }
    
    setLoading(true)
    setError(null)
    try {
      const res = await searchTalentPool(sessionData.session_id, 10)
      setResults(res.data.results)
      if (res.data.results.length === 0) {
        setError("No matching candidates found in the archive.")
      }
    } catch (err) {
      setError(err?.response?.data?.detail || "Failed to search talent pool. Ensure Supabase is configured.")
    } finally {
      setLoading(false)
    }
  }

  const handleStore = async () => {
    if (!sessionData?.session_id || !sessionData?.scores) return
    setIsStoring(true)
    setStoreResult(null)
    try {
      const candidatesToStore = sessionData.scores.map(s => s.candidate_name)
      const pipelineStages = sessionData.scores.reduce((acc, curr) => {
        acc[curr.candidate_name] = curr.stage || 'new'
        return acc
      }, {})
      
      const res = await storeToTalentPool(sessionData.session_id, candidatesToStore, pipelineStages)
      setStoreResult(res.data)
      fetchStats() // refresh numbers
    } catch (err) {
      setError(err?.response?.data?.detail || "Failed to store candidates. Ensure Supabase is configured.")
    } finally {
      setIsStoring(false)
    }
  }

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: 1000, margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 40 }}>
          <div>
            <div className="section-label">RESUME REDISCOVERY</div>
            <h1 className="text-h1" style={{ fontSize: 32, margin: '8px 0', display: 'flex', alignItems: 'center', gap: 12 }}>
              <Database size={28} color="var(--sage)" /> Global Talent Pool
            </h1>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--slate)', maxWidth: 600, lineHeight: 1.6 }}>
              Unearth top candidates from past roles who perfectly match your <em>current</em> requirements, automatically adjusted for time-decay and prior interview progression.
            </p>
          </div>
          
          {/* Active Session Sync */}
          {sessionData && (
            <div style={{ background: 'var(--white)', padding: '16px 20px', borderRadius: 12, border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 12, minWidth: 280 }}>
              <div style={{ fontSize: 12, fontFamily: 'var(--font-sans)', fontWeight: 600, color: 'var(--slate-mid)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Active Session Sync
              </div>
              <MagneticButton className="btn-secondary" onClick={handleStore} disabled={isStoring}>
                {isStoring ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
                    <Search className="spin-anim" size={16} /> Archiving {sessionData.scores?.length || 0} candidates...
                  </span>
                ) : (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
                    <Database size={16} /> Store Current Batch to Pool
                  </span>
                )}
              </MagneticButton>
              {storeResult && (
                <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--sage)', textAlign: 'center' }}>
                  {storeResult.stored} new added, {storeResult.updated} updated
                </div>
              )}
            </div>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 280px', gap: 32 }}>
          
          {/* Main Content Area */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            
            {/* Search Action */}
            <div style={{ background: 'var(--white)', padding: 24, borderRadius: 16, border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ fontFamily: 'var(--font-sans)', fontSize: 16, fontWeight: 600, color: 'var(--ink)' }}>Query pgvector Archive</h3>
                <p style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--slate-mid)', marginTop: 4 }}>
                  Find candidates matching the JD: <strong style={{ color: 'var(--sage)' }}>{sessionData?.jd?.title || 'Unknown Role'}</strong>
                </p>
              </div>
              <MagneticButton className="btn-primary" onClick={handleSearch} disabled={loading || !sessionData}>
                {loading ? 'Semantic Searching...' : 'Run Vector Search'} <Search size={16} style={{ marginLeft: 6 }} />
              </MagneticButton>
            </div>

            {error && (
              <div style={{ padding: 16, background: 'var(--blush-pale)', color: 'var(--blush)', borderRadius: 12, fontFamily: 'var(--font-sans)', fontSize: 14 }}>
                {error}
              </div>
            )}

            {/* Results */}
            <AnimatePresence>
              {results.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <h3 style={{ fontFamily: 'var(--font-sans)', fontSize: 15, fontWeight: 600, color: 'var(--slate)', margin: '16px 0 8px 0', borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
                    Top {results.length} Matches (Decay Adjusted)
                  </h3>
                  
                  {results.map((c, i) => (
                    <motion.div 
                      key={c.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      style={{ 
                        background: 'var(--white)', padding: 20, borderRadius: 12, 
                        border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 20,
                        position: 'relative', overflow: 'hidden'
                      }}
                    >
                      {/* Left Rank */}
                      <div style={{ 
                        width: 40, height: 40, borderRadius: '50%', background: 'var(--sage-pale)', 
                        color: 'var(--sage)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 16
                      }}>
                        {i + 1}
                      </div>

                      {/* Info */}
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 4 }}>
                          <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 16, color: 'var(--ink)' }}>{c.candidate_name}</span>
                          <span style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--slate-mid)', padding: '2px 8px', background: 'var(--cream-mid)', borderRadius: 12 }}>
                            Originally: {c.original_role}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--slate)' }}>
                          <span>Past Stage: <strong style={{ color: 'var(--ink)' }}>{c.stage_reached}</strong></span>
                          <span>•</span>
                          <span>Screened: {c.recency_label}</span>
                        </div>
                        <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
                          {c.skills_preview && c.skills_preview.map((skill, j) => (
                            <span key={j} style={{ fontFamily: 'var(--font-mono)', fontSize: 10, background: 'var(--cream)', border: '1px solid var(--border)', padding: '2px 8px', borderRadius: 4, color: 'var(--slate-mid)' }}>
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Scores */}
                      <div style={{ textAlign: 'right', minWidth: 120 }}>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 24, fontWeight: 700, color: 'var(--moss)', lineHeight: 1.1 }}>
                          {c.adjusted_score.toFixed(1)}%
                        </div>
                        <div style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: 'var(--slate-light)', marginTop: 4 }}>
                          Raw Semantic: {c.raw_similarity.toFixed(1)}%
                        </div>
                        {c.decay_factor < 0.99 && (
                          <div style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: 'var(--blush)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4, marginTop: 4 }}>
                            Time Decay: -{Math.round((1 - c.decay_factor)*100)}%
                          </div>
                        )}
                      </div>

                      {/* Re-screen Action */}
                      <div style={{ borderLeft: '1px solid var(--border)', paddingLeft: 20, marginLeft: 10 }}>
                         <MagneticButton className="btn-secondary" style={{ padding: '8px', borderRadius: '50%' }}>
                           <UserPlus size={16} color="var(--sage)" />
                         </MagneticButton>
                      </div>

                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

          </div>

          {/* Right Metrics Panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {stats && (
              <>
                <div style={{ background: 'var(--white)', padding: 20, borderRadius: 12, border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 11, fontFamily: 'var(--font-sans)', fontWeight: 600, color: 'var(--slate-mid)', textTransform: 'uppercase', marginBottom: 8 }}>Total Archive</div>
                  <div style={{ fontSize: 28, fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--ink)' }}>{stats.total_candidates}</div>
                  <div style={{ fontSize: 13, fontFamily: 'var(--font-sans)', color: 'var(--slate-light)', marginTop: 4 }}>Across {stats.roles_represented} distinct roles</div>
                </div>

                <div style={{ background: 'var(--white)', padding: 20, borderRadius: 12, border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 11, fontFamily: 'var(--font-sans)', fontWeight: 600, color: 'var(--slate-mid)', textTransform: 'uppercase', marginBottom: 12 }}>Stage Distribution</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontFamily: 'var(--font-sans)', color: 'var(--slate)' }}>
                      <span>Interviewed</span>
                      <strong>{stats.stage_distribution?.interview || 0}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontFamily: 'var(--font-sans)', color: 'var(--slate)' }}>
                      <span>Shortlisted</span>
                      <strong>{stats.stage_distribution?.shortlisted || 0}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontFamily: 'var(--font-sans)', color: 'var(--slate)' }}>
                      <span>Rejected</span>
                      <strong>{stats.stage_distribution?.rejected || 0}</strong>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
          
        </div>

      </div>
    </div>
  )
}
