from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List


class ParsedResume(BaseModel):
    candidate_name: str = ""
    skills: list[str] = Field(default_factory=list)
    skills_text: str = ""
    experience: list[dict] = Field(default_factory=list)
    experience_text: str = ""
    experience_years: float = 0.0
    education: list[dict] = Field(default_factory=list)
    education_text: str = ""
    certifications: list[str] = Field(default_factory=list)
    institution_tier: str = "tier_3"
    raw_text: str = ""


class ParsedJD(BaseModel):
    title: str = ""
    required_skills: list[str] = Field(default_factory=list)
    skills_text: str = ""
    experience_requirements: str = ""
    experience_text: str = ""
    education_requirements: str = ""
    education_text: str = ""
    nice_to_have: list[str] = Field(default_factory=list)
    responsibilities: list[str] = Field(default_factory=list)
    raw_text: str = ""


class CandidateScore(BaseModel):
    """Flat score model — aligned with what the React frontend expects."""
    candidate_name: str
    # Flat dimension scores (0-100) — the frontend reads these directly
    skills_score: float = 0.0
    experience_score: float = 0.0
    education_score: float = 0.0
    composite_score: float = 0.0
    # Explanations per dimension
    skills_explanation: str = ""
    experience_explanation: str = ""
    education_explanation: str = ""
    # Skill gap data
    matched_skills: list[str] = Field(default_factory=list)
    partial_skills: list[str] = Field(default_factory=list)
    missing_skills: list[str] = Field(default_factory=list)
    # Metadata
    normalized_score: Optional[float] = None
    rank: int = 0
    institution_tier: str = "tier_3"
    experience_years: float = 0.0
    experience_cohort: str = "fresher"
    bias_flag: bool = False
    adjusted: bool = False


class BiasTestDetail(BaseModel):
    test_used: str = ""
    p_value: Optional[float] = None
    effect_size: Optional[float] = None
    bias_detected: bool = False
    group_averages: dict = Field(default_factory=dict)
    normalization_applied: bool = False


class BiasAuditResult(BaseModel):
    overall_status: str = "Pass"
    flags_detected: int = 0
    tests_run: int = 0
    details: dict = Field(default_factory=dict)   # category_name -> BiasTestDetail
    normalization_applied: bool = False


class JDQualityReport(BaseModel):
    """Aligned with what JDQualityCard.jsx expects."""
    score: float = 0.0
    has_responsibilities: bool = False
    has_requirements: bool = False
    has_nice_to_haves: bool = False
    has_experience_level: bool = False
    has_education: bool = False
    specificity_analysis: str = ""
    improvement_suggestions: list[str] = Field(default_factory=list)
    estimated_match_rate: str = "moderate"


class WeightsUpdate(BaseModel):
    skills: float = 0.50
    experience: float = 0.30
    education: float = 0.20


class SessionData(BaseModel):
    session_id: str
    user_id: Optional[str] = None  # Owner of this session
    jd: Optional[ParsedJD] = None
    jd_quality: Optional[JDQualityReport] = None
    resumes: list[ParsedResume] = Field(default_factory=list)
    scores: list[CandidateScore] = Field(default_factory=list)
    bias_audit: Optional[BiasAuditResult] = None
    weights: WeightsUpdate = Field(default_factory=WeightsUpdate)
    embeddings: dict = Field(default_factory=dict)
    status: str = "created"
    progress: float = 0.0
    is_demo: bool = False
    created_at: str = ""

# ==================== KANBAN PIPELINE MODELS ====================

class CandidateStageUpdate(BaseModel):
    """Request body for updating a candidate's pipeline stage."""
    candidate_id: str
    new_stage: str  # "new", "screening", "interview_1", "interview_2", "offer", "hired", "rejected"
    session_id: Optional[str] = None
    notes: Optional[str] = None


class PipelineCandidate(BaseModel):
    """A candidate within the Kanban pipeline."""
    candidate_id: str
    candidate_name: str
    stage: str = "new"
    composite_score: float = 0.0
    days_in_stage: int = 0
    stage_entered_at: str = ""
    notes: str = ""
    shortlisted: bool = False


# ==================== ANTI-BS AUTHENTICATOR MODELS ====================

class AntiBSRequest(BaseModel):
    """Request body for authenticity analysis."""
    resume_text: str
    candidate_name: Optional[str] = None
    github_url: Optional[str] = None
    kaggle_url: Optional[str] = None


