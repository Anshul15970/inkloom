import React from "react";
import {
  ShieldCheck,
  Sparkles,
  BookOpen,
  FileCheck2,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Layers,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { useWorkspace } from "../context/WorkspaceContext";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../design-system/Card";
import { Button } from "../design-system/Button";
import { Badge } from "../design-system/Badge";
import { MOCK_AUDIT_HISTORY, MOCK_REVIEW_QUEUE } from "../data/mockData";

export const OverviewView: React.FC = () => {
  const { activeBrand, setCurrentRoute, activeRole } = useWorkspace();

  const brandAudits = MOCK_AUDIT_HISTORY.filter((a) => a.brandId === activeBrand.id || a.brandId === "brand-nexus");
  const pendingReviews = MOCK_REVIEW_QUEUE.filter((r) => r.status === "PENDING");

  return (
    <div className="space-y-6">
      {/* Brand Header Banner */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: activeBrand.secondaryColor }}
            />
            <span className="text-xs uppercase font-bold tracking-wider text-slate-500">
              {activeBrand.industry}
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            {activeBrand.name} Governance Overview
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {activeBrand.tagline}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentRoute("golden-facts")}
            leftIcon={<BookOpen className="h-4 w-4" />}
          >
            Manage Facts ({activeBrand.goldenFactsCount})
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setCurrentRoute("creator-studio")}
            leftIcon={<Sparkles className="h-4 w-4" />}
          >
            Launch Creator Studio
          </Button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Average Compliance Rate</span>
              <TrendingUp className="h-4 w-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">88.4%</div>
            <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
              ↑ 4.2% across last 30 days
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Indexed Golden Facts</span>
              <BookOpen className="h-4 w-4 text-indigo-500" />
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {activeBrand.goldenFactsCount}
            </div>
            <div className="text-[11px] text-slate-500">
              pgvector 768d embeddings active
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Enforced Guardrails</span>
              <ShieldCheck className="h-4 w-4 text-slate-700 dark:text-slate-300" />
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {activeBrand.activeRulesCount}
            </div>
            <div className="text-[11px] text-slate-500">
              Prohibited claims & tone rules
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Review Queue Backlog</span>
              <Clock className="h-4 w-4 text-amber-500" />
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {pendingReviews.length}
            </div>
            <div className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
              Requires compliance sign-off
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid: Pending Reviews & Recent Audits */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Pending Review Item Alert */}
        <div className="lg:col-span-7 space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Escalated Review Queue</CardTitle>
                <CardDescription>High-risk drafts requiring compliance sign-off</CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentRoute("review-queue")}
                rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
              >
                View Queue
              </Button>
            </CardHeader>
            <CardContent className="p-5 space-y-3">
              {pendingReviews.length > 0 ? (
                pendingReviews.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-lg border border-amber-200 dark:border-amber-900/60 bg-amber-50/30 dark:bg-amber-950/20 text-xs space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900 dark:text-slate-100">
                          {item.creatorName}
                        </span>
                        <Badge variant="warning" size="sm">
                          Score: {item.overallScore}/100
                        </Badge>
                      </div>
                      <span className="text-[11px] text-slate-500">{item.submittedAt}</span>
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 font-mono text-[11px] bg-white dark:bg-slate-900 p-2 rounded border border-slate-200 dark:border-slate-800">
                      "{item.contentSnippet}"
                    </p>
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px] text-slate-500">
                        <strong>Reason:</strong> {item.creatorNotes}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentRoute("review-queue")}
                      >
                        Inspect Draft
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-xs text-slate-500">
                  Zero pending escalations. All drafts cleared.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Start Creator Card */}
          <Card className="bg-linear-to-r from-slate-900 to-slate-800 text-white border-transparent">
            <CardContent className="p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1 text-center sm:text-left">
                <h3 className="text-base font-bold text-white flex items-center gap-2 justify-center sm:justify-start">
                  <Sparkles className="h-4 w-4 text-sky-400" /> Try Creator Studio Audit
                </h3>
                <p className="text-xs text-slate-300 max-w-md">
                  Paste draft copy or test sample claims to experience real-time factual citation and 1-click prescriptive rewrites.
                </p>
              </div>
              <Button
                variant="primary"
                size="md"
                className="bg-white text-slate-900 hover:bg-slate-100 shrink-0"
                onClick={() => setCurrentRoute("creator-studio")}
                rightIcon={<ArrowRight className="h-4 w-4" />}
              >
                Open Studio
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Recent Audit Stream */}
        <div className="lg:col-span-5 space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Audits</CardTitle>
                <CardDescription>Latest pre-publication evaluations</CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentRoute("audit-history")}
                rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
              >
                All
              </Button>
            </CardHeader>
            <CardContent className="p-0 divide-y divide-slate-100 dark:divide-slate-800">
              {brandAudits.slice(0, 3).map((audit) => (
                <div key={audit.id} className="p-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {audit.authorName}
                    </span>
                    <Badge
                      variant={
                        audit.overallScore >= 90
                          ? "success"
                          : audit.overallScore >= 70
                          ? "warning"
                          : "danger"
                      }
                      size="sm"
                    >
                      {audit.overallScore}/100
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 truncate">
                    {audit.contentSnippet}
                  </p>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2">
                    <span className="capitalize">{audit.channel}</span>
                    <span>{audit.timestamp}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

