import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 300000, // 5 min — long processing
})

api.interceptors.response.use(
  response => response,
  error => {
    const message = error.response?.data?.detail || error.message || 'An error occurred'
    console.error('API Error:', message)
    return Promise.reject(error)
  }
)

// Demo mode
export const loadDemo = () => api.get('/demo')

// Upload endpoints
export const uploadJD = (formData) =>
  api.post('/upload/jd', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })

export const uploadResumes = (formData) =>
  api.post('/upload/resumes', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })

// Full analysis pipeline
export const analyzeResumes = (jdText, resumeTexts, weights) =>
  api.post('/analyze', {
    jd_text: jdText,
    resume_texts: resumeTexts,
    weights,
  })

// Session
export const getSession = (sessionId) => api.get(`/session/${sessionId}`)

// Recalculate with new weights (uses cached embeddings)
export const recalculateScores = (sessionId, weights) =>
  api.post(`/recalculate/${sessionId}`, weights)

// Export
export const exportPDF = (sessionId) =>
  api.get(`/export/pdf/${sessionId}`, { responseType: 'blob' })

export const exportCSV = (sessionId) =>
  api.get(`/export/csv/${sessionId}`, { responseType: 'blob' })

// Health check
export const healthCheck = () => api.get('/health')

// ==================== KANBAN PIPELINE ====================

// Update candidate pipeline stage
export const updateCandidateStage = (candidateId, newStage, sessionId, notes = '') =>
  api.post('/candidates/stage', {
    candidate_id: candidateId,
    new_stage: newStage,
    session_id: sessionId,
    notes
  })

// Get pipeline state for a session
export const getPipeline = (sessionId) => api.get(`/pipeline/${sessionId}`)

// ==================== ANTI-BS AUTHENTICATOR ====================

// Analyze resume authenticity
export const analyzeAuthenticity = (resumeText, candidateName = '', githubUrl = '', kaggleUrl = '') =>
  api.post('/anti-bs', {
    resume_text: resumeText,
    candidate_name: candidateName,
    github_url: githubUrl,
    kaggle_url: kaggleUrl
  })

// ==================== TEAM TOPOLOGY ====================

// Match candidate to team dynamics
export const matchTeamTopology = (resumeText, jdText, teamContext, candidateName = '') =>
  api.post('/topology-match', {
    resume_text: resumeText,
    jd_text: jdText,
    team_context: teamContext,
    candidate_name: candidateName
  })

// ==================== AUDIT TRAIL ====================

// Log an audit entry
export const logAuditEntry = (action, sessionId = null, candidateId = null, details = {}) =>
  api.post('/audit/log', {
    action,
    session_id: sessionId,
    candidate_id: candidateId,
    details
  })

// Get audit stream (with optional session filter)
export const getAuditStream = (sessionId = null, limit = 50, offset = 0) =>
  api.get('/audit-stream', { params: { session_id: sessionId, limit, offset } })

// Export audit log for compliance
export const exportAuditLog = (sessionId) => api.get(`/audit/export/${sessionId}`)

export default api