class AntiBSResult(BaseModel):
    """Result of authenticity analysis."""
    authenticity_score: float = 0.0  # 0-100
    fluff_words: list[str] = Field(default_factory=list)
    hard_outcomes: list[str] = Field(default_factory=list)
    signal_to_noise_ratio: float = 0.0
    action_verb_analysis: dict = Field(default_factory=dict)
    github_verified: bool = False
    kaggle_verified: bool = False
    verification_notes: str = ""


# ==================== TEAM TOPOLOGY MODELS ====================

class TopologyMatchRequest(BaseModel):
    """Request body for team topology matching."""
    resume_text: str
    jd_text: str
    team_context: str  # e.g. "Heavy on API design, lacking DevOps"
    candidate_name: Optional[str] = None


class TopologyMatchResult(BaseModel):
    """Result of team topology analysis."""
    fit_score: float = 0.0  # 0-100
    fills_gaps: list[str] = Field(default_factory=list)
    overlaps: list[str] = Field(default_factory=list)
    team_balance_impact: str = ""
    recommendation: str = ""


# ==================== AUDIT TRAIL MODELS ====================

class AuditLogEntry(BaseModel):
    """An entry in the immutable audit trail."""
    timestamp: str = ""
    action: str = ""  # "stage_change", "score_adjusted", "weight_changed", "export", "bias_flag"
    user: str = "system"
    session_id: Optional[str] = None
    candidate_id: Optional[str] = None
    details: dict = Field(default_factory=dict)
    prev_hash: str = ""  # SHA-256 of previous entry for immutability
    entry_hash: str = ""  # SHA-256 of this entry


class AuditLogRequest(BaseModel):
    """Request body for logging an audit entry."""
    action: str
    session_id: Optional[str] = None
    candidate_id: Optional[str] = None
    details: dict = Field(default_factory=dict)
    user_id: Optional[str] = "system"

# -----------------------------------------------------------------
# Feature 1: Automated Concierge Outreach (Emails)
# -----------------------------------------------------------------
class PipelineMoveRequest(BaseModel):
    session_id: str
    candidate_id: str
    from_stage: str
    to_stage: str

class EmailDraftResponse(BaseModel):
    draft_id: str
    email_body: str
    candidate_name: str
    email_type: str
    subject_line: str

class EmailSendRequest(BaseModel):
    draft_id: str
    to_email: str
    final_body: str
    subject: str

class EmailRegenerateRequest(BaseModel):
    draft_id: str
    feedback: Optional[str] = None

# -----------------------------------------------------------------
# Feature 2: Explainable AI Enhancements
# -----------------------------------------------------------------
class CompareRequest(BaseModel):
    session_id: str
    candidate_id_A: str
    candidate_id_B: str

class CompareDimensionScore(BaseModel):
    gap: float
    ci_lower: float
    ci_upper: float
    significant: bool
    winner: str # "A", "B", "None"

class CompareComposite(BaseModel):
    total_delta: float
    skills_contribution: float
    exp_contribution: float
    edu_contribution: float
    skills_share_pct: float
    exp_share_pct: float
    edu_share_pct: float
    primary_driver: str

class CompareResult(BaseModel):
    candidate_A: Dict[str, Any]
    candidate_B: Dict[str, Any]
    dimensions: Dict[str, CompareDimensionScore]
    composite: CompareComposite
    narrative: str

class AttributionRequest(BaseModel):
    session_id: str
    candidate_id: str
    dimension: str # "skills", "experience", "education"

class SentenceAttribution(BaseModel):
    text: str
    contribution: float
    rank: int
    pct_of_score: float

class AttributionResult(BaseModel):
    sentences: List[SentenceAttribution]
    total_score: float
    explained_score: float
    unexplained: float

# -----------------------------------------------------------------
# Feature 3: Resume Rediscovery (Talent Pool)
# -----------------------------------------------------------------
class TalentPoolStoreRequest(BaseModel):
    session_id: str
    candidates_to_store: List[str]
    pipeline_stages: Dict[str, str]

class TalentPoolCandidateResult(BaseModel):
    id: str  # Added ID here so frontend has it
    candidate_name: str
    original_role: str
    screened_at: str
    recency_label: str
    original_score: float
    raw_similarity: float
    adjusted_score: float
    stage_reached: str
    skills_preview: List[str]
    decay_factor: float

class TalentPoolSearchResult(BaseModel):
    results: List[TalentPoolCandidateResult]
    total_in_pool: int
    query_time_ms: int

class TalentPoolRescreenRequest(BaseModel):
    session_id: str
    talent_pool_id: str
    user_id: Optional[str] = "system"
