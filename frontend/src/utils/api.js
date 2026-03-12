import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
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

// Update candidate pipeline stage (Now returns email drafts)
export const updateCandidateStage = (candidateId, newStage, sessionId, notes = '') =>
  api.post('/pipeline/move', {
    candidate_id: candidateId,
    to_stage: newStage,
    from_stage: 'unknown',
    session_id: sessionId,
    notes
  })

// Send drafted email
export const sendPipelineEmail = (draftId, toEmail, subject, finalBody) =>
  api.post('/pipeline/send-email', {
    draft_id: draftId,
    to_email: toEmail,
    subject: subject,
    final_body: finalBody
  })

// Regenerate email draft with feedback
export const regeneratePipelineEmail = (draftId, feedback) =>
  api.post('/pipeline/regenerate', {
    draft_id: draftId,
    feedback: feedback
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

// ==================== EXPLAINABLE AI ====================

// Compare two candidates using bootstrap CI
export const compareCandidates = (sessionId, candidateIdA, candidateIdB) =>
  api.post('/explain/compare', {
    session_id: sessionId,
    candidate_id_A: candidateIdA,
    candidate_id_B: candidateIdB
  })

// Get sentence-level attribution
export const getSentenceAttribution = (sessionId, candidateId, dimension) =>
  api.post('/explain/attribution', {
    session_id: sessionId,
    candidate_id: candidateId,
    dimension: dimension // "skills", "experience", "education"
  })

// ==================== TALENT POOL ====================

// Archive candidates to the pgvector pool
export const storeToTalentPool = (sessionId, candidatesToStore, pipelineStages) =>
  api.post('/talent-pool/store', {
    session_id: sessionId,
    candidates_to_store: candidatesToStore,
    pipeline_stages: pipelineStages
  })

// Search the global talent pool against the active JD
export const searchTalentPool = (sessionId, limit = 10) =>
  api.get('/talent-pool/search', {
    params: { session_id: sessionId, limit }
  })

// Get talent pool stats
export const getTalentPoolStats = () => 
  api.get('/talent-pool/stats')

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
