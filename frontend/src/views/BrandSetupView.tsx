import React, { useState } from "react";
import {
  Building2,
  Save,
  Palette,
  Volume2,
  Mail,
  Shield,
  CheckCircle2,
} from "lucide-react";
import { useWorkspace } from "../context/WorkspaceContext";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../design-system/Card";
import { Button } from "../design-system/Button";
import { Input, Textarea, Select } from "../design-system/FormControls";
import { useNotification } from "../context/NotificationContext";

export const BrandSetupView: React.FC = () => {
  const { activeBrand } = useWorkspace();
  const { showToast } = useNotification();

  const [brandName, setBrandName] = useState(activeBrand.name);
  const [tagline, setTagline] = useState(activeBrand.tagline);
  const [industry, setIndustry] = useState(activeBrand.industry);
  const [primaryColor, setPrimaryColor] = useState(activeBrand.primaryColor);
  const [secondaryColor, setSecondaryColor] = useState(activeBrand.secondaryColor);
  const [toneGuidelines, setToneGuidelines] = useState(activeBrand.toneGuidelines.join("\n"));
  const [escalationEmail, setEscalationEmail] = useState("compliance@nexuscloud.io");

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    showToast({
      type: "success",
      title: "Workspace Profile Updated",
      message: `Saved configuration for ${brandName}. Policies synchronized across all active creator sessions.`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Building2 className="h-5 w-5 text-indigo-500" />
            Brand Workspace Profile
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Configure core identity, voice parameters, and escalation contacts for <strong>{activeBrand.name}</strong>
          </p>
        </div>

        <Button variant="primary" size="sm" onClick={handleSave} leftIcon={<Save className="h-4 w-4" />}>
          Save Configuration
        </Button>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Core Profile */}
        <Card>
          <CardHeader>
            <CardTitle>Organization & Identity</CardTitle>
            <CardDescription>Primary metadata and industry positioning</CardDescription>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Brand Workspace Name"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                required
              />
              <Input
                label="Industry Domain"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                required
              />
            </div>
            <Input
              label="Tagline / Positioning Statement"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              required
            />
          </CardContent>
        </Card>

        {/* Tone of Voice Guidelines */}
        <Card>
          <CardHeader>
            <CardTitle>Brand Voice & Tonal Guardrails</CardTitle>
            <CardDescription>
              Fed directly into Gemini LLM context for generative tone and style checks
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            <Textarea
              label="Tone Directives (One directive per line)"
              rows={4}
              value={toneGuidelines}
              onChange={(e) => setToneGuidelines(e.target.value)}
              placeholder="e.g. Empirical, architectural, and authoritative..."
            />
            <p className="text-[11px] text-slate-500">
              The AI Governance Engine evaluates creator drafts against these directives to detect tone drift.
            </p>
          </CardContent>
        </Card>

        {/* Escalation Policy */}
        <Card>
          <CardHeader>
            <CardTitle>Review & Escalation Policy</CardTitle>
            <CardDescription>
              Configures where high-risk claims and exception requests route
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Compliance Escalation Email"
                type="email"
                value={escalationEmail}
                onChange={(e) => setEscalationEmail(e.target.value)}
                required
              />
              <Select
                label="Target Sign-Off SLA"
                defaultValue="4h"
                options={[
                  { value: "1h", label: "1 Hour (Priority)" },
                  { value: "4h", label: "4 Hours (Standard)" },
                  { value: "24h", label: "24 Hours (Low Urgency)" },
                ]}
              />
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
};
