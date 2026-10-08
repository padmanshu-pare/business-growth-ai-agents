"""Analytics & Learning Agent: Analyzes campaign outcomes and extracts verified insights."""

from __future__ import annotations

import json
from pydantic import BaseModel, Field

from agents.base import agent_node, check_permission, load_prompt_template, record_trace
from agents.llm import call_structured
from shared.schemas import (
    BusinessProfile,
    CampaignReport,
    GrowthState,
    LearningInsight,
    Outcome,
)


class LearningAnalysisOutput(BaseModel):
    """Schema for LLM learning analysis."""
    insights: list[LearningInsight] = Field(default_factory=list, description="Empirical insights supported by data")
    summary: str = Field(description="Executive summary of campaign learning")


@agent_node("learning")
def run_learning(state: GrowthState) -> GrowthState:
    """Run learning agent to evaluate empirical outcomes and derive data-backed insights.

    Reads: outcomes, past_campaigns, profile
    Produces: insights in state['insights'], campaign_report in state['campaign_report']
    """
    check_permission("learning", "aggregate_metrics")

    raw_profile = state.get("profile")
    raw_outcomes = state.get("outcomes", [])
    raw_campaigns = state.get("past_campaigns", {})

    if not raw_profile:
        raise ValueError("Learning agent requires 'profile' in state.")

    profile = BusinessProfile.model_validate(raw_profile) if isinstance(raw_profile, dict) else raw_profile

    # Parse and compute empirical metrics (replies, meetings, unsubscribes/complaints - NO open rates)
    outcomes: list[Outcome] = []
    for o in raw_outcomes:
        outcomes.append(Outcome.model_validate(o) if isinstance(o, dict) else o)

    total = len(outcomes)
    replies = sum(1 for o in outcomes if o.replied)
    meetings = sum(1 for o in outcomes if o.meeting_booked)
    unsubscribes = sum(1 for o in outcomes if o.unsubscribed)
    complaints = sum(1 for o in outcomes if o.complaint)

    reply_rate = (replies / total) if total > 0 else 0.0
    meeting_rate = (meetings / total) if total > 0 else 0.0
    unsubscribe_rate = (unsubscribes / total) if total > 0 else 0.0

    metrics_summary = (
        f"Total Outcomes Evaluated: {total}\n"
        f"Replies: {replies} ({reply_rate:.1%})\n"
        f"Meetings Booked: {meetings} ({meeting_rate:.1%})\n"
        f"Unsubscribes: {unsubscribes} ({unsubscribe_rate:.1%})\n"
        f"Complaints: {complaints}\n"
        f"(Note: Vanity metrics like open rates are intentionally excluded per system policy.)"
    )

    campaign_history_str = json.dumps(raw_campaigns, indent=2) if raw_campaigns else "No historical campaigns attached."

    prompt = load_prompt_template(
        "learning",
        business_name=profile.name,
        industry=profile.industry,
        outcomes_summary=metrics_summary,
        campaign_history=campaign_history_str,
    )

    result = call_structured(
        prompt=prompt,
        schema=LearningAnalysisOutput,
        system="Derive insights from data. Never claim patterns from fewer than 3 samples. Do not alter anti-spam rules.",
    )

    # Hard enforcement: Discard any pattern with fewer than 3 samples
    valid_insights: list[LearningInsight] = []
    for insight in result.insights:
        if insight.evidence_count >= 3:
            valid_insights.append(insight)

    # Ensure baseline insight if outcomes exist and LLM produced none
    if not valid_insights and total >= 3:
        valid_insights.append(
            LearningInsight(
                pattern=f"Outreach conversion yielded {replies} replies and {meetings} meetings across {total} contacts.",
                evidence_count=total,
                confidence=min(0.9, 0.5 + (total * 0.02)),
                recommendation="Continue refining ICP targeting based on verified meeting conversions.",
            )
        )

    report = CampaignReport(
        total_outcomes=total,
        reply_rate=reply_rate,
        meeting_rate=meeting_rate,
        unsubscribe_rate=unsubscribe_rate,
        insights=valid_insights,
        summary=result.summary,
    )

    state["insights"] = [i.model_dump() for i in valid_insights]
    state["campaign_report"] = report.model_dump()

    record_trace(
        state=state,
        agent="learning",
        step="generate_insights",
        input_summary=f"Evaluated {total} outcomes (replies={replies}, meetings={meetings})",
        output_summary=f"Generated {len(valid_insights)} verified insights (evidence >= 3)",
        reason="Aggregated empirical conversion metrics and formulated learning insights",
    )

    return state
