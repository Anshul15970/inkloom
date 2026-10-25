import React, { useState } from "react";
import {
  FileCheck2,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  MessageSquare,
  User,
  ArrowRight,
} from "lucide-react";
import { useWorkspace } from "../context/WorkspaceContext";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../design-system/Card";
import { Button } from "../design-system/Button";
import { Badge } from "../design-system/Badge";
import { Textarea } from "../design-system/FormControls";
import { EmptyState } from "../design-system/EmptyState";
import { useNotification } from "../context/NotificationContext";
import { MOCK_REVIEW_QUEUE } from "../data/mockData";
import { ReviewQueueItem } from "../types";

export const ReviewQueueView: React.FC = () => {
  const { activeBrand } = useWorkspace();
  const { showToast } = useNotification();

  const [queue, setQueue] = useState<ReviewQueueItem[]>(MOCK_REVIEW_QUEUE);
  const [selectedItem, setSelectedItem] = useState<ReviewQueueItem | null>(queue[0] || null);
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [reviewerComment, setReviewerComment] = useState("");

  const filteredQueue = queue.filter(
    (item) => filterStatus === "ALL" || item.status === filterStatus
  );

  const handleTakeAction = (action: "APPROVED" | "REJECTED" | "CHANGES_REQUESTED") => {
    if (!selectedItem) return;

    const updated: ReviewQueueItem = {
      ...selectedItem,
      status: action,
      reviewerComments: reviewerComment || (action === "APPROVED" ? "Approved with exception." : "Declined compliance sign-off."),
    };

    setQueue((prev) => prev.map((q) => (q.id === selectedItem.id ? updated : q)));
    setSelectedItem(updated);
    setReviewerComment("");

    const actionText =
      action === "APPROVED"
        ? "Draft Approved with Exception"
        : action === "REJECTED"
        ? "Draft Rejected"
        : "Changes Requested";

    showToast({
      type: action === "APPROVED" ? "success" : action === "REJECTED" ? "error" : "warning",
      title: actionText,
      message: `Audit #${selectedItem.auditId} updated in compliance ledger. Creator notified.`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <FileCheck2 className="h-5 w-5 text-indigo-500" />
            Authorised Review Queue
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Escalated drafts requiring compliance sign-off for <strong>{activeBrand.name}</strong>
          </p>
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-2">
          {["ALL", "PENDING", "APPROVED", "CHANGES_REQUESTED"].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`text-xs px-2.5 py-1 rounded-md transition-colors ${
                filterStatus === status
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-semibold"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              {status.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Main Review Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Queue Items List */}
        <div className="lg:col-span-5 space-y-3">
          {filteredQueue.length > 0 ? (
            filteredQueue.map((item) => {
              const isSelected = selectedItem?.id === item.id;
              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  className={`p-4 rounded-xl border text-xs cursor-pointer transition-all ${
                    isSelected
                      ? "border-slate-900 dark:border-white bg-white dark:bg-slate-900 shadow-sm"
                      : "border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/40 hover:bg-white dark:hover:bg-slate-900"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900 dark:text-slate-100">
                        {item.creatorName}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        #{item.auditId}
                      </span>
                    </div>
                    <Badge
                      variant={
                        item.status === "PENDING"
                          ? "warning"
                          : item.status === "APPROVED"
                          ? "success"
                          : "danger"
                      }
                      size="sm"
                    >
                      {item.status.replace("_", " ")}
                    </Badge>
                  </div>

                  <p className="text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                    "{item.contentSnippet}"
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800/80 mt-2">
                    <span>{item.channel}</span>
                    <span>{item.submittedAt}</span>
                  </div>
                </div>
              );
            })
          ) : (
            <EmptyState
              icon={<Clock className="h-6 w-6" />}
              title="Queue Cleared"
              description="No escalated items match the selected filter."
            />
          )}
        </div>

        {/* Right Column: Detailed Review & Decision Inspector */}
        <div className="lg:col-span-7">
          {selectedItem ? (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Draft Inspection #{selectedItem.auditId}</CardTitle>
                  <CardDescription>
                    Submitted by {selectedItem.creatorName} on {selectedItem.submittedAt}
                  </CardDescription>
                </div>
                <Badge
                  variant={
                    selectedItem.status === "PENDING"
                      ? "warning"
                      : selectedItem.status === "APPROVED"
                      ? "success"
                      : "danger"
                  }
                  size="md"
                >
                  {selectedItem.status.replace("_", " ")}
                </Badge>
              </CardHeader>
              <CardContent className="p-5 space-y-4 text-xs">
                {/* Creator Notes */}
                <div className="p-3 rounded-lg bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/60">
                  <span className="text-[10px] uppercase font-bold text-amber-800 dark:text-amber-300 block mb-1">
                    Creator Justification / Exception Request:
                  </span>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                    {selectedItem.creatorNotes}
                  </p>
                </div>

                {/* Draft Copy */}
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                    Escalated Draft Copy ({selectedItem.channel}):
                  </span>
                  <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono text-xs leading-relaxed text-slate-800 dark:text-slate-200">
                    "{selectedItem.contentSnippet}"
                  </div>
                </div>

                {/* Existing Reviewer Comments */}
                {selectedItem.reviewerComments && (
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                      Reviewer Decision Comments:
                    </span>
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                      {selectedItem.reviewerComments}
                    </p>
                  </div>
                )}

                {/* Reviewer Action Area */}
                {selectedItem.status === "PENDING" && (
                  <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-3">
                    <Textarea
                      label="Reviewer Comments & Conditions"
                      placeholder="Specify required disclaimers or rationale for approval/rejection..."
                      value={reviewerComment}
                      onChange={(e) => setReviewerComment(e.target.value)}
                      rows={3}
                    />

                    <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleTakeAction("CHANGES_REQUESTED")}
                        leftIcon={<AlertCircle className="h-3.5 w-3.5" />}
                      >
                        Request Changes
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleTakeAction("REJECTED")}
                        leftIcon={<XCircle className="h-3.5 w-3.5" />}
                      >
                        Reject Draft
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleTakeAction("APPROVED")}
                        leftIcon={<CheckCircle2 className="h-3.5 w-3.5" />}
                      >
                        Approve with Exception
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="py-16 text-center text-xs text-slate-500">
              Select an item from the queue to inspect.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

