import React, { useState } from "react";
import {
  Sliders,
  Plus,
  AlertTriangle,
  ShieldAlert,
  FileText,
  Volume2,
  Bookmark,
  CheckCircle2,
} from "lucide-react";
import { useWorkspace } from "../context/WorkspaceContext";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../design-system/Card";
import { Button } from "../design-system/Button";
import { Badge } from "../design-system/Badge";
import { Input, Textarea, Select } from "../design-system/FormControls";
import { Modal } from "../design-system/Modal";
import { useNotification } from "../context/NotificationContext";
import { MOCK_BRAND_RULES } from "../data/mockData";
import { BrandRule } from "../types";

export const BrandRulesView: React.FC = () => {
  const { activeBrand } = useWorkspace();
  const { showToast } = useNotification();

  const [rules, setRules] = useState<BrandRule[]>(MOCK_BRAND_RULES);
  const [activeType, setActiveType] = useState<string>("ALL");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form State
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState<BrandRule["ruleType"]>("PROHIBITED_CLAIM");
  const [newSeverity, setNewSeverity] = useState<BrandRule["severity"]>("CRITICAL");
  const [newPattern, setNewPattern] = useState("");
  const [newExplanation, setNewExplanation] = useState("");

  const filteredRules = rules.filter((r) => activeType === "ALL" || r.ruleType === activeType);

  const handleAddRule = (e: React.FormEvent) => {
    e.preventDefault();
    const created: BrandRule = {
      id: `rule-${Date.now()}`,
      brandId: activeBrand.id,
      ruleType: newType,
      name: newName,
      severity: newSeverity,
      patternOrInstruction: newPattern,
      explanation: newExplanation,
      channels: ["all"],
      isActive: true,
    };

    setRules([created, ...rules]);
    setIsAddModalOpen(false);
    setNewName("");
    setNewPattern("");
    setNewExplanation("");

    showToast({
      type: "success",
      title: "Guardrail Enforced",
      message: `Rule "${newName}" is now active across all ${activeBrand.name} channels.`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Sliders className="h-5 w-5 text-indigo-500" />
            Brand Guardrails & Policies
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Deterministic rules and guidelines enforced for <strong>{activeBrand.name}</strong>
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsAddModalOpen(true)}
          leftIcon={<Plus className="h-4 w-4" />}
        >
          Add Brand Guardrail
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto">
        {[
          { id: "ALL", label: "All Rules" },
          { id: "PROHIBITED_CLAIM", label: "Prohibited Claims" },
          { id: "MANDATORY_DISCLOSURE", label: "Mandatory Disclosures" },
          { id: "TONE_OF_VOICE", label: "Tone of Voice" },
          { id: "TERMINOLOGY", label: "Terminology" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveType(tab.id)}
            className={`text-xs px-3 py-1.5 rounded-md whitespace-nowrap transition-colors ${
              activeType === tab.id
                ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-semibold shadow-2xs"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Rules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredRules.map((rule) => (
          <Card key={rule.id}>
            <CardHeader className="flex flex-row items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-xs text-slate-900 dark:text-slate-100">
                    {rule.name}
                  </span>
                  <Badge
                    variant={
                      rule.severity === "CRITICAL"
                        ? "danger"
                        : rule.severity === "WARNING"
                        ? "warning"
                        : "neutral"
                    }
                    size="sm"
                  >
                    {rule.severity}
                  </Badge>
                </div>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-medium block mt-1">
                  {rule.ruleType.replace("_", " ")}
                </span>
              </div>
              <Badge variant="success" size="sm" dot>
                Enforced
              </Badge>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-mono text-slate-800 dark:text-slate-200">
                <span className="text-[10px] text-slate-400 uppercase block font-sans font-semibold mb-0.5">
                  Trigger Pattern:
                </span>
                "{rule.patternOrInstruction}"
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                {rule.explanation}
              </p>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400">
                <span>Applies to: {rule.channels.join(", ")}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add Rule Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Author Brand Guardrail"
        description="Configure an automated rule enforced across creator drafts."
      >
        <form onSubmit={handleAddRule} className="space-y-4">
          <Input
            label="Rule Name"
            placeholder="e.g., Comparative Superlatives"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Rule Type"
              value={newType}
              onChange={(e) => setNewType(e.target.value as any)}
              options={[
                { value: "PROHIBITED_CLAIM", label: "Prohibited Claim" },
                { value: "MANDATORY_DISCLOSURE", label: "Mandatory Disclosure" },
                { value: "TONE_OF_VOICE", label: "Tone of Voice" },
                { value: "TERMINOLOGY", label: "Terminology" },
              ]}
            />

            <Select
              label="Severity"
              value={newSeverity}
              onChange={(e) => setNewSeverity(e.target.value as any)}
              options={[
                { value: "CRITICAL", label: "Critical (Blocks Publish)" },
                { value: "WARNING", label: "Warning" },
                { value: "SUGGESTION", label: "Suggestion" },
              ]}
            />
          </div>

          <Textarea
            label="Trigger Pattern / Keyphrase"
            placeholder="e.g., cheapest, 100% uptime, unbeatable"
            value={newPattern}
            onChange={(e) => setNewPattern(e.target.value)}
            required
            rows={2}
          />

          <Textarea
            label="Guideline Explanation (Shown to Creators)"
            placeholder="Explain why this rule exists and cite regulatory or brand policy..."
            value={newExplanation}
            onChange={(e) => setNewExplanation(e.target.value)}
            required
            rows={3}
          />

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="ghost" size="sm" type="button" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Save Guardrail
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
