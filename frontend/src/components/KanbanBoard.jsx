import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { User, Clock, Mail, Calendar, ChevronRight, AlertCircle, RefreshCw, GripVertical } from 'lucide-react'
import { updateCandidateStage } from '../utils/api'
import MagneticButton from './MagneticButton'
import EmailDraftDrawer from './EmailDraftDrawer'
import ScheduleInterviewModal from './ScheduleInterviewModal'

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
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('application/json', JSON.stringify(candidate))
        e.dataTransfer.effectAllowed = 'move'
        onDragStart?.(candidate)
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        background: 'var(--white)',
        border: '1px solid var(--border)',
        borderRadius: 10,
        padding: 14,
        cursor: 'grab',
        position: 'relative',
        boxShadow: isHovered
          ? 'var(--shadow-elevated), 0 0 20px rgba(74,124,111,0.15)'
          : 'var(--shadow-card)',
        transition: 'box-shadow 200ms, transform 120ms',
        transform: isHovered ? 'scale(1.02)' : 'scale(1)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          background: 'var(--sage-light)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--sage)', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14
        }}>
          {candidate.candidate_name.charAt(0)}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 14, color: 'var(--ink)', lineHeight: 1.2 }}>
            {candidate.candidate_name}
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--slate-mid)' }}>
            Score: {Math.round(candidate.composite_score)}%
          </div>
        </div>
        <GripVertical size={14} style={{ color: 'var(--slate-light)', flexShrink: 0 }} />
      </div>

      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        fontFamily: 'var(--font-sans)', fontSize: 12,
        color: isOverdue ? 'var(--blush)' : 'var(--slate-mid)',
      }}>
        <Clock size={12} />
        <span>{daysInStage} day{daysInStage !== 1 ? 's' : ''} in stage</span>
        {isOverdue && <AlertCircle size={12} style={{ color: 'var(--blush)' }} />}
      </div>

      {isHovered && (
        <div style={{ display: 'flex', gap: 6, marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border)' }}>
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
        </div>
      )}
    </div>
  )
}

function KanbanColumn({ stage, candidates, onDrop, onDragStart, onSchedule, onEmail }) {
  const [isDragOver, setIsDragOver] = useState(false)
  const dragCounter = useRef(0)

  return (
    <div
      onDragEnter={(e) => { e.preventDefault(); dragCounter.current++; setIsDragOver(true) }}
      onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move' }}
      onDragLeave={() => { dragCounter.current--; if (dragCounter.current <= 0) { setIsDragOver(false); dragCounter.current = 0 } }}
      onDrop={(e) => {
        e.preventDefault()
        dragCounter.current = 0
        setIsDragOver(false)
        try {
          const data = JSON.parse(e.dataTransfer.getData('application/json'))
          onDrop?.(stage.id, data)
        } catch (err) { console.error('Drop parse error:', err) }
      }}
      style={{ minWidth: 240, maxWidth: 280, flex: '1 0 240px', height: '100%', display: 'flex', flexDirection: 'column' }}
    >
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '12px 14px',
        background: isDragOver ? 'var(--sage-pale)' : 'var(--cream-mid)',
        borderRadius: '10px 10px 0 0',
        border: `1px solid ${isDragOver ? 'var(--sage)' : 'var(--border)'}`, borderBottom: 'none',
        transition: 'background 200ms, border-color 200ms',
      }}>
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: stage.color }} />
        <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 13, color: 'var(--ink)', flex: 1 }}>
          {stage.label}
        </span>
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--slate-mid)',
          background: 'var(--white)', padding: '2px 8px',
          borderRadius: 'var(--radius-pill)', border: '1px solid var(--border)',
        }}>
          {candidates.length}
        </span>
      </div>
      <div style={{
        flex: 1,
        background: isDragOver ? 'rgba(74,124,111,0.06)' : 'var(--white)',
        border: `2px ${isDragOver ? 'dashed' : 'solid'} ${isDragOver ? 'var(--sage)' : 'var(--border)'}`,
        borderRadius: '0 0 10px 10px',
        padding: 10, display: 'flex', flexDirection: 'column', gap: 10,
        overflowY: 'auto', minHeight: 300,
        transition: 'background 200ms, border-color 200ms',
      }}>
        {candidates.map((candidate) => (
          <CandidateCard
            key={candidate.candidate_id}
            candidate={candidate}
            onDragStart={onDragStart}
            onSchedule={onSchedule}
            onEmail={onEmail}
          />
        ))}
        {candidates.length === 0 && (
          <div style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-sans)', fontSize: 13, color: isDragOver ? 'var(--sage)' : 'var(--slate-light)',
            fontWeight: isDragOver ? 600 : 400,
            border: isDragOver ? 'none' : '2px dashed var(--border)',
            borderRadius: 8, margin: 6, padding: 24,
            transition: 'all 200ms',
          }}>
            {isDragOver ? '✓ Release to drop here' : 'Drop candidates here'}
          </div>
        )}
      </div>
    </div>
  )
}

