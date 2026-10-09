"""Abstract Repository interface for Growth Agents data and state persistence."""

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any

from shared.schemas import (
    ApprovalDecision,
    BusinessProfile,
    Draft,
    KnowledgeBaseDoc,
    Lead,
    LearningInsight,
    Outcome,
    TraceEvent,
    TrustReport,
)


class Repository(ABC):
    """Abstract Repository interface.

    Agents and graph nodes must NEVER import Supabase or SQL directly;
    they interact strictly through this repository contract.
    """

    # -------------------------------------------------------------------------
    # Businesses
    # -------------------------------------------------------------------------
    @abstractmethod
    def get_business(self, business_id: str) -> dict[str, Any] | None:
        """Retrieve a business profile dict by business_id (e.g. 'saas', 'ecommerce')."""
        pass

    @abstractmethod
    def list_businesses(self) -> list[dict[str, Any]]:
        """List all available business profiles."""
        pass

    # -------------------------------------------------------------------------
    # Knowledge Base
    # -------------------------------------------------------------------------
    @abstractmethod
    def get_kb_docs(self, business_id: str) -> list[dict[str, Any]]:
        """Retrieve all verified KB documents for a business."""
        pass

    @abstractmethod
    def search_kb(
        self,
        business_id: str,
        query_embedding: list[float] | None = None,
        query: str | None = None,
        k: int = 5,
    ) -> list[dict[str, Any]]:
        """Search knowledge base docs by embedding vector or text query."""
        pass

    # -------------------------------------------------------------------------
    # Leads
    # -------------------------------------------------------------------------
    @abstractmethod
    def get_leads(self, business_id: str) -> list[dict[str, Any]]:
        """Retrieve all leads for a given business."""
        pass

    @abstractmethod
    def get_lead(self, lead_id: str) -> dict[str, Any] | None:
        """Retrieve a single lead by its lead_id."""
        pass

    @abstractmethod
    def update_lead_status(self, lead_id: str, status: str) -> bool:
        """Update the pipeline status of a lead (e.g. 'contacted', 'opted_out')."""
        pass

    @abstractmethod
    def add_to_opt_out(self, business_id: str, email: str) -> bool:
        """Add an email or domain to the business anti-spam opt-out list."""
        pass

    # -------------------------------------------------------------------------
    # Campaigns & Drafts
    # -------------------------------------------------------------------------
    @abstractmethod
    def save_draft(self, run_id: str, draft: dict[str, Any] | Draft) -> str:
        """Save a generated outreach draft linked to a run. Returns draft_id."""
        pass

    @abstractmethod
    def get_draft(self, draft_id: str) -> dict[str, Any] | None:
        """Retrieve a saved draft by draft_id or run_id."""
        pass

    # -------------------------------------------------------------------------
    # Trust Reports & Flags
    # -------------------------------------------------------------------------
    @abstractmethod
    def save_trust_report(self, run_id: str, report: dict[str, Any] | TrustReport) -> str:
        """Save a TrustReport and its flags linked to a run."""
        pass

    @abstractmethod
    def update_flag_status(self, flag_id: str, status: str) -> bool:
        """Update a flag status ('open', 'accepted', 'dismissed')."""
        pass

    # -------------------------------------------------------------------------
    # Approvals
    # -------------------------------------------------------------------------
    @abstractmethod
    def save_approval(self, run_id: str, decision: dict[str, Any] | ApprovalDecision) -> str:
        """Record a human approval decision for a run."""
        pass

    # -------------------------------------------------------------------------
    # Outcomes & Insights
    # -------------------------------------------------------------------------
    @abstractmethod
    def save_outcome(self, outcome: dict[str, Any] | Outcome, business_id: str | None = None) -> str:
        """Save a campaign or outreach outcome."""
        pass

    @abstractmethod
    def get_outcomes(self, business_id: str) -> list[dict[str, Any]]:
        """Retrieve past campaign outcomes for a business."""
        pass

    @abstractmethod
    def save_insight(self, insight: dict[str, Any] | LearningInsight, business_id: str | None = None) -> str:
        """Save an extracted learning insight."""
        pass

    @abstractmethod
    def get_insights(self, business_id: str) -> list[dict[str, Any]]:
        """Retrieve learning insights for a business."""
        pass

    # -------------------------------------------------------------------------
    # Trace Auditing
    # -------------------------------------------------------------------------
    @abstractmethod
    def append_trace(self, run_id: str, event: dict[str, Any] | TraceEvent) -> None:
        """Append a trace event to the audit trail of a run."""
        pass

    @abstractmethod
    def get_trace(self, run_id: str) -> list[TraceEvent]:
        """Retrieve all trace events for a run, ordered by timestamp."""
        pass

    # -------------------------------------------------------------------------
    # Run Orchestration Lifecycle
    # -------------------------------------------------------------------------
    @abstractmethod
    def create_run(self, business_id: str, lead_id: str | None = None) -> str:
        """Initialize and persist a new pipeline run. Returns run_id."""
        pass

    @abstractmethod
    def update_run(self, run_id: str, status: str, state_summary: dict[str, Any] | None = None) -> bool:
        """Update run execution status and summary state."""
        pass

    @abstractmethod
    def get_run(self, run_id: str) -> dict[str, Any] | None:
        """Get run metadata and current status summary."""
        pass
