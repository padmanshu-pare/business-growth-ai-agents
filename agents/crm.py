"""Mock CRM client inspired by production B2B pipeline patterns.

Maintains simulated contact records, interaction history, and lead enrichment
data locally without requiring paid third-party CRM APIs.
"""

from __future__ import annotations

import json
from pathlib import Path
import time
from typing import Any
import uuid


class MockCRMClient:
    """Local mock CRM client for B2B pipeline integration."""

    def __init__(self, store_path: Path | None = None, latency_seconds: float = 0.05):
        self._latency_seconds = latency_seconds
        self._store_path = store_path or Path(__file__).parent.parent / "data" / "crm_store.json"

    def get_contact_by_email(self, email: str) -> dict[str, Any] | None:
        """Retrieve CRM record by lead email address."""
        if self._latency_seconds > 0:
            time.sleep(self._latency_seconds)
        records = self._load()
        for r in records:
            if r.get("email", "").lower() == email.lower():
                return r
        return None

    def upsert_contact(self, payload: dict[str, Any]) -> dict[str, Any]:
        """Upsert a lead or account record into the CRM store."""
        if self._latency_seconds > 0:
            time.sleep(self._latency_seconds)
        records = self._load()
        email = payload.get("email")
        existing_index = None

        if email:
            for idx, r in enumerate(records):
                if r.get("email", "").lower() == email.lower():
                    existing_index = idx
                    break

        record = dict(payload)
        record["updated_at"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())

        if existing_index is not None:
            record["id"] = records[existing_index].get("id", f"crm_{uuid.uuid4().hex[:8]}")
            records[existing_index] = record
        else:
            record["id"] = record.get("id") or f"crm_{uuid.uuid4().hex[:8]}"
            record["created_at"] = record["updated_at"]
            records.append(record)

        self._save(records)
        return {"status": "synced", "record_id": record["id"], "record": record}

    def _load(self) -> list[dict[str, Any]]:
        if self._store_path.exists():
            try:
                return json.loads(self._store_path.read_text(encoding="utf-8"))
            except Exception:
                return []
        return []

    def _save(self, records: list[dict[str, Any]]) -> None:
        self._store_path.parent.mkdir(parents=True, exist_ok=True)
        self._store_path.write_text(json.dumps(records, indent=2), encoding="utf-8")
