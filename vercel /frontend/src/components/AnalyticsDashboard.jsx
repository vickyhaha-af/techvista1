import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  TrendingUp, BarChart3, Filter, Download, Terminal,
  Clock, Users, Target, Shield
} from 'lucide-react'
import { 
  AreaChart, Area, BarChart, Bar, 
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Cell
} from 'recharts'
import { getAuditStream, exportAuditLog } from '../utils/api'
import MagneticButton from './MagneticButton'
import NumberTicker from './NumberTicker'

// Fake data for demo (replace with real API calls)
const TIME_TO_HIRE_DATA = [
  { week: 'W1', days: 12 },
  { week: 'W2', days: 10 },
  { week: 'W3', days: 15 },
  { week: 'W4', days: 8 },
  { week: 'W5', days: 11 },
  { week: 'W6', days: 7 },
]

const SOURCE_DATA = [
  { source: 'LinkedIn', value: 45 },
  { source: 'Inbound', value: 30 },
  { source: 'Referral', value: 20 },
  { source: 'Other', value: 5 },
]

const FUNNEL_DATA = [
  { stage: 'Applied', count: 150, color: 'var(--slate-mid)' },
  { stage: 'Screened', count: 85, color: 'var(--sage)' },
  { stage: 'Interview', count: 32, color: 'var(--accent-experience)' },
  { stage: 'Offer', count: 8, color: 'var(--moss)' },
  { stage: 'Hired', count: 5, color: 'var(--moss)' },
]

