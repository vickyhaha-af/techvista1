import React, { useEffect, useRef, useState } from 'react'
import { useSpring, useMotionValue, motion, useTransform } from 'framer-motion'

/**
 * NumberTicker - Animated counting with spring physics.
 * Higher numbers animate longer, giving psychological "weight" to scores.
 */
export default function NumberTicker({
  value = 0,
  decimals = 0,
  suffix = '',
  prefix = '',
  animate = true,
  className = '',
  style = {},
}) {
  const ref = useRef(null)
  const [hasAnimated, setHasAnimated] = useState(false)
  const motionValue = useMotionValue(0)

  const springValue = useSpring(motionValue, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  })

  const displayValue = useTransform(springValue, (latest) => {
    return `${prefix}${latest.toFixed(decimals)}${suffix}`
  })

  useEffect(() => {
    if (!animate) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true)
          const timer = setTimeout(() => { motionValue.set(value) }, 50)
          return () => clearTimeout(timer)
        }
      },
      { threshold: 0.1 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [value, animate, hasAnimated, motionValue])

  useEffect(() => {
    if (hasAnimated) motionValue.set(value)
  }, [value, hasAnimated, motionValue])

  if (!animate) {
    return <span className={className} style={style}>{prefix}{value.toFixed(decimals)}{suffix}</span>
  }

  return <motion.span ref={ref} className={className} style={style}>{displayValue}</motion.span>
}

export function ScoreTicker({ value = 0, decimals = 0, showPercent = true, className = '', style = {} }) {
  return <NumberTicker value={value} decimals={decimals} suffix={showPercent ? '%' : ''} className={className} style={style} />
}
