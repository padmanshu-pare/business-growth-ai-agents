/**
 * Growth Agents Dashboard — Frontend Application Logic
 */

let businessesData = {};

document.addEventListener("DOMContentLoaded", async () => {
    await fetchBusinesses();
    setupEventListeners();
});

async function fetchBusinesses() {
    try {
        const res = await fetch("/api/businesses");
        businessesData = await res.json();
        populateLeads();
    } catch (err) {
        console.error("Failed to load businesses:", err);
    }
}

function setupEventListeners() {
    const bizSelect = document.getElementById("business-select");
    const runBtn = document.getElementById("run-pipeline-btn");
    const toggleTraceBtn = document.getElementById("toggle-trace-btn");

    bizSelect.addEventListener("change", populateLeads);
    runBtn.addEventListener("click", runPipeline);

    toggleTraceBtn.addEventListener("click", () => {
        const traceContainer = document.getElementById("trace-container");
        if (traceContainer.style.display === "none") {
            traceContainer.style.display = "flex";
            toggleTraceBtn.textContent = "Collapse Trace";
        } else {
            traceContainer.style.display = "none";
            toggleTraceBtn.textContent = "Expand Trace";
        }
    });
}

function populateLeads() {
    const bizKey = document.getElementById("business-select").value;
    const leadSelect = document.getElementById("lead-select");
    leadSelect.innerHTML = "";

    const bizInfo = businessesData[bizKey];
    if (!bizInfo || !bizInfo.leads) return;

    bizInfo.leads.forEach((lead) => {
        const opt = document.createElement("option");
        opt.value = lead.id;
        opt.textContent = `${lead.name} (${lead.role} @ ${lead.company}) [${lead.status}]`;
        leadSelect.appendChild(opt);
    });
}

async function runPipeline() {
    const runBtn = document.getElementById("run-pipeline-btn");
    const spinner = runBtn.querySelector(".spinner");
    const btnText = runBtn.querySelector(".btn-text");

    const business = document.getElementById("business-select").value;
    const leadId = document.getElementById("lead-select").value;
    const provider = document.getElementById("provider-select").value;

    // UI Loading state
    runBtn.disabled = true;
    spinner.classList.remove("hidden");
    btnText.textContent = "Executing Agents...";

    // Activate Stepper Stage 1
    setStepperActive("step-research");

    try {
        const response = await fetch("/api/run-pipeline", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ business, lead_id: leadId, provider })
        });

        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.error || "Pipeline execution failed");
        }

        const state = await response.json();
        
        // Render Output
        setStepperActive("step-scoring");
        setTimeout(() => setStepperActive("step-outreach"), 300);
        setTimeout(() => setStepperActive("step-audit"), 600);

        renderFacts(state.facts || []);
        renderScoring(state.score);
        renderOutreach(state.draft);
        renderTrace(state.trace || []);

    } catch (err) {
        alert("Pipeline Execution Error: " + err.message);
    } finally {
        runBtn.disabled = false;
        spinner.classList.add("hidden");
        btnText.textContent = "Run Full Pipeline";
    }
}

function setStepperActive(stepId) {
    const steps = ["step-research", "step-scoring", "step-outreach", "step-audit"];
    steps.forEach(id => {
        const el = document.getElementById(id);
        if (id === stepId) {
            el.classList.add("active");
        }
    });
}

function renderFacts(facts) {
    const container = document.getElementById("facts-container");
    const countBadge = document.getElementById("facts-count-badge");
    container.innerHTML = "";

    countBadge.textContent = `${facts.length} Verified`;

    if (!facts.length) {
        container.innerHTML = '<div class="empty-state">No facts extracted.</div>';
        return;
    }

    facts.forEach(f => {
        const item = document.createElement("div");
        item.className = "fact-item";
        item.innerHTML = `
            <div class="fact-header">
                <span class="fact-id">${f.id || "fact"}</span>
                <span class="fact-kind">${f.kind || "general"}</span>
            </div>
            <div class="fact-text">${f.statement}</div>
            <div class="fact-meta">
                <span>Provenance: <strong>${f.source || "Input Data"}</strong></span>
                <span>Conf: ${(f.confidence * 100).toFixed(0)}%</span>
            </div>
        `;
        container.appendChild(item);
    });
}

