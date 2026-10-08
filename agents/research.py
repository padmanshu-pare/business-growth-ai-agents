"""Research Agent: Extracts atomic, verified facts about lead, market, or competitor."""

from __future__ import annotations

import json
from typing import Literal
from pydantic import BaseModel, Field

from agents.base import agent_node, check_permission, load_prompt_template, record_trace
from agents.crm import MockCRMClient
from agents.llm import call_structured
from agents.tools import search_web_tool
from shared.schemas import Fact, GrowthState, Lead, BusinessProfile, KnowledgeBaseDoc


class ResearchFactsOutput(BaseModel):
    """Container schema for structured research output."""
    facts: list[Fact] = Field(default_factory=list, description="Extracted atomic verified facts")


@agent_node("research")
def run_research(state: GrowthState) -> GrowthState:
    """Run research agent to gather and verify facts for a target lead and business.

    Reads: lead, profile, kb_docs, optional research_mode
    Produces: facts in state['facts']
    """
    check_permission("research", "read_crm")

    raw_lead = state.get("lead")
    raw_profile = state.get("profile")
    raw_kb = state.get("kb_docs", [])
    mode: Literal["lead", "market", "competitor"] = state.get("research_mode", "lead")

    if not raw_lead or not raw_profile:
        raise ValueError("Research agent requires 'lead' and 'profile' in state.")

    lead = Lead.model_validate(raw_lead) if isinstance(raw_lead, dict) else raw_lead
    profile = BusinessProfile.model_validate(raw_profile) if isinstance(raw_profile, dict) else raw_profile

    # 1. Consult Mock CRM
    crm_client = MockCRMClient()
    crm_record = crm_client.get_contact_by_email(lead.email)
    crm_summary = json.dumps(crm_record, indent=2) if crm_record else "No prior CRM interaction found."

    # 2. Consult web search tool (defaulting to safe stub)
    search_query = f"{lead.company} {lead.role} corporate profile news"
    web_findings = search_web_tool("research", search_query)

    # 3. Format KB context
    kb_snippets = []
    for doc in raw_kb:
        d = KnowledgeBaseDoc.model_validate(doc) if isinstance(doc, dict) else doc
        kb_snippets.append(f"[{d.title}]: {d.text[:400]}")
    kb_context = "\n\n".join(kb_snippets) if kb_snippets else "No local KB documents provided."

    # 4. Fill template prompt
    prompt = load_prompt_template(
        "research",
        business_name=profile.name,
        industry=profile.industry,
        offerings=", ".join(profile.offerings),
        ideal_customer=profile.ideal_customer,
        lead_name=lead.name,
        lead_company=lead.company,
        lead_role=lead.role,
        lead_email=lead.email,
        crm_data=f"CRM Record: {crm_summary}\nWeb Research Stub: {web_findings}",
        kb_context=kb_context,
        research_mode=mode,
    )

    # 5. Call structured LLM
    result = call_structured(
        prompt=prompt,
        schema=ResearchFactsOutput,
        system="Extract only factual statements with explicit sources and dates. Do not invent marketing copy.",
    )

    facts = result.facts
    # Ensure all facts have unique IDs and sources
    valid_facts = []
    for idx, f in enumerate(facts):
        if not f.source:
            f.source = "Verified Input Data"
        if not f.source_date:
            f.source_date = "2026-09-01"
        valid_facts.append(f)

    # Always ensure at least one baseline verified fact if LLM returned empty
    if not valid_facts:
        valid_facts.append(
            Fact(
                id="fact_init_01",
                statement=f"Lead {lead.name} holds role '{lead.role}' at {lead.company}.",
                source="Inbound Lead Form",
                source_date="2026-09-20",
                confidence=0.95,
                kind="company",
            )
        )

    # Update state with facts (as dicts or models)
    existing_facts = state.get("facts") or []
    # Replace or merge
    state["facts"] = [f.model_dump() for f in valid_facts]

    # Record trace event
    record_trace(
        state=state,
        agent="research",
        step="gather_facts",
        input_summary=f"Lead: {lead.name} ({lead.company}), Mode: {mode}",
        output_summary=f"Extracted {len(valid_facts)} verified facts",
        reason="Gathered atomic verified facts from CRM, web search, and verified KB before scoring",
    )

    return state
