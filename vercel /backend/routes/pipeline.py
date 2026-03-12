"""
Pipeline routes — Kanban board, stage management, Anti-BS authenticator, Team Topology.
New endpoints for Tech Vista v2.0 Hiring OS features.
"""
import os
import json
import re
from datetime import datetime
from fastapi import APIRouter, HTTPException
from typing import Optional
import google.generativeai as genai

from models.schemas import (
    CandidateStageUpdate, PipelineCandidate,
    AntiBSRequest, AntiBSResult,
    TopologyMatchRequest, TopologyMatchResult,
    AuditLogEntry, AuditLogRequest
)

router = APIRouter(prefix="/api", tags=["pipeline"])

# Configure Gemini
genai.configure(api_key=os.environ.get("GEMINI_API_KEY", ""))

# In-memory pipeline state (keyed by session_id -> candidate_id -> PipelineCandidate)
pipeline_state: dict[str, dict[str, PipelineCandidate]] = {}

# In-memory audit log (in production, this would be a database)
audit_log: list[AuditLogEntry] = []

VALID_STAGES = ["new", "screening", "interview_1", "interview_2", "offer", "hired", "rejected"]


# ==================== KANBAN STAGE MANAGEMENT ====================

@router.post("/candidates/stage")
async def update_candidate_stage(update: CandidateStageUpdate):
    """Update a candidate's pipeline stage."""
    if update.new_stage not in VALID_STAGES:
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid stage. Must be one of: {', '.join(VALID_STAGES)}"
        )
    
    session_id = update.session_id or "default"
    if session_id not in pipeline_state:
        pipeline_state[session_id] = {}
    
    candidate = pipeline_state[session_id].get(update.candidate_id)
    old_stage = candidate.stage if candidate else "new"
    
    if not candidate:
        # Create new pipeline entry
        candidate = PipelineCandidate(
            candidate_id=update.candidate_id,
            candidate_name=update.candidate_id,  # Will be enriched from session
            stage=update.new_stage,
            stage_entered_at=datetime.now().isoformat(),
            notes=update.notes or ""
        )
        pipeline_state[session_id][update.candidate_id] = candidate
    else:
        # Update existing
        candidate.stage = update.new_stage
        candidate.stage_entered_at = datetime.now().isoformat()
        candidate.days_in_stage = 0
        if update.notes:
            candidate.notes = update.notes
    
    # Log the stage change
    log_entry = AuditLogEntry(
        timestamp=datetime.now().isoformat(),
        action="stage_change",
        session_id=session_id,
        candidate_id=update.candidate_id,
        details={
            "old_stage": old_stage,
            "new_stage": update.new_stage,
            "notes": update.notes
        }
    )
    audit_log.append(log_entry)
    
    return {
        "status": "success",
        "candidate_id": update.candidate_id,
        "new_stage": update.new_stage,
        "stage_entered_at": candidate.stage_entered_at
    }


@router.get("/pipeline/{session_id}")
async def get_pipeline(session_id: str):
    """Get all candidates in the pipeline for a session."""
    candidates = pipeline_state.get(session_id, {})
    
    # Calculate days in stage
    for candidate in candidates.values():
        if candidate.stage_entered_at:
            try:
                entered = datetime.fromisoformat(candidate.stage_entered_at)
                candidate.days_in_stage = (datetime.now() - entered).days
            except ValueError:
                pass
    
    # Group by stage
    grouped = {stage: [] for stage in VALID_STAGES}
    for candidate in candidates.values():
        grouped[candidate.stage].append(candidate)
    
    return {
        "session_id": session_id,
        "stages": grouped,
        "total_candidates": len(candidates)
    }


# ==================== ANTI-BS AUTHENTICATOR ====================

@router.post("/anti-bs")
async def analyze_authenticity(request: AntiBSRequest):
    """
    Analyze resume for authenticity: detect fluff vs hard outcomes.
    Uses Gemini to extract action verbs and quantifiable achievements.
    """
    try:
        model = genai.GenerativeModel("gemini-1.5-flash")
        
        prompt = f"""Analyze this resume text for authenticity. Extract:
1. All action verbs used (list them)
2. Separate "fluff" vague verbs (helped, assisted, participated, collaborated, worked on) from "hard outcome" verbs with quantifiable results (scaled, increased, reduced, built, launched, achieved)
3. Calculate a signal-to-noise ratio (hard outcomes / total action verbs)
4. Give an authenticity score 0-100 based on specificity and measurable achievements

Resume text:
{request.resume_text[:5000]}

Respond in JSON format:
{{
  "action_verbs": ["verb1", "verb2", ...],
  "fluff_words": ["helped", "assisted", ...],
  "hard_outcomes": ["scaled to 10k users", "reduced latency by 40%", ...],
  "signal_to_noise_ratio": 0.65,
  "authenticity_score": 72,
  "analysis_notes": "Brief explanation"
}}"""

        response = model.generate_content(prompt)
        text = response.text.strip()
        
        # Extract JSON from response
        json_match = re.search(r'\{[\s\S]*\}', text)
        if json_match:
            data = json.loads(json_match.group())
        else:
            data = {}
        
        result = AntiBSResult(
            authenticity_score=float(data.get("authenticity_score", 50)),
            fluff_words=data.get("fluff_words", []),
            hard_outcomes=data.get("hard_outcomes", []),
            signal_to_noise_ratio=float(data.get("signal_to_noise_ratio", 0.5)),
            action_verb_analysis={
                "total_verbs": len(data.get("action_verbs", [])),
                "fluff_count": len(data.get("fluff_words", [])),
                "outcome_count": len(data.get("hard_outcomes", []))
            },
            verification_notes=data.get("analysis_notes", "")
        )
        
        # TODO: Add GitHub/Kaggle verification if URLs provided
        if request.github_url:
            result.github_verified = False  # Placeholder for actual verification
            result.verification_notes += " GitHub URL provided but not yet verified."
        
        if request.kaggle_url:
            result.kaggle_verified = False  # Placeholder
            result.verification_notes += " Kaggle URL provided but not yet verified."
        
        return result
        
    except Exception as e:
        print(f"Anti-BS analysis error: {e}")
        # Return fallback result
        return AntiBSResult(
            authenticity_score=50,
            verification_notes=f"Analysis failed: {str(e)}"
        )


