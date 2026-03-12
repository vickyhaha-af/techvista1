import os
import uuid
import json
import statistics
import google.generativeai as genai
from datetime import datetime, timezone

from models.schemas import PipelineMoveRequest, EmailDraftResponse
from services.session_store import load_session

_gemini_key = os.environ.get("GEMINI_API_KEY", "") or os.environ.get("GEMINI_API_KEY_1", "")
genai.configure(api_key=_gemini_key)

def draft_email_for_stage_change(request: PipelineMoveRequest) -> EmailDraftResponse | None:
    session = load_session(request.session_id)
    if not session:
        return None
        
    candidate = next((c for c in session.scores if c.candidate_name == request.candidate_id), None)
    if not candidate:
        return None
        
    resume = next((r for r in session.resumes if r.candidate_name == request.candidate_id), None)
    
    # ----------------------------------------------------
    # Step 1: Compute Signals
    # ----------------------------------------------------
    all_composite = [c.composite_score for c in session.scores]
    total_candidates = len(session.scores)
    mean_score = statistics.mean(all_composite) if all_composite else 0.0
    
    # Ranks is 1-indexed, candidate.rank holds sorting position
    percentile = 100 - ((candidate.rank - 1) / total_candidates * 100) if total_candidates > 1 else 99
    percentile = int(round(percentile))
    
    # Sort dimensions
    dims = [
        ("Skills", candidate.skills_score),
        ("Experience", candidate.experience_score),
        ("Education", candidate.education_score)
    ]
    dims.sort(key=lambda x: x[1], reverse=True)
    primary_strength, primary_score = dims[0]
    
    top_matched = candidate.matched_skills[:3] if candidate.matched_skills else ["core competencies"]
    top_gaps = candidate.missing_skills[:2] if candidate.missing_skills else ["specific domain requirements", "advanced tooling"]
    
    experience_summary = "their recent role"
    if resume and resume.experience:
        exp_entry = resume.experience[0]
        experience_summary = f"{exp_entry.get('title', 'Role')} at {exp_entry.get('company', 'Previous Company')}"
        
    role_title = session.jd.title if session.jd and session.jd.title else "the open position"

    # ----------------------------------------------------
    # Step 2: Determine Email Type
    # ----------------------------------------------------
    to_stage = request.to_stage.lower()
    email_type = "UNKNOWN"
    if to_stage == "shortlisted":
        email_type = "INVITE_TO_NEXT_STEP"
        subject_line = f"Next steps — {role_title}"
    elif to_stage.startswith("interview"):
        email_type = "INTERVIEW_CONFIRMATION"
        subject_line = f"Interview confirmed — {role_title}"
    elif to_stage == "rejected":
        email_type = "THOUGHTFUL_REJECTION"
        subject_line = f"Your application for {role_title}"
    elif to_stage == "offer":
        email_type = "OFFER_PREAMBLE"
        subject_line = f"We'd love to have you — {role_title}"
    else:
        # For 'new' or 'hired', we don't draft generally, but let's provide a fallback
        email_type = "STATUS_UPDATE"
        subject_line = f"Update on your application for {role_title}"

    # ----------------------------------------------------
    # Step 3: Build Gemini Prompt
    # ----------------------------------------------------
    system_prompt = (
        "You are a warm, professional HR communications writer for a fast-growing startup. "
        "You write emails that are specific, human, and respectful. You never use generic "
        "phrases like 'we regret to inform you'. Every sentence references something real "
        "and specific about this candidate. Write in a direct, confident tone. Max 180 words. "
        "Do not use bullet points. No sign-off needed. Output only the email body text."
    )
    
    if email_type == "THOUGHTFUL_REJECTION":
        user_prompt = f"""Write a rejection email for {request.candidate_id}.
They applied for the {role_title} role.
Their overall match score was {candidate.composite_score:.1f}%, placing them in the {percentile}th percentile of {total_candidates} applicants.
Their strongest area was {primary_strength} ({primary_score:.1f}% match), where they showed strong alignment on {', '.join(top_matched)}.
Their most recent role was {experience_summary}.
The specific gaps that prevented shortlisting were: {', '.join(top_gaps)} — both are core requirements for this particular role.
The email must:
1. Open by acknowledging something genuinely specific about their background.
2. Be honest about why they weren't selected, using the gap information above — not vague language. Frame gaps as requirements that weren't evident, not failures.
3. End with a genuine, specific encouragement referencing their actual strength area.
Tone: warm, direct, respectful. Not corporate."""
    
    elif email_type == "INVITE_TO_NEXT_STEP":
        user_prompt = f"""Write an interview invitation email for {request.candidate_id}.
They applied for the {role_title} role.
Their overall match score was {candidate.composite_score:.1f}%, placing them in the {percentile}th percentile of {total_candidates} applicants.
They ranked #{candidate.rank} overall.
Their skills match was {candidate.skills_score:.1f}%, driven by strong alignment on {', '.join(top_matched)}.
Their most recent experience: {experience_summary}.
The email must:
1. Open by referencing a specific, genuine reason why their profile stood out.
2. Convey real enthusiasm grounded in their actual scores — not generic excitement.
3. Include a placeholder [INTERVIEW_DATE_TIME] for HR to fill in.
4. Be direct about next steps.
Tone: energetic, specific, human. Not corporate."""

    elif email_type == "OFFER_PREAMBLE":
        user_prompt = f"""Write a warm offer preamble email for {request.candidate_id} for the {role_title} role.
They ranked #{candidate.rank} of {total_candidates} applicants with a {candidate.composite_score:.1f}% match score.
Their standout area: {primary_strength} at {primary_score:.1f}%.
Their most recent experience: {experience_summary}.
This email precedes the formal offer letter.
It should express genuine excitement about this specific person joining the team, reference one concrete thing from their background that excites the team, and set the expectation that a formal offer follows.
Include placeholder [OFFER_DETAILS] for HR to complete. Maximum 120 words. Tone: warm, direct, celebratory."""

    else:
        # Generic status update for other stages
        user_prompt = f"""Write a short status update email for {request.candidate_id} for the {role_title} role.
Their application is currently in stage: {request.to_stage}.
Tone: Professional, brief."""

    try:
        model = genai.GenerativeModel("gemini-1.5-flash", system_instruction=system_prompt)
        # temperature 0.75 as per spec
        response = model.generate_content(
            user_prompt,
            generation_config=genai.types.GenerationConfig(temperature=0.75, max_output_tokens=300)
        )
        email_body = response.text.strip()
    except Exception as e:
        print(f"[EmailDrafter] Error calling Gemini: {e}")
        email_body = f"Hi {request.candidate_id},\n\n[Auto-drafting failed. Please enter manual text here.]\n\nThanks,\nTech Vista Team"

    draft_id = str(uuid.uuid4())
    
    # We will let the router handle database insertion.
    return EmailDraftResponse(
        draft_id=draft_id,
        email_body=email_body,
        candidate_name=request.candidate_id,
        email_type=email_type,
        subject_line=subject_line
    )

def regenerate_email_draft(draft_id: str, old_body: str, feedback: str) -> str:
    system_prompt = "You are an HR writing assistant. You adjust drafted emails based on user feedback. Provide only the refreshed email text, nothing else."
    user_prompt = f"""Original Draft:
{old_body}

Feedback to apply:
{feedback}

Please rewrite the draft incorporating the feedback."""
    try:
        model = genai.GenerativeModel("gemini-1.5-flash", system_instruction=system_prompt)
        response = model.generate_content(
            user_prompt,
            generation_config=genai.types.GenerationConfig(temperature=0.85, max_output_tokens=300)
        )
        return response.text.strip()
    except Exception as e:
        print(f"[EmailDrafter] Error regenerating email: {e}")
        return old_body
