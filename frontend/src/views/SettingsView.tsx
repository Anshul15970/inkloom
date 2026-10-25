import React, { useState } from "react";
import {
  Settings,
  Users,
  Key,
  Copy,
  Check,
  Shield,
  Plus,
  RefreshCw,
  Cpu,
} from "lucide-react";
import { useWorkspace } from "../context/WorkspaceContext";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../design-system/Card";
import { Button } from "../design-system/Button";
import { Badge } from "../design-system/Badge";
import { Input, Select } from "../design-system/FormControls";
import { Modal } from "../design-system/Modal";
import { useNotification } from "../context/NotificationContext";

export const SettingsView: React.FC = () => {
  const { activeBrand } = useWorkspace();
  const { showToast } = useNotification();

  const [copiedToken, setCopiedToken] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("CONTENT_CREATOR");

  const [members, setMembers] = useState([
    { id: "m-1", name: "David Vance", email: "david@nexuscloud.io", role: "BRAND_MANAGER", status: "Active" },
    { id: "m-2", name: "Sarah Chen", email: "sarah.c@nexuscloud.io", role: "CONTENT_CREATOR", status: "Active" },
    { id: "m-3", name: "Marcus Sterling", email: "m.sterling@legal.nexuscloud.io", role: "COMPLIANCE_REVIEWER", status: "Active" },
  ]);

  const handleCopyToken = () => {
    navigator.clipboard.writeText("inkloom_pat_live_9f82d1b7c4a30e8f");
    setCopiedToken(true);
    showToast({
      type: "info",
      title: "Extension Token Copied",
      message: "Personal Access Token copied to clipboard for Chrome MV3 Extension.",
    });
    setTimeout(() => setCopiedToken(false), 2000);
  };

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    setMembers([
      ...members,
      {
        id: `m-${Date.now()}`,
        name: inviteEmail.split("@")[0],
        email: inviteEmail,
        role: inviteRole,
        status: "Invited",
      },
    ]);
    setIsInviteModalOpen(false);
    setInviteEmail("");
    showToast({
      type: "success",
      title: "Invitation Dispatched",
      message: `Invited ${inviteEmail} as ${inviteRole} to ${activeBrand.name}.`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Settings className="h-5 w-5 text-indigo-500" />
          Workspace Settings & Integrations
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Manage access controls, API keys, and Chrome Extension connection for <strong>{activeBrand.name}</strong>
        </p>
      </div>

      {/* Chrome Extension & API Keys */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-4 w-4 text-indigo-500" />
            Chrome Extension (Manifest V3) Integration
          </CardTitle>
          <CardDescription>
            Authenticate your browser extension to evaluate drafts directly inside WordPress, LinkedIn, or Webflow.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-5 space-y-4 text-xs">
          <div>
            <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1.5">
              Personal Access Token
            </label>
            <div className="flex items-center gap-2">
              <input
                type="password"
                readOnly
                value="inkloom_pat_live_9f82d1b7c4a30e8f"
                className="w-full max-w-md font-mono text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2 text-slate-700 dark:text-slate-300 select-all"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyToken}
                leftIcon={copiedToken ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
              >
                {copiedToken ? "Copied" : "Copy Token"}
              </Button>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span>Backend Gateway: <strong>http://localhost:8000/api/v1</strong></span>
            </div>
            <Badge variant="success" size="sm">Operational</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Team Members & Roles */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-4 w-4 text-indigo-500" />
              Authorized Workspace Members
            </CardTitle>
            <CardDescription>Role-based access control for this brand tenant</CardDescription>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsInviteModalOpen(true)}
            leftIcon={<Plus className="h-4 w-4" />}
          >
            Invite Member
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  <th className="py-3 px-4">Member</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Assigned Role</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {members.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-slate-100">
                      {m.name}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">{m.email}</td>
                    <td className="py-3.5 px-4">
                      <Badge variant="brand" size="sm">
                        {m.role.replace("_", " ")}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Badge variant="neutral" size="sm">
                        {m.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Infrastructure Telemetry */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cpu className="h-4 w-4 text-indigo-500" />
            Infrastructure Engine Specifications
          </CardTitle>
          <CardDescription>Decoupled multi-tenant governance topology</CardDescription>
        </CardHeader>
        <CardContent className="p-5 text-xs text-slate-600 dark:text-slate-400 space-y-2">
          <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800">
            <span>Semantic Vector Database</span>
            <span className="font-mono text-slate-900 dark:text-slate-100 font-semibold">PostgreSQL 18 + pgvector (768d HNSW)</span>
          </div>
          <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800">
            <span>Deterministic Visual Engine</span>
            <span className="font-mono text-slate-900 dark:text-slate-100 font-semibold">OpenCV 4.10 + Pillow (CIELAB ΔE &lt; 25)</span>
          </div>
          <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800">
            <span>LLM Governance Provider</span>
            <span className="font-mono text-slate-900 dark:text-slate-100 font-semibold">Gemini 2.5 Flash via Google GenAI SDK</span>
          </div>
          <div className="flex items-center justify-between py-1">
            <span>Multi-Tenant Boundary</span>
            <span className="font-mono text-slate-900 dark:text-slate-100 font-semibold">Logical Isolation (Strict brand_id foreign keys & RLS)</span>
          </div>
        </CardContent>
      </Card>

      {/* Invite Modal */}
      <Modal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        title="Invite Brand Workspace Member"
        description="Grant a team member access to create, audit, or review content for this brand."
      >
        <form onSubmit={handleInvite} className="space-y-4">
          <Input
            label="Work Email"
            type="email"
            placeholder="colleague@nexuscloud.io"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            required
          />

          <Select
            label="Assigned Role"
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value)}
            options={[
              { value: "CONTENT_CREATOR", label: "Content Creator (Studio & Extension Audits)" },
              { value: "COMPLIANCE_REVIEWER", label: "Compliance Reviewer (Queue Approvals)" },
              { value: "BRAND_MANAGER", label: "Brand Manager (Full Workspace Configuration)" },
            ]}
          />

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="ghost" size="sm" type="button" onClick={() => setIsInviteModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Send Invite
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

