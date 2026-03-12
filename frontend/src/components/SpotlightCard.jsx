import React, { useRef } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'

/**
 * SpotlightCard — Glassmorphism card with mouse-following radial spotlight.
 * Semi-transparent white background with backdrop blur (CSS inline, no Tailwind).
 */
export default function SpotlightCard({ children, style = {} }) {
  const cardRef = useRef(null)
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  const spotlightX = useSpring(mouseX, { stiffness: 300, damping: 30 })
  const spotlightY = useSpring(mouseY, { stiffness: 300, damping: 30 })

  const handleMouseMove = (e) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    mouseX.set(e.clientX - rect.left)
    mouseY.set(e.clientY - rect.top)
  }

  const handleMouseLeave = () => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    mouseX.set(rect.width / 2)
    mouseY.set(rect.height / 2)
  }

  return (
    <motion.div
      ref={cardRef}
      style={{
        position: 'relative',
        overflow: 'hidden',
        background: 'rgba(255,255,255,0.55)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1px solid rgba(255,255,255,0.35)',
        borderRadius: 'var(--radius-card)',
        ...style
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.35 }}
      whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
    >
      <motion.div
        style={{
          pointerEvents: 'none',
          position: 'absolute', inset: 0, zIndex: 0,
          background: `radial-gradient(350px circle at ${spotlightX}px ${spotlightY}px, rgba(74,124,111,0.13), transparent 60%)`,
        }}
      />
      <div style={{ position: 'relative', zIndex: 1 }}>
        {children}
      </div>
    </motion.div>
  )
}