# ==================== TEAM TOPOLOGY MATCHING ====================

@router.post("/topology-match")
async def match_team_topology(request: TopologyMatchRequest):
    """
    Analyze how a candidate fits into the existing team dynamics.
    Uses Gemini to assess gap-filling and balance impact.
    """
    try:
        model = genai.GenerativeModel("gemini-1.5-flash")
        
        prompt = f"""You are analyzing team fit for a hiring decision.

TEAM CONTEXT (current team dynamics/gaps):
{request.team_context}

JOB DESCRIPTION:
{request.jd_text[:2000]}

CANDIDATE RESUME:
{request.resume_text[:3000]}

Analyze:
1. What gaps in the team does this candidate fill?
2. Where does the candidate overlap with existing team skills?
3. How would adding this person affect team balance?
4. Overall fit score (0-100) and recommendation

Respond in JSON format:
{{
  "fit_score": 78,
  "fills_gaps": ["DevOps expertise", "Cloud architecture", "CI/CD"],
  "overlaps": ["Python backend", "API design"],
  "team_balance_impact": "Would strengthen infrastructure side while adding needed DevOps expertise. Good complement to existing API-heavy team.",
  "recommendation": "Strong fit for the team's current needs. The DevOps gap is critical and this candidate addresses it well."
}}"""

        response = model.generate_content(prompt)
        text = response.text.strip()
        
        # Extract JSON from response
        json_match = re.search(r'\{[\s\S]*\}', text)
        if json_match:
            data = json.loads(json_match.group())
        else:
            data = {}
        
        return TopologyMatchResult(
            fit_score=float(data.get("fit_score", 50)),
            fills_gaps=data.get("fills_gaps", []),
            overlaps=data.get("overlaps", []),
            team_balance_impact=data.get("team_balance_impact", ""),
            recommendation=data.get("recommendation", "")
        )
        
    except Exception as e:
        print(f"Topology match error: {e}")
        return TopologyMatchResult(
            fit_score=50,
            recommendation=f"Analysis failed: {str(e)}"
        )


# ==================== AUDIT TRAIL ====================

@router.post("/audit/log")
async def log_audit_entry(request: AuditLogRequest):
    """Log an action to the immutable audit trail."""
    entry = AuditLogEntry(
        timestamp=datetime.now().isoformat(),
        action=request.action,
        session_id=request.session_id,
        candidate_id=request.candidate_id,
        details=request.details
    )
    audit_log.append(entry)
    
    return {
        "status": "logged",
        "timestamp": entry.timestamp,
        "action": entry.action
    }


@router.get("/audit-stream")
async def get_audit_stream(
    session_id: Optional[str] = None,
    limit: int = 50,
    offset: int = 0
):
    """
    Get audit log entries. Supports filtering by session_id.
    Returns newest entries first.
    """
    filtered = audit_log
    if session_id:
        filtered = [e for e in audit_log if e.session_id == session_id]
    
    # Sort by timestamp descending (newest first)
    sorted_entries = sorted(
        filtered, 
        key=lambda x: x.timestamp, 
        reverse=True
    )
    
    # Paginate
    paginated = sorted_entries[offset:offset + limit]
    
    return {
        "entries": paginated,
        "total": len(filtered),
        "limit": limit,
        "offset": offset
    }


@router.get("/audit/export/{session_id}")
async def export_audit_log(session_id: str):
    """Export audit log for DPDPA compliance reporting."""
    filtered = [e for e in audit_log if e.session_id == session_id]
    
    return {
        "session_id": session_id,
        "export_timestamp": datetime.now().isoformat(),
        "entries_count": len(filtered),
        "entries": filtered,
        "compliance_note": "This audit log is provided for DPDPA 2023 compliance purposes."
    }
