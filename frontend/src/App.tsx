import React, { useState } from "react";
import {
  ShieldCheck,
  Sparkles,
  BookOpen,
  FileCheck2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Layers,
  BarChart3,
  ArrowRight,
  Send,
  Upload,
  RefreshCw,
  Building2,
  Sliders,
} from "lucide-react";

interface Finding {
  id: string;
  finding_type: string;
  severity: "CRITICAL" | "WARNING" | "SUGGESTION";
  original_snippet: string;
  explanation: string;
  citation_reference: string;
  suggested_fix: string;
}

interface AuditResult {
  overall_score: number;
  status: "PASSED" | "WARNINGS_RESOLVABLE" | "NEEDS_REVIEW" | "REJECTED";
  summary: string;
  findings: Finding[];
}

export default function App() {
  const [activeBrand, setActiveBrand] = useState("Acme Cloud");
  const [activeTab, setActiveTab] = useState<"studio" | "rules" | "facts" | "review" | "analytics">("studio");
  const [channel, setChannel] = useState("linkedin");
  const [draftContent, setDraftContent] = useState(
    "Acme Cloud delivers guaranteed 100% uptime with our unbeatable 30% discount this quarter. It's the cheapest cloud available anywhere!"
  );
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditResult, setAuditResult] = useState<AuditResult | null>(null);
  const [escalated, setEscalated] = useState(false);

  const mockGoldenFacts = [
    {
      id: "fact-1",
      category: "Service Level Agreement",
      title: "Uptime Commitment",
      claim_statement: "Acme Cloud guarantees 99.99% uptime availability backed by financial credits.",
      source_document: "Enterprise SLA v4.2",
    },
    {
      id: "fact-2",
      category: "Pricing & Discounts",
      title: "Current Quarter Promo",
      claim_statement: "Eligible new accounts receive a maximum 20% discount on annual subscriptions for Q4.",
      source_document: "Sales Pricing Handbook 2026",
    },
    {
      id: "fact-3",
      category: "Competitive Positioning",
      title: "Value Proposition",
      claim_statement: "Acme Cloud delivers high performance at competitive total cost of ownership (TCO). Never claim absolute 'cheapest'.",
      source_document: "Brand Positioning Guidelines",
    },
  ];

  const mockBrandRules = [
    {
      id: "rule-1",
      type: "PROHIBITED_CLAIM",
      name: "Absolute Superlatives",
      pattern: "cheapest, 100% uptime, unbeatable",
      severity: "CRITICAL",
      explanation: "Superlative claims violate legal substantiation guidelines.",
    },
    {
      id: "rule-2",
      type: "MANDATORY_DISCLOSURE",
      name: "Promotional Terms",
      pattern: "Terms and conditions apply.",
      severity: "WARNING",
      explanation: "All promotional pricing must include statutory disclosure.",
    },
    {
      id: "rule-3",
      type: "TONE_OF_VOICE",
      name: "Enterprise Credibility",
      pattern: "Professional, confident, empirical",
      severity: "SUGGESTION",
      explanation: "Avoid hyperbolic marketing hype.",
    },
  ];

  const handleAudit = () => {
    setIsAuditing(true);
    setEscalated(false);

    // Simulate multi-modal RAG & OpenCV Governance Engine
    setTimeout(() => {
      const findings: Finding[] = [
        {
          id: "f-1",
          finding_type: "FACTUAL_INACCURACY",
          severity: "CRITICAL",
          original_snippet: "guaranteed 100% uptime",
          explanation: "Claim contradicts official SLA commitment of 99.99%. Absolute 100% guarantees expose the brand to contractual liability.",
          citation_reference: "Golden Fact #1: Enterprise SLA v4.2",
          suggested_fix: "guaranteed 99.99% uptime with enterprise SLAs",
        },
        {
          id: "f-2",
          finding_type: "FACTUAL_INACCURACY",
          severity: "WARNING",
          original_snippet: "30% discount",
          explanation: "Active Q4 maximum authorized discount rate is 20%.",
          citation_reference: "Golden Fact #2: Sales Pricing Handbook 2026",
          suggested_fix: "exclusive 20% promotional discount",
        },
        {
          id: "f-3",
          finding_type: "PROHIBITED_CLAIM",
          severity: "CRITICAL",
          original_snippet: "cheapest cloud available anywhere",
          explanation: "Violates Brand Rule against unsubstantiated comparative superlatives ('cheapest').",
          citation_reference: "Brand Rule: Prohibited Superlatives #1",
          suggested_fix: "cost-effective cloud infrastructure for scale",
        },
      ];

      setAuditResult({
        overall_score: 54,
        status: "NEEDS_REVIEW",
        summary: "Flagged 2 critical factual deviations and 1 prohibited superlative claim. Revision recommended.",
        findings,
      });
      setIsAuditing(false);
    }, 600);
  };

  const applyFix = (finding: Finding) => {
    setDraftContent((prev) => prev.replace(finding.original_snippet, finding.suggested_fix));
    if (auditResult) {
      setAuditResult({
        ...auditResult,
        findings: auditResult.findings.filter((f) => f.id !== finding.id),
        overall_score: Math.min(100, auditResult.overall_score + 15),
      });
    }
  };

  return (
    <div className="flex h-screen bg-slate-900 text-slate-100 overflow-hidden font-sans">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col justify-between p-4">
        <div>
          {/* Logo */}
          <div className="flex items-center gap-3 px-2 py-3 mb-6">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/20">
              <ShieldCheck className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-sky-400 to-indigo-200 bg-clip-text text-transparent">
                Inkloom
              </span>
              <span className="block text-[10px] font-semibold tracking-wider uppercase text-slate-400">
                Brand Governance
              </span>
            </div>
          </div>

          {/* Brand Workspace Selector */}
          <div className="mb-6 p-2 bg-slate-900/80 rounded-lg border border-slate-800">
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
              <Building2 className="h-3 w-3 text-sky-400" /> Active Workspace
            </label>
            <select
              value={activeBrand}
              onChange={(e) => setActiveBrand(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded px-2.5 py-1.5 text-xs font-medium focus:outline-none focus:border-sky-500"
            >
              <option value="Acme Cloud">Acme Cloud (Enterprise)</option>
              <option value="BioHealth">BioHealth Pharma</option>
              <option value="FinEdge">FinEdge Banking</option>
            </select>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab("studio")}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition ${
                activeTab === "studio"
                  ? "bg-sky-500/10 text-sky-400 border border-sky-500/30"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
              }`}
            >
              <Sparkles className="h-4 w-4" /> Creator Studio
            </button>
            <button
              onClick={() => setActiveTab("facts")}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition ${
                activeTab === "facts"
                  ? "bg-sky-500/10 text-sky-400 border border-sky-500/30"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
              }`}
            >
              <BookOpen className="h-4 w-4" /> Golden Facts (RAG)
            </button>
            <button
              onClick={() => setActiveTab("rules")}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition ${
                activeTab === "rules"
                  ? "bg-sky-500/10 text-sky-400 border border-sky-500/30"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
              }`}
            >
              <Sliders className="h-4 w-4" /> Guardrails & Policies
            </button>
            <button
              onClick={() => setActiveTab("review")}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition ${
                activeTab === "review"
                  ? "bg-sky-500/10 text-sky-400 border border-sky-500/30"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
              }`}
            >
              <FileCheck2 className="h-4 w-4" /> Review Queue
            </button>
            <button
              onClick={() => setActiveTab("analytics")}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition ${
                activeTab === "analytics"
                  ? "bg-sky-500/10 text-sky-400 border border-sky-500/30"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
              }`}
            >
              <BarChart3 className="h-4 w-4" /> Governance Analytics
            </button>
          </nav>
        </div>

        {/* User profile & extension bridge info */}
        <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800 text-[11px] text-slate-400">
          <div className="flex items-center gap-2 mb-1">
            <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
            <span className="font-semibold text-slate-300">Chrome MV3 Ready</span>
          </div>
          <div>Tenant isolation active</div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-y-auto">
        {/* Top Header */}
        <header className="h-14 border-b border-slate-800 bg-slate-950/60 backdrop-blur px-6 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">Brand Workspace</span>
            <span className="text-slate-600">/</span>
            <span className="font-semibold text-sky-400">{activeBrand}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 font-medium">
              Role: Brand Manager
            </span>
          </div>
        </header>

        {/* Tab Content */}
        <div className="p-6 max-w-7xl w-full mx-auto">
          {activeTab === "studio" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Creator Editor Column */}
              <div className="lg:col-span-7 space-y-4">
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-sky-400" /> Creator Studio Draft
                    </h2>
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-slate-400">Channel:</label>
                      <select
                        value={channel}
                        onChange={(e) => setChannel(e.target.value)}
                        className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded px-2.5 py-1 focus:outline-none"
                      >
                        <option value="linkedin">LinkedIn Post</option>
                        <option value="twitter">X / Twitter</option>
                        <option value="blog">Blog / Webflow</option>
                        <option value="press">Press Release</option>
                      </select>
                    </div>
                  </div>

                  <textarea
                    value={draftContent}
                    onChange={(e) => setDraftContent(e.target.value)}
                    rows={8}
                    className="w-full bg-slate-900/90 border border-slate-800 rounded-lg p-3.5 text-sm text-slate-200 focus:outline-none focus:border-sky-500 leading-relaxed font-normal"
                    placeholder="Type or paste draft copy here..."
                  />

                  <div className="mt-4 flex items-center justify-between">
                    <div className="text-xs text-slate-400">
                      Evaluated against <span className="text-slate-200 font-semibold">{mockGoldenFacts.length} Golden Facts</span> and <span className="text-slate-200 font-semibold">{mockBrandRules.length} Guardrails</span>
                    </div>
                    <button
                      onClick={handleAudit}
                      disabled={isAuditing}
                      className="flex items-center gap-2 px-4 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs rounded-lg transition disabled:opacity-50 shadow-md shadow-sky-500/20"
                    >
                      {isAuditing ? (
                        <>
                          <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Auditing...
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="h-4 w-4" /> Run AI Governance Audit
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Visual Identity Checker Module */}
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                      <Layers className="h-3.5 w-3.5 text-sky-400" /> Split Vision Engine (OpenCV + Gemini)
                    </h3>
                    <span className="text-[11px] text-slate-400">Deterministic Color & Logo Check</span>
                  </div>
                  <div className="border-2 border-dashed border-slate-800 rounded-lg p-6 text-center hover:border-slate-700 transition cursor-pointer">
                    <Upload className="h-6 w-6 text-slate-500 mx-auto mb-2" />
                    <p className="text-xs font-medium text-slate-300">Drop creative image or banner here</p>
                    <p className="text-[10px] text-slate-500 mt-1">Verifies exact hex palettes (CIELAB ΔE &lt; 25) and logo safe margins</p>
                  </div>
                </div>
              </div>

              {/* Audit Results & Explanations Column */}
              <div className="lg:col-span-5 space-y-4">
                {auditResult ? (
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
                    {/* Score Overview */}
                    <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
                      <div>
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">
                          Governance Score
                        </span>
                        <div className="flex items-baseline gap-2 mt-1">
                          <span
                            className={`text-3xl font-extrabold ${
                              auditResult.overall_score >= 80
                                ? "text-emerald-400"
                                : auditResult.overall_score >= 60
                                ? "text-amber-400"
                                : "text-rose-400"
                            }`}
                          >
                            {auditResult.overall_score}
                          </span>
                          <span className="text-xs text-slate-400 font-semibold">/ 100</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span
                          className={`inline-block px-2.5 py-1 rounded text-[11px] font-bold ${
                            auditResult.status === "PASSED"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : auditResult.status === "WARNINGS_RESOLVABLE"
                              ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                              : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                          }`}
                        >
                          {auditResult.status}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">{auditResult.summary}</p>

                    {/* Findings & Citations List */}
                    <div className="space-y-3">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        Identified Deviations ({auditResult.findings.length})
                      </div>
                      {auditResult.findings.map((f) => (
                        <div
                          key={f.id}
                          className="p-3.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 transition text-xs space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-200 flex items-center gap-1.5">
                              {f.severity === "CRITICAL" ? (
                                <AlertTriangle className="h-3.5 w-3.5 text-rose-400" />
                              ) : (
                                <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                              )}
                              {f.finding_type}
                            </span>
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                                f.severity === "CRITICAL"
                                  ? "bg-rose-500/20 text-rose-300"
                                  : "bg-amber-500/20 text-amber-300"
                              }`}
                            >
                              {f.severity}
                            </span>
                          </div>

                          <div className="text-slate-400 font-mono text-[11px] bg-slate-950 px-2 py-1 rounded border border-slate-800/80">
                            "{f.original_snippet}"
                          </div>

                          <p className="text-slate-300">{f.explanation}</p>

                          <div className="text-[11px] text-slate-400">
                            <strong className="text-slate-300">Ground Truth Citation:</strong> {f.citation_reference}
                          </div>

                          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                            <div className="text-emerald-400 font-medium text-[11px]">
                              Fix: "{f.suggested_fix}"
                            </div>
                            <button
                              onClick={() => applyFix(f)}
                              className="px-2.5 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded text-[11px] font-semibold transition shrink-0"
                            >
                              Apply Rewrite
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Escalation Button */}
                    <div className="pt-2">
                      <button
                        onClick={() => setEscalated(true)}
                        disabled={escalated}
                        className="w-full flex items-center justify-center gap-2 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition"
                      >
                        <Send className="h-3.5 w-3.5" />
                        {escalated ? "Escalated to Review Queue" : "Escalate to Human Reviewer"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-8 text-center text-slate-500">
                    <ShieldCheck className="h-10 w-10 mx-auto mb-3 text-slate-700" />
                    <h4 className="text-sm font-semibold text-slate-400">No active audit run</h4>
                    <p className="text-xs mt-1">
                      Click "Run AI Governance Audit" to verify factual claims and brand tone against Golden Facts.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "facts" && (
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-200">Golden Facts Library (RAG Knowledge Base)</h2>
                  <p className="text-xs text-slate-400">Ground-truth facts indexed into pgvector for semantic claim verification.</p>
                </div>
                <button className="flex items-center gap-2 px-3 py-1.5 bg-sky-500 text-slate-950 font-bold text-xs rounded-lg hover:bg-sky-400 transition">
                  <Upload className="h-3.5 w-3.5" /> Ingest CSV / Excel
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                      <th className="py-2.5 px-3">Category</th>
                      <th className="py-2.5 px-3">Title</th>
                      <th className="py-2.5 px-3">Approved Claim Statement</th>
                      <th className="py-2.5 px-3">Source Document</th>
                      <th className="py-2.5 px-3">Vector Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {mockGoldenFacts.map((fact) => (
                      <tr key={fact.id} className="hover:bg-slate-900/50">
                        <td className="py-3 px-3 font-semibold text-slate-300">{fact.category}</td>
                        <td className="py-3 px-3 text-slate-200">{fact.title}</td>
                        <td className="py-3 px-3 text-slate-300 max-w-md">{fact.claim_statement}</td>
                        <td className="py-3 px-3 text-slate-400 font-mono text-[11px]">{fact.source_document}</td>
                        <td className="py-3 px-3">
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                            <CheckCircle2 className="h-3 w-3" /> Indexed (768d)
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "rules" && (
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-200">Brand Guardrails & Governance Policies</h2>
                  <p className="text-xs text-slate-400">Rules applied across marketing channels to prevent off-brand risk.</p>
                </div>
                <button className="flex items-center gap-2 px-3 py-1.5 bg-sky-500 text-slate-950 font-bold text-xs rounded-lg hover:bg-sky-400 transition">
                  + Add Brand Rule
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {mockBrandRules.map((rule) => (
                  <div key={rule.id} className="p-4 bg-slate-900 border border-slate-800 rounded-lg text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-200">{rule.name}</span>
                      <span className="text-[10px] font-bold text-rose-300 bg-rose-500/20 px-2 py-0.5 rounded">
                        {rule.type}
                      </span>
                    </div>
                    <div className="text-slate-400 font-mono text-[11px] bg-slate-950 p-2 rounded">
                      Pattern: {rule.pattern}
                    </div>
                    <p className="text-slate-300">{rule.explanation}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "review" && (
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-200">Authorised Review Queue</h2>
                  <p className="text-xs text-slate-400">Escalated drafts requiring compliance sign-off.</p>
                </div>
              </div>

              {escalated ? (
                <div className="p-4 bg-slate-900 border border-amber-500/30 rounded-lg text-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-400 flex items-center gap-2">
                      <Clock className="h-4 w-4" /> Pending Human Review (Escalated Just Now)
                    </span>
                    <span className="text-[11px] text-slate-400">Target: LinkedIn Post</span>
                  </div>
                  <p className="text-slate-300 font-mono bg-slate-950 p-2.5 rounded border border-slate-800">
                    "{draftContent}"
                  </p>
                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button className="px-3 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 rounded font-semibold text-xs">
                      Reject Draft
                    </button>
                    <button className="px-3 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded font-semibold text-xs">
                      Approve with Exception
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-slate-500 text-xs">
                  All review queues are currently cleared. Escalated content will appear here for sign-off.
                </div>
              )}
            </div>
          )}

          {activeTab === "analytics" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-5">
                <span className="text-xs text-slate-400 font-semibold uppercase">Total Audits Run</span>
                <div className="text-3xl font-extrabold text-slate-100 mt-2">1,248</div>
                <span className="text-[11px] text-emerald-400 font-medium">↑ 18% this month</span>
              </div>
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-5">
                <span className="text-xs text-slate-400 font-semibold uppercase">Average Compliance Rate</span>
                <div className="text-3xl font-extrabold text-sky-400 mt-2">89.4%</div>
                <span className="text-[11px] text-slate-400">Across 3 brands</span>
              </div>
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-5">
                <span className="text-xs text-slate-400 font-semibold uppercase">Top Flagged Violation</span>
                <div className="text-base font-bold text-rose-400 mt-2">Outdated Pricing &amp; Superlatives</div>
                <span className="text-[11px] text-slate-400">42 occurrences</span>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
