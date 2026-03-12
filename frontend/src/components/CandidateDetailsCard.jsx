import React from 'react'
import { motion } from 'framer-motion'
import { CheckCircle, AlertTriangle, ShieldAlert } from 'lucide-react'

// Simple helper to replace the removed AntiBS and SkillGap cards
export default function CandidateDetailsCard({ candidate }) {
  if (!candidate) return null

  // Process bias triggers
  const triggers = []
  if (candidate.triggers?.has_name_bias) triggers.push("Name Bias Detected")
  if (candidate.triggers?.has_age_bias) triggers.push("Age/Experience Over-weighting")
  if (candidate.triggers?.has_gender_bias) triggers.push("Gender-coded Language")
  if (candidate.triggers?.has_school_bias) triggers.push("Elitist Institution Bias")

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Bio / Summary */}
      <div className="glass-card" style={{ padding: '20px' }}>
        <h3 className="text-h3" style={{ marginBottom: '12px', fontSize: '1.1rem' }}>Candidate Overview</h3>
        <p style={{ fontFamily: 'var(--font-sans)', fontSize: 13, lineHeight: 1.5, color: 'var(--slate)' }}>
          {candidate.candidate_name} scored <strong>{candidate.composite_score.toFixed(1)}%</strong> overall, driven heavily by their {
            candidate.skills_score > candidate.experience_score ? 'skills evaluation' : 'experience timeline'
          }.
        </p>
      </div>

      {/* Bias Triggers */}
      <div className="glass-card" style={{ padding: '20px', borderLeft: triggers.length > 0 ? '4px solid var(--blush)' : '4px solid var(--moss)' }}>
        <h3 className="text-h3" style={{ marginBottom: '12px', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
          <ShieldAlert size={16} /> Bias Audit Snapshot
        </h3>
        {triggers.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {triggers.map((t, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--blush)', fontFamily: 'var(--font-sans)' }}>
                <AlertTriangle size={14} /> {t} (Score Auto-Adjusted)
              </div>
            ))}
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--moss)', fontFamily: 'var(--font-sans)' }}>
            <CheckCircle size={14} /> No significant bias triggers detected.
          </div>
        )}
      </div>
      
      {/* Skill Gaps Overview */}
      <div className="glass-card" style={{ padding: '20px' }}>
         <h3 className="text-h3" style={{ marginBottom: '12px', fontSize: '1.1rem' }}>Identified Skill Gaps</h3>
         <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
           {(candidate.missing_skills || []).length > 0 ? candidate.missing_skills.map((skill, index) => (
             <span key={index} className="badge badge-warning">
               {skill}
             </span>
           )) : (
             <span style={{ fontSize: 13, color: 'var(--slate-mid)', fontFamily: 'var(--font-mono)' }}>No major skill gaps found.</span>
           )}
         </div>
      </div>
    </div>
  )
}
