import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence, Reorder } from 'framer-motion'
import { User, Clock, Mail, Calendar, MoreHorizontal, ChevronRight, AlertCircle } from 'lucide-react'
import { updateCandidateStage, getPipeline } from '../utils/api'
import MagneticButton from './MagneticButton'

const STAGES = [
  { id: 'new', label: 'New', color: 'var(--slate-mid)' },
  { id: 'screening', label: 'Screening', color: 'var(--sage)' },
  { id: 'interview_1', label: 'Interview 1', color: 'var(--accent-experience)' },
  { id: 'interview_2', label: 'Interview 2', color: 'var(--accent-education)' },
  { id: 'offer', label: 'Offer', color: 'var(--moss)' },
  { id: 'hired', label: 'Hired', color: 'var(--moss)' },
  { id: 'rejected', label: 'Rejected', color: 'var(--blush)' },
]

function CandidateCard({ candidate, onDragStart, onSchedule, onEmail }) {
  const [isHovered, setIsHovered] = useState(false)
  const daysInStage = candidate.days_in_stage || 0
  const isOverdue = daysInStage > 5

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.96 }}
      drag
      dragConstraints={{ top: 0, bottom: 0, left: 0, right: 0 }}
      dragElastic={0.1}
      onDragStart={onDragStart}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        background: 'var(--white)',
        border: '1px solid var(--border)',
        borderRadius: 10,
        padding: 14,
        cursor: 'grab',
        position: 'relative',
        boxShadow: isHovered ? 'var(--shadow-elevated), 0 0 20px rgba(74,124,111,0.15)' : 'var(--shadow-card)',
        transition: 'box-shadow 200ms',
      }}
    >
      {/* Candidate Info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          background: 'var(--sage-light)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--sage)',
        }}>
          <User size={16} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{
            fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 14,
            color: 'var(--ink)', lineHeight: 1.2
          }}>{candidate.candidate_name}</div>
          <div style={{
            fontFamily: 'var(--font-mono)', fontSize: 11,
            color: 'var(--slate-mid)'
          }}>Score: {Math.round(candidate.composite_score)}%</div>
        </div>
      </div>

      {/* Days in Stage */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        fontFamily: 'var(--font-sans)', fontSize: 12,
        color: isOverdue ? 'var(--blush)' : 'var(--slate-mid)',
      }}>
        <Clock size={12} />
        <span style={{
          animation: isOverdue ? 'pulse 2s ease-in-out infinite' : 'none',
        }}>
          {daysInStage} day{daysInStage !== 1 ? 's' : ''} in stage
        </span>
        {isOverdue && <AlertCircle size={12} style={{ color: 'var(--blush)' }} />}
      </div>

      {/* Hover Actions */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            style={{
              display: 'flex', gap: 6, marginTop: 10,
              paddingTop: 10, borderTop: '1px solid var(--border)'
            }}
          >
            <MagneticButton
              className="btn-ghost"
              onClick={(e) => { e.stopPropagation(); onSchedule?.(candidate) }}
              style={{ flex: 1, fontSize: 11, padding: '6px 8px', justifyContent: 'center' }}
            >
              <Calendar size={12} /> Schedule
            </MagneticButton>
            <MagneticButton
              className="btn-ghost"
              onClick={(e) => { e.stopPropagation(); onEmail?.(candidate) }}
              style={{ flex: 1, fontSize: 11, padding: '6px 8px', justifyContent: 'center' }}
            >
              <Mail size={12} /> Email
            </MagneticButton>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function KanbanColumn({ stage, candidates, onDrop, onSchedule, onEmail }) {
  const [isDragOver, setIsDragOver] = useState(false)

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={(e) => { e.preventDefault(); setIsDragOver(false); onDrop?.(stage.id) }}
      style={{
        minWidth: 260,
        maxWidth: 280,
        flex: '1 0 260px',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Column Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '12px 14px',
        background: isDragOver ? 'var(--sage-pale)' : 'var(--cream-mid)',
        borderRadius: '10px 10px 0 0',
        border: '1px solid var(--border)',
        borderBottom: 'none',
        transition: 'background 150ms',
      }}>
        <div style={{
          width: 10, height: 10, borderRadius: '50%',
          background: stage.color,
        }} />
        <span style={{
          fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 13,
          color: 'var(--ink)', flex: 1
        }}>{stage.label}</span>
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: 12,
          color: 'var(--slate-mid)',
          background: 'var(--white)',
          padding: '2px 8px',
          borderRadius: 'var(--radius-pill)',
          border: '1px solid var(--border)',
        }}>{candidates.length}</span>
      </div>

      {/* Cards Container */}
      <div style={{
        flex: 1,
        background: isDragOver ? 'var(--sage-pale)' : 'var(--white)',
        border: `1px solid ${isDragOver ? 'var(--sage)' : 'var(--border)'}`,
        borderRadius: '0 0 10px 10px',
        padding: 10,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        overflowY: 'auto',
        minHeight: 300,
        transition: 'background 150ms, border-color 150ms',
      }}>
        <AnimatePresence>
          {candidates.map((candidate) => (
            <CandidateCard
              key={candidate.candidate_id}
              candidate={candidate}
              onSchedule={onSchedule}
              onEmail={onEmail}
            />
          ))}
        </AnimatePresence>

        {candidates.length === 0 && (
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'var(--font-sans)',
            fontSize: 13,
            color: 'var(--slate-light)',
          }}>
            Drop candidates here
          </div>
        )}
      </div>
    </div>
  )
}

