import React, { useState } from "react";
import {
  History,
  Search,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Eye,
  Filter,
} from "lucide-react";
import { useWorkspace } from "../context/WorkspaceContext";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../design-system/Card";
import { Button } from "../design-system/Button";
import { Badge } from "../design-system/Badge";
import { Modal } from "../design-system/Modal";
import { MOCK_AUDIT_HISTORY } from "../data/mockData";
import { AuditRecord } from "../types";

export const AuditHistoryView: React.FC = () => {
  const { activeBrand } = useWorkspace();
  const [audits] = useState<AuditRecord[]>(MOCK_AUDIT_HISTORY);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAudit, setSelectedAudit] = useState<AuditRecord | null>(null);

  const filteredAudits = audits.filter(
    (a) =>
      a.contentSnippet.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.authorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.channel.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <History className="h-5 w-5 text-indigo-500" />
            Audit History & Immutable Ledger
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Historical compliance evaluations for <strong>{activeBrand.name}</strong>
          </p>
        </div>

        <div className="w-full sm:w-64">
          <input
            type="text"
            placeholder="Search audit ledger..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-400"
          />
        </div>
      </div>

      {/* Audits Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  <th className="py-3 px-4">Audit ID & Author</th>
                  <th className="py-3 px-4">Channel & Content Snippet</th>
                  <th className="py-3 px-4">Score & Status</th>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {filteredAudits.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900 dark:text-slate-100">
                        {a.authorName}
                      </div>
                      <span className="text-[10px] font-mono text-slate-500">#{a.id}</span>
                    </td>
                    <td className="py-3.5 px-4 max-w-md">
                      <div className="font-semibold text-[11px] text-slate-500 uppercase mb-0.5">
                        {a.channel} • {a.contentType}
                      </div>
                      <p className="text-slate-700 dark:text-slate-300 truncate">
                        "{a.contentSnippet}"
                      </p>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="font-bold">{a.overallScore}/100</span>
                        <Badge
                          variant={
                            a.status === "PASSED"
                              ? "success"
                              : a.status === "WARNINGS_RESOLVABLE"
                              ? "warning"
                              : "danger"
                          }
                          size="sm"
                        >
                          {a.status}
                        </Badge>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                      {a.timestamp}
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedAudit(a)}
                        leftIcon={<Eye className="h-3.5 w-3.5" />}
                      >
                        Inspect
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Inspect Modal */}
      <Modal
        isOpen={selectedAudit !== null}
        onClose={() => setSelectedAudit(null)}
        title={`Audit Report #${selectedAudit?.id}`}
        description={`Author: ${selectedAudit?.authorName} • Evaluated on ${selectedAudit?.timestamp}`}
        maxWidth="lg"
      >
        {selectedAudit && (
          <div className="space-y-4 text-xs">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                Content Evaluated ({selectedAudit.channel}):
              </span>
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono text-slate-800 dark:text-slate-200 leading-relaxed">
                "{selectedAudit.contentSnippet}"
              </div>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                Executive Evaluation Summary:
              </span>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                {selectedAudit.summary}
              </p>
            </div>

            {selectedAudit.findings.length > 0 && (
              <div className="space-y-2">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Identified Violations ({selectedAudit.findings.length}):
                </span>
                {selectedAudit.findings.map((f) => (
                  <div
                    key={f.id}
                    className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-900 dark:text-slate-100">
                        {f.findingType}
                      </span>
                      <Badge variant={f.severity === "CRITICAL" ? "danger" : "warning"} size="sm">
                        {f.severity}
                      </Badge>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400">{f.explanation}</p>
                    <div className="text-[10px] text-slate-500 font-mono">
                      <strong>Citation:</strong> {f.citationReference}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Button variant="outline" size="sm" onClick={() => setSelectedAudit(null)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
