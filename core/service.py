"""Service layer providing a typed API for FastAPI and React UI integration."""

from __future__ import annotations

import logging
from typing import Any, Literal
from pydantic import BaseModel, Field

from langgraph.types import Command

from core.graph import get_compiled_graph
from core.repo import get_repo
from shared.schemas import (
    ApprovalDecision,
    Draft,
    Flag,
    Outcome,
    PolicyResult,
    TraceEvent,
    TrustReport,
)

logger = logging.getLogger("core.service")


# -----------------------------------------------------------------------------
# Request & Response Schemas
# -----------------------------------------------------------------------------
class StartRunRequest(BaseModel):
    business_id: str = Field(description="Business key (e.g. 'saas', 'ecommerce', 'local_services')")
    lead_id: str | None = Field(default=None, description="Optional specific target lead ID")


class RunSummaryResponse(BaseModel):
    run_id: str
    status: str
    business_id: str
    lead_id: str | None = None
    state_summary: dict[str, Any] = Field(default_factory=dict)


class ReviewPayloadResponse(BaseModel):
    run_id: str
    draft: Draft | dict[str, Any] | None = None
    trust_report: TrustReport | dict[str, Any] | None = None
    policy_result: PolicyResult | dict[str, Any] | None = None
    failed_trust_banner: bool = False


# -----------------------------------------------------------------------------
# Public Service API
# -----------------------------------------------------------------------------
def start_run(business_id: str, lead_id: str | None = None) -> str:
    """Start an autonomous pipeline run for a business and optional target lead.

    Executes through the graph until it reaches human review (status='waiting_for_human')
    or terminates early.
    """
    repo = get_repo()
    run_id = repo.create_run(business_id, lead_id)

    initial_state = {
        "run_id": run_id,
        "business_id": business_id,
        "lead_id": lead_id,
        "status": "running",
        "retry_count": {"research": 0, "trust_audit": 0, "policy_check": 0},
        "trace": [],
    }

    graph = get_compiled_graph()
    config = {"configurable": {"thread_id": run_id}}

    # Runs until interrupt() at human_review or termination
    try:
        graph.invoke(initial_state, config)
    except Exception as exc:
        logger.error(f"Run {run_id} encountered error during graph execution: {exc}")
        repo.update_run(run_id, "failed")

    return run_id


def get_run(run_id: str) -> dict[str, Any]:
    """Retrieve run execution metadata and current state summary."""
    repo = get_repo()
    run_record = repo.get_run(run_id)
    if not run_record:
        return {"run_id": run_id, "status": "not_found", "state_summary": {}}

    graph = get_compiled_graph()
    config = {"configurable": {"thread_id": run_id}}
    state_snapshot = graph.get_state(config)

    state_values = state_snapshot.values if state_snapshot else {}
    current_status = state_values.get("status") or run_record.get("status", "unknown")

    # If execution paused at interrupt
    if state_snapshot and state_snapshot.next:
        if "human_review" in state_snapshot.next:
            current_status = "waiting_for_human"

    return {
        "run_id": run_id,
        "business_id": run_record.get("business_id"),
        "lead_id": run_record.get("lead_id"),
        "status": current_status,
        "state_summary": {
            "draft": state_values.get("draft"),
            "score": state_values.get("score"),
            "trust_report": state_values.get("trust_report"),
            "policy_result": state_values.get("policy_result"),
            "mock_send_result": state_values.get("mock_send_result"),
            "failed_trust_banner": state_values.get("failed_trust_banner", False),
        },
    }


def get_trace(run_id: str) -> list[TraceEvent]:
    """Retrieve ordered audit trace events for the live trace panel."""
    repo = get_repo()
    return repo.get_trace(run_id)


def get_review_payload(run_id: str) -> dict[str, Any]:
    """Retrieve the draft, TrustReport with flags, and PolicyResult for human review."""
    graph = get_compiled_graph()
    config = {"configurable": {"thread_id": run_id}}
    snapshot = graph.get_state(config)
    vals = snapshot.values if snapshot else {}

    draft = vals.get("draft")
    trust_report = vals.get("trust_report")
    policy_result = vals.get("policy_result")
    banner = vals.get("failed_trust_banner", False)

    return {
        "run_id": run_id,
        "draft": draft,
        "trust_report": trust_report,
        "policy_result": policy_result,
        "failed_trust_banner": banner,
    }


def update_flag(run_id: str, flag_id: str, status: Literal["open", "accepted", "dismissed"]) -> TrustReport:
    """Update flag status ('accepted' or 'dismissed') and recalculate the trust report score."""
    repo = get_repo()
    repo.update_flag_status(flag_id, status)

    graph = get_compiled_graph()
    config = {"configurable": {"thread_id": run_id}}
    snapshot = graph.get_state(config)
    vals = dict(snapshot.values) if snapshot else {}

    rep_data = vals.get("trust_report")
    if not rep_data:
        raise ValueError(f"No trust report found for run {run_id}")

    report = TrustReport.model_validate(rep_data)
    for f in report.flags:
        if f.id == flag_id:
            f.status = status
            break

    # Recompute score and verdict
    report.recompute_score()

    # Update graph state checkpoint with recalculated report
    graph.update_state(config, {"trust_report": report.model_dump()})

    return report


def submit_approval(run_id: str, decision: ApprovalDecision | dict[str, Any]) -> dict[str, Any]:
    """Submit human review decision (approve, edit, reject) and resume graph execution."""
    if isinstance(decision, dict):
        decision_obj = ApprovalDecision.model_validate(decision)
    else:
        decision_obj = decision

    graph = get_compiled_graph()
    config = {"configurable": {"thread_id": run_id}}

    # Resume graph execution passing the approval decision to interrupt()
    graph.invoke(Command(resume=decision_obj), config)

    # Return updated run state
    return get_run(run_id)


def list_businesses() -> list[dict[str, Any]]:
    """List all available business profiles."""
    repo = get_repo()
    return repo.list_businesses()


def switch_business(business_id: str) -> dict[str, Any]:
    """Retrieve details for switching active business."""
    repo = get_repo()
    biz = repo.get_business(business_id)
    if not biz:
        raise ValueError(f"Business '{business_id}' not found.")
    return biz


def record_outcome(run_id: str, outcome: Outcome | dict[str, Any]) -> dict[str, Any]:
    """Record an outreach or campaign outcome, triggering followup and learning updates."""
    repo = get_repo()
    outcome_obj = Outcome.model_validate(outcome) if isinstance(outcome, dict) else outcome
    repo.save_outcome(outcome_obj)

    # Trigger learning agent update
    run_info = get_run(run_id)
    business_id = run_info.get("business_id", "saas")

    outcomes = repo.get_outcomes(business_id)
    biz = repo.get_business(business_id) or {}

    state = {
        "profile": biz,
        "outcomes": outcomes,
        "trace": [],
        "run_id": run_id,
    }
    from agents.learning import run_learning
    updated = run_learning(state)

    for ins in updated.get("insights", []):
        repo.save_insight(ins, business_id=business_id)

    return {
        "status": "outcome_recorded",
        "insights_count": len(updated.get("insights", [])),
        "campaign_report": updated.get("campaign_report"),
    }
