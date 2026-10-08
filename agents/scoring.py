"""Scoring & Timing Agent: Evaluates lead fit, evidence freshness, and anti-spam constraints."""

from __future__ import annotations

import json
from datetime import datetime, timezone

from agents.base import agent_node, check_permission, load_prompt_template, record_trace
from agents.llm import call_structured
from shared.schemas import BusinessProfile, Fact, GrowthState, Lead, LeadScore


@agent_node("scoring")
def run_scoring(state: GrowthState) -> GrowthState:
    """Run scoring agent to compute lead fit and determine outreach action & timing.

    Reads: facts, profile, lead, optional outcomes
    Produces: score in state['score']
    """
    check_permission("scoring", "evaluate_fit")

    raw_profile = state.get("profile")
    raw_lead = state.get("lead")
    raw_facts = state.get("facts", [])
    raw_outcomes = state.get("outcomes", [])

    if not raw_profile or not raw_lead:
        raise ValueError("Scoring agent requires 'profile' and 'lead' in state.")

    profile = BusinessProfile.model_validate(raw_profile) if isinstance(raw_profile, dict) else raw_profile
    lead = Lead.model_validate(raw_lead) if isinstance(raw_lead, dict) else raw_lead

    # 1. Deterministic Anti-Spam Check: Opt-out enforcement
    lead_email_lower = lead.email.lower()
    lead_domain = lead_email_lower.split("@")[-1] if "@" in lead_email_lower else ""
    opt_out_list = [entry.lower() for entry in profile.anti_spam.opt_out_list]

    if lead_email_lower in opt_out_list or lead_domain in opt_out_list or lead.status == "opted_out":
        score = LeadScore(
            score=0,
            breakdown={"fit": 0.0, "intent": 0.0, "freshness": 0.0, "source_quality": 0.0},
            decision="REJECT",
            reason="Lead email or domain is present on the anti-spam opt-out list.",
            recheck_after=None,
        )
        state["score"] = score.model_dump()
        record_trace(
            state=state,
            agent="scoring",
            step="evaluate_lead",
            input_summary=f"Lead: {lead.email}, Facts: {len(raw_facts)}",
            output_summary="Decision: REJECT, Score: 0",
            reason="Hard anti-spam policy: lead is in opt-out list",
        )
        return state

    # 2. Check for stale lead data (> 1 year old last_contacted or stale facts)
    is_stale = False
    if lead.last_contacted:
        try:
            contact_year = int(lead.last_contacted[:4])
            if contact_year < 2026:
                is_stale = True
        except Exception:
            pass

    # 3. Format facts & past outcomes
    facts_text_list = []
    for f in raw_facts:
        f_obj = Fact.model_validate(f) if isinstance(f, dict) else f
        facts_text_list.append(
            f"- [{f_obj.id}] ({f_obj.kind}, confidence={f_obj.confidence:.2f}, source={f_obj.source}, date={f_obj.source_date}): {f_obj.statement}"
        )
    facts_str = "\n".join(facts_text_list) if facts_text_list else "No verified facts available."

    outcomes_str = json.dumps(raw_outcomes, indent=2) if raw_outcomes else "No past campaign outcome history."

    anti_spam_str = (
        f"Max contacts per week: {profile.anti_spam.max_contacts_per_week}\n"
        f"Quiet hours: {profile.anti_spam.quiet_hours}\n"
        f"Opt-out list size: {len(profile.anti_spam.opt_out_list)}"
    )

    lead_info_str = (
        f"Name: {lead.name}\n"
        f"Company: {lead.company}\n"
        f"Role: {lead.role}\n"
        f"Email: {lead.email}\n"
        f"Status: {lead.status}\n"
        f"Last Contacted: {lead.last_contacted or 'Never'}\n"
        f"Data Freshness Warning: {'Data is stale (>1 year old)' if is_stale else 'Data is current'}"
    )

    # 4. Fill template prompt
    prompt = load_prompt_template(
        "scoring",
        business_name=profile.name,
        industry=profile.industry,
        ideal_customer=profile.ideal_customer,
        anti_spam_rules=anti_spam_str,
        lead_info=lead_info_str,
        facts=facts_str,
        past_outcomes=outcomes_str,
    )

    # 5. Call structured LLM
    score_result = call_structured(
        prompt=prompt,
        schema=LeadScore,
        system="Evaluate evidence freshness, fit, and source quality. Do not generate message copy.",
    )

    # If stale data rule applies and LLM didn't catch it
    if is_stale and score_result.decision == "ACT":
        score_result.decision = "RESEARCH_MORE"
        score_result.reason += " (Flagged for re-verification due to historical data staleness)."

    state["score"] = score_result.model_dump()

    record_trace(
        state=state,
        agent="scoring",
        step="evaluate_lead",
        input_summary=f"Lead: {lead.name} ({lead.role}), Verified Facts: {len(raw_facts)}",
        output_summary=f"Decision: {score_result.decision}, Score: {score_result.score}/100",
        reason=f"Calculated fit and timing based on verified facts and anti-spam rules: {score_result.reason[:100]}",
    )

    return state
