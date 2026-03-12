import React from 'react'
import { motion } from 'framer-motion'

/**
 * MagneticButton — Premium interactive button with spring physics.
 *
 * Physics:
 *  - whileHover: scale 1.015  (subtle lift)
 *  - whileTap:   scale 0.96   (satisfying press)
 *  - Spring: stiffness 400, damping 17, mass 0.8 → tight, clicky feel
 */

const springTransition = {
  type: 'spring',
  stiffness: 400,
  damping: 17,
  mass: 0.8,
}

export default function MagneticButton({
  children,
  className = '',
  glow = false,
  disabled = false,
  style = {},
  onClick,
  type = 'button',
  title,
  ...rest
}) {
  const glowStyle = glow && !disabled
    ? { boxShadow: '0 0 20px rgba(74,124,111,0.3), 0 0 40px rgba(74,124,111,0.1)' }
    : {}

  return (
    <motion.button
      type={type}
      className={className}
      style={{ ...glowStyle, ...style }}
      disabled={disabled}
      onClick={onClick}
      title={title}
      whileHover={disabled ? undefined : { scale: 1.015 }}
      whileTap={disabled ? undefined : { scale: 0.96 }}
      transition={springTransition}
      {...rest}
    >
      {children}
    </motion.button>
  )
}
