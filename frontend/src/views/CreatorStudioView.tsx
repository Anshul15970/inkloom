import React, { useState } from "react";
import {
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  Upload,
  RefreshCw,
  Send,
  CheckCircle2,
  Image as ImageIcon,
  Layers,
  Check,
  ArrowRight,
  Info,
} from "lucide-react";
import { useWorkspace } from "../context/WorkspaceContext";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../design-system/Card";
import { Button } from "../design-system/Button";
import { Badge } from "../design-system/Badge";
import { Select, Textarea } from "../design-system/FormControls";
import { Modal } from "../design-system/Modal";
import { useNotification } from "../context/NotificationContext";
import { AuditFinding } from "../types";

export const CreatorStudioView: React.FC = () => {
  const { activeBrand } = useWorkspace();
  const { showToast } = useNotification();

  const [channel, setChannel] = useState("linkedin");
  const [draftText, setDraftText] = useState(
    "Nexus Cloud delivers guaranteed 100% uptime with our unbeatable 30% discount this quarter. It is the cheapest cloud infrastructure available anywhere!"
  );
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditScore, setAuditScore] = useState<number | null>(54);
  const [auditStatus, setAuditStatus] = useState<"PASSED" | "WARNINGS_RESOLVABLE" | "NEEDS_REVIEW">("NEEDS_REVIEW");
  const [findings, setFindings] = useState<AuditFinding[]>([
    {
      id: "f-1",
      findingType: "FACTUAL_INACCURACY",
      severity: "CRITICAL",
      originalSnippet: "guaranteed 100% uptime",
      explanation: "Violates verified SLA commitment. Official metric is 99.99% multi-region availability.",
      citationReference: "Golden Fact #1: Enterprise SLA Agreement v2026.1",
      suggestedFix: "guaranteed 99.99% uptime with enterprise SLAs",
      isApplied: false,
    },
    {
      id: "f-2",
      findingType: "FACTUAL_INACCURACY",
      severity: "WARNING",
      originalSnippet: "unbeatable 30% discount",
      explanation: "Authorized Q4 mid-market promotion cap is 20%. 30% violates approved commercial policy.",
      citationReference: "Golden Fact #2: Q4 2026 Commercial Pricing Directive",
      suggestedFix: "exclusive 20% promotional credit",
      isApplied: false,
    },
    {
      id: "f-3",
      findingType: "PROHIBITED_CLAIM",
      severity: "CRITICAL",
      originalSnippet: "cheapest cloud infrastructure available anywhere",
      explanation: "Absolute superlative ('cheapest') violates brand guardrail regarding competitive substantiation.",
      citationReference: "Brand Rule: Unsubstantiated Superlatives",
      suggestedFix: "cost-effective cloud infrastructure engineered for scale",
      isApplied: false,
    },
  ]);

  const [escalateModalOpen, setEscalateModalOpen] = useState(false);
  const [creatorNotes, setCreatorNotes] = useState("");
  const [hasEscalated, setHasEscalated] = useState(false);

  // Visual check state
  const [hasVisualAsset, setHasVisualAsset] = useState(false);
  const [visualScore, setVisualScore] = useState<number | null>(null);

  const handleAudit = () => {
    setIsAuditing(true);
    setHasEscalated(false);

    setTimeout(() => {
      setIsAuditing(false);
      showToast({
        type: "info",
        title: "Audit Completed",
        message: "Evaluated against active brand Golden Facts and visual identity rules.",
      });
    }, 700);
  };

  const applyRewrite = (finding: AuditFinding) => {
    if (!draftText.includes(finding.originalSnippet)) {
      showToast({
        type: "warning",
        title: "Snippet not found in draft",
        message: "The original text snippet has already been edited.",
      });
      return;
    }

    setDraftText((prev) => prev.replace(finding.originalSnippet, finding.suggestedFix));
    setFindings((prev) =>
      prev.map((f) => (f.id === finding.id ? { ...f, isApplied: true } : f))
    );

    // Increment compliance score
    setAuditScore((prev) => {
      const next = Math.min(100, (prev || 50) + 16);
      if (next >= 90) setAuditStatus("PASSED");
      else if (next >= 70) setAuditStatus("WARNINGS_RESOLVABLE");
      return next;
    });

    showToast({
      type: "success",
      title: "Rewrite Applied",
      message: `Replaced "${finding.originalSnippet}" with compliant wording.`,
    });
  };

  const handleEscalateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setEscalateModalOpen(false);
    setHasEscalated(true);
    showToast({
      type: "success",
      title: "Escalated to Review Queue",
      message: "Draft submitted to authorized brand compliance reviewers.",
    });
  };

  const loadSample = (type: "violations" | "clean") => {
    if (type === "violations") {
      setDraftText(
        "Nexus Cloud delivers guaranteed 100% uptime with our unbeatable 30% discount this quarter. It is the cheapest cloud infrastructure available anywhere!"
      );
      setAuditScore(54);
      setAuditStatus("NEEDS_REVIEW");
      setFindings([
        {
          id: "f-1",
          findingType: "FACTUAL_INACCURACY",
          severity: "CRITICAL",
          originalSnippet: "guaranteed 100% uptime",
          explanation: "Violates verified SLA commitment. Official metric is 99.99% multi-region availability.",
          citationReference: "Golden Fact #1: Enterprise SLA Agreement v2026.1",
          suggestedFix: "guaranteed 99.99% uptime with enterprise SLAs",
          isApplied: false,
        },
        {
          id: "f-2",
          findingType: "FACTUAL_INACCURACY",
          severity: "WARNING",
          originalSnippet: "unbeatable 30% discount",
          explanation: "Authorized Q4 mid-market promotion cap is 20%. 30% violates approved commercial policy.",
          citationReference: "Golden Fact #2: Q4 2026 Commercial Pricing Directive",
          suggestedFix: "exclusive 20% promotional credit",
          isApplied: false,
        },
        {
          id: "f-3",
          findingType: "PROHIBITED_CLAIM",
          severity: "CRITICAL",
          originalSnippet: "cheapest cloud infrastructure available anywhere",
          explanation: "Absolute superlative ('cheapest') violates brand guardrail regarding competitive substantiation.",
          citationReference: "Brand Rule: Unsubstantiated Superlatives",
          suggestedFix: "cost-effective cloud infrastructure engineered for scale",
          isApplied: false,
        },
      ]);
    } else {
      setDraftText(
        "Nexus Cloud delivers guaranteed 99.99% multi-region uptime backed by enterprise financial SLAs. Take advantage of an exclusive 20% promotional credit for eligible Q4 enterprise accounts."
      );
      setAuditScore(98);
      setAuditStatus("PASSED");
      setFindings([]);
    }
  };

  const handleSimulateImageUpload = () => {
    setHasVisualAsset(true);
    setVisualScore(88);
    showToast({
      type: "success",
      title: "Deterministic Visual Audit (OpenCV)",
      message: "Extracted dominant hex #0F172A (Deep Slate, ΔE: 0.8) and #2563EB (Nexus Blue, ΔE: 1.2). Aspect ratio: 1.91:1.",
    });
  };

  return (
    <div className="space-y-6">
      {/* Studio Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-indigo-500" />
            Creator Studio
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time compliance evaluations for <strong>{activeBrand.name}</strong>
          </p>
        </div>

        {/* Quick Sample Presets */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 hidden sm:inline">Preset Samples:</span>
          <Button variant="outline" size="sm" onClick={() => loadSample("violations")}>
            Flagged Draft
          </Button>
          <Button variant="outline" size="sm" onClick={() => loadSample("clean")}>
            Compliant Draft
          </Button>
        </div>
      </div>

      {/* Main Studio Dual Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Editor & Visual Uploader */}
        <div className="lg:col-span-7 space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Draft Content Canvas</CardTitle>
              <div className="w-44">
                <Select
                  value={channel}
                  onChange={(e) => setChannel(e.target.value)}
                  options={[
                    { value: "linkedin", label: "LinkedIn Post" },
                    { value: "twitter", label: "X / Twitter" },
                    { value: "blog", label: "Blog / Webflow" },
                    { value: "press_release", label: "Press Release" },
                  ]}
                />
              </div>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <Textarea
                rows={9}
                value={draftText}
                onChange={(e) => setDraftText(e.target.value)}
                placeholder="Draft or paste marketing copy here..."
                className="font-mono text-xs leading-relaxed"
              />

              <div className="flex items-center justify-between pt-2">
                <div className="text-[11px] text-slate-500">
                  {draftText.length} characters • {draftText.trim().split(/\s+/).filter(Boolean).length} words
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleAudit}
                  isLoading={isAuditing}
                  leftIcon={<ShieldCheck className="h-4 w-4" />}
                >
                  Run AI Governance Audit
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Split Vision Engine Uploader */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-indigo-500" />
                Split Vision Engine (OpenCV + Gemini Multimodal)
              </CardTitle>
              <CardDescription>
                Verifies exact hex color distances (CIELAB ΔE) and logo safe margins
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5">
              {!hasVisualAsset ? (
                <div
                  onClick={handleSimulateImageUpload}
                  className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-6 text-center hover:bg-slate-50/50 dark:hover:bg-slate-900/50 cursor-pointer transition-colors"
                >
                  <Upload className="h-7 w-7 text-slate-400 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Upload banner or creative image (Simulate OpenCV Check)
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Accepts PNG, JPG, WebP. Verifies {channel} 1.91:1 ratio.
                  </p>
                </div>
              ) : (
                <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/20 dark:bg-emerald-950/20 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                      <ImageIcon className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                        Banner_LinkedIn_1200x627.png
                      </div>
                      <div className="text-[11px] text-slate-500">
                        OpenCV Audit: Aspect Ratio 1.91:1 Compliant • Dominant Hexes Approved
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="success" size="sm">
                      Visual Score: {visualScore}/100
                    </Badge>
                    <Button variant="ghost" size="sm" onClick={() => setHasVisualAsset(false)}>
                      Remove
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Governance Findings & Explanations */}
        <div className="lg:col-span-5 space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Governance Scorecard</CardTitle>
                <CardDescription>Ground truth compliance verification</CardDescription>
              </div>
              {auditScore !== null && (
                <Badge
                  variant={
                    auditStatus === "PASSED"
                      ? "success"
                      : auditStatus === "WARNINGS_RESOLVABLE"
                      ? "warning"
                      : "danger"
                  }
                  size="md"
                >
                  {auditStatus}
                </Badge>
              )}
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              {auditScore !== null ? (
                <>
                  <div className="flex items-baseline justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                        Compliance Index
                      </span>
                      <div className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 mt-1">
                        {auditScore} <span className="text-xs text-slate-500 font-normal">/ 100</span>
                      </div>
                    </div>
                    <div className="text-right text-xs">
                      <span className="text-slate-500">Violations: </span>
                      <strong className="text-slate-900 dark:text-slate-100">
                        {findings.filter((f) => !f.isApplied).length}
                      </strong>
                    </div>
                  </div>

                  {/* Findings List */}
                  <div className="space-y-3">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Guideline Deviations
                    </div>

                    {findings.length > 0 && findings.some((f) => !f.isApplied) ? (
                      findings
                        .filter((f) => !f.isApplied)
                        .map((f) => (
                          <div
                            key={f.id}
                            className={`p-3.5 rounded-lg border text-xs space-y-2 transition-colors ${
                              f.severity === "CRITICAL"
                                ? "border-rose-200 dark:border-rose-900/60 bg-rose-50/30 dark:bg-rose-950/10"
                                : "border-amber-200 dark:border-amber-900/60 bg-amber-50/30 dark:bg-amber-950/10"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span
                                className={`font-semibold flex items-center gap-1.5 ${
                                  f.severity === "CRITICAL"
                                    ? "text-rose-700 dark:text-rose-400"
                                    : "text-amber-800 dark:text-amber-400"
                                }`}
                              >
                                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                                {f.findingType}
                              </span>
                              <Badge
                                variant={f.severity === "CRITICAL" ? "danger" : "warning"}
                                size="sm"
                              >
                                {f.severity}
                              </Badge>
                            </div>

                            <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
                              {f.explanation}
                            </p>

                            <div className="text-[10px] text-slate-500 font-mono">
                              <strong>Citation:</strong> {f.citationReference}
                            </div>

                            <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between gap-2">
                              <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium truncate">
                                Fix: "{f.suggestedFix}"
                              </span>
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => applyRewrite(f)}
                                className="shrink-0"
                              >
                                Apply Rewrite
                              </Button>
                            </div>
                          </div>
                        ))
                    ) : (
                      <div className="p-6 text-center rounded-xl bg-emerald-50/30 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300 space-y-1">
                        <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-1" />
                        <h4 className="text-xs font-bold">100% Brand Compliant</h4>
                        <p className="text-[11px] text-emerald-600 dark:text-emerald-400">
                          All factual claims and brand voice guardrails are satisfied. Ready to publish.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Escalate button */}
                  <div className="pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => setEscalateModalOpen(true)}
                      disabled={hasEscalated}
                      leftIcon={<Send className="h-3.5 w-3.5" />}
                    >
                      {hasEscalated ? "Escalated to Review Queue" : "Request Reviewer Exception Sign-Off"}
                    </Button>
                  </div>
                </>
              ) : (
                <div className="py-12 text-center text-xs text-slate-500">
                  Click "Run AI Governance Audit" to verify copy.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Escalation Modal */}
      <Modal
        isOpen={escalateModalOpen}
        onClose={() => setEscalateModalOpen(false)}
        title="Escalate Draft for Human Review"
        description="Submit this draft to authorized compliance reviewers for policy exception approval."
      >
        <form onSubmit={handleEscalateSubmit} className="space-y-4">
          <Textarea
            label="Reviewer Notes & Justification"
            placeholder="Explain why this copy requires a promotional exception or emergency publication..."
            value={creatorNotes}
            onChange={(e) => setCreatorNotes(e.target.value)}
            required
            rows={4}
          />
          <div className="text-[11px] text-slate-500">
            Escalating will notify assigned Brand Compliance Officers and log this event in the immutable audit trail.
          </div>
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="ghost" size="sm" type="button" onClick={() => setEscalateModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Submit to Review Queue
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
