import React from 'react'
import { motion } from 'framer-motion'

/**
 * Aceternity-style Aurora Background — Tailwind-free version
 * 3 animated gaussian blobs using inline CSS + framer-motion
 */
export default function AuroraBackground({ children }) {
  return (
    <div style={{ position: 'relative', overflow: 'hidden' }}>
      {/* Aurora layers */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        {/* Base */}
        <div style={{ position: 'absolute', inset: 0, background: 'var(--cream)' }} />

        {/* Blob 1 — sage */}
        <motion.div
          style={{
            position: 'absolute',
            width: '60vw', height: '60vw',
            borderRadius: '50%',
            filter: 'blur(80px)',
            opacity: 0.30,
            background: 'radial-gradient(circle, rgba(74,124,111,0.45) 0%, transparent 70%)',
            top: '-20%', left: '-10%',
          }}
          animate={{ x: [0, 100, 50, 0], y: [0, 50, 100, 0], scale: [1, 1.1, 0.95, 1] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Blob 2 — moss */}
        <motion.div
          style={{
            position: 'absolute',
            width: '50vw', height: '50vw',
            borderRadius: '50%',
            filter: 'blur(80px)',
            opacity: 0.22,
            background: 'radial-gradient(circle, rgba(94,122,82,0.40) 0%, transparent 70%)',
            top: '10%', right: '-15%',
          }}
          animate={{ x: [0, -80, -40, 0], y: [0, 80, 40, 0], scale: [1, 0.9, 1.05, 1] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        />

        {/* Blob 3 — cream accent */}
        <motion.div
          style={{
            position: 'absolute',
            width: '45vw', height: '45vw',
            borderRadius: '50%',
            filter: 'blur(80px)',
            opacity: 0.35,
            background: 'radial-gradient(circle, rgba(234,230,221,0.7) 0%, transparent 70%)',
            bottom: '-10%', left: '20%',
          }}
          animate={{ x: [0, 60, -30, 0], y: [0, -60, -30, 0], scale: [1, 1.05, 0.98, 1] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut', delay: 4 }}
        />

        {/* Shimmer overlay */}
        <motion.div
          style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(135deg, rgba(74,124,111,0.07) 0%, transparent 50%, rgba(94,122,82,0.07) 100%)',
          }}
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 10 }}>
        {children}
      </div>
    </div>
  )
}
