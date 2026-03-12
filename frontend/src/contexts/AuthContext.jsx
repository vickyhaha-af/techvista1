import React, { createContext, useContext, useState, useEffect } from 'react'
import { login, signup, getCurrentUser, logout } from '../utils/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check for stored token on mount
    const token = localStorage.getItem('techvista_token')
    if (token) {
      getCurrentUser()
        .then(res => {
          setUser(res.data)
        })
        .catch(() => {
          localStorage.removeItem('techvista_token')
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const handleLogin = async (email, password) => {
    const res = await login(email, password)
    const { user, session } = res.data
    localStorage.setItem('techvista_token', session.access_token)
    localStorage.setItem('techvista_user', JSON.stringify(user))
    setUser(user)
    return user
  }

  const handleSignup = async (email, password, fullName) => {
    const res = await signup(email, password, fullName)
    const { user, session } = res.data
    if (session?.access_token) {
      localStorage.setItem('techvista_token', session.access_token)
      localStorage.setItem('techvista_user', JSON.stringify(user))
      setUser(user)
    }
    return res.data
  }

  const handleLogout = async () => {
    await logout()
    setUser(null)
  }

  const value = {
    user,
    isAuthenticated: !!user,
    login: handleLogin,
    signup: handleSignup,
    logout: handleLogout,
    loading
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
