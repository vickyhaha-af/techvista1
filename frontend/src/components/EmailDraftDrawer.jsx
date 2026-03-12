import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Send, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react'
import { sendPipelineEmail, regeneratePipelineEmail } from '../utils/api'
import MagneticButton from './MagneticButton'

export default function EmailDraftDrawer({ isOpen, onClose, draftData, onSendSuccess }) {
  const [feedback, setFeedback] = useState('')
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [isSending, setIsSending] = useState(false)
  
  // Local state for the editable fields
  const [body, setBody] = useState(draftData?.email_body || '')
  const [subject, setSubject] = useState(draftData?.subject_line || '')
  const [toEmail, setToEmail] = useState('')
  
  const [status, setStatus] = useState(null) // { type: 'error' | 'success', msg: string }

  // Reset state when a new draft is loaded
  React.useEffect(() => {
    if (draftData) {
      setBody(draftData.email_body || '')
      setSubject(draftData.subject_line || 'Updates regarding your application')
      setStatus(null)
      setFeedback('')
    }
  }, [draftData])

  if (!isOpen || !draftData) return null

  const handleRegenerate = async () => {
    if (!feedback.trim()) {
      setStatus({ type: 'error', msg: 'Please provide feedback for the AI to rewrite.' })
      return
    }
    
    setIsRegenerating(true)
    setStatus(null)
    try {
      const res = await regeneratePipelineEmail(draftData.draft_id, feedback)
      setBody(res.data.email_body)
      setFeedback('')
      setStatus({ type: 'success', msg: 'Draft regenerated successfully.' })
    } catch (err) {
      setStatus({ type: 'error', msg: 'Failed to regenerate draft.' })
    } finally {
      setIsRegenerating(false)
    }
  }

  const handleSend = async () => {
    if (!toEmail.trim() || !toEmail.includes('@')) {
      setStatus({ type: 'error', msg: 'Please enter a valid recipient email address.' })
      return
    }
    
    setIsSending(true)
    setStatus(null)
    try {
      await sendPipelineEmail(draftData.draft_id, toEmail, subject, body)
      setStatus({ type: 'success', msg: 'Email sent successfully via Mock provider!' })
      setTimeout(() => {
        onSendSuccess?.()
        onClose()
      }, 1500)
    } catch (err) {
      setStatus({ type: 'error', msg: err?.response?.data?.detail || 'Failed to send email.' })
    } finally {
      setIsSending(false)
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(21, 26, 24, 0.4)',
          backdropFilter: 'blur(4px)',
          zIndex: 999,
          display: 'flex',
          justifyContent: 'flex-end'
        }}
        onClick={onClose}
      >
        <motion.div
          initial={{ x: '100%', opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          style={{
            width: '90%',
            maxWidth: 600,
            background: 'var(--cream)',
            borderLeft: '1px solid var(--border)',
            boxShadow: 'var(--shadow-elevated)',
            height: '100%',
            display: 'flex',
            flexDirection: 'column'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div style={{
            padding: '24px 32px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'var(--white)'
          }}>
            <div>
              <div className="section-label">AI ASSISTANT</div>
              <h2 className="text-h2" style={{ fontSize: 24, margin: '4px 0 0 0' }}>
                Review Draft
              </h2>
            </div>
            <button
              onClick={onClose}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--slate)', padding: 8, borderRadius: '50%'
              }}
            >
              <X size={20} />
            </button>
          </div>

          {/* Scrollable Content */}
          <div style={{ flex: 1, overflowY: 'auto', padding: 32, display: 'flex', flexDirection: 'column', gap: 24 }}>
            
            {/* Status MSG */}
            {status && (
              <div style={{
                padding: 12, borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8,
                background: status.type === 'error' ? 'var(--blush-pale)' : 'var(--sage-pale)',
                color: status.type === 'error' ? 'var(--blush)' : 'var(--sage)',
                fontFamily: 'var(--font-sans)', fontSize: 14
              }}>
                {status.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
                {status.msg}
              </div>
            )}

            {/* Headers */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--slate-mid)', marginBottom: 4, fontFamily: 'var(--font-sans)', fontWeight: 600 }}>
                  To Email
                </label>
                <input
                  type="email"
                  value={toEmail}
                  onChange={(e) => setToEmail(e.target.value)}
                  placeholder={`e.g. ${draftData.candidate_name.toLowerCase().replace(' ', '.')}@example.com`}
                  style={{
                    width: '100%', padding: '10px 14px',
                    borderRadius: 8, border: '1px solid var(--border)',
                    fontFamily: 'var(--font-sans)', fontSize: 14,
                    background: 'var(--white)'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--slate-mid)', marginBottom: 4, fontFamily: 'var(--font-sans)', fontWeight: 600 }}>
                  Subject
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  style={{
                    width: '100%', padding: '10px 14px',
                    borderRadius: 8, border: '1px solid var(--border)',
                    fontFamily: 'var(--font-sans)', fontSize: 14,
                    background: 'var(--white)'
                  }}
                />
              </div>
            </div>

            {/* Body */}
            <div>
              <label style={{ display: 'block', fontSize: 12, color: 'var(--slate-mid)', marginBottom: 4, fontFamily: 'var(--font-sans)', fontWeight: 600 }}>
                Message Body
              </label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                style={{
                  width: '100%', minHeight: 250, padding: 16,
                  borderRadius: 8, border: '1px solid var(--border)',
                  fontFamily: 'var(--font-sans)', fontSize: 14, lineHeight: 1.6,
                  background: 'var(--white)', resize: 'vertical'
                }}
              />
            </div>

            {/* AI Feedback Strip */}
            <div style={{
              background: 'var(--cream-mid)', padding: 16, borderRadius: 12,
              border: '1px dashed var(--border)', display: 'flex', flexDirection: 'column', gap: 12
            }}>
              <div style={{ fontSize: 13, color: 'var(--slate)', fontFamily: 'var(--font-sans)' }}>
                <strong>Draft needs a change?</strong> Give Gemini specific feedback to rewrite it.
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="text"
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="e.g. Make it sound a bit more casual"
                  style={{
                    flex: 1, padding: '8px 12px',
                    borderRadius: 6, border: '1px solid var(--border)',
                    fontFamily: 'var(--font-sans)', fontSize: 13,
                  }}
                  onKeyDown={e => e.key === 'Enter' && handleRegenerate()}
                />
                <button
                  onClick={handleRegenerate}
                  disabled={isRegenerating || !feedback.trim()}
                  style={{
                    padding: '0 16px', borderRadius: 6, border: 'none',
                    background: 'var(--sage)', color: 'var(--cream)',
                    fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 500,
                    cursor: (isRegenerating || !feedback.trim()) ? 'not-allowed' : 'pointer',
                    opacity: (isRegenerating || !feedback.trim()) ? 0.7 : 1,
                    display: 'flex', alignItems: 'center', gap: 6
                  }}
                >
                  <RefreshCw size={14} className={isRegenerating ? 'spin-anim' : ''} />
                  {isRegenerating ? 'Rewriting...' : 'Rewrite'}
                </button>
              </div>
            </div>

          </div>

          {/* Footer Actions */}
          <div style={{
            padding: '24px 32px',
            borderTop: '1px solid var(--border)',
            background: 'var(--white)',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 12
          }}>
            <MagneticButton className="btn-ghost" onClick={onClose} disabled={isSending}>
              Cancel
            </MagneticButton>
            <MagneticButton className="btn-primary" onClick={handleSend} disabled={isSending}>
              {isSending ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <RefreshCw size={16} className="spin-anim" /> Sending...
                </span>
              ) : (
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Send size={16} /> Send Email
                </span>
              )}
            </MagneticButton>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
