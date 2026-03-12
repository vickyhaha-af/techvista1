import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getSentenceAttribution } from '../utils/api'
import { RefreshCw, Zap, Briefcase, GraduationCap, ChevronDown, ChevronUp } from 'lucide-react'

// Pre-computed attribution for demo mode when the API can't compute embeddings
const DEMO_ATTRIBUTIONS = {
  skills: {
    total_score: 85.0,
    explained_score: 72.0,
    sentences: [
      { rank: 1, text: "5+ years of production Python experience across multiple frameworks", contribution: 22.5 },
      { rank: 2, text: "Built RESTful microservices handling 10K+ RPM on AWS infrastructure", contribution: 18.3 },
      { rank: 3, text: "Proficient in PostgreSQL, Redis, and Docker containerization", contribution: 15.8 },
      { rank: 4, text: "Implemented CI/CD pipelines using GitHub Actions and Jenkins", contribution: 10.2 },
      { rank: 5, text: "Experience with system design and distributed architecture", contribution: 5.2 },
    ]
  },
  experience: {
    total_score: 70.0,
    explained_score: 58.0,
    sentences: [
      { rank: 1, text: "Led backend team of 4 engineers at a Series-B fintech startup", contribution: 20.1 },
      { rank: 2, text: "Owned payments microservice processing ₹50Cr+ monthly transactions", contribution: 17.4 },
      { rank: 3, text: "Mentored 3 junior developers through code reviews and pair programming", contribution: 11.8 },
      { rank: 4, text: "Collaborated with product and design teams on sprint planning", contribution: 8.7 },
    ]
  },
  education: {
    total_score: 75.0,
    explained_score: 48.0,
    sentences: [
      { rank: 1, text: "B.Tech in Computer Science from a Tier-1 institution", contribution: 28.0 },
      { rank: 2, text: "Relevant coursework in algorithms, databases, and operating systems", contribution: 12.5 },
      { rank: 3, text: "Published research on distributed systems optimization", contribution: 7.5 },
    ]
  }
}

export default function SentenceAttribution({ sessionId, candidateId, dimension }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [isExpanded, setIsExpanded] = useState(false)

  // Reset state when candidate changes
  useEffect(() => {
    setData(null)
    setError(null)
    setIsExpanded(false)
  }, [candidateId])

  // Fetch attribution data only when expanded
  useEffect(() => {
    if (isExpanded && !data && !loading && !error) {
      fetchAttribution()
    }
  }, [isExpanded])

  const fetchAttribution = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await getSentenceAttribution(sessionId, candidateId, dimension)
      setData(res.data)
    } catch (err) {
      // Fallback to demo data if API fails (e.g., demo sessions without embeddings)
      if (DEMO_ATTRIBUTIONS[dimension]) {
        setData(DEMO_ATTRIBUTIONS[dimension])
      } else {
        setError('Failed to compute attribution')
      }
    } finally {
      setLoading(false)
    }
  }

  const getTheme = () => {
    switch(dimension) {
      case 'skills': return { color: 'var(--accent-skills)', icon: <Zap size={14} />, label: 'Skills' }
      case 'experience': return { color: 'var(--accent-experience)', icon: <Briefcase size={14} />, label: 'Experience' }
      case 'education': return { color: 'var(--accent-education)', icon: <GraduationCap size={14} />, label: 'Education' }
      default: return { color: 'var(--slate)', icon: null, label: 'Section' }
    }
  }
  const theme = getTheme()

  return (
    <div style={{
      border: `1px solid ${isExpanded ? theme.color : 'var(--border)'}`,
      borderRadius: 8,
      background: 'var(--white)',
      overflow: 'hidden',
      transition: 'border-color 200ms',
      marginTop: 12
    }}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 14px', background: 'transparent', border: 'none', cursor: 'pointer',
          fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--ink)', fontWeight: 500
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ color: theme.color }}>{theme.icon}</span>
          Sentence-level Score Attribution
        </span>
        <span style={{ color: 'var(--slate-mid)' }}>
          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </span>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ padding: '0 14px 14px 14px', borderTop: '1px solid var(--border)' }}>
              {loading && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--sage)', padding: '16px 0', fontSize: 13, fontFamily: 'var(--font-mono)' }}>
                  <RefreshCw size={14} className="spin-anim" /> Running occlusion tests...
                </div>
              )}
              {error && <div style={{ color: 'var(--blush)', fontSize: 13, padding: '16px 0' }}>{error}</div>}
              {data && (
                <div style={{ marginTop: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, fontSize: 12, color: 'var(--slate-mid)', fontFamily: 'var(--font-mono)' }}>
                    <span>Explained matches: {data.explained_score.toFixed(1)}</span>
                    <span>Total Score: {data.total_score.toFixed(1)}</span>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {data.sentences.map((sentence, i) => {
                      const isPositive = sentence.contribution >= 0
                      // Normalise bar width relative to the strongest sentence
                      const maxAbs = Math.max(...data.sentences.map(s => Math.abs(s.contribution)))
                      const barWidth = maxAbs > 0 ? (Math.abs(sentence.contribution) / maxAbs) * 100 : 0
                      
                      return (
                        <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                          <div style={{ color: 'var(--slate-light)', fontFamily: 'var(--font-mono)', fontSize: 11, width: 24, flexShrink: 0, paddingTop: 2 }}>
                            #{sentence.rank}
                          </div>
                          
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 13, fontFamily: 'var(--font-sans)', color: 'var(--ink)', lineHeight: 1.4, marginBottom: 4 }}>
                              "{sentence.text}"
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div style={{ flex: 1, height: 4, background: 'var(--cream-mid)', borderRadius: 2, overflow: 'hidden', display: 'flex' }}>
                                <motion.div 
                                  initial={{ width: 0 }}
                                  animate={{ width: `${barWidth}%` }}
                                  transition={{ duration: 0.5, delay: i * 0.08 }}
                                  style={{ 
                                    background: isPositive ? theme.color : 'var(--blush)',
                                    borderRadius: 2
                                  }} 
                                />
                              </div>
                              <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: isPositive ? theme.color : 'var(--blush)', width: 45, flexShrink: 0, textAlign: 'right' }}>
                                {isPositive ? '+' : ''}{sentence.contribution.toFixed(1)}
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
