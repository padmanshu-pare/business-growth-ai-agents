"""Follow-up & Reply Agent: Analyzes replies with strictly enforced hard escalation rules."""

from __future__ import annotations

import re
from typing import Any
from agents.base import agent_node, check_permission, load_prompt_template, record_trace
from agents.llm import call_structured
from shared.schemas import BusinessProfile, GrowthState, Lead, ReplyAnalysis

# Mandatory escalation keywords evaluated in plain code BEFORE LLM
ESCALATION_KEYWORDS = {
    "price": "pricing_or_contract",
    "pricing": "pricing_or_contract",
    "cost": "pricing_or_contract",
    "quote": "pricing_or_contract",
    "discount": "pricing_or_contract",
    "contract": "pricing_or_contract",
    "agreement": "pricing_or_contract",
    "legal": "pricing_or_contract",
    "compliance": "pricing_or_contract",
    "refund": "pricing_or_contract",
    "complaint": "pricing_or_contract",
    "unacceptable": "pricing_or_contract",
    "lawyer": "pricing_or_contract",
    "sue": "pricing_or_contract",
}

UNSUBSCRIBE_KEYWORDS = [
    "unsubscribe",
    "remove me",
    "stop emailing",
    "opt out",
    "opt-out",
    "do not contact",
    "take me off",
    "leave me alone",
    "stop",
]


def add_lead_to_opt_out(state: GrowthState, email: str) -> None:
    """Add lead email to profile opt-out list and mark lead status."""
    email_clean = email.strip().lower()

    # Update profile anti-spam opt-out list
    if "profile" in state and isinstance(state["profile"], dict):
        anti_spam = state["profile"].setdefault("anti_spam", {})
        opt_outs = anti_spam.setdefault("opt_out_list", [])
        if email_clean not in [e.lower() for e in opt_outs]:
            opt_outs.append(email_clean)

    # Update lead status if present
    if "lead" in state and isinstance(state["lead"], dict):
        state["lead"]["status"] = "opted_out"


@agent_node("followup")
def run_followup(state: GrowthState) -> GrowthState:
    """Run follow-up & reply agent to classify incoming message and recommend next action.

    Enforces deterministic hard escalation before LLM.
    Reads: incoming_reply or reply_text, profile, lead, optional prior_outreach
    Produces: reply_analysis in state['reply_analysis']
    """
    check_permission("followup", "analyze_reply")

    raw_profile = state.get("profile")
    raw_lead = state.get("lead")
    reply_text = state.get("incoming_reply") or state.get("reply_text") or ""
    prior_outreach = state.get("prior_outreach", "")

    if not raw_profile or not raw_lead:
        raise ValueError("Followup agent requires 'profile' and 'lead' in state.")

    profile = BusinessProfile.model_validate(raw_profile) if isinstance(raw_profile, dict) else raw_profile
    lead = Lead.model_validate(raw_lead) if isinstance(raw_lead, dict) else raw_lead

    reply_lower = reply_text.lower().strip()

    # -------------------------------------------------------------------------
    # HARD ESCALATION RULE 1: Unsubscribe
    # -------------------------------------------------------------------------
    is_unsubscribe = any(kw in reply_lower for kw in UNSUBSCRIBE_KEYWORDS)
    if is_unsubscribe:
        add_lead_to_opt_out(state, lead.email)
        analysis = ReplyAnalysis(
            intent="unsubscribe",
            next_action="opt_out_lead_and_notify_human",
            escalate_to_human=True,
            reason="HARD RULE TRIGGERED: Inbound reply requested unsubscription. Lead added to opt-out list.",
            draft_reply=None,
        )
        state["reply_analysis"] = analysis.model_dump()
        record_trace(
            state=state,
            agent="followup",
            step="hard_escalation_unsubscribe",
            input_summary=f"Inbound reply: '{reply_text[:60]}...'",
            output_summary="Intent: unsubscribe, Escalate: True, Opt-out recorded",
            reason="Deterministic security rule: unsubscribe must escalate and update opt-out list without LLM bypass",
        )
        return state

    # -------------------------------------------------------------------------
    # HARD ESCALATION RULE 2: Commercial / Price / Legal / Complaint
    # -------------------------------------------------------------------------
    matched_escalation_kw = None
    for kw in ESCALATION_KEYWORDS:
        # Match whole words or clean boundaries
        if re.search(r"\b" + re.escape(kw) + r"\b", reply_lower):
            matched_escalation_kw = kw
            break

    if matched_escalation_kw:
        analysis = ReplyAnalysis(
            intent="pricing_or_contract",
            next_action="escalate_to_account_team_for_quote",
            escalate_to_human=True,
            reason=f"HARD RULE TRIGGERED: Reply contains commercial or risk keyword '{matched_escalation_kw}'. Agents are forbidden from quoting prices or negotiating.",
            draft_reply=None,
        )
        state["reply_analysis"] = analysis.model_dump()
        record_trace(
            state=state,
            agent="followup",
            step="hard_escalation_commercial",
            input_summary=f"Inbound reply: '{reply_text[:60]}...'",
            output_summary=f"Intent: pricing_or_contract, Escalate: True (keyword: {matched_escalation_kw})",
            reason="Deterministic safety rule: pricing/contract inquiries must be handled by authorized human personnel",
        )
        return state

    # -------------------------------------------------------------------------
    # NON-ESCALATED PATH: Call LLM for conversational classification
    # -------------------------------------------------------------------------
    prompt = load_prompt_template(
        "followup",
        business_name=profile.name,
        tone=profile.tone,
        offerings=", ".join(profile.offerings),
        lead_info=f"Name: {lead.name}, Title: {lead.role}, Company: {lead.company}",
        reply_text=reply_text or "No reply received after 5 business days.",
        prior_outreach=prior_outreach or "Initial cold outreach email sent previously.",
    )

    llm_analysis = call_structured(
        prompt=prompt,
        schema=ReplyAnalysis,
        system="Analyze reply intent. Do not quote prices or custom contracts.",
    )

    # Secondary enforcement: Double-check that LLM did not un-escalate or quote prices
    if any(kw in reply_lower for kw in ESCALATION_KEYWORDS) or any(kw in reply_lower for kw in UNSUBSCRIBE_KEYWORDS):
        llm_analysis.escalate_to_human = True
        llm_analysis.draft_reply = None

    state["reply_analysis"] = llm_analysis.model_dump()

    record_trace(
        state=state,
        agent="followup",
        step="analyze_reply",
        input_summary=f"Reply from {lead.email}: '{reply_text[:50]}...'",
        output_summary=f"Intent: {llm_analysis.intent}, Escalate: {llm_analysis.escalate_to_human}",
        reason=f"Classified prospect reply intent: {llm_analysis.reason[:100]}",
    )

    return state