function MetricCard({ icon: Icon, label, value, suffix = '', trend, color = 'var(--sage)' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: 'var(--white)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        padding: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 9,
          background: `${color}15`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={18} style={{ color }} />
        </div>
        <span style={{
          fontFamily: 'var(--font-sans)', fontSize: 13,
          color: 'var(--slate-mid)'
        }}>{label}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <span style={{
          fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 32,
          color: 'var(--ink)'
        }}>
          <NumberTicker value={value} />
        </span>
        <span style={{
          fontFamily: 'var(--font-sans)', fontSize: 14,
          color: 'var(--slate-mid)'
        }}>{suffix}</span>
        {trend && (
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: 12,
            color: trend > 0 ? 'var(--moss)' : 'var(--blush)',
            marginLeft: 'auto'
          }}>
            {trend > 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>
    </motion.div>
  )
}

function AuditTerminal({ sessionId }) {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(false)
  const terminalRef = useRef(null)

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true)
      try {
        const res = await getAuditStream(sessionId, 50)
        setLogs(res.data.entries || [])
      } catch (err) {
        console.error('Failed to fetch audit logs:', err)
      }
      setLoading(false)
    }
    fetchLogs()
    
    // Poll for updates every 10 seconds
    const interval = setInterval(fetchLogs, 10000)
    return () => clearInterval(interval)
  }, [sessionId])

  // Auto-scroll to bottom
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight
    }
  }, [logs])

  const formatTime = (timestamp) => {
    try {
      return new Date(timestamp).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      })
    } catch {
      return '--:--:--'
    }
  }

  const getActionColor = (action) => {
    switch (action) {
      case 'stage_change': return 'var(--sage)'
      case 'score_adjusted': return 'var(--accent-education)'
      case 'weight_changed': return 'var(--accent-experience)'
      case 'bias_flag': return 'var(--blush)'
      case 'export': return 'var(--moss)'
      default: return 'var(--slate-mid)'
    }
  }

  return (
    <div style={{
      background: 'linear-gradient(180deg, #1A1D24 0%, #111318 100%)',
      borderRadius: 12,
      overflow: 'hidden',
      border: '1px solid rgba(255,255,255,0.1)',
    }}>
      {/* Terminal Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '12px 16px',
        background: 'rgba(255,255,255,0.05)',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
      }}>
        <div style={{ display: 'flex', gap: 6 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#FF5F57' }} />
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#FFBD2E' }} />
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#27CA40' }} />
        </div>
        <Terminal size={14} style={{ color: 'rgba(255,255,255,0.5)', marginLeft: 8 }} />
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: 12,
          color: 'rgba(255,255,255,0.5)'
        }}>audit_trail.log</span>
        <span style={{
          marginLeft: 'auto',
          fontFamily: 'var(--font-mono)', fontSize: 11,
          color: 'var(--sage)',
          animation: 'pulse 2s ease-in-out infinite'
        }}>LIVE</span>
      </div>

      {/* Terminal Content */}
      <div
        ref={terminalRef}
        style={{
          height: 280,
          overflowY: 'auto',
          padding: 16,
          fontFamily: 'var(--font-mono)',
          fontSize: 12,
          lineHeight: 1.8,
        }}
      >
        {logs.length === 0 && !loading && (
          <div style={{ color: 'rgba(255,255,255,0.3)' }}>
            No audit logs yet. Actions will appear here.
          </div>
        )}
        <AnimatePresence>
          {logs.map((log, i) => (
            <motion.div
              key={`${log.timestamp}-${i}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              style={{
                display: 'flex', gap: 12,
                color: 'rgba(255,255,255,0.7)',
              }}
            >
              <span style={{ color: 'rgba(255,255,255,0.4)' }}>
                [{formatTime(log.timestamp)}]
              </span>
              <span style={{ color: getActionColor(log.action) }}>
                {log.action.toUpperCase()}
              </span>
              <span>
                {log.candidate_id && `${log.candidate_id} — `}
                {log.details?.old_stage && `${log.details.old_stage} → ${log.details.new_stage}`}
                {log.details?.notes && ` "${log.details.notes}"`}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default function AnalyticsDashboard({ sessionId, sessionData }) {
  const [exporting, setExporting] = useState(false)

  const handleExportCompliance = async () => {
    if (!sessionId) return
    setExporting(true)
    try {
      const res = await exportAuditLog(sessionId)
      // Create and download JSON file
      const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `dpdpa_compliance_${sessionId.slice(0, 8)}.json`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Export failed:', err)
    }
    setExporting(false)
  }

  return (
    <div style={{ padding: 24 }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 24
      }}>
        <div>
          <div className="section-label">ANALYTICS</div>
          <h2 className="text-h1">Hiring Metrics</h2>
        </div>
        <MagneticButton
          className="btn-primary"
          glow
          onClick={handleExportCompliance}
          disabled={exporting}
          style={{ gap: 8 }}
        >
          {exporting ? (
            <>
              <motion.div
                animate={{ x: [0, 200, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: 40,
                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                }}
              />
              Generating...
            </>
          ) : (
            <>
              <Shield size={16} />
              Generate DPDPA Report
            </>
          )}
        </MagneticButton>
      </div>

      {/* Metrics Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 16,
        marginBottom: 24,
      }}>
        <MetricCard
          icon={Clock}
          label="Avg. Time to Hire"
          value={sessionData?.scores?.length ? Math.round(12 - sessionData.scores.length * 0.2) : 12}
          suffix="days"
          trend={-15}
          color="var(--sage)"
        />
        <MetricCard
          icon={Users}
          label="Total Candidates"
          value={sessionData?.scores?.length || 0}
          trend={8}
          color="var(--accent-experience)"
        />
        <MetricCard
          icon={Target}
          label="Shortlist Rate"
          value={sessionData?.scores ? Math.round(sessionData.scores.filter(s => s.composite_score >= 60).length / sessionData.scores.length * 100) : 0}
          suffix="%"
          color="var(--moss)"
        />
        <MetricCard
          icon={Shield}
          label="Bias Flags"
          value={sessionData?.bias_audit?.flags_detected || 0}
          color="var(--blush)"
        />
      </div>

      {/* Charts Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '2fr 1fr 1fr',
        gap: 16,
        marginBottom: 24,
      }}>
        {/* Time to Hire Trend */}
        <div style={{
          background: 'var(--white)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          padding: 20,
        }}>
          <div className="section-label" style={{ marginBottom: 16 }}>TIME TO HIRE TREND</div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={TIME_TO_HIRE_DATA}>
              <defs>
                <linearGradient id="colorDays" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--sage)" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="var(--sage)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="week" 
                axisLine={false} 
                tickLine={false}
                tick={{ fill: 'var(--slate-mid)', fontSize: 11 }}
              />
              <YAxis hide />
              <Tooltip
                contentStyle={{
                  background: 'var(--white)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  fontFamily: 'var(--font-sans)',
                  fontSize: 12,
                }}
              />
              <Area
                type="monotone"
                dataKey="days"
                stroke="var(--sage)"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorDays)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Source Effectiveness */}
        <div style={{
          background: 'var(--white)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          padding: 20,
        }}>
          <div className="section-label" style={{ marginBottom: 16 }}>SOURCE EFFECTIVENESS</div>
          <ResponsiveContainer width="100%" height={180}>
            <RadarChart data={SOURCE_DATA}>
              <PolarGrid stroke="var(--border)" />
              <PolarAngleAxis 
                dataKey="source" 
                tick={{ fill: 'var(--slate-mid)', fontSize: 10 }}
              />
              <Radar
                dataKey="value"
                stroke="var(--sage)"
                fill="var(--sage)"
                fillOpacity={0.4}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Pipeline Funnel */}
        <div style={{
          background: 'var(--white)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          padding: 20,
        }}>
          <div className="section-label" style={{ marginBottom: 16 }}>PIPELINE CONVERSION</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {FUNNEL_DATA.map((item, i) => (
              <div key={item.stage} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  flex: 1,
                  height: 24,
                  background: 'var(--cream-mid)',
                  borderRadius: 4,
                  overflow: 'hidden',
                }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(item.count / FUNNEL_DATA[0].count) * 100}%` }}
                    transition={{ duration: 0.8, delay: i * 0.1 }}
                    style={{
                      height: '100%',
                      background: item.color,
                      borderRadius: 4,
                    }}
                  />
                </div>
                <span style={{
                  fontFamily: 'var(--font-mono)', fontSize: 11,
                  color: 'var(--slate-mid)', minWidth: 30
                }}>{item.count}</span>
              </div>
            ))}
          </div>
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            marginTop: 8, fontFamily: 'var(--font-sans)', fontSize: 10,
            color: 'var(--slate-light)'
          }}>
            {FUNNEL_DATA.map(item => (
              <span key={item.stage}>{item.stage}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Audit Terminal */}
      <div>
        <div className="section-label" style={{ marginBottom: 12 }}>IMMUTABLE AUDIT TRAIL</div>
        <AuditTerminal sessionId={sessionId} />
      </div>
    </div>
  )
}
