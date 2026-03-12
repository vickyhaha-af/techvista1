import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Mail, Calendar, Send, Clock, AlertTriangle, CheckCircle } from 'lucide-react'
import MagneticButton from './MagneticButton'
import { useModalContext } from './ModalContext'

const EMAIL_TEMPLATES = {
  rejection: {
    subject: 'Update on Your Application - {company}',
    body: `Dear {name},

Thank you for your interest in the {role} position at {company} and for taking the time to apply.

After careful consideration, we have decided to move forward with other candidates whose qualifications more closely align with our current needs.

We appreciate your interest in our company and wish you the best in your job search and future career endeavors.

Best regards,
{company} Hiring Team`,
  },
  invite: {
    subject: 'Interview Invitation - {role} at {company}',
    body: `Dear {name},

We are pleased to inform you that your application for the {role} position has been shortlisted.

We would like to invite you for an interview to discuss your qualifications further. Please let us know your availability for the coming week.

Looking forward to speaking with you.

Best regards,
{company} Hiring Team`,
  },
  offer: {
    subject: 'Job Offer - {role} at {company}',
    body: `Dear {name},

We are delighted to extend an offer for the {role} position at {company}.

Please find attached the formal offer letter with details about compensation, benefits, and start date.

We are excited about the possibility of you joining our team and look forward to your response.

Best regards,
{company} Hiring Team`,
  },
}

function ModalOverlay({ isOpen, onClose, children }) {
  const { setModalOpen } = useModalContext()

  React.useEffect(() => {
    setModalOpen(isOpen)
    return () => setModalOpen(false)
  }, [isOpen, setModalOpen])

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 24,
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--white)',
              borderRadius: 16,
              boxShadow: 'var(--shadow-elevated)',
              maxWidth: 560,
              width: '100%',
              maxHeight: '90vh',
              overflow: 'hidden',
            }}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export function EmailModal({ isOpen, onClose, candidate, companyName = 'Tech Vista' }) {
  const [template, setTemplate] = useState('invite')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [includeDPDPA, setIncludeDPDPA] = useState(false)
  const [sending, setSending] = useState(false)

  React.useEffect(() => {
    if (candidate && isOpen) {
      const tpl = EMAIL_TEMPLATES[template]
      setSubject(tpl.subject
        .replace('{company}', companyName)
        .replace('{name}', candidate.candidate_name)
        .replace('{role}', 'Open Position')
      )
      setBody(tpl.body
        .replace('{company}', companyName)
        .replace('{name}', candidate.candidate_name)
        .replace('{role}', 'Open Position')
      )
    }
  }, [candidate, template, isOpen, companyName])

  const handleSend = async () => {
    setSending(true)
    // Simulate sending
    await new Promise(resolve => setTimeout(resolve, 1500))
    setSending(false)
    onClose()
  }

  const dpdpaNotice = `

---
DATA DELETION NOTICE (DPDPA 2023)
Per the Digital Personal Data Protection Act, 2023, your personal data collected during this application process will be permanently deleted within 30 days of this notice. If you wish to request earlier deletion, please contact us.`

  return (
    <ModalOverlay isOpen={isOpen} onClose={onClose}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '20px 24px',
        borderBottom: '1px solid var(--border)',
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: 10,
          background: 'var(--sage-light)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Mail size={20} style={{ color: 'var(--sage)' }} />
        </div>
        <div style={{ flex: 1 }}>
          <div className="text-h3">Compose Email</div>
          <div className="text-body-sm">To: {candidate?.candidate_name || 'Candidate'}</div>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--slate-mid)', padding: 4,
          }}
        >
          <X size={20} />
        </button>
      </div>

      {/* Content */}
      <div style={{ padding: 24 }}>
        {/* Template Selector */}
        <div style={{ marginBottom: 16 }}>
          <div className="section-label" style={{ marginBottom: 8 }}>TEMPLATE</div>
          <div className="pill-toggle">
            {[
              { id: 'invite', label: 'Invite' },
              { id: 'rejection', label: 'Rejection' },
              { id: 'offer', label: 'Offer' },
            ].map(t => (
              <button
                key={t.id}
                className={`pill-toggle-option ${template === t.id ? 'active' : ''}`}
                onClick={() => setTemplate(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Subject */}
        <div style={{ marginBottom: 16 }}>
          <div className="section-label" style={{ marginBottom: 8 }}>SUBJECT</div>
          <input
            className="input-field"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
        </div>

        {/* Body */}
        <div style={{ marginBottom: 16 }}>
          <div className="section-label" style={{ marginBottom: 8 }}>MESSAGE</div>
          <textarea
            className="input-field"
            value={body + (includeDPDPA ? dpdpaNotice : '')}
            onChange={(e) => setBody(e.target.value)}
            style={{ minHeight: 200, resize: 'vertical' }}
          />
        </div>

        {/* DPDPA Toggle */}
        {template === 'rejection' && (
          <label style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '12px 14px',
            background: 'var(--blush-pale)',
            border: '1px solid var(--blush)',
            borderRadius: 8,
            cursor: 'pointer',
            marginBottom: 16,
          }}>
            <input
              type="checkbox"
              checked={includeDPDPA}
              onChange={(e) => setIncludeDPDPA(e.target.checked)}
              style={{ width: 18, height: 18 }}
            />
            <div>
              <div style={{
                fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 13,
                color: 'var(--blush)',
              }}>
                <AlertTriangle size={14} style={{ display: 'inline', marginRight: 6 }} />
                Include DPDPA Data Deletion Notice
              </div>
              <div style={{
                fontFamily: 'var(--font-sans)', fontSize: 12,
                color: 'var(--slate-mid)', marginTop: 2
              }}>
                Required for rejection emails under DPDPA 2023
              </div>
            </div>
          </label>
        )}
      </div>

      {/* Footer */}
      <div style={{
        display: 'flex', gap: 12,
        padding: '16px 24px',
        borderTop: '1px solid var(--border)',
        background: 'var(--cream-mid)',
      }}>
        <MagneticButton className="btn-secondary" onClick={onClose} style={{ flex: 1 }}>
          Cancel
        </MagneticButton>
        <MagneticButton
          className="btn-primary"
          glow
          onClick={handleSend}
          disabled={sending}
          style={{ flex: 1 }}
        >
          {sending ? (
            <>Sending...</>
          ) : (
            <><Send size={16} /> Send Email</>
          )}
        </MagneticButton>
      </div>
    </ModalOverlay>
  )
}