export default function KanbanBoard({ sessionId, candidates = [] }) {
  const [pipeline, setPipeline] = useState({})
  const [draggedCandidate, setDraggedCandidate] = useState(null)
  
  // Email Drawer State
  const [draftData, setDraftData] = useState(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [isGeneratingEmail, setIsGeneratingEmail] = useState(false)

  // Schedule Modal State
  const [scheduleCandidate, setScheduleCandidate] = useState(null)
  const [isScheduleOpen, setIsScheduleOpen] = useState(false)

  useEffect(() => {
    if (candidates.length > 0) {
      const initial = {}
      STAGES.forEach(s => { initial[s.id] = [] })
      candidates.forEach(c => {
        const pc = {
          candidate_id: c.candidate_name,
          candidate_name: c.candidate_name,
          composite_score: c.composite_score || 0,
          stage: c.stage || 'new',
          days_in_stage: 0,
        }
        initial[pc.stage]?.push(pc)
      })
      setPipeline(initial)
    }
  }, [candidates])

  const handleDrop = async (targetStage, droppedCandidate) => {
    if (!droppedCandidate) return
    const sourceStage = Object.keys(pipeline).find(stage =>
      pipeline[stage].some(c => c.candidate_id === droppedCandidate.candidate_id)
    )
    if (!sourceStage || sourceStage === targetStage) return

    // Optimistic update
    setPipeline(prev => {
      const np = {}
      Object.keys(prev).forEach(k => { np[k] = [...prev[k]] })
      np[sourceStage] = np[sourceStage].filter(c => c.candidate_id !== droppedCandidate.candidate_id)
      np[targetStage] = [...np[targetStage], { ...droppedCandidate, stage: targetStage, days_in_stage: 0 }]
      return np
    })

    try {
      if (['interview_1', 'interview_2', 'offer', 'rejected'].includes(targetStage)) {
        setIsGeneratingEmail(true)
      }
      
      const res = await updateCandidateStage(droppedCandidate.candidate_id, targetStage, sessionId)
      
      if (res.data && res.data.draft_id) {
        setDraftData(res.data)
        setIsDrawerOpen(true)
      }
    } catch (err) {
      console.error('Stage update failed:', err)
      // Revert on error
      setPipeline(prev => {
        const np = {}
        Object.keys(prev).forEach(k => { np[k] = [...prev[k]] })
        np[targetStage] = np[targetStage].filter(c => c.candidate_id !== droppedCandidate.candidate_id)
        np[sourceStage] = [...np[sourceStage], droppedCandidate]
        return np
      })
    } finally {
      setIsGeneratingEmail(false)
    }
    setDraggedCandidate(null)
  }

  const handleScheduleClick = (candidate) => {
    setScheduleCandidate(candidate)
    setIsScheduleOpen(true)
  }

  const handleEmailClick = (candidate) => {
    // Generate a client-side email draft for the candidate
    const stage = candidate.stage || 'new'
    const stageLabel = STAGES.find(s => s.id === stage)?.label || stage

    const templates = {
      new: {
        subject: `Application Received — ${candidate.candidate_name}`,
        body: `Dear ${candidate.candidate_name},\n\nThank you for applying. We've received your resume and our AI screening system has completed an initial review.\n\nYour application scored ${Math.round(candidate.composite_score)}% on our composite evaluation. We'll be in touch with next steps shortly.\n\nBest regards,\nHiring Team`
      },
      screening: {
        subject: `Next Steps — Technical Screening for ${candidate.candidate_name}`,
        body: `Dear ${candidate.candidate_name},\n\nWe're pleased to inform you that your application has moved to the screening stage.\n\nYour profile scored ${Math.round(candidate.composite_score)}% and we'd like to schedule a brief technical screening call. Please reply with your availability this week.\n\nBest regards,\nHiring Team`
      },
      interview_1: {
        subject: `Interview Invitation — Round 1 for ${candidate.candidate_name}`,
        body: `Dear ${candidate.candidate_name},\n\nCongratulations! You have been advanced to Interview Round 1.\n\nThe interview will cover technical fundamentals and system design concepts. We'll send a calendar invite shortly. Please prepare:\n\n• A brief introduction of your background\n• Discussion of a challenging project you've worked on\n• Questions about the role and team\n\nBest regards,\nHiring Team`
      },
      interview_2: {
        subject: `Interview — Final Round for ${candidate.candidate_name}`,
        body: `Dear ${candidate.candidate_name},\n\nGreat news! We're inviting you to the final round of interviews.\n\nThis round will include a culture fit discussion with team leads and a live coding exercise. Duration: approximately 90 minutes.\n\nPlease confirm your availability, and we'll send the Google Meet link.\n\nBest regards,\nHiring Team`
      },
      offer: {
        subject: `Offer Letter — ${candidate.candidate_name}`,
        body: `Dear ${candidate.candidate_name},\n\nWe are delighted to extend an offer to join our team! Your interview performance and technical profile were outstanding (Composite Score: ${Math.round(candidate.composite_score)}%).\n\nPlease find the offer details attached. We'd love to have you on board and look forward to your response.\n\nWarm regards,\nHiring Team`
      },
      rejected: {
        subject: `Application Update — ${candidate.candidate_name}`,
        body: `Dear ${candidate.candidate_name},\n\nThank you for your interest in our role and for taking the time to go through the interview process.\n\nAfter careful evaluation, we've decided to move forward with other candidates whose skills more closely match our current needs. We encourage you to apply for future openings.\n\nWishing you all the best,\nHiring Team`
      },
    }

    const template = templates[stage] || templates.new

    setDraftData({
      draft_id: `local-${Date.now()}`,
      candidate_name: candidate.candidate_name,
      subject_line: template.subject,
      email_body: template.body,
      email_type: stage,
    })
    setIsDrawerOpen(true)
  }

  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div className="section-label">CANDIDATE PIPELINE</div>
          <h2 className="text-h2">Track &amp; Manage</h2>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {isGeneratingEmail && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontFamily: 'var(--font-mono)', color: 'var(--sage)' }}
            >
              <RefreshCw size={14} className="spin-anim" /> Drafting email with Gemini...
            </motion.div>
          )}
          <div style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--slate-mid)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <GripVertical size={14} /> Drag candidates between stages
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 16 }}>
        {STAGES.filter(s => s.id !== 'rejected').map(stage => (
          <KanbanColumn
            key={stage.id}
            stage={stage}
            candidates={pipeline[stage.id] || []}
            onDrop={handleDrop}
            onDragStart={setDraggedCandidate}
            onSchedule={handleScheduleClick}
            onEmail={handleEmailClick}
          />
        ))}
      </div>

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
          padding: 16, background: 'var(--blush-pale)', borderRadius: 10, marginTop: 8,
        }}>
          {(pipeline.rejected || []).map(candidate => (
            <div key={candidate.candidate_id} style={{
              background: 'var(--white)', border: '1px solid var(--border)',
              borderRadius: 8, padding: '8px 12px',
              fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--slate)',
            }}>
              {candidate.candidate_name}
            </div>
          ))}
        </div>
      </details>
      
      {/* Email Draft Drawer */}
      <EmailDraftDrawer 
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        draftData={draftData}
        onSendSuccess={() => console.log("Email mock send success")}
      />

      {/* Schedule Interview Modal */}
      <ScheduleInterviewModal
        isOpen={isScheduleOpen}
        onClose={() => { setIsScheduleOpen(false); setScheduleCandidate(null) }}
        candidate={scheduleCandidate}
      />
    </div>
  )
}
