import React, { useState, createContext, useContext } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import UploadPage from './pages/UploadPage'
import ProcessingPage from './pages/ProcessingPage'
import ResultsPage from './pages/ResultsPage'
import DashboardPage from './pages/DashboardPage'
import ExportPage from './pages/ExportPage'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import { ToastProvider } from './components/Toast'
import { ModalProvider, SpatialContent } from './components/ModalContext'
import { AuthProvider, useAuth } from './contexts/AuthContext'

// Global session context
const SessionContext = createContext(null)

export function useSession() {
  return useContext(SessionContext)
}

function AppContent() {
  const [sessionData, setSessionData] = useState(null)
  const [currentStep, setCurrentStep] = useState(0) // 0 = landing, 1-4 = steps
  const navigate = useNavigate()

  const startScreening = () => {
    setCurrentStep(1)
    navigate('/upload')
  }

  const goToProcessing = (data) => {
    setSessionData(data)
    setCurrentStep(2)
    navigate('/processing')
  }

  const goToResults = (data) => {
    setSessionData(data)
    setCurrentStep(3)
    navigate('/results')
  }

  const goToExport = () => {
    setCurrentStep(4)
    navigate('/export')
  }

  const goToDashboard = (data) => {
    if (data) setSessionData(data)
    setCurrentStep(3) // Share step 3 with Results
    navigate('/dashboard')
  }

  const startNew = () => {
    setSessionData(null)
    setCurrentStep(1)
    navigate('/upload')
  }

  const goHome = () => {
    setCurrentStep(0)
    navigate('/')
  }

  return (
    <SessionContext.Provider value={{
      sessionData, setSessionData,
      currentStep, setCurrentStep,
      goToProcessing, goToResults, goToDashboard, goToExport, startNew, goHome
    }}>
      <SpatialContent className={currentStep > 0 ? 'main-content' : ''}>
        {currentStep > 0 && <Navbar currentStep={currentStep} />}
        <Routes>
          <Route path="/" element={<LandingPage onStart={startScreening} />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/upload" element={<UploadPage />} />
          <Route path="/processing" element={<ProcessingPage />} />
          <Route path="/results" element={<ResultsPage />} />
          <Route path="/dashboard" element={
            sessionData ? <DashboardPage sessionData={sessionData} setSessionData={setSessionData} /> : <Navigate to="/" />
          } />
          <Route path="/export" element={<ExportPage />} />
        </Routes>
      </SpatialContent>
    </SessionContext.Provider>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <ModalProvider>
            <AppContent />
          </ModalProvider>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