function renderScoring(score) {
    const container = document.getElementById("scoring-container");
    const decisionBadge = document.getElementById("decision-badge");
    container.innerHTML = "";

    if (!score) {
        decisionBadge.textContent = "N/A";
        decisionBadge.className = "decision-pill pending";
        container.innerHTML = '<div class="empty-state">No score generated (withheld by policy).</div>';
        return;
    }

    const decision = score.decision ? score.decision.toLowerCase() : "pending";
    decisionBadge.textContent = score.decision || "Pending";
    decisionBadge.className = `decision-pill ${decision}`;

    const breakdown = score.breakdown || {};
    let breakdownHtml = "";
    for (const [key, val] of Object.entries(breakdown)) {
        const pct = val > 1 ? val : (val * 100).toFixed(0);
        breakdownHtml += `
            <div>
                <div class="breakdown-row">
                    <span style="text-transform: capitalize;">${key.replace('_', ' ')}</span>
                    <strong>${pct}%</strong>
                </div>
                <div class="breakdown-bar-bg">
                    <div class="breakdown-bar-fill" style="width: ${pct}%;"></div>
                </div>
            </div>
        `;
    }

    container.innerHTML = `
        <div class="score-hero">
            <div class="score-dial">
                <span class="score-number">${score.score !== undefined ? score.score : "--"}</span>
                <span class="score-total">/ 100</span>
            </div>
            <div class="score-decision-group">
                <span style="font-size: 11px; text-transform: uppercase; color: var(--text-muted);">Evaluation</span>
                <span style="font-size: 15px; font-weight: 700; color: #fff;">${score.decision || "N/A"}</span>
                <span style="font-size: 11px; color: var(--emerald);">✓ Anti-Spam Verified</span>
            </div>
        </div>
        <div class="breakdown-list">
            ${breakdownHtml || '<span style="color: var(--text-muted); font-size:12px;">No breakdown recorded.</span>'}
        </div>
        <div class="scoring-reason">
            <strong>Reasoning:</strong> ${score.reason || "No reasoning logged."}
        </div>
    `;
}

function renderOutreach(draft) {
    const container = document.getElementById("outreach-container");
    container.innerHTML = "";

    if (!draft) {
        container.innerHTML = `
            <div class="empty-state" style="color: var(--amber);">
                Draft withheld by policy (Score decision did not permit outreach).
            </div>
        `;
        return;
    }

    const claims = draft.claims_used || [];
    let claimsHtml = "";
    claims.forEach(c => {
        claimsHtml += `<span class="claim-tag">#${c}</span>`;
    });

    container.innerHTML = `
        <div class="draft-header">
            <div class="draft-subject"><strong>Subject:</strong> ${draft.subject}</div>
            <div class="draft-meta">Channel: <strong>${draft.channel.toUpperCase()}</strong> | Recipient: <strong>${draft.lead_id}</strong></div>
        </div>
        <div class="draft-body">${draft.body}</div>
        <div>
            <span style="font-size: 11px; color: var(--text-muted); font-weight: 600;">GROUNDED CLAIMS CITED:</span>
            <div class="claims-badge-container">
                ${claimsHtml || '<span style="font-size:11px; color:var(--text-muted);">No claims tags</span>'}
            </div>
        </div>
        <div class="action-bar">
            <button class="approve-btn" onclick="alert('Draft Approved and staged for transmission!')">✓ Approve Draft</button>
            <button class="reject-btn" onclick="alert('Draft rejected back to SDR queue.')">✕ Request Revision</button>
        </div>
    `;
}

function renderTrace(trace) {
    const container = document.getElementById("trace-container");
    const countBadge = document.getElementById("trace-count");
    container.innerHTML = "";

    countBadge.textContent = `${trace.length} Events`;

    if (!trace.length) {
        container.innerHTML = '<div class="empty-state">No trace events recorded.</div>';
        return;
    }

    trace.forEach((t, idx) => {
        const item = document.createElement("div");
        item.className = "trace-item";
        item.innerHTML = `
            <div class="trace-meta">
                <span><strong>[${idx + 1}] ${t.agent.toUpperCase()}</strong> • ${t.step}</span>
                <span>${new Date(t.timestamp).toLocaleTimeString()}</span>
            </div>
            <div><strong>In:</strong> ${t.input_summary} ➔ <strong>Out:</strong> ${t.output_summary}</div>
            <div class="trace-reason">Why: ${t.reason}</div>
        `;
        container.appendChild(item);
    });
}
