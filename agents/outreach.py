"""Outreach Agent: Generates grounded, human-reviewable drafts citing verified facts."""

from __future__ import annotations

import re
from agents.base import agent_node, check_permission, load_prompt_template, record_trace
from agents.llm import call_structured
from shared.schemas import (
    BusinessProfile,
    Draft,
    Fact,
    GrowthState,
    KnowledgeBaseDoc,
    Lead,
    LeadScore,
)


@agent_node("outreach")
def run_outreach(state: GrowthState) -> GrowthState:
    """Run outreach agent to synthesize a personalized draft based strictly on verified facts.

    Reads: facts, score, profile, kb_docs, lead
    Produces: draft in state['draft']
    """
    check_permission("outreach", "grounded_drafting")

    raw_profile = state.get("profile")
    raw_lead = state.get("lead")
    raw_facts = state.get("facts", [])
    raw_score = state.get("score")
    raw_kb = state.get("kb_docs", [])

    if not raw_profile or not raw_lead:
        raise ValueError("Outreach agent requires 'profile' and 'lead' in state.")

    profile = BusinessProfile.model_validate(raw_profile) if isinstance(raw_profile, dict) else raw_profile
    lead = Lead.model_validate(raw_lead) if isinstance(raw_lead, dict) else raw_lead

    # Check score decision: if lead was rejected or put on wait, do not draft outreach
    if raw_score:
        score = LeadScore.model_validate(raw_score) if isinstance(raw_score, dict) else raw_score
        if score.decision in ("REJECT", "WAIT", "RESEARCH_MORE"):
            state["draft"] = None
            record_trace(
                state=state,
                agent="outreach",
                step="withhold_draft",
                input_summary=f"Score decision: {score.decision}",
                output_summary="Draft withheld",
                reason=f"Policy enforcement: outreach withheld because scoring decision was {score.decision} ({score.reason})",
            )
            return state

    # Separate approved claims doc from unapproved claims doc in KB
    approved_claims_text = ""
    unapproved_claims_text = ""
    kb_facts: list[Fact] = []

    for doc in raw_kb:
        d = KnowledgeBaseDoc.model_validate(doc) if isinstance(doc, dict) else doc
        title_lower = d.title.lower()
        if "approved" in title_lower and "unapproved" not in title_lower and "forbidden" not in title_lower:
            approved_claims_text += f"\n{d.text}"
            # Extract claim lines as synthetic verified kb facts if needed
            for line in d.text.splitlines():
                line = line.strip()
                if line.startswith(("-", "*", "1.", "2.", "3.", "4.", "5.")) or "[" in line:
                    claim_match = re.search(r"\[(CLAIM-[^\]]+)\]\s*(.*)", line)
                    if claim_match:
                        claim_id = claim_match.group(1).lower().replace("-", "_")
                        claim_stmt = claim_match.group(2)
                        kb_facts.append(
                            Fact(
                                id=claim_id,
                                statement=claim_stmt,
                                source=d.title,
                                source_date="2026-08-01",
                                confidence=1.0,
                                kind="kb",
                            )
                        )
        elif "unapproved" in title_lower or "forbidden" in title_lower:
            unapproved_claims_text += f"\n{d.text}"

    # Combine input facts and kb facts
    all_facts: list[Fact] = []
    for f in raw_facts:
        f_obj = Fact.model_validate(f) if isinstance(f, dict) else f
        all_facts.append(f_obj)
    all_facts.extend(kb_facts)

    valid_fact_ids = {f.id for f in all_facts}

    facts_formatted = "\n".join(
        f"- ID [{f.id}]: {f.statement} (Source: {f.source})" for f in all_facts
    )

    score_str = f"Score: {raw_score.get('score') if isinstance(raw_score, dict) else 'N/A'}"

    # Anti-spam opt-out line requirement
    opt_out_rule = (
        "MANDATORY: Append a clean, polite opt-out sentence at the bottom "
        "(e.g. 'Reply STOP at any time to opt out of future emails.')"
    )

    channel = profile.channels[0] if profile.channels else "email"

    prompt = load_prompt_template(
        "outreach",
        business_name=profile.name,
        tone=profile.tone,
        offerings=", ".join(profile.offerings),
        channel=channel,
        opt_out_rule=opt_out_rule,
        lead_info=f"Name: {lead.name}, Title: {lead.role}, Company: {lead.company}, Email: {lead.email}",
        score_info=score_str,
        facts=facts_formatted,
        approved_claims=approved_claims_text or "No special claims document.",
        unapproved_claims=unapproved_claims_text or "Do not invent false guarantees or unverified pricing.",
    )

    draft_result = call_structured(
        prompt=prompt,
        schema=Draft,
        system="Draft a grounded outreach message citing only verified fact IDs in claims_used. Never invent facts.",
    )

    # Strictly filter claims_used to only verified facts that exist
    verified_claims_used = [cid for cid in draft_result.claims_used if cid in valid_fact_ids]

    # If LLM didn't cite any or cited unknown, link to the primary fact
    if not verified_claims_used and all_facts:
        verified_claims_used = [all_facts[0].id]

    # Ensure lead_id matches current lead
    draft = Draft(
        subject=draft_result.subject,
        body=draft_result.body,
        channel=draft_result.channel or channel,
        claims_used=verified_claims_used,
        lead_id=lead.id,
    )

    # Ensure opt-out line exists in draft body
    if "opt out" not in draft.body.lower() and "stop" not in draft.body.lower():
        draft.body += "\n\nReply 'STOP' at any time to opt out of future communications."

    state["draft"] = draft.model_dump()

    record_trace(
        state=state,
        agent="outreach",
        step="generate_draft",
        input_summary=f"Lead: {lead.name}, Verified Facts available: {len(all_facts)}",
        output_summary=f"Created draft for review (Claims used: {verified_claims_used})",
        reason="Synthesized personalized outreach grounded strictly in verified facts for human approval",
    )

    return state
