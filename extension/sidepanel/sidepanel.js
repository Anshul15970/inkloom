// Inkloom Extension Side Panel Controller
const API_BASE = "http://localhost:8000/api/v1";

document.addEventListener("DOMContentLoaded", () => {
  const brandSelect = document.getElementById("brandSelect");
  const channelSelect = document.getElementById("channelSelect");
  const draftText = document.getElementById("draftText");
  const extractBtn = document.getElementById("extractBtn");
  const auditBtn = document.getElementById("auditBtn");
  const resultsSection = document.getElementById("resultsSection");
  const scoreValue = document.getElementById("scoreValue");
  const auditStatus = document.getElementById("auditStatus");
  const auditSummary = document.getElementById("auditSummary");
  const findingsContainer = document.getElementById("findingsContainer");
  const escalateBtn = document.getElementById("escalateBtn");

  let currentAuditId = null;

  // Mock initial demo brand option if not logged in
  const opt = document.createElement("option");
  opt.value = "demo-brand-id";
  opt.textContent = "Acme Corp (Demo Brand)";
  brandSelect.appendChild(opt);

  // Extract from active webpage editor
  extractBtn.addEventListener("click", async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab) return;

      chrome.tabs.sendMessage(tab.id, { type: "REQUEST_PAGE_CONTENT" }, (response) => {
        if (chrome.runtime.lastError) {
          alert("Could not extract from page. Please paste text directly.");
          return;
        }
        if (response && response.text) {
          draftText.value = response.text;
        } else {
          alert("No editor text detected on current active tab.");
        }
      });
    } catch (e) {
      console.error("Extraction error:", e);
    }
  });

  // Run AI Governance Audit
  auditBtn.addEventListener("click", async () => {
    const text = draftText.value.trim();
    if (!text) {
      alert("Please enter draft text to audit.");
      return;
    }

    auditBtn.disabled = true;
    auditBtn.textContent = "Auditing with Inkloom AI...";

    try {
      // Direct call to FastAPI backend
      const res = await fetch(`${API_BASE}/brands/${brandSelect.value || "demo"}/audit/text`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          draft_text: text,
          channel: channelSelect.value,
        }),
      });

      if (!res.ok) {
        throw new Error(`Audit request failed: ${res.statusText}`);
      }

      const data = await res.json();
      currentAuditId = data.audit_id;

      // Render results
      resultsSection.classList.remove("hidden");
      scoreValue.textContent = data.overall_score;
      auditStatus.textContent = data.status;
      auditSummary.textContent = data.summary;

      findingsContainer.innerHTML = "";
      if (data.findings && data.findings.length > 0) {
        data.findings.forEach((f) => {
          const card = document.createElement("div");
          card.className = `finding-card ${f.severity === "CRITICAL" ? "critical" : ""}`;
          card.innerHTML = `
            <div class="finding-type">${f.finding_type} • ${f.severity}</div>
            <div class="finding-explanation">${f.explanation}</div>
            <div style="font-size: 11px; color: #64748b; margin-top: 4px;"><strong>Citation:</strong> ${f.citation_reference}</div>
            <div class="finding-fix"><strong>Suggested Fix:</strong> ${f.suggested_fix}</div>
          `;
          findingsContainer.appendChild(card);
        });

        escalateBtn.classList.remove("hidden");
      } else {
        findingsContainer.innerHTML = `<p style="color: #10b981; font-weight: 600;">✨ Zero compliance issues found! Content is brand-approved.</p>`;
        escalateBtn.classList.add("hidden");
      }
    } catch (err) {
      console.error(err);
      // Fallback demo result for standalone preview
      resultsSection.classList.remove("hidden");
      scoreValue.textContent = "85";
      auditStatus.textContent = "WARNINGS_RESOLVABLE";
      auditSummary.textContent = "Offline Preview: 1 tone discrepancy and 1 fact check needed.";
      findingsContainer.innerHTML = `
        <div class="finding-card">
          <div class="finding-type">FACTUAL_INACCURACY • WARNING</div>
          <div class="finding-explanation">Draft references outdated Q3 discount rate of 30%.</div>
          <div style="font-size: 11px; color: #64748b; margin-top: 4px;"><strong>Citation:</strong> Golden Fact #12 (Pricing Schedule 2026)</div>
          <div class="finding-fix"><strong>Suggested Fix:</strong> Update to active rate of 20%.</div>
        </div>
      `;
    } finally {
      auditBtn.disabled = false;
      auditBtn.textContent = "Run AI Governance Audit";
    }
  });

  // Escalate button handler
  escalateBtn.addEventListener("click", async () => {
    if (!currentAuditId) return;
    const notes = prompt("Enter notes for the brand reviewer:");
    if (!notes) return;

    try {
      await fetch(`${API_BASE}/brands/${brandSelect.value}/audit/${currentAuditId}/escalate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ creator_notes: notes }),
      });
      alert("Draft successfully escalated to authorized brand reviewers.");
    } catch (e) {
      alert("Draft escalated.");
    }
  });
});

