import React, { useState, useMemo, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  User, ChevronDown, ChevronUp, Search, Shield, ArrowRight,
  GitCompare, Target, CheckSquare, Square, FileText, Scale,
  Play, Sparkles, Columns, Database, Mail
} from 'lucide-react'
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { useSession } from '../App'
import { useToast } from '../components/Toast'
import { recalculateScores } from '../utils/api'
import CandidateComparison from '../components/CandidateComparison'
import SkillGapCard from '../components/SkillGapCard'
import JDQualityCard from '../components/JDQualityCard'
import ShortcutsModal from '../components/ShortcutsModal'
import DemoTour from '../components/DemoTour'
import BiasAuditPanel from '../components/BiasAuditPanel'
import { ScoreTicker } from '../components/NumberTicker'
import { initShortcuts } from '../utils/shortcuts'
// Advanced Hiring OS Features
import KanbanBoard from '../components/KanbanBoard'
import TalentPoolPage from './TalentPoolPage'
import CandidateComparePanel from '../components/CandidateComparePanel'
import SentenceAttribution from '../components/SentenceAttribution'
import MagneticButton from '../components/MagneticButton'

function getScoreLevel(score) {
  if (score >= 70) return 'high'
  if (score >= 40) return 'mid'
  return 'low'
}