export default function KanbanBoard({ sessionId, candidates = [], onSchedule, onEmail }) {
  const [pipeline, setPipeline] = useState({})
  const [draggedCandidate, setDraggedCandidate] = useState(null)
  const [loading, setLoading] = useState(false)

  // Initialize pipeline from candidates
  useEffect(() => {
    if (candidates.length > 0) {
      const initial = {}
      STAGES.forEach(s => { initial[s.id] = [] })
      
      candidates.forEach(c => {
        const pipelineCandidate = {
          candidate_id: c.candidate_name,
          candidate_name: c.candidate_name,
          composite_score: c.composite_score || 0,
          stage: c.stage || 'new',
          days_in_stage: 0,
        }
        initial[pipelineCandidate.stage]?.push(pipelineCandidate)
      })
      
      setPipeline(initial)
    }
  }, [candidates])

  const handleDrop = async (targetStage) => {
    if (!draggedCandidate) return

    const sourceStage = Object.keys(pipeline).find(stage =>
      pipeline[stage].some(c => c.candidate_id === draggedCandidate.candidate_id)
    )

    if (sourceStage === targetStage) {
      setDraggedCandidate(null)
      return
    }

    // Optimistic update
    setPipeline(prev => {
      const newPipeline = { ...prev }
      newPipeline[sourceStage] = prev[sourceStage].filter(
        c => c.candidate_id !== draggedCandidate.candidate_id
      )
      newPipeline[targetStage] = [
        ...prev[targetStage],
        { ...draggedCandidate, stage: targetStage, days_in_stage: 0 }
      ]
      return newPipeline
    })

    // API call
    try {
      await updateCandidateStage(
        draggedCandidate.candidate_id,
        targetStage,
        sessionId
      )
    } catch (err) {
      console.error('Failed to update stage:', err)
      // Revert on error
      setPipeline(prev => {
        const newPipeline = { ...prev }
        newPipeline[targetStage] = prev[targetStage].filter(
          c => c.candidate_id !== draggedCandidate.candidate_id
        )
        newPipeline[sourceStage] = [...prev[sourceStage], draggedCandidate]
        return newPipeline
      })
    }

    setDraggedCandidate(null)
  }

  return (
    <div style={{ width: '100%' }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 20
      }}>
        <div>
          <div className="section-label">CANDIDATE PIPELINE</div>
          <h2 className="text-h2">Track & Manage</h2>
        </div>
        <div style={{
          fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--slate-mid)'
        }}>
          Drag candidates between stages
        </div>
      </div>

      {/* Kanban Board */}
      <div style={{
        display: 'flex',
        gap: 16,
        overflowX: 'auto',
        paddingBottom: 16,
      }}>
        {STAGES.filter(s => s.id !== 'rejected').map(stage => (
          <KanbanColumn
            key={stage.id}
            stage={stage}
            candidates={pipeline[stage.id] || []}
            onDrop={handleDrop}
            onSchedule={onSchedule}
            onEmail={onEmail}
          />
        ))}
      </div>

      {/* Rejected Section (collapsed) */}
      <details style={{ marginTop: 16 }}>
        <summary style={{
          fontFamily: 'var(--font-sans)', fontWeight: 500, fontSize: 13,
          color: 'var(--slate-mid)', cursor: 'pointer', padding: '8px 0',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <ChevronRight size={14} />
          Rejected ({pipeline.rejected?.length || 0})
        </summary>
        <div style={{
          display: 'flex', gap: 10, flexWrap: 'wrap',
          padding: 16, background: 'var(--blush-pale)',
          borderRadius: 10, marginTop: 8,
        }}>
          {(pipeline.rejected || []).map(candidate => (
            <div key={candidate.candidate_id} style={{
              background: 'var(--white)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              padding: '8px 12px',
              fontFamily: 'var(--font-sans)',
              fontSize: 13,
              color: 'var(--slate)',
            }}>
              {candidate.candidate_name}
            </div>
          ))}
        </div>
      </details>
    </div>
  )
}
