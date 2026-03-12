from pydantic import BaseModel, Field
from typing import Optional


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


class AuditLogRequest(BaseModel):
    """Request body for logging an audit entry."""
    action: str
    session_id: Optional[str] = None
    candidate_id: Optional[str] = None
    details: dict = Field(default_factory=dict)
