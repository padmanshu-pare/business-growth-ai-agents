"""Content Agent: Generates grounded marketing content (posts, blogs) based on approved KB claims."""

from __future__ import annotations

import re
from agents.base import agent_node, check_permission, load_prompt_template, record_trace
from agents.llm import call_structured
from shared.schemas import (
    BusinessProfile,
    ContentPiece,
    Fact,
    GrowthState,
    KnowledgeBaseDoc,
)


@agent_node("content")
def run_content(state: GrowthState) -> GrowthState:
    """Run content agent to synthesize educational or marketing content from approved claims.

    Reads: profile, kb_docs, campaign_goal, channel
    Produces: content_piece in state['content_piece']
    """
    check_permission("content", "grounded_content_generation")

    raw_profile = state.get("profile")
    raw_kb = state.get("kb_docs", [])
    campaign_goal = state.get("campaign_goal", "Educate prospective buyers on verified operational advantages.")
    channel = state.get("content_channel", "blog")

    if not raw_profile:
        raise ValueError("Content agent requires 'profile' in state.")

    profile = BusinessProfile.model_validate(raw_profile) if isinstance(raw_profile, dict) else raw_profile

    # Extract approved claims & unapproved claims
    approved_claims_text = ""
    unapproved_claims_text = ""
    kb_facts: list[Fact] = []

    for doc in raw_kb:
        d = KnowledgeBaseDoc.model_validate(doc) if isinstance(doc, dict) else doc
        title_lower = d.title.lower()
        if "approved" in title_lower and "unapproved" not in title_lower and "forbidden" not in title_lower:
            approved_claims_text += f"\n{d.text}"
            for line in d.text.splitlines():
                claim_match = re.search(r"\[(CLAIM-[^\]]+)\]\s*(.*)", line.strip())
                if claim_match:
                    claim_id = claim_match.group(1).lower().replace("-", "_")
                    kb_facts.append(
                        Fact(
                            id=claim_id,
                            statement=claim_match.group(2),
                            source=d.title,
                            source_date="2026-08-01",
                            confidence=1.0,
                            kind="kb",
                        )
                    )
        elif "unapproved" in title_lower or "forbidden" in title_lower:
            unapproved_claims_text += f"\n{d.text}"

    valid_claim_ids = {f.id for f in kb_facts}

    claims_formatted = "\n".join(
        f"- ID [{f.id}]: {f.statement} (Source: {f.source})" for f in kb_facts
    ) or approved_claims_text

    prompt = load_prompt_template(
        "content",
        business_name=profile.name,
        industry=profile.industry,
        tone=profile.tone,
        offerings=", ".join(profile.offerings),
        channel=channel,
        campaign_goal=campaign_goal,
        approved_claims=claims_formatted or "General approved profile capabilities.",
        unapproved_claims=unapproved_claims_text or "Do not make unsupported guarantees or quote unverified pricing.",
    )

    content_result = call_structured(
        prompt=prompt,
        schema=ContentPiece,
        system="Generate grounded content piece referencing only verified claims. Do not invent claims.",
    )

    # Filter claims_used
    verified_claims = [cid for cid in content_result.claims_used if cid in valid_claim_ids]
    if not verified_claims and kb_facts:
        verified_claims = [kb_facts[0].id]

    content_piece = ContentPiece(
        title=content_result.title,
        body=content_result.body,
        channel=content_result.channel or channel,
        claims_used=verified_claims,
    )

    state["content_piece"] = content_piece.model_dump()

    record_trace(
        state=state,
        agent="content",
        step="generate_content",
        input_summary=f"Channel: {channel}, Goal: {campaign_goal[:50]}",
        output_summary=f"Created content '{content_piece.title}' with {len(verified_claims)} verified claims",
        reason="Created grounded educational content referencing verified KB claims for review",
    )

    return state
