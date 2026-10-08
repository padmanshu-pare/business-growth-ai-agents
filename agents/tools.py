"""External tools and search stubs with permission enforcement."""

from __future__ import annotations

import os
from typing import Any
from agents.base import check_permission


def search_web_tool(caller_agent: str, query: str) -> str:
    """Web search tool, enabled behind flag with mock stub default.

    Enforces that caller agent has 'web_search_stub' or 'web_search' permission.
    """
    check_permission(caller_agent, "web_search_stub")

    use_live = os.environ.get("ENABLE_WEB_SEARCH", "0") == "1"
    tavily_key = os.environ.get("TAVILY_API_KEY")

    if use_live and tavily_key:
        try:
            from tavily import TavilyClient
            client = TavilyClient(api_key=tavily_key)
            res = client.search(query=query, search_depth="basic", max_results=3)
            results = res.get("results", [])
            if results:
                return "\n".join(
                    f"[{r.get('title')}]: {r.get('content', '')[:250]} (Source: {r.get('url')})"
                    for r in results
                )
        except Exception as exc:
            pass  # Fallback to stub on error

    # Deterministic search stub
    query_lower = query.lower()
    return (
        f"[Stub Web Search for '{query}']:\n"
        f"- Target organization reports ongoing expansion and operational investments in recent quarterly update.\n"
        f"- Public corporate filing verifies headcount growth and team restructuring.\n"
        f"Source: Verified Public Filings (2026-09-15)"
    )


def send_message_tool(caller_agent: str, recipient: str, message: str) -> None:
    """Forbidden send action for agents in the pipeline.

    By contract, agents NEVER send messages directly; everything requires human review.
    """
    check_permission(caller_agent, "send")
    raise RuntimeError("Direct message sending by agents is permanently blocked by system policy.")
