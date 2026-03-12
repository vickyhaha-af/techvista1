import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Calendar, Clock, Video, MapPin, Send, CheckCircle2, AlertCircle, User, Copy } from 'lucide-react'
import MagneticButton from './MagneticButton'

const TIME_SLOTS = [
  '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM',
  '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM',
  '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM',
  '04:00 PM', '04:30 PM', '05:00 PM', '05:30 PM'
]

const INTERVIEW_TYPES = [
  { id: 'video', label: 'Video Call', icon: Video, description: 'Google Meet / Zoom' },
  { id: 'inperson', label: 'In Person', icon: MapPin, description: 'Office location' },
  { id: 'phone', label: 'Phone Screen', icon: Clock, description: '15-30 min call' },
]

function getNextWeekdays(count = 10) {
  const days = []
  const date = new Date()
  date.setDate(date.getDate() + 1)
  while (days.length < count) {
    const day = date.getDay()
    if (day !== 0 && day !== 6) {
      days.push(new Date(date))
    }
    date.setDate(date.getDate() + 1)
  }
  return days
}

export default function ScheduleInterviewModal({ isOpen, onClose, candidate }) {
  const [selectedDate, setSelectedDate] = useState(null)
  const [selectedTime, setSelectedTime] = useState(null)
  const [interviewType, setInterviewType] = useState('video')
  const [interviewerName, setInterviewerName] = useState('')
  const [notes, setNotes] = useState('')
  const [status, setStatus] = useState(null) // null | 'sending' | 'success' | 'error'
  const [calendarLink, setCalendarLink] = useState(null)

  if (!isOpen || !candidate) return null

  const weekdays = getNextWeekdays(10)

  const formatDate = (d) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    return { day: days[d.getDay()], date: d.getDate(), month: months[d.getMonth()], full: d.toISOString().split('T')[0] }
  }

  const handleSchedule = () => {
    if (!selectedDate || !selectedTime) {
      setStatus('error')
      return
    }

    setStatus('sending')

    // Build Google Calendar link
    const dateObj = new Date(selectedDate)
    const [time, period] = selectedTime.split(' ')
    let [hours, minutes] = time.split(':').map(Number)
    if (period === 'PM' && hours !== 12) hours += 12
    if (period === 'AM' && hours === 12) hours = 0
    dateObj.setHours(hours, minutes, 0)

    const endDate = new Date(dateObj.getTime() + 60 * 60 * 1000) // 1 hour
    const fmt = (d) => d.toISOString().replace(/[-:]/g, '').replace('.000', '')
    const typeLabel = INTERVIEW_TYPES.find(t => t.id === interviewType)?.label || 'Interview'

    const title = encodeURIComponent(`${typeLabel} — ${candidate.candidate_name}`)
    const details = encodeURIComponent(
      `Interview with ${candidate.candidate_name}\nScore: ${Math.round(candidate.composite_score)}%\n${interviewerName ? `Interviewer: ${interviewerName}` : ''}\n${notes ? `Notes: ${notes}` : ''}`
    )
    const location = encodeURIComponent(
      interviewType === 'video' ? 'Google Meet (link will be generated)' :
      interviewType === 'phone' ? 'Phone call' : 'Office'
    )

    const gcalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${fmt(dateObj)}/${fmt(endDate)}&details=${details}&location=${location}`
    
    setCalendarLink(gcalUrl)

    setTimeout(() => {
      setStatus('success')
    }, 800)
  }

  const handleCopyLink = () => {
    if (calendarLink) {
      navigator.clipboard.writeText(calendarLink)
    }
  }

  const resetAndClose = () => {
    setSelectedDate(null)
    setSelectedTime(null)
    setInterviewType('video')
    setInterviewerName('')
    setNotes('')
    setStatus(null)
    setCalendarLink(null)
    onClose()
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(21, 26, 24, 0.4)', backdropFilter: 'blur(4px)',
          zIndex: 999, display: 'flex', justifyContent: 'center', alignItems: 'center'
        }}
        onClick={resetAndClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          style={{
            width: '90%', maxWidth: 560, maxHeight: '90vh',
            background: 'var(--cream)', borderRadius: 16,
            border: '1px solid var(--border)', boxShadow: 'var(--shadow-elevated)',
            display: 'flex', flexDirection: 'column', overflow: 'hidden'
          }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div style={{
            padding: '20px 24px', borderBottom: '1px solid var(--border)',
            background: 'var(--white)', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
          }}>
            <div>
              <div className="section-label">PIPELINE ACTION</div>
              <h2 className="text-h2" style={{ fontSize: 20, margin: '4px 0 0 0' }}>
                Schedule Interview
              </h2>
            </div>
            <button onClick={resetAndClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--slate)', padding: 8 }}>
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div style={{ flex: 1, overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
            
            {/* Candidate Info */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12,
              background: 'var(--white)', padding: 14, borderRadius: 10, border: '1px solid var(--border)'
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: 'var(--sage-light)', color: 'var(--sage)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16
              }}>
                {candidate.candidate_name.charAt(0)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 14, color: 'var(--ink)' }}>
                  {candidate.candidate_name}
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--slate-mid)' }}>
                  Score: {Math.round(candidate.composite_score)}% · Stage: {(candidate.stage || 'new').replace('_', ' ')}
                </div>
              </div>
            </div>

            {status === 'error' && (
              <div style={{
                padding: 10, borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8,
                background: 'var(--blush-pale)', color: 'var(--blush)',
                fontFamily: 'var(--font-sans)', fontSize: 13
              }}>
                <AlertCircle size={14} /> Please select both a date and time slot
              </div>
            )}

            {status === 'success' ? (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '32px 0' }}>
                <CheckCircle2 size={48} style={{ color: 'var(--moss)' }} />
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 16, color: 'var(--ink)', marginBottom: 4 }}>
                    Interview Scheduled!
                  </div>
                  <div style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--slate-mid)' }}>
                    {candidate.candidate_name} · {selectedTime} on {selectedDate}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <MagneticButton className="btn-primary" onClick={() => window.open(calendarLink, '_blank')}
                    style={{ fontSize: 13 }}>
                    <Calendar size={14} /> Add to Google Calendar
                  </MagneticButton>
                  <MagneticButton className="btn-ghost" onClick={handleCopyLink} style={{ fontSize: 13 }}>
                    <Copy size={14} /> Copy Link
                  </MagneticButton>
                </div>
              </motion.div>
            ) : (
              <>
                {/* Interview Type */}
                <div>
                  <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 12, color: 'var(--slate-mid)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                    Interview Type
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                    {INTERVIEW_TYPES.map(({ id, label, icon: Icon, description }) => (
                      <button key={id} onClick={() => setInterviewType(id)} style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                        padding: '14px 10px', borderRadius: 10, cursor: 'pointer',
                        background: interviewType === id ? 'var(--sage-pale)' : 'var(--white)',
                        border: `1.5px solid ${interviewType === id ? 'var(--sage)' : 'var(--border)'}`,
                        transition: 'all 150ms',
                      }}>
                        <Icon size={18} style={{ color: interviewType === id ? 'var(--sage)' : 'var(--slate-mid)' }} />
                        <span style={{ fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 600, color: interviewType === id ? 'var(--sage)' : 'var(--ink)' }}>{label}</span>
                        <span style={{ fontFamily: 'var(--font-sans)', fontSize: 10, color: 'var(--slate-light)' }}>{description}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Date Selection */}
                <div>
                  <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 12, color: 'var(--slate-mid)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                    Select Date
                  </div>
                  <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
                    {weekdays.map(d => {
                      const f = formatDate(d)
                      const isSelected = selectedDate === f.full
                      return (
                        <button key={f.full} onClick={() => { setSelectedDate(f.full); setStatus(null) }}
                          style={{
                            minWidth: 52, padding: '10px 8px', borderRadius: 10, cursor: 'pointer',
                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                            background: isSelected ? 'var(--sage)' : 'var(--white)',
                            border: `1px solid ${isSelected ? 'var(--sage)' : 'var(--border)'}`,
                            transition: 'all 150ms',
                          }}>
                          <span style={{ fontFamily: 'var(--font-sans)', fontSize: 10, fontWeight: 500, color: isSelected ? 'rgba(255,255,255,0.7)' : 'var(--slate-light)' }}>{f.day}</span>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 700, color: isSelected ? 'var(--white)' : 'var(--ink)' }}>{f.date}</span>
                          <span style={{ fontFamily: 'var(--font-sans)', fontSize: 10, color: isSelected ? 'rgba(255,255,255,0.7)' : 'var(--slate-light)' }}>{f.month}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Time Selection */}
                <div>
                  <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 12, color: 'var(--slate-mid)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                    Select Time
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
                    {TIME_SLOTS.map(slot => {
                      const isSelected = selectedTime === slot
                      return (
                        <button key={slot} onClick={() => { setSelectedTime(slot); setStatus(null) }}
                          style={{
                            padding: '8px 4px', borderRadius: 8, cursor: 'pointer',
                            fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: isSelected ? 600 : 400,
                            background: isSelected ? 'var(--sage)' : 'var(--white)',
                            color: isSelected ? 'var(--white)' : 'var(--ink)',
                            border: `1px solid ${isSelected ? 'var(--sage)' : 'var(--border)'}`,
                            transition: 'all 150ms',
                          }}>
                          {slot}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Interviewer & Notes */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 600, color: 'var(--slate-mid)', marginBottom: 4 }}>
                      Interviewer (optional)
                    </label>
                    <input type="text" value={interviewerName} onChange={e => setInterviewerName(e.target.value)}
                      placeholder="e.g. Vikram S."
                      style={{
                        width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)',
                        fontFamily: 'var(--font-sans)', fontSize: 13, background: 'var(--white)'
                      }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 600, color: 'var(--slate-mid)', marginBottom: 4 }}>
                      Notes (optional)
                    </label>
                    <input type="text" value={notes} onChange={e => setNotes(e.target.value)}
                      placeholder="e.g. Focus on system design"
                      style={{
                        width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)',
                        fontFamily: 'var(--font-sans)', fontSize: 13, background: 'var(--white)'
                      }} />
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          {status !== 'success' && (
            <div style={{
              padding: '16px 24px', borderTop: '1px solid var(--border)', background: 'var(--white)',
              display: 'flex', justifyContent: 'flex-end', gap: 10
            }}>
              <MagneticButton className="btn-ghost" onClick={resetAndClose}>Cancel</MagneticButton>
              <MagneticButton className="btn-primary" onClick={handleSchedule} disabled={status === 'sending'}>
                {status === 'sending' ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Clock size={14} className="spin-anim" /> Creating...</span>
                ) : (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Calendar size={14} /> Schedule Interview</span>
                )}
              </MagneticButton>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
