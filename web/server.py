"""Lightweight HTTP server for Growth Agents interactive Web UI dashboard."""

from __future__ import annotations

import json
import mimetypes
import os
import sys
from http import HTTPStatus
from http.server import HTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
from urllib.parse import urlparse

# Ensure project root is in sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from agents.content import run_content
from agents.demo import load_business_state
from agents.followup import run_followup
from agents.learning import run_learning
from agents.outreach import run_outreach
from agents.research import run_research
from agents.scoring import run_scoring
from shared.schemas import GrowthState


class GrowthAgentDashboardHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(Path(__file__).parent), **kwargs)

    def do_GET(self):
        parsed = urlparse(self.path)
        if parsed.path == "/api/businesses":
            self.send_response(HTTPStatus.OK)
            self.send_header("Content-Type", "application/json")
            self.end_headers()

            data = {}
            for biz in ["saas", "ecommerce", "local_services"]:
                try:
                    state = load_business_state(biz)
                    # Load all leads for this biz
                    biz_dir = PROJECT_ROOT / "data" / biz
                    leads = json.loads((biz_dir / "leads.json").read_text(encoding="utf-8"))
                    data[biz] = {
                        "profile": state["profile"],
                        "leads": leads,
                    }
                except Exception as e:
                    data[biz] = {"error": str(e)}

            self.wfile.write(json.dumps(data).encode("utf-8"))
            return

        # Serve static files
        return super().do_GET()

    def do_POST(self):
        parsed = urlparse(self.path)
        content_len = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(content_len).decode("utf-8") if content_len > 0 else "{}"
        try:
            payload = json.loads(body)
        except Exception:
            payload = {}

        if parsed.path == "/api/run-pipeline":
            business = payload.get("business", "saas")
            lead_id = payload.get("lead_id")
            provider = payload.get("provider", "mock")

            # Temporarily configure provider environment
            orig_provider = os.environ.get("LLM_PROVIDER")
            os.environ["LLM_PROVIDER"] = provider

            try:
                state = load_business_state(business)

                # Swap selected lead if specified
                if lead_id:
                    biz_dir = PROJECT_ROOT / "data" / business
                    leads = json.loads((biz_dir / "leads.json").read_text(encoding="utf-8"))
                    for l in leads:
                        if l.get("id") == lead_id:
                            state["lead"] = l
                            break

                # 1. Research
                state = run_research(state)
                # 2. Scoring
                state = run_scoring(state)
                # 3. Outreach
                state = run_outreach(state)

                def _serializer(obj):
                    if hasattr(obj, "model_dump"):
                        return obj.model_dump()
                    if hasattr(obj, "dict"):
                        return obj.dict()
                    return str(obj)

                self.send_response(HTTPStatus.OK)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                serialized = json.dumps(state, default=_serializer)
                self.wfile.write(serialized.encode("utf-8"))

            except Exception as e:
                self.send_response(HTTPStatus.INTERNAL_SERVER_ERROR)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode("utf-8"))

            finally:
                if orig_provider is not None:
                    os.environ["LLM_PROVIDER"] = orig_provider
                elif "LLM_PROVIDER" in os.environ:
                    del os.environ["LLM_PROVIDER"]
            return

        self.send_error(HTTPStatus.NOT_FOUND, "Endpoint not found")


def start_server(port: int = 8088):
    server = HTTPServer(("127.0.0.1", port), GrowthAgentDashboardHandler)
    print(f"Growth Agent Web Dashboard running at http://127.0.0.1:{port}")
    server.serve_forever()


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8088
    start_server(port)