export function ScheduleModal({ isOpen, onClose, candidate }) {
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [duration, setDuration] = useState('60')
  const [syncGoogle, setSyncGoogle] = useState(false)
  const [scheduling, setScheduling] = useState(false)

  const handleSchedule = async () => {
    setScheduling(true)
    // Simulate scheduling
    await new Promise(resolve => setTimeout(resolve, 1500))
    setScheduling(false)
    onClose()
  }

  // Get next 7 days
  const getDateOptions = () => {
    const options = []
    const today = new Date()
    for (let i = 1; i <= 7; i++) {
      const d = new Date(today)
      d.setDate(d.getDate() + i)
      options.push({
        value: d.toISOString().split('T')[0],
        label: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
      })
    }
    return options
  }

  const timeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'
  ]

  return (
    <ModalOverlay isOpen={isOpen} onClose={onClose}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '20px 24px',
        borderBottom: '1px solid var(--border)',
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: 10,
          background: 'var(--sage-light)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Calendar size={20} style={{ color: 'var(--sage)' }} />
        </div>
        <div style={{ flex: 1 }}>
          <div className="text-h3">Schedule Interview</div>
          <div className="text-body-sm">With: {candidate?.candidate_name || 'Candidate'}</div>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--slate-mid)', padding: 4,
          }}
        >
          <X size={20} />
        </button>
      </div>

      {/* Content */}
      <div style={{ padding: 24 }}>
        {/* Date Picker */}
        <div style={{ marginBottom: 20 }}>
          <div className="section-label" style={{ marginBottom: 10 }}>SELECT DATE</div>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8
          }}>
            {getDateOptions().map(d => (
              <motion.button
                key={d.value}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setDate(d.value)}
                style={{
                  padding: '12px 8px',
                  background: date === d.value ? 'var(--sage)' : 'var(--white)',
                  color: date === d.value ? '#fff' : 'var(--slate)',
                  border: `1px solid ${date === d.value ? 'var(--sage)' : 'var(--border)'}`,
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontFamily: 'var(--font-sans)',
                  fontSize: 12,
                  fontWeight: 500,
                  transition: 'all 150ms',
                }}
              >
                {d.label}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Time Picker */}
        <div style={{ marginBottom: 20 }}>
          <div className="section-label" style={{ marginBottom: 10 }}>SELECT TIME</div>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8
          }}>
            {timeSlots.map(t => (
              <motion.button
                key={t}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setTime(t)}
                style={{
                  padding: '10px 8px',
                  background: time === t ? 'var(--sage)' : 'var(--white)',
                  color: time === t ? '#fff' : 'var(--slate)',
                  border: `1px solid ${time === t ? 'var(--sage)' : 'var(--border)'}`,
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 12,
                  transition: 'all 150ms',
                }}
              >
                {t}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Duration */}
        <div style={{ marginBottom: 20 }}>
          <div className="section-label" style={{ marginBottom: 10 }}>DURATION</div>
          <div className="pill-toggle">
            {['30', '45', '60', '90'].map(d => (
              <button
                key={d}
                className={`pill-toggle-option ${duration === d ? 'active' : ''}`}
                onClick={() => setDuration(d)}
              >
                {d} min
              </button>
            ))}
          </div>
        </div>

        {/* Google Sync */}
        <label style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '12px 14px',
          background: 'var(--cream-mid)',
          border: '1px solid var(--border)',
          borderRadius: 8,
          cursor: 'pointer',
        }}>
          <input
            type="checkbox"
            checked={syncGoogle}
            onChange={(e) => setSyncGoogle(e.target.checked)}
            style={{ width: 18, height: 18 }}
          />
          <div>
            <div style={{
              fontFamily: 'var(--font-sans)', fontWeight: 500, fontSize: 13,
              color: 'var(--ink)',
            }}>
              Sync with Google Workspace
            </div>
            <div style={{
              fontFamily: 'var(--font-sans)', fontSize: 12,
              color: 'var(--slate-mid)', marginTop: 2
            }}>
              Creates calendar event and sends invite
            </div>
          </div>
        </label>
      </div>

      {/* Footer */}
      <div style={{
        display: 'flex', gap: 12,
        padding: '16px 24px',
        borderTop: '1px solid var(--border)',
        background: 'var(--cream-mid)',
      }}>
        <MagneticButton className="btn-secondary" onClick={onClose} style={{ flex: 1 }}>
          Cancel
        </MagneticButton>
        <MagneticButton
          className="btn-primary"
          glow
          onClick={handleSchedule}
          disabled={scheduling || !date || !time}
          style={{ flex: 1 }}
        >
          {scheduling ? (
            <>Scheduling...</>
          ) : (
            <><CheckCircle size={16} /> Confirm</>
          )}
        </MagneticButton>
      </div>
    </ModalOverlay>
  )
}
