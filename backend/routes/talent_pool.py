import os
import math
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException
import numpy as np

from models.schemas import (
    TalentPoolStoreRequest, TalentPoolSearchResult, 
    TalentPoolCandidateResult, TalentPoolRescreenRequest
)
from services.session_store import load_session
from db.supabase_client import get_supabase
from config import TALENT_POOL_DECAY_LAMBDA, TALENT_POOL_MIN_SCORE

router = APIRouter(prefix="/api/talent-pool", tags=["talent-pool"])

def _normalize_vec(v: np.ndarray) -> np.ndarray:
    norm = np.linalg.norm(v)
    if norm == 0:
        return v
    return v / norm

@router.post("/store")
async def store_candidates(request: TalentPoolStoreRequest):
    """Stores passed candidates into the talent_pool with weighted composite vector."""
    session = load_session(request.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    db = get_supabase()
    if not db:
        return {"error": "Supabase not configured. Cannot store to Talent Pool."}

    w_s = session.weights.skills
    w_e = session.weights.experience
    w_ed = session.weights.education

    stored, updated, skipped = 0, 0, 0

    for cid in request.candidates_to_store:
        cand = next((c for c in session.scores if c.candidate_name == cid), None)
        resume = next((r for r in session.resumes if r.candidate_name == cid), None)
        stage = request.pipeline_stages.get(cid, "rejected")

        if not cand or not resume:
            skipped += 1
            continue

        if cand.composite_score < TALENT_POOL_MIN_SCORE:
            skipped += 1
            continue

        embeds = session.embeddings.get(cid, {})
        v_s = np.array(embeds.get("skills", []))
        v_e = np.array(embeds.get("experience", []))
        v_ed = np.array(embeds.get("education", []))

        # Safe normalisation
        v_comp = np.zeros(768)
        if len(v_s) == 768 and len(v_e) == 768 and len(v_ed) == 768:
            v_comp = (v_s * w_s) + (v_e * w_e) + (v_ed * w_ed)
        v_comp = _normalize_vec(v_comp)
        
        # Check duplicate
        try:
            existing = db.table("talent_pool").select("id, composite_score").eq("candidate_name", cid).execute()
            if existing.data:
                # Update if new score is higher
                prev_score = existing.data[0].get("composite_score", 0)
                if cand.composite_score > prev_score:
                    db.table("talent_pool").update({
                        "composite_score": cand.composite_score,
                        "pipeline_stage": stage,
                        "screened_at": datetime.now(timezone.utc).isoformat(),
                        "composite_vec": v_comp.tolist()
                    }).eq("id", existing.data[0]["id"]).execute()
                    updated += 1
                else:
                    skipped += 1
                continue
        except Exception as e:
            print(f"[TalentPool] Failed to check duplicate: {e}")
            skipped += 1
            continue

        # Insert new
        try:
            db.table("talent_pool").insert({
                "candidate_name": cid,
                "original_session_id": request.session_id,
                "original_role": session.jd.title if session.jd else "Unknown Role",
                "screened_at": datetime.now(timezone.utc).isoformat(),
                "composite_score": cand.composite_score,
                "skills_score": cand.skills_score,
                "exp_score": cand.experience_score,
                "edu_score": cand.education_score,
                "pipeline_stage": stage,
                "skills_vec": v_s.tolist() if len(v_s) == 768 else None,
                "exp_vec": v_e.tolist() if len(v_e) == 768 else None,
                "edu_vec": v_ed.tolist() if len(v_ed) == 768 else None,
                "composite_vec": v_comp.tolist(),
                "parsed_skills": resume.skills,
            }).execute()
            stored += 1
        except Exception as e:
            print(f"[TalentPool] Failed to insert new candidate: {e}")
            skipped += 1

    return {"stored": stored, "updated": updated, "skipped": skipped}


@router.get("/search", response_model=TalentPoolSearchResult)
async def search_talent_pool(session_id: str, limit: int = 10):
    """Searches for past candidates matching the new JD."""
    session = load_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    db = get_supabase()
    if not db:
        return TalentPoolSearchResult(results=[], total_in_pool=0, query_time_ms=0)

    # Compute JD composite
    w_s = session.weights.skills
    w_e = session.weights.experience
    w_ed = session.weights.education
    
    jd_e = session.embeddings.get("jd", {})
    jd_v_s = np.array(jd_e.get("skills", []))
    jd_v_e = np.array(jd_e.get("experience", []))
    jd_v_ed = np.array(jd_e.get("education", []))
    
    jd_comp = np.zeros(768)
    if len(jd_v_s) == 768 and len(jd_v_e) == 768 and len(jd_v_ed) == 768:
        jd_comp = (jd_v_s * w_s) + (jd_v_e * w_e) + (jd_v_ed * w_ed)
    jd_comp = _normalize_vec(jd_comp)

    # Note: To perform pgvector `<=>` using Supabase Rest API, an RPC function 'search_talent_pool' is required.
    # The user SQL spec requires them to add the RPC to match. 
    start_t = datetime.now()
    try:
        res = db.rpc("search_talent_pool", {
            "query_embedding": jd_comp.tolist(),
            "match_limit": 20
        }).execute()
        raw_results = res.data or []
    except Exception as e:
        print(f"[TalentPool] RPC search_talent_pool failed: {e}. Ensure you have created the matching RPC in Supabase.")
        raw_results = []
    
    # Process results locally for decay and tiering
    processed = []
    
    for row in raw_results:
        try:
            screened_at = datetime.fromisoformat(row.get("screened_at", "").replace("Z", "+00:00"))
            days_since = (datetime.now(timezone.utc) - screened_at).days
        except Exception:
            days_since = 0
            
        decay_factor = math.exp(-TALENT_POOL_DECAY_LAMBDA * max(0, days_since))
        
        # We assume the RPC returns "raw_similarity" which is (1 - cosine_distance)
        raw_sim = row.get("raw_similarity", 0)
        adj_sim = raw_sim * decay_factor
        
        # Stage bonus
        stage = row.get("pipeline_stage", "rejected").lower()
        if "interview" in stage or stage in ["offer", "hired"]:
            adj_sim += 0.04
        elif stage == "shortlisted":
            adj_sim += 0.02
        
        final_score = min(100.0, max(0.0, adj_sim * 100))
        if final_score < 45.0:
            continue
            
        stage_reached = stage
        if days_since < 30:
            recency_label = "This month"
        else:
            recency_label = f"{days_since // 30} months ago"
            
        processed.append(TalentPoolCandidateResult(
            id=row.get("id", ""),
            candidate_name=row.get("candidate_name", "Unknown"),
            original_role=row.get("original_role", "Unknown"),
            screened_at=row.get("screened_at", ""),
            recency_label=recency_label,
            original_score=row.get("composite_score", 0),
            raw_similarity=float(raw_sim * 100),
            adjusted_score=final_score,
            stage_reached=stage_reached,
            skills_preview=row.get("parsed_skills", [])[:3],
            decay_factor=decay_factor
        ))
        
    processed.sort(key=lambda x: x.adjusted_score, reverse=True)
    processed = processed[:limit]
    
    # Pool size
    try:
        count_res = db.table("talent_pool").select("id", count="exact").execute()
        total_in_pool = count_res.count or 0
    except:
        total_in_pool = 0
        
    q_time = int((datetime.now() - start_t).total_seconds() * 1000)

    return TalentPoolSearchResult(
        results=processed,
        total_in_pool=total_in_pool,
        query_time_ms=q_time
    )

@router.get("/stats")
async def get_talent_pool_stats():
    """Returns general metrics for the Talent Pool."""
    db = get_supabase()
    if not db:
        # Return demo/mock stats when Supabase is not configured
        return {
            "total_candidates": 0,
            "roles_represented": 0,
            "avg_pool_score": 0.0,
            "oldest_entry_days": 0,
            "top_skills_in_pool": [],
            "stage_distribution": {"shortlisted": 0, "interview": 0, "rejected": 0}
        }
        
    try:
        data_res = db.table("talent_pool").select("composite_score, pipeline_stage, original_role").execute()
        rows = data_res.data or []
        
        roles = len(set(r.get("original_role") for r in rows if r.get("original_role")))
        scores = [r.get("composite_score", 0) for r in rows if r.get("composite_score")]
        avg = sum(scores) / len(scores) if scores else 0.0
        
        stages = {"shortlisted": 0, "interview": 0, "rejected": 0}
        for r in rows:
            st = r.get("pipeline_stage", "rejected")
            if "interview" in st:
                stages["interview"] += 1
            elif "shortlist" in st:
                stages["shortlisted"] += 1
            else:
                stages["rejected"] += 1
                
        return {
            "total_candidates": len(rows),
            "roles_represented": roles,
            "avg_pool_score": round(avg, 1),
            "oldest_entry_days": 0, # simplified 
            "top_skills_in_pool": ["Python", "JavaScript", "SQL"], # mock aggregation
            "stage_distribution": stages
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
