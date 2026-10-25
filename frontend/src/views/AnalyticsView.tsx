import React from "react";
import {
  BarChart3,
  TrendingUp,
  AlertTriangle,
  Clock,
  Layers,
  ArrowUpRight,
  ShieldCheck,
} from "lucide-react";
import { useWorkspace } from "../context/WorkspaceContext";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../design-system/Card";
import { Badge } from "../design-system/Badge";

export const AnalyticsView: React.FC = () => {
  const { activeBrand } = useWorkspace();

  const violationStats = [
    { category: "Unsubstantiated Superlatives", count: 42, percentage: 38, severity: "CRITICAL" },
    { category: "Outdated Pricing & Discount Rates", count: 31, percentage: 28, severity: "WARNING" },
    { category: "Missing Statutory Disclaimers", count: 20, percentage: 18, severity: "WARNING" },
    { category: "Visual Palette / Color Drift", count: 18, percentage: 16, severity: "WARNING" },
  ];

  const channelStats = [
    { channel: "Blog & Webflow", score: 96, audits: 320, passRate: "94%" },
    { channel: "Press Release", score: 92, audits: 85, passRate: "91%" },
    { channel: "LinkedIn Feed", score: 88, audits: 540, passRate: "86%" },
    { channel: "X / Twitter", score: 82, audits: 410, passRate: "79%" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-indigo-500" />
          Governance Analytics & Trend Insights
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Real-time compliance data and recurring violation patterns for <strong>{activeBrand.name}</strong>
        </p>
      </div>

      {/* KPI Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 space-y-1">
            <span className="text-xs text-slate-500">Total Audits Processed</span>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">1,355</div>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
              ↑ 18.4% month-over-month
            </span>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-1">
            <span className="text-xs text-slate-500">First-Time Pass Rate</span>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">84.2%</div>
            <span className="text-[11px] text-slate-500">Before AI suggested fixes</span>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-1">
            <span className="text-xs text-slate-500">Suggested Rewrite Acceptance</span>
            <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">91.8%</div>
            <span className="text-[11px] text-slate-500">Accepted without escalation</span>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-1">
            <span className="text-xs text-slate-500">Avg. Review Escalation Time</span>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">18 min</div>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
              Down from 3.2 days (manual)
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recurring Violations */}
        <div className="lg:col-span-7">
          <Card>
            <CardHeader>
              <CardTitle>Top Recurring Brand Violations</CardTitle>
              <CardDescription>
                Identifies ambiguous guidelines or recurring creator knowledge gaps.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              {violationStats.map((item) => (
                <div key={item.category} className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {item.category}
                    </span>
                    <span className="font-mono text-slate-500">
                      {item.count} issues ({item.percentage}%)
                    </span>
                  </div>
                  {/* Progress Bar */}
                  <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        item.severity === "CRITICAL"
                          ? "bg-rose-500"
                          : "bg-amber-500"
                      }`}
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Channel Performance Breakdown */}
        <div className="lg:col-span-5">
          <Card>
            <CardHeader>
              <CardTitle>Channel Compliance Breakdown</CardTitle>
              <CardDescription>Average adherence by marketing channel</CardDescription>
            </CardHeader>
            <CardContent className="p-0 divide-y divide-slate-100 dark:divide-slate-800">
              {channelStats.map((ch) => (
                <div key={ch.channel} className="p-4 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                      {ch.channel}
                    </span>
                    <span className="text-[11px] text-slate-500">{ch.audits} total audits</span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-sm text-slate-900 dark:text-slate-100">
                      {ch.score} / 100
                    </div>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                      {ch.passRate} pass rate
                    </span>
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
