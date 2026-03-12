import React, { createContext, useContext, useState } from 'react'
import { motion } from 'framer-motion'

const ModalContext = createContext({
  isModalOpen: false,
  setModalOpen: () => {},
})

export function useModalContext() {
  return useContext(ModalContext)
}

export function ModalProvider({ children }) {
  const [isModalOpen, setModalOpen] = useState(false)

  return (
    <ModalContext.Provider value={{ isModalOpen, setModalOpen }}>
      {children}
    </ModalContext.Provider>
  )
}

// Wrapper for main content — scales down & dims when a modal is open
// Creates a premium "spatial" depth effect used on Results/Dashboard pages
export function SpatialContent({ children, className = '' }) {
  const { isModalOpen } = useModalContext()

  return (
    <motion.div
      className={className}
      animate={{
        scale: isModalOpen ? 0.96 : 1,
        filter: isModalOpen ? 'brightness(0.6)' : 'brightness(1)',
        borderRadius: isModalOpen ? 24 : 0,
      }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 30,
      }}
      style={{
        transformOrigin: 'center center',
        overflow: isModalOpen ? 'hidden' : 'visible',
        minHeight: '100vh',
      }}
    >
      {children}
    </motion.div>
  )
}

export default ModalContext