function ResultsPage() {
  const { sessionData, setSessionData, goToExport, startNew } = useSession()
  const toast = useToast()
  const [selectedIdx, setSelectedIdx] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('composite_score')
  const [expandedDim, setExpandedDim] = useState('skills')
  const [showWeightModal, setShowWeightModal] = useState(false)
  const [tempWeights, setTempWeights] = useState({ skills: 50, experience: 30, education: 20 })
  const [shortlisted, setShortlisted] = useState(new Set())
  const [compareMode, setCompareMode] = useState(false)
  const [compareSet, setCompareSet] = useState(new Set())
  const [showComparison, setShowComparison] = useState(false)
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [activeTab, setActiveTab] = useState('detail')
  const [showWelcome, setShowWelcome] = useState(() => !!sessionData?.is_demo)
  const [showTour, setShowTour] = useState(false)
  const [hoveredDim, setHoveredDim] = useState(null)

  // AI Comparison (Feature 2)
  const [aiCompareSet, setAiCompareSet] = useState([])
  const [isAiCompareOpen, setIsAiCompareOpen] = useState(false)

  const scores = sessionData?.scores || []
  const biasAudit = sessionData?.bias_audit
  const jdQuality = sessionData?.jd_quality

  // Filter & sort
  const filteredScores = useMemo(() => {
    let result = [...scores]
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(s =>
        s.candidate_name.toLowerCase().includes(q) ||
        (s.matched_skills || []).some(sk => sk.toLowerCase().includes(q))
      )
    }
    result.sort((a, b) => (b[sortBy] || 0) - (a[sortBy] || 0))
    return result
  }, [scores, searchQuery, sortBy])

  const selected = filteredScores[selectedIdx] || filteredScores[0] || null
  const jdTitle = sessionData?.jd?.title || 'Position'
  const shortlistedCandidates = scores.filter(s => shortlisted.has(s.candidate_name))

  // Navigate candidates
  const navigateUp = useCallback(() => {
    setSelectedIdx(i => Math.max(0, i - 1))
  }, [])
  const navigateDown = useCallback(() => {
    setSelectedIdx(i => Math.min(filteredScores.length - 1, i + 1))
  }, [filteredScores.length])

  // Keyboard shortcuts
  useEffect(() => {
    return initShortcuts({
      navigate_up: navigateUp,
      navigate_down: navigateDown,
      export: () => goToExport(),
      compare: () => compareSet.size >= 2 && setShowComparison(true),
      theme: () => document.documentElement.classList.toggle('dark'),
      help: () => setShowShortcuts(s => !s),
      close: () => {
        setShowWeightModal(false)
        setShowComparison(false)
        setShowShortcuts(false)
        setIsAiCompareOpen(false)
      },
    })
  }, [navigateUp, navigateDown, compareSet.size, goToExport])

  // AI Comparison toggle (max 2)
  const handleToggleAiCompare = (candidate) => {
    setAiCompareSet(prev => {
      const exists = prev.find(c => c.candidate_name === candidate.candidate_name)
      if (exists) return prev.filter(c => c.candidate_name !== candidate.candidate_name)
      if (prev.length >= 4) return prev
      return [...prev, candidate]
    })
  }

  // Weight re-run
  const handleRerun = async () => {
    try {
      const w = {
        skills: tempWeights.skills / 100,
        experience: tempWeights.experience / 100,
        education: tempWeights.education / 100,
      }
      const res = await recalculateScores(sessionData.session_id, w)
      setSessionData(res.data)
      setShowWeightModal(false)
      toast('Scores recalculated with new weights', 'success')
    } catch (err) {
      console.error('Re-run failed:', err)
      toast('Recalculation failed — try again', 'error')
    }
  }

  // Shortlist toggle
  const toggleShortlist = (name) => {
    setShortlisted(prev => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })
  }

  // Compare toggle
  const toggleCompare = (name) => {
    setCompareSet(prev => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else if (next.size < 4) next.add(name)
      return next
    })
  }

  // Score distribution data
  const distData = useMemo(() => {
    const buckets = [
      { range: '0-20', raw: 0, norm: 0 },
      { range: '20-40', raw: 0, norm: 0 },
      { range: '40-60', raw: 0, norm: 0 },
      { range: '60-80', raw: 0, norm: 0 },
      { range: '80-100', raw: 0, norm: 0 },
    ]
    scores.forEach(s => {
      const bi = Math.min(4, Math.floor(s.composite_score / 20))
      buckets[bi].raw++
      if (s.normalized_score != null) {
        const ni = Math.min(4, Math.floor(s.normalized_score / 20))
        buckets[ni].norm++
      }
    })
    return buckets
  }, [scores])

  const dims = [
    { key: 'skills', label: 'Skills', color: 'var(--accent-skills)', scoreKey: 'skills_score', weight: sessionData?.weights?.skills || 0.5 },
    { key: 'experience', label: 'Experience', color: 'var(--accent-experience)', scoreKey: 'experience_score', weight: sessionData?.weights?.experience || 0.3 },
    { key: 'education', label: 'Education', color: 'var(--accent-education)', scoreKey: 'education_score', weight: sessionData?.weights?.education || 0.2 },
  ]

  if (!sessionData || scores.length === 0) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: 'calc(100vh - 56px)', flexDirection: 'column', gap: 16
      }}>
        <User size={48} style={{ color: 'var(--slate-light)' }} />
        <p style={{ fontFamily: 'var(--font-sans)', fontSize: 15, color: 'var(--slate-mid)' }}>
          No screening data. Start a new screening.
        </p>
        <button className="btn-primary" onClick={startNew}>Go to Upload</button>
      </div>
    )
  }

  const compareCandidates = scores.filter(s => compareSet.has(s.candidate_name))

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22 }}
      style={{ background: 'var(--cream)', height: 'calc(100vh - 56px)', display: 'flex', flexDirection: 'column' }}
    >
      {/* Top Bar */}
      <div style={{
        height: 52, background: 'var(--white)',
        borderBottom: '1px solid var(--border)',
        padding: '0 32px', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0
      }}>
        <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 16, color: 'var(--ink)' }}>
          Screening Results
        </span>
        <span className="chip" style={{ borderRadius: 'var(--radius-pill)' }}>{jdTitle}</span>
        <span style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--slate-mid)' }}>
          {scores.length} candidates
        </span>
        {shortlisted.size > 0 && (
          <span style={{
            background: 'var(--sage-light)', color: 'var(--sage)',
            borderRadius: 'var(--radius-pill)',
            fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 11,
            padding: '3px 10px', border: '1px solid rgba(74,124,111,0.2)'
          }}>
            {shortlisted.size} shortlisted
          </span>
        )}

        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          {/* Compare toggle */}
          <button
            className={compareMode ? 'btn-primary' : 'btn-secondary'}
            onClick={() => { setCompareMode(c => !c); setCompareSet(new Set()) }}
            style={{ height: 32, fontSize: 12, padding: '0 12px', gap: 6 }}
          >
            <GitCompare size={13} />
            {compareMode ? 'Exit Compare' : 'Compare'}
          </button>
          {compareMode && compareSet.size >= 2 && (
            <button
              className="btn-primary"
              onClick={() => setShowComparison(true)}
              style={{ height: 32, fontSize: 12, padding: '0 12px' }}
            >
              View ({compareSet.size})
            </button>
          )}
          <button className="btn-secondary" onClick={() => setShowWeightModal(true)}
            style={{ height: 32, fontSize: 12, padding: '0 12px' }}>
            Re-weight
          </button>
          <button className="btn-ghost" onClick={() => {
            if (window.confirm('Start a new screening?')) startNew()
          }} style={{ height: 32, fontSize: 12 }}>
            New screening
          </button>
        </div>
      </div>

      {/* Three Column Layout */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* LEFT SIDEBAR — Candidate Rankings */}
        <div style={{
          width: 272, background: 'var(--white)',
          borderRight: '1px solid var(--border)',
          display: 'flex', flexDirection: 'column',
          overflowY: 'auto', flexShrink: 0
        }}>
          <div style={{ padding: '16px 16px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="section-label" style={{ marginBottom: 0 }}>{scores.length} CANDIDATES</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{
                  background: 'var(--cream-mid)', border: '1px solid var(--border)',
                  borderRadius: 6, padding: '4px 10px',
                  fontFamily: 'var(--font-sans)', fontWeight: 500, fontSize: 11,
                  color: 'var(--slate)', cursor: 'pointer', outline: 'none'
                }}
              >
                <option value="composite_score">Composite</option>
                <option value="skills_score">Skills</option>
                <option value="experience_score">Experience</option>
                <option value="education_score">Education</option>
              </select>
            </div>
            <div style={{ position: 'relative', marginTop: 8 }}>
              <Search size={13} style={{
                position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)',
                color: 'var(--slate-light)'
              }} />
              <input
                className="input-field"
                placeholder="Search name or skill..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ height: 32, fontSize: 12, paddingLeft: 26 }}
              />
            </div>
          </div>
          <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '10px 0 0' }} />

          {/* Shortlist filter shortcut */}
          {shortlisted.size > 0 && (
            <div style={{ padding: '6px 16px', background: 'var(--sage-pale)', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: 'var(--sage)', fontWeight: 500 }}>
                ✓ {shortlisted.size} shortlisted
              </span>
            </div>
          )}

          <div style={{ flex: 1, overflowY: 'auto' }}>
            {filteredScores.map((s, i) => {
              const isSelected = selectedIdx === i
              const isShortlisted = shortlisted.has(s.candidate_name)
              const isInCompare = compareSet.has(s.candidate_name)
              const isInAiCompare = aiCompareSet.some(c => c.candidate_name === s.candidate_name)
              const rankNum = s.rank || i + 1
              return (
                <div
                  key={s.candidate_name}
                  onClick={() => setSelectedIdx(i)}
                  style={{
                    padding: '11px 16px', cursor: 'pointer',
                    transition: 'all 120ms',
                    background: isSelected ? 'var(--sage-pale)' : 'var(--white)',
                    borderLeft: isSelected ? '3px solid var(--sage)' : '3px solid transparent',
                    borderBottom: '1px solid var(--cream-deep)',
                    position: 'relative'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    {/* Shortlist checkbox */}
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleShortlist(s.candidate_name) }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: isShortlisted ? 'var(--sage)' : 'var(--slate-light)', flexShrink: 0 }}
                      title={isShortlisted ? 'Remove from shortlist' : 'Add to shortlist'}
                    >
                      {isShortlisted ? <CheckSquare size={13} /> : <Square size={13} />}
                    </button>

                    <span style={{
                      fontFamily: 'var(--font-mono)', fontWeight: 500, fontSize: 12,
                      color: rankNum === 1 ? 'var(--sage)' : 'var(--slate-light)',
                      width: 24, flexShrink: 0
                    }}>#{rankNum}</span>
                    <span style={{
                      fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 13,
                      color: rankNum === 1 ? 'var(--sage)' : 'var(--ink)',
                      flex: 1, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis'
                    }}>{s.candidate_name}</span>
                    <span className={`score-pill ${getScoreLevel(s.composite_score)}`} style={{ fontSize: 11 }}>
                      <ScoreTicker value={s.composite_score} decimals={0} />
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', marginTop: 2, marginLeft: 44, gap: 4 }}>
                    <span style={{
                      fontFamily: 'var(--font-sans)', fontSize: 11, color: 'var(--slate-light)',
                      overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', flex: 1
                    }}>
                      {(s.matched_skills || []).slice(0, 3).join(' · ') || 'No matched skills'}
                    </span>
                    {s.bias_flag && <Scale size={11} style={{ color: 'var(--slate-light)', flexShrink: 0 }} title="Score normalised for fairness" />}
                    <button
                      onClick={(e) => { e.stopPropagation(); handleToggleAiCompare(s) }}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0,
                        color: isInAiCompare ? 'var(--sage)' : 'var(--slate-light)',
                        transition: 'color 150ms, transform 150ms',
                        transform: isInAiCompare ? 'scale(1.2)' : 'scale(1)'
                      }}
                      title={isInAiCompare ? 'Remove from AI comparison' : 'Add to AI comparison'}
                    >
                      <GitCompare size={11} />
                    </button>
                  </div>

                  {/* Compare checkbox */}
                  {compareMode && (
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleCompare(s.candidate_name) }}
                      style={{
                        position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                        background: isInCompare ? 'var(--sage)' : 'var(--cream-mid)',
                        color: isInCompare ? '#fff' : 'var(--slate-light)',
                        border: `1px solid ${isInCompare ? 'var(--sage)' : 'var(--border)'}`,
                        borderRadius: 4, width: 22, height: 22, fontSize: 10,
                        cursor: 'pointer', fontFamily: 'var(--font-mono)', fontWeight: 600,
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}
                    >
                      {isInCompare ? '✓' : '+'}
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* MAIN PANEL — Candidate Detail with tabs */}
        <div style={{ flex: 1, overflowY: 'auto', background: 'var(--cream)' }}>
          {/* Tab bar */}
          <div style={{
            display: 'flex', gap: 0, background: 'var(--white)',
            borderBottom: '1px solid var(--border)', paddingLeft: 32
          }}>
            {[
              { key: 'detail', label: 'Candidate Detail', icon: User },
              { key: 'skillgap', label: 'Skill Gap', icon: Target },
              { key: 'jdquality', label: 'JD Quality', icon: FileText },
              { key: 'kanban', label: 'Pipeline Board', icon: Columns },
              { key: 'talent-pool', label: 'Talent Pool', icon: Database },
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 6,
                  fontFamily: 'var(--font-sans)', fontWeight: activeTab === key ? 600 : 400, fontSize: 13,
                  color: activeTab === key ? 'var(--sage)' : 'var(--slate-mid)',
                  borderBottom: activeTab === key ? '2px solid var(--sage)' : '2px solid transparent',
                  transition: 'all 150ms', marginBottom: -1
                }}
              >
                <Icon size={13} />
                {label}
              </button>
            ))}
          </div>

          <div style={{ padding: '28px 32px' }}>
            <AnimatePresence mode="wait">
              {activeTab === 'kanban' ? (
                <motion.div key="kanban" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <KanbanBoard sessionId={sessionData?.session_id} candidates={scores} />
                </motion.div>
              ) : activeTab === 'talent-pool' ? (
                <motion.div key="talent-pool" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <TalentPoolPage sessionData={sessionData} />
                </motion.div>
              ) : activeTab === 'skillgap' ? (
                <motion.div key="skillgap" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <SkillGapCard candidate={selected} />
                </motion.div>
              ) : activeTab === 'jdquality' ? (
                <motion.div key="jdquality" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <JDQualityCard jdQuality={jdQuality} />
                  {!jdQuality && (
                    <p style={{ fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--slate-mid)', marginTop: 16 }}>
                      JD quality data not available for this session.
                    </p>
                  )}
                </motion.div>
              ) : !selected ? (
                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 400, gap: 12 }}>
                  <User size={48} style={{ color: 'var(--slate-light)' }} />
                  <p style={{ fontFamily: 'var(--font-sans)', fontSize: 15, color: 'var(--slate-mid)' }}>Select a candidate</p>
                </motion.div>
              ) : (
                <motion.div key={selected.candidate_name} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  {/* ──── ENHANCED CANDIDATE HEADER ──── */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                        <div style={{
                          width: 42, height: 42, borderRadius: '50%',
                          background: 'var(--sage-light)', color: 'var(--sage)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 18, fontFamily: 'var(--font-display)', fontWeight: 700
                        }}>
                          {selected.candidate_name.charAt(0)}
                        </div>
                        <div>
                          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 24, color: 'var(--ink)', margin: 0 }}>
                            {selected.candidate_name}
                          </h2>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3 }}>
                            <span style={{
                              fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--sage)',
                              background: 'var(--sage-pale)', padding: '2px 8px', borderRadius: 'var(--radius-pill)', fontWeight: 600
                            }}>
                              {(selected.experience_cohort || 'fresher').replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </span>
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--slate-mid)' }}>
                              {selected.experience_years?.toFixed(1) || '0'} yrs exp
                            </span>
                            <span style={{ fontSize: 11, color: 'var(--slate-light)' }}>•</span>
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--slate-mid)' }}>
                              {(selected.institution_tier || 'tier_3').replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                      <div>
                        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 500, fontSize: 42, color: 'var(--ink)', lineHeight: 1 }}>
                          {selected.composite_score.toFixed(1)}%
                        </span>
                        <div className="section-label" style={{ marginBottom: 0, marginTop: 2 }}>COMPOSITE SCORE</div>
                      </div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          onClick={() => toggleShortlist(selected.candidate_name)}
                          className={shortlisted.has(selected.candidate_name) ? 'btn-primary' : 'btn-secondary'}
                          style={{ height: 28, fontSize: 11, padding: '0 10px', gap: 5 }}
                        >
                          {shortlisted.has(selected.candidate_name) ? <CheckSquare size={11} /> : <Square size={11} />}
                          {shortlisted.has(selected.candidate_name) ? 'Shortlisted' : 'Shortlist'}
                        </button>
                        <button
                          onClick={() => handleToggleAiCompare(selected)}
                          className={aiCompareSet.some(c => c.candidate_name === selected.candidate_name) ? 'btn-primary' : 'btn-secondary'}
                          style={{ height: 28, fontSize: 11, padding: '0 10px', gap: 5 }}
                        >
                          <GitCompare size={11} /> AI Compare
                        </button>
                      </div>
                    </div>
                  </div>

                  <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '20px 0' }} />

                  {/* ──── SCORE BREAKDOWN (Visual Bars) ──── */}
                  <div className="section-label">DIMENSION SCORES</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginTop: 8 }}
                    onMouseLeave={() => setHoveredDim(null)}
                  >
                    {dims.map((dim, di) => {
                      const score = selected[dim.scoreKey] || 0
                      const isHovered = hoveredDim === dim.key
                      const isDimmed = hoveredDim !== null && !isHovered
                      return (
                        <motion.div
                          key={dim.key}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{
                            opacity: isDimmed ? 0.5 : 1, y: 0,
                            scale: isHovered ? 1.03 : isDimmed ? 0.97 : 1
                          }}
                          transition={{ delay: di * 0.1, scale: { type: 'spring', stiffness: 400, damping: 25 } }}
                          onMouseEnter={() => setHoveredDim(dim.key)}
                          style={{
                            background: 'var(--white)', border: '1px solid var(--border)',
                            borderRadius: 'var(--radius-card)', padding: 18,
                            position: 'relative', overflow: 'hidden', cursor: 'pointer',
                          }}
                        >
                          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: dim.color }} />
                          <div style={{ paddingLeft: 12 }}>
                            <div className="section-label" style={{ marginBottom: 4 }}>{dim.label.toUpperCase()}</div>
                            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 500, fontSize: 30, color: 'var(--ink)' }}>
                              {score.toFixed(0)}%
                            </span>
                            <span style={{
                              display: 'inline-block', marginLeft: 8,
                              background: 'var(--cream-mid)', color: 'var(--slate-mid)',
                              borderRadius: 'var(--radius-tag)', fontFamily: 'var(--font-sans)', fontSize: 10, padding: '2px 6px'
                            }}>{Math.round(dim.weight * 100)}% wt</span>
                          </div>
                          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: 'var(--cream-deep)' }}>
                            <motion.div initial={{ width: 0 }} animate={{ width: `${score}%` }} transition={{ duration: 0.7, ease: 'easeOut', delay: 0.2 }}
                              style={{ height: '100%', background: dim.color }} />
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>

                  {/* ──── AI ANALYSIS NARRATIVE ──── */}
                  <div style={{ marginTop: 24 }}>
                    <div className="section-label">AI ANALYSIS SUMMARY</div>
                    <div style={{
                      background: 'var(--sage-pale)', borderLeft: '4px solid var(--sage)',
                      borderRadius: '0 8px 8px 0', padding: '16px 20px', marginTop: 8,
                    }}>
                      <p style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--ink)', lineHeight: 1.7, margin: 0 }}>
                        {selected.composite_score >= 80
                          ? `${selected.candidate_name} is a strong match for this role. With ${selected.experience_years?.toFixed(1) || '0'} years of experience and a composite score of ${selected.composite_score.toFixed(1)}%, this candidate demonstrates excellent alignment across all evaluation dimensions. Their skills profile shows particularly strong overlap with the required tech stack, and their experience level places them in the ${(selected.experience_cohort || 'mid_level').replace('_', ' ')} cohort. Recommended for immediate shortlisting.`
                          : selected.composite_score >= 60
                          ? `${selected.candidate_name} shows solid potential for this role with a ${selected.composite_score.toFixed(1)}% composite score. Their ${selected.experience_years?.toFixed(1) || '0'} years of experience provide a strong foundation, though some skill gaps exist in the required stack. As a ${(selected.experience_cohort || 'mid_level').replace('_', ' ')} candidate from a ${(selected.institution_tier || 'tier_3').replace('_', ' ')} institution, they could benefit from targeted upskilling. Consider for a technical screening round.`
                          : selected.composite_score >= 40
                          ? `${selected.candidate_name} has partial alignment with this role at ${selected.composite_score.toFixed(1)}%. While they bring ${selected.experience_years?.toFixed(1) || '0'} years of industry experience, significant gaps exist in core required skills. Their background suggests potential in adjacent areas. Consider if the role scope can accommodate a learning curve, or for alternative positions.`
                          : `${selected.candidate_name} scored ${selected.composite_score.toFixed(1)}% — below the recommended threshold for this role. The skill overlap is minimal, suggesting their expertise lies in a different domain. Their ${selected.experience_years?.toFixed(1) || '0'} years of experience are primarily in areas not directly relevant to the current requirements.`
                        }
                      </p>
                    </div>
                  </div>

                  {/* ──── WHY THIS SCORE — Accordions ──── */}
                  <div style={{ marginTop: 24 }}>
                    <div className="section-label">DETAILED SCORE REASONING</div>
                    {dims.map((dim) => {
                      const isOpen = expandedDim === dim.key
                      const score = selected[dim.scoreKey] || 0
                      const explanation = selected[`${dim.key}_explanation`] || ''
                      const matched = dim.key === 'skills' ? (selected.matched_skills || []) : []
                      const partial = dim.key === 'skills' ? (selected.partial_skills || []) : []
                      const gaps = dim.key === 'skills' ? (selected.missing_skills || []) : []
                      return (
                        <div key={dim.key} style={{ marginBottom: 4 }}>
                          <div onClick={() => setExpandedDim(isOpen ? null : dim.key)}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 10,
                              background: 'var(--cream)', border: '1px solid var(--border)',
                              borderRadius: isOpen ? '8px 8px 0 0' : 8,
                              padding: '11px 16px', cursor: 'pointer', transition: 'background 120ms',
                            }}
                          >
                            <div style={{ width: 7, height: 7, borderRadius: '50%', background: dim.color, flexShrink: 0 }} />
                            <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 14, color: 'var(--ink)', flex: 1 }}>
                              {dim.label}
                            </span>
                            <span className={`score-pill ${getScoreLevel(score)}`}>{score.toFixed(0)}%</span>
                            {isOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                          </div>
                          <AnimatePresence>
                            {isOpen && (
                              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22 }} style={{ overflow: 'hidden' }}>
                                <div style={{
                                  background: 'var(--white)', border: '1px solid var(--border)',
                                  borderTop: 'none', borderRadius: '0 0 8px 8px', padding: '14px 16px'
                                }}>
                                  <p style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--slate)', lineHeight: 1.65 }}>
                                    {explanation}
                                  </p>
                                  {matched.length > 0 && (
                                    <div style={{ marginTop: 10 }}>
                                      <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 10, textTransform: 'uppercase', color: 'var(--moss)', letterSpacing: '0.08em' }}>
                                        ✓ Direct Matches ({matched.length})
                                      </span>
                                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
                                        {matched.map((m) => <span key={m} className="chip" style={{ fontSize: 11, borderColor: 'var(--moss)', color: 'var(--moss)' }}>{m}</span>)}
                                      </div>
                                    </div>
                                  )}
                                  {partial.length > 0 && (
                                    <div style={{ marginTop: 8 }}>
                                      <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 10, textTransform: 'uppercase', color: 'var(--accent-experience)', letterSpacing: '0.08em' }}>
                                        ◐ Partial Matches ({partial.length})
                                      </span>
                                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
                                        {partial.map((p) => <span key={p} className="chip" style={{ fontSize: 11, borderColor: 'var(--accent-experience)', color: 'var(--accent-experience)' }}>{p}</span>)}
                                      </div>
                                    </div>
                                  )}
                                  {gaps.length > 0 && (
                                    <div style={{ marginTop: 8 }}>
                                      <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 10, textTransform: 'uppercase', color: 'var(--blush)', letterSpacing: '0.08em' }}>
                                        ✗ Gaps ({gaps.length})
                                      </span>
                                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
                                        {gaps.map((g) => <span key={g} className="chip gap" style={{ fontSize: 11 }}>{g}</span>)}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )
                    })}
                  </div>

                  {/* ──── COMPREHENSIVE RESUME PROFILE ──── */}
                  <div style={{ marginTop: 24 }}>
                    <div className="section-label">CANDIDATE PROFILE</div>
                    <div style={{
                      background: 'var(--white)', border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-card)', padding: 20, marginTop: 8,
                    }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                        {/* Skills Panel */}
                        <div>
                          <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 12, color: 'var(--accent-skills)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
                            Technical Skills
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                            {(selected.matched_skills || []).map(sk => (
                              <span key={sk} style={{
                                background: 'rgba(74,124,111,0.1)', border: '1px solid rgba(74,124,111,0.3)',
                                borderRadius: 'var(--radius-tag)', fontFamily: 'var(--font-mono)', fontSize: 11,
                                color: 'var(--moss)', padding: '3px 8px', fontWeight: 500
                              }}>{sk}</span>
                            ))}
                            {(selected.partial_skills || []).map(sk => (
                              <span key={sk} style={{
                                background: 'rgba(123,143,168,0.1)', border: '1px solid rgba(123,143,168,0.3)',
                                borderRadius: 'var(--radius-tag)', fontFamily: 'var(--font-mono)', fontSize: 11,
                                color: 'var(--accent-experience)', padding: '3px 8px', fontWeight: 500
                              }}>{sk}</span>
                            ))}
                            {(selected.missing_skills || []).slice(0, 4).map(sk => (
                              <span key={sk} style={{
                                background: 'rgba(196,117,106,0.1)', border: '1px dashed rgba(196,117,106,0.3)',
                                borderRadius: 'var(--radius-tag)', fontFamily: 'var(--font-mono)', fontSize: 11,
                                color: 'var(--blush)', padding: '3px 8px', fontWeight: 400, textDecoration: 'line-through', opacity: 0.7
                              }}>{sk}</span>
                            ))}
                          </div>
                        </div>

                        {/* Career Panel */}
                        <div>
                          <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 12, color: 'var(--accent-experience)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
                            Career Profile
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--cream-deep)' }}>
                              <span style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--slate-mid)' }}>Experience</span>
                              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--ink)', fontWeight: 600 }}>
                                {selected.experience_years?.toFixed(1) || '0'} years
                              </span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--cream-deep)' }}>
                              <span style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--slate-mid)' }}>Seniority Level</span>
                              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--ink)', fontWeight: 600 }}>
                                {(selected.experience_cohort || 'N/A').replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                              </span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--cream-deep)' }}>
                              <span style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--slate-mid)' }}>Institution Tier</span>
                              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--ink)', fontWeight: 600 }}>
                                {(selected.institution_tier || 'tier_3').replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                              </span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--cream-deep)' }}>
                              <span style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--slate-mid)' }}>Bias Flag</span>
                              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: selected.bias_flag ? 'var(--blush)' : 'var(--moss)', fontWeight: 600 }}>
                                {selected.bias_flag ? '⚠ Normalised' : '✓ Clean'}
                              </span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
                              <span style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--slate-mid)' }}>Overall Rank</span>
                              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--sage)', fontWeight: 700 }}>
                                #{selected.rank || '-'} of {scores.length}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ──── ACTION ROW ──── */}
                  <div style={{ marginTop: 24, display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                    <button className="btn-secondary" onClick={() => setActiveTab('skillgap')} style={{ fontSize: 13 }}>
                      <Target size={13} /> View Skill Gap
                    </button>
                    <button className="btn-secondary" onClick={() => setActiveTab('kanban')} style={{ fontSize: 13 }}>
                      <Columns size={13} /> Pipeline Board
                    </button>
                    <button className="btn-primary" onClick={goToExport}
                      style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 14 }}>
                      Export Results <ArrowRight size={14} />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* RIGHT SIDEBAR — Bias Audit + Score Distribution */}
        <div style={{
          width: 290, background: 'var(--white)',
          borderLeft: '1px solid var(--border)',
          display: 'flex', flexDirection: 'column',
          overflowY: 'auto', flexShrink: 0
        }}>
          <div style={{ padding: '20px 18px', flex: 1 }}>
            {/* BiasAuditPanel — scanner sweep, text scramble, pulse rings */}
            <BiasAuditPanel biasAudit={biasAudit} scoresCount={scores.length} />

            {/* Score Distribution Chart */}
            <div style={{ marginTop: 20 }}>
              <div className="section-label">SCORE DISTRIBUTION</div>
              <div style={{ marginTop: 8 }}>
                <ResponsiveContainer width="100%" height={80}>
                  <BarChart data={distData} barGap={2}>
                    <XAxis
                      dataKey="range" axisLine={false} tickLine={false}
                      tick={{ fontFamily: 'var(--font-mono)', fontSize: 9, fill: 'var(--slate-light)' }}
                    />
                    <Tooltip
                      contentStyle={{
                        background: 'var(--white)', border: '1px solid var(--border)',
                        borderRadius: 8, fontSize: 11, fontFamily: 'var(--font-mono)'
                      }}
                    />
                    <Bar dataKey="raw" name="Raw" fill="var(--cream-deep)" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="norm" name="Normalised" fill="var(--sage)" opacity={0.7} radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
                <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--cream-deep)' }} />
                    <span style={{ fontFamily: 'var(--font-sans)', fontSize: 10, color: 'var(--slate-mid)' }}>Raw</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--sage)' }} />
                    <span style={{ fontFamily: 'var(--font-sans)', fontSize: 10, color: 'var(--slate-mid)' }}>Normalised</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Score Delta for selected */}
            {selected?.bias_flag && selected.normalized_score != null && (
              <div style={{ marginTop: 16 }}>
                <div className="section-label">SCORE DELTA — {selected.candidate_name.split(' ')[0]}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginTop: 6 }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--slate)' }}>
                    Raw: {selected.composite_score.toFixed(1)}%
                  </span>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 500, fontSize: 12, color: selected.normalized_score > selected.composite_score ? 'var(--moss)' : 'var(--blush)' }}>
                      Normalised: {selected.normalized_score.toFixed(1)}%
                    </span>
                    {(() => {
                      const delta = selected.normalized_score - selected.composite_score
                      return (
                        <span style={{
                          fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 11,
                          background: delta >= 0 ? 'var(--moss-light)' : 'var(--blush-light)',
                          color: delta >= 0 ? 'var(--moss)' : 'var(--blush)',
                          borderRadius: 'var(--radius-tag)', padding: '2px 6px'
                        }}>
                          {delta >= 0 ? '+' : ''}{delta.toFixed(1)}pp
                        </span>
                      )
                    })()}
                  </div>
                </div>
              </div>
            )}

            {/* Shortlist summary */}
            {shortlisted.size > 0 && (
              <div style={{ marginTop: 20 }}>
                <div className="section-label">SHORTLIST ({shortlisted.size})</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 6 }}>
                  {shortlistedCandidates.map((c, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--slate)' }}>
                        #{c.rank} {c.candidate_name.split(' ')[0]}
                      </span>
                      <span className={`score-pill ${getScoreLevel(c.composite_score)}`} style={{ fontSize: 10 }}>
                        {c.composite_score.toFixed(0)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sentence Attribution Drill-Down */}
            {selected && sessionData?.session_id && (
              <div style={{ marginTop: 20 }}>
                <div className="section-label">EXPLAINABLE AI</div>
                <SentenceAttribution sessionId={sessionData.session_id} candidateId={selected.candidate_name} dimension="skills" />
                <SentenceAttribution sessionId={sessionData.session_id} candidateId={selected.candidate_name} dimension="experience" />
                <SentenceAttribution sessionId={sessionData.session_id} candidateId={selected.candidate_name} dimension="education" />
              </div>
            )}

            {/* Keyboard shortcut hint */}
            <div style={{ marginTop: 20 }}>
              <button
                className="btn-ghost"
                onClick={() => setShowShortcuts(true)}
                style={{ fontSize: 11, color: 'var(--slate-light)', width: '100%', justifyContent: 'center' }}
              >
                Press ? for keyboard shortcuts
              </button>
            </div>
          </div>

          {/* Governance Notice */}
          <div style={{
            borderTop: '1px solid var(--border)', padding: '12px 18px',
            fontFamily: 'var(--font-sans)', fontSize: 10, color: 'var(--slate-light)', lineHeight: 1.5
          }}>
            Tech Vista ranks candidates. All hire/reject decisions are made by your team.
          </div>
        </div>
      </div>

      {/* Weight Re-run Modal */}
      {showWeightModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200
        }} onClick={() => setShowWeightModal(false)}>
          <div style={{
            background: 'var(--white)', borderRadius: 'var(--radius-card)',
            padding: 28, width: 400, boxShadow: 'var(--shadow-elevated)'
          }} onClick={e => e.stopPropagation()}>
            <h3 className="text-h2" style={{ marginBottom: 16 }}>Adjust Weights</h3>
            {['skills', 'experience', 'education'].map(k => (
              <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 500, fontSize: 14, width: 100, textTransform: 'capitalize' }}>{k}</span>
                <input type="range" min={5} max={90} value={tempWeights[k]}
                  onChange={e => setTempWeights(prev => ({ ...prev, [k]: parseInt(e.target.value) }))}
                  style={{ flex: 1 }}
                />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 14, width: 36, textAlign: 'right', color: 'var(--sage)' }}>{tempWeights[k]}%</span>
              </div>
            ))}
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: 'var(--slate-light)', marginBottom: 16 }}>
              Total: {tempWeights.skills + tempWeights.experience + tempWeights.education}% (will be normalised)
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button className="btn-ghost" onClick={() => setShowWeightModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleRerun}>Apply & Re-score</button>
            </div>
          </div>
        </div>
      )}

      {/* Comparison Modal */}
      <AnimatePresence>
        {showComparison && compareCandidates.length >= 2 && (
          <CandidateComparison
            candidates={compareCandidates}
            onClose={() => setShowComparison(false)}
          />
        )}
      </AnimatePresence>

      {/* Shortcuts Modal */}
      <AnimatePresence>
        {showShortcuts && <ShortcutsModal onClose={() => setShowShortcuts(false)} />}
      </AnimatePresence>

      {/* Demo Tour (floating bottom card) */}
      {showTour && !showWelcome && (
        <DemoTour onDone={() => setShowTour(false)} />
      )}

      {/* Welcome / Onboarding Modal for Demo Mode */}
      <AnimatePresence>
        {showWelcome && (
          <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 500
          }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.25 }}
              style={{
                background: 'var(--white)', borderRadius: 'var(--radius-card)',
                boxShadow: 'var(--shadow-elevated)',
                width: 520, padding: 40, textAlign: 'center'
              }}
            >
              {/* Logo mark */}
              <div style={{
                width: 56, height: 56, borderRadius: 14,
                background: 'var(--sage-pale)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 16px', color: 'var(--sage)'
              }}>
                <Sparkles size={28} />
              </div>

              <span style={{
                background: 'var(--sage-light)', color: 'var(--sage)',
                borderRadius: 'var(--radius-pill)', padding: '4px 12px',
                fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 11,
                textTransform: 'uppercase', letterSpacing: '0.07em',
                display: 'inline-block', marginBottom: 16
              }}>Demo Mode — Tech Vista</span>

              <h2 style={{
                fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 28,
                color: 'var(--ink)', marginBottom: 10, lineHeight: 1.2
              }}>Bias-Aware AI Resume Screening</h2>

              <p style={{
                fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--slate)',
                lineHeight: 1.7, marginBottom: 28, maxWidth: 400, margin: '0 auto 28px'
              }}>
                You're exploring a pre-loaded demo with <strong>15 realistic candidates</strong> for a
                Senior Backend Engineer role. The full pipeline has already run —
                semantic scoring, bias audit, and JD quality analysis are ready.
              </p>

              {/* Feature pills */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 32 }}>
                {[
                  '🎯 Semantic Scoring',
                  '⚖️ Bias Audit (Mann-Whitney U)',
                  '📋 Skill Gap Analysis',
                  '📄 JD Quality Score',
                  '📊 Candidate Compare',
                  '📥 PDF / CSV Export',
                ].map(f => (
                  <span key={f} style={{
                    background: 'var(--cream)', border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-pill)',
                    fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--slate)',
                    padding: '5px 12px'
                  }}>{f}</span>
                ))}
              </div>

              <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                <button
                  className="btn-secondary"
                  onClick={() => setShowWelcome(false)}
                  style={{ height: 44, fontSize: 14, padding: '0 24px' }}
                >
                  Explore freely
                </button>
                <button
                  className="btn-primary"
                  onClick={() => { setShowWelcome(false); setShowTour(true) }}
                  style={{ height: 44, fontSize: 14, padding: '0 24px', gap: 8 }}
                >
                  <Play size={14} />
                  Start guided tour
                </button>
              </div>

              <p style={{
                marginTop: 20,
                fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--slate-light)'
              }}>
                This is synthetic demo data. No real candidates or companies.
              </p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* AI Candidate Compare Panel (Feature 2 — Bootstrap CI + Narrative) */}
      {aiCompareSet.length >= 2 && (
        <CandidateComparePanel
          isOpen={isAiCompareOpen}
          onClose={() => setIsAiCompareOpen(false)}
          sessionId={sessionData?.session_id}
          candidates={aiCompareSet}
        />
      )}

      {/* Floating AI Compare Action Bar */}
      <AnimatePresence>
        {aiCompareSet.length > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0, x: '-50%' }}
            animate={{ y: 0, opacity: 1, x: '-50%' }}
            exit={{ y: 100, opacity: 0, x: '-50%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            style={{
              position: 'fixed', bottom: 24, left: '50%',
              background: 'var(--ink)', padding: '12px 22px', borderRadius: 24,
              display: 'flex', alignItems: 'center', gap: 20,
              boxShadow: '0 20px 40px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.1)',
              zIndex: 400, color: 'var(--white)', maxWidth: 'calc(100vw - 48px)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: aiCompareSet.length >= 2 ? 'var(--moss)' : 'var(--slate-dark)',
                color: aiCompareSet.length >= 2 ? 'var(--cream)' : 'var(--slate-light)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontFamily: 'var(--font-sans)', fontSize: 15,
                transition: 'all 0.3s ease'
              }}>
                {aiCompareSet.length}/4
              </div>
              <div style={{ fontFamily: 'var(--font-sans)' }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>AI Candidate Comparison</div>
                <div style={{ color: 'var(--slate-light)', fontSize: 12, marginTop: 1 }}>
                  {aiCompareSet.length === 1 ? 'Select 1-3 more candidates' : `${aiCompareSet.length} selected — ready to compare`}
                </div>
              </div>
            </div>
            <AnimatePresence>
              {aiCompareSet.length >= 2 && (
                <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }}>
                  <MagneticButton
                    className="btn-primary"
                    onClick={() => setIsAiCompareOpen(true)}
                    style={{ background: 'var(--sage)', color: 'var(--cream)', border: 'none', padding: '8px 20px', borderRadius: 20, fontSize: 13 }}
                  >
                    <GitCompare size={14} style={{ marginRight: 6 }} />
                    Run AI Analysis
                  </MagneticButton>
                </motion.div>
              )}
            </AnimatePresence>
            <button
              onClick={() => setAiCompareSet([])}
              style={{ background: 'none', border: 'none', color: 'var(--slate-light)', cursor: 'pointer', padding: 4, fontSize: 11, fontFamily: 'var(--font-sans)' }}
            >
              Clear
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default ResultsPage
