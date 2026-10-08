"""Shared schemas for the Growth Agents system."""

from __future__ import annotations

import uuid
from typing import Any, Literal
from pydantic import BaseModel, Field


class AntiSpamSettings(BaseModel):
    """Anti-spam constraints and rules for communication."""
    max_contacts_per_week: int = Field(default=3, description="Maximum outreach attempts per lead per week")
    quiet_hours: str = Field(default="20:00-08:00", description="Local quiet hours when contacts must not be made")
    opt_out_list: list[str] = Field(default_factory=list, description="List of emails or domains opted out")


class BusinessProfile(BaseModel):
    """Dynamic profile describing any business without hardcoded logic."""
    name: str = Field(description="Name of the business")
    industry: str = Field(description="Industry vertical")
    offerings: list[str] = Field(default_factory=list, description="Core products or services offered")
    ideal_customer: str = Field(description="Ideal Customer Profile (ICP) description")
    tone: str = Field(default="professional and consultative", description="Communication tone guidelines")
    channels: list[str] = Field(default_factory=lambda: ["email", "linkedin"], description="Allowed communication channels")
    anti_spam: AntiSpamSettings = Field(default_factory=AntiSpamSettings, description="Anti-spam policy")
    enabled_agents: list[str] = Field(
        default_factory=lambda: ["research", "scoring", "outreach", "content", "followup", "learning"],
        description="Active agents in pipeline"
    )


class KnowledgeBaseDoc(BaseModel):
    """Document in the verified knowledge base."""
    id: str = Field(default_factory=lambda: f"kb_{uuid.uuid4().hex[:8]}", description="Unique doc identifier")
    title: str = Field(description="Title of document")
    text: str = Field(description="Full text or excerpts from document")


class Lead(BaseModel):
    """Prospect or target account information."""
    id: str = Field(default_factory=lambda: f"lead_{uuid.uuid4().hex[:8]}", description="Lead identifier")
    name: str = Field(description="Contact full name")
    company: str = Field(description="Company name")
    role: str = Field(description="Job title or role")
    email: str = Field(description="Email address")
    source: str = Field(default="inbound", description="Source of lead (e.g. inbound, crm, outbound_list)")
    status: str = Field(default="new", description="Pipeline status: new, contacted, qualified, opted_out")
    last_contacted: str | None = Field(default=None, description="ISO timestamp or date string of last contact")


class Fact(BaseModel):
    """Atomic verified fact gathered by research."""
    id: str = Field(default_factory=lambda: f"fact_{uuid.uuid4().hex[:8]}", description="Unique identifier for referencing in claims")
    statement: str = Field(description="Factual claim or observation")
    source: str = Field(description="Originating source (doc title, crm record, verified url)")
    source_date: str = Field(description="Date source was recorded or published")
    confidence: float = Field(ge=0.0, le=1.0, description="Confidence score from 0.0 to 1.0")
    kind: Literal["company", "market", "competitor", "kb"] = Field(description="Category of fact")


class LeadScore(BaseModel):
    """Score and decision regarding whether/when to reach out to a lead."""
    score: int = Field(ge=0, le=100, description="Overall score between 0 and 100")
    breakdown: dict[str, float] = Field(
        default_factory=dict,
        description="Scoring breakdown e.g. fit, intent, freshness, source_quality"
    )
    decision: Literal["ACT", "WAIT", "REJECT", "RESEARCH_MORE"] = Field(description="Action decision")
    reason: str = Field(description="Explanation of scoring decision")
    recheck_after: str | None = Field(default=None, description="Suggested re-evaluation timeframe (e.g. '14 days')")


class Draft(BaseModel):
    """Draft message created for human review."""
    subject: str = Field(description="Subject line for email, or headline for messaging")
    body: str = Field(description="Body copy of message")
    channel: str = Field(default="email", description="Target communication channel")
    claims_used: list[str] = Field(default_factory=list, description="IDs of Fact objects referenced in draft")
    lead_id: str = Field(description="Target lead ID")


class ContentPiece(BaseModel):
    """Marketing or educational content grounded in approved claims."""
    title: str = Field(description="Content title or headline")
    body: str = Field(description="Body of content piece")
    channel: str = Field(description="Target channel (blog, linkedin_post, newsletter)")
    claims_used: list[str] = Field(default_factory=list, description="IDs of Fact objects or approved claims used")


class ReplyAnalysis(BaseModel):
    """Analysis of inbound response from a contact."""
    intent: Literal[
        "interested",
        "not_interested",
        "question",
        "unsubscribe",
        "out_of_office",
        "pricing_or_contract",
        "unclear"
    ] = Field(description="Classified intent")
    next_action: str = Field(description="Recommended next step")
    escalate_to_human: bool = Field(default=False, description="True if human intervention is mandatory")
    reason: str = Field(description="Justification for intent and escalation decision")
    draft_reply: str | None = Field(default=None, description="Suggested draft response if appropriate and non-escalated")


class Outcome(BaseModel):
    """Recorded outcome from an outreach or campaign effort."""
    lead_id: str = Field(description="Lead ID")
    draft_id: str = Field(description="Draft or outreach ID")
    replied: bool = Field(default=False, description="Whether lead replied")
    meeting_booked: bool = Field(default=False, description="Whether meeting was booked")
    unsubscribed: bool = Field(default=False, description="Whether lead unsubscribed")
    complaint: bool = Field(default=False, description="Whether a complaint or negative issue was raised")
    notes: str = Field(default="", description="Qualitative feedback or observation")


class LearningInsight(BaseModel):
    """System-level learning derived from outcomes."""
    pattern: str = Field(description="Discovered pattern or correlation")
    evidence_count: int = Field(ge=0, description="Number of data points supporting pattern")
    confidence: float = Field(ge=0.0, le=1.0, description="Confidence in insight")
    recommendation: str = Field(description="Actionable recommendation for future campaigns")


class CampaignReport(BaseModel):
    """Summary report of campaign performance."""
    total_outcomes: int = Field(description="Total outcomes evaluated")
    reply_rate: float = Field(description="Ratio of replies")
    meeting_rate: float = Field(description="Ratio of meetings booked")
    unsubscribe_rate: float = Field(description="Ratio of unsubscribes")
    insights: list[LearningInsight] = Field(default_factory=list, description="Extracted insights")
    summary: str = Field(description="Overall strategic synthesis")


class TraceEvent(BaseModel):
    """Audit trace item capturing agent actions and decisions."""
    agent: str = Field(description="Name of agent executing step")
    step: str = Field(description="Name of action or step taken")
    input_summary: str = Field(description="Concise summary of inputs received")
    output_summary: str = Field(description="Concise summary of outputs produced")
    reason: str = Field(description="Why this step was executed and decisions made")
    timestamp: str = Field(description="ISO timestamp of execution")


# LangGraph-compatible state container
GrowthState = dict[str, Any]
