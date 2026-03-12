import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Download, GitCompare } from 'lucide-react'
import SessionSummary from '../components/SessionSummary'
import WeightSliders from '../components/WeightSliders'
import ScoringTable from '../components/ScoringTable'
import BiasAuditPanel from '../components/BiasAuditPanel'
import JDQualityCard from '../components/JDQualityCard'
import ScoreDistribution from '../components/ScoreDistribution'
import KanbanBoard from '../components/KanbanBoard'
import { recalculateScores } from '../utils/api'
import { initShortcuts } from '../utils/shortcuts'
import MagneticButton from '../components/MagneticButton'
import ExportModal from '../components/ExportModal'

// Feature 2 Components
import CandidateComparePanel from '../components/CandidateComparePanel'
import SentenceAttribution from '../components/SentenceAttribution'
import CandidateDetailsCard from '../components/CandidateDetailsCard' 

// Feature 3 Component
import TalentPoolPage from './TalentPoolPage'

export default function DashboardPage({ sessionData, setSessionData, onNewUpload, onWeightChange }) {
  const [activeTab, setActiveTab] = useState('candidates')
  const [selectedCandidate, setSelectedCandidate] = useState(null)
  const [selectedIndex, setSelectedIndex] = useState(0)

  // Selection array for Candidate Comparison (Feature 2)
  const [comparisonCandidates, setComparisonCandidates] = useState([])
  const [isCompareOpen, setIsCompareOpen] = useState(false)

  const [isExportOpen, setIsExportOpen] = useState(false)
  const scores = sessionData?.scores || []

  const handleWeightChange = async (weights) => {
    try {
      const res = await recalculateScores(sessionData.session_id, weights)
      if (typeof setSessionData === 'function') {
        setSessionData(res.data)
      }
      if (typeof onWeightChange === 'function') {
        onWeightChange(res.data)
      }
    } catch (err) {
      console.error('Recalculation failed:', err)
    }
  }

  const handleToggleComparison = (candidate) => {
    setComparisonCandidates(prev => {
      const exists = prev.find(c => c.candidate_name === candidate.candidate_name)
      if (exists) {
        return prev.filter(c => c.candidate_name !== candidate.candidate_name)
      } else {
        if (prev.length >= 2) return prev // Max 2 for Bootstrap test
        return [...prev, candidate]
      }
    })
  }

  const handleOpenCompare = () => {
    if (comparisonCandidates.length === 2) {
      setIsCompareOpen(true)
    }
  }

  useEffect(() => {
    const cleanup = initShortcuts({
      navigate_up: () => setSelectedIndex(i => Math.max(0, i - 1)),
      navigate_down: () => setSelectedIndex(i => Math.min(scores.length - 1, i + 1)),
      export: () => setIsExportOpen(true),
      compare: () => comparisonCandidates.length >= 2 && setIsCompareOpen(true),
      close: () => { setIsExportOpen(false); setIsCompareOpen(false) },
    })
    return cleanup
  }, [scores.length, comparisonCandidates])

  useEffect(() => {
    if (scores.length > 0 && !selectedCandidate) {
      setSelectedCandidate(scores[0])
      setSelectedIndex(0)
    }
  }, [scores, selectedCandidate])

  return (
    <div className="page" style={{ position: 'relative' }}>

      <div className="container">
        <SessionSummary sessionData={sessionData} onNewUpload={onNewUpload} />

        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}
        >
          <div className="tabs">
            {[
              { id: 'candidates', label: 'Candidates' },
              { id: 'kanban', label: 'Pipeline Board' },
              { id: 'talent-pool', label: 'Talent Pool' },
              { id: 'bias', label: 'Bias Audit' },
              { id: 'distribution', label: 'Distribution' },
              { id: 'jd-quality', label: 'JD Analysis' },
            ].map(tab => (
              <button
                key={tab.id}
                className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {comparisonCandidates.length >= 2 && (
              <button className="btn btn-secondary btn-sm" onClick={() => setIsCompareOpen(true)}>
                <GitCompare size={14} /> Compare ({comparisonCandidates.length})
              </button>
            )}
            <button className="btn btn-primary btn-sm" onClick={() => setIsExportOpen(true)}>
              <Download size={14} /> Export
            </button>
          </div>
        </motion.div>

        {activeTab === 'talent-pool' ? (
          <TalentPoolPage sessionData={sessionData} />
        ) : activeTab === 'kanban' ? (
          <KanbanBoard sessionId={sessionData?.session_id} candidates={scores} />
        ) : activeTab === 'bias' ? (
          <BiasAuditPanel auditData={sessionData?.bias_audit} />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px', alignItems: 'start' }}>
            {/* Left: Main Panel */}
            <div>
              {activeTab === 'candidates' && (
                <motion.div key="candidates" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <ScoringTable
                    scores={scores}
                    selectedCandidate={selectedCandidate}
                    selectedIndex={selectedIndex}
                    onSelect={(c, i) => { setSelectedCandidate(c); setSelectedIndex(i) }}
                    comparisonCandidates={comparisonCandidates}
                    onToggleComparison={handleToggleComparison}
                  />
                </motion.div>
              )}
              {activeTab === 'distribution' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <ScoreDistribution scores={scores} onSelectCandidate={(c, i) => { setSelectedCandidate(c); setSelectedIndex(i); setActiveTab('candidates') }} />
                </motion.div>
              )}
              {activeTab === 'jd-quality' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <JDQualityCard jdQuality={sessionData?.jd_quality} />
                </motion.div>
              )}
            </div>

            {/* Right: Side Panel */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <WeightSliders weights={sessionData?.weights} onChange={handleWeightChange} />

              <AnimatePresence mode="wait">
                {selectedCandidate && (
                  <motion.div
                    key={selectedCandidate.candidate_name}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    
                    {/* The new Details Card (replaces Anti-BS/Gap) */}
                    <CandidateDetailsCard candidate={selectedCandidate} />

                    <div style={{ marginTop: 24 }}>
                      <h4 style={{ fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 600, color: 'var(--slate-mid)', marginBottom: 12 }}>Detailed Breakdown</h4>

                      <SentenceAttribution
                        sessionId={sessionData.session_id}
                        candidateId={selectedCandidate.candidate_name}
                        dimension="skills"
                      />

                      <SentenceAttribution
                        sessionId={sessionData.session_id}
                        candidateId={selectedCandidate.candidate_name}
                        dimension="experience"
                      />

                      <SentenceAttribution
                        sessionId={sessionData.session_id}
                        candidateId={selectedCandidate.candidate_name}
                        dimension="education"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>

      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        sessionId={sessionData.session_id}
      />

      {comparisonCandidates.length === 2 && (
        <CandidateComparePanel
          isOpen={isCompareOpen}
          onClose={() => setIsCompareOpen(false)}
          sessionId={sessionData.session_id}
          candA_Id={comparisonCandidates[0].candidate_name}
          candB_Id={comparisonCandidates[1].candidate_name}
        />
      )}

      {/* Floating Compare Action Bar */}
      <AnimatePresence>
        {comparisonCandidates.length > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0, x: '-50%' }}
            animate={{ y: 0, opacity: 1, x: '-50%' }}
            exit={{ y: 100, opacity: 0, x: '-50%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            style={{
              position: 'fixed',
              bottom: 40,
              left: '50%',
              background: 'var(--ink)',
              padding: '16px 24px',
              borderRadius: 32,
              display: 'flex',
              alignItems: 'center',
              gap: 32,
              boxShadow: '0 20px 40px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.1)',
              zIndex: 100,
              color: 'var(--white)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ 
                width: 40, height: 40, borderRadius: '50%', 
                background: comparisonCandidates.length === 2 ? 'var(--moss)' : 'var(--slate-dark)',
                color: comparisonCandidates.length === 2 ? 'var(--cream)' : 'var(--slate-light)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontFamily: 'var(--font-sans)', fontSize: 16,
                transition: 'all 0.3s ease'
              }}>
                {comparisonCandidates.length}/2
              </div>
              <div style={{ fontFamily: 'var(--font-sans)' }}>
                <div style={{ fontWeight: 600, fontSize: 15 }}>Candidate Comparison</div>
                <div style={{ color: 'var(--slate-light)', fontSize: 13, marginTop: 2 }}>
                  {comparisonCandidates.length === 1 ? 'Select one more candidate to compare' : 'Ready for deep AI analysis'}
                </div>
              </div>
            </div>
            
            <AnimatePresence>
              {comparisonCandidates.length === 2 && (
                <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }}>
                  <MagneticButton 
                    className="btn-primary" 
                    onClick={handleOpenCompare}
                    style={{ background: 'var(--sage)', color: 'var(--cream)', border: 'none', padding: '10px 24px', borderRadius: 24, fontSize: 14 }}
                  >
                    <GitCompare size={16} style={{ marginRight: 8 }} />
                    Run AI Analysis
                  </MagneticButton>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
