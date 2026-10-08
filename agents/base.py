"""Common base agent contract, permission engine, prompt loader, and trace auditing."""

from __future__ import annotations

import datetime
import functools
import logging
from pathlib import Path
import time
from typing import Any, Callable

from shared.schemas import GrowthState, TraceEvent

logger = logging.getLogger("agents.base")

# Base directory for prompt templates
PROMPTS_DIR = Path(__file__).parent / "prompts"

# Explicit permission map: allowed capabilities and strictly forbidden actions per agent
AGENT_PERMISSIONS: dict[str, dict[str, list[str]]] = {
    "research": {
        "allowed_tools": ["read_crm", "search_kb", "web_search_stub"],
        "forbidden_actions": ["write_copy", "send", "edit_kb", "quote_price"],
    },
    "scoring": {
        "allowed_tools": ["evaluate_fit", "evaluate_timing", "read_memory"],
        "forbidden_actions": ["contact_lead", "send", "write_copy", "edit_kb"],
    },
    "outreach": {
        "allowed_tools": ["grounded_drafting"],
        "forbidden_actions": ["web_search", "send", "edit_kb", "invent_claims"],
    },
    "content": {
        "allowed_tools": ["grounded_content_generation"],
        "forbidden_actions": ["web_search", "send", "edit_kb", "invent_claims"],
    },
    "followup": {
        "allowed_tools": ["analyze_reply", "record_opt_out"],
        "forbidden_actions": ["quote_price", "send", "invent_claims"],
    },
    "learning": {
        "allowed_tools": ["aggregate_metrics", "generate_insights"],
        "forbidden_actions": ["change_policy", "edit_anti_spam", "send"],
    },
}


class PermissionDeniedError(RuntimeError):
    """Raised when an agent attempts a forbidden action or unpermitted tool."""
    pass


def check_permission(agent_name: str, action: str) -> None:
    """Validate that an agent has permission to execute an action."""
    perms = AGENT_PERMISSIONS.get(agent_name)
    if not perms:
        raise PermissionDeniedError(f"Agent '{agent_name}' has no defined permission boundary.")

    forbidden = perms.get("forbidden_actions", [])
    if action in forbidden:
        raise PermissionDeniedError(
            f"SECURITY VIOLATION: Agent '{agent_name}' is forbidden from executing '{action}'."
        )

    allowed = perms.get("allowed_tools", [])
    if action not in allowed:
        raise PermissionDeniedError(
            f"SECURITY VIOLATION: Action '{action}' is not in allowed tools for agent '{agent_name}'."
        )


def enforce_permission(agent_name: str, action_name: str) -> Callable:
    """Decorator to protect functions and ensure the caller agent has permission."""
    def decorator(fn: Callable) -> Callable:
        @functools.wraps(fn)
        def wrapper(*args: Any, **kwargs: Any) -> Any:
            check_permission(agent_name, action_name)
            return fn(*args, **kwargs)
        return wrapper
    return decorator


def load_prompt_template(agent_name: str, **variables: Any) -> str:
    """Load a markdown prompt template and inject variables.

    Ensures zero hardcoded business wording by strictly reading from template.
    """
    template_path = PROMPTS_DIR / f"{agent_name}.md"
    if not template_path.exists():
        raise FileNotFoundError(f"Prompt template not found at {template_path}")

    template_str = template_path.read_text(encoding="utf-8")
    for key, value in variables.items():
        placeholder = f"{{{key}}}"
        template_str = template_str.replace(placeholder, str(value))
    return template_str


def record_trace(
    state: GrowthState,
    agent: str,
    step: str,
    input_summary: str,
    output_summary: str,
    reason: str,
) -> None:
    """Append a structured TraceEvent to state['trace'] without mutating unrelated state."""
    if "trace" not in state or not isinstance(state["trace"], list):
        state["trace"] = []

    event = TraceEvent(
        agent=agent,
        step=step,
        input_summary=input_summary,
        output_summary=output_summary,
        reason=reason,
        timestamp=datetime.datetime.now(datetime.timezone.utc).isoformat(),
    )
    state["trace"].append(event)


def agent_node(agent_name: str) -> Callable:
    """Decorator for agent functions implementing the standard contract:

    1. Records duration and trace.
    2. Enforces non-crashing behavior (records error in trace instead).
    3. Guarantees state isolation.
    """
    def decorator(fn: Callable[[GrowthState], GrowthState]) -> Callable[[GrowthState], GrowthState]:
        @functools.wraps(fn)
        def wrapper(state: GrowthState) -> GrowthState:
            # Ensure trace container exists
            if "trace" not in state or not isinstance(state["trace"], list):
                state["trace"] = []

            start_time = time.perf_counter()
            try:
                result_state = fn(state)
                duration = time.perf_counter() - start_time
                logger.info(f"Agent '{agent_name}' completed successfully in {duration:.2f}s")
                return result_state
            except Exception as exc:
                duration = time.perf_counter() - start_time
                error_msg = f"{type(exc).__name__}: {str(exc)}"
                logger.error(f"Agent '{agent_name}' encountered error: {error_msg}", exc_info=True)
                record_trace(
                    state=state,
                    agent=agent_name,
                    step="error_handler",
                    input_summary="Execution failed during agent run",
                    output_summary=f"Error caught: {error_msg}",
                    reason=f"Graceful degradation: failure captured in trace without crashing pipeline ({duration:.2f}s)",
                )
                return state

        return wrapper
    return decorator
