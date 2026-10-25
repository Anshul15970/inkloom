import React, { useState } from "react";
import {
  ShieldCheck,
  Sparkles,
  ArrowRight,
  BookOpen,
  Layers,
  FileCheck2,
  CheckCircle2,
  AlertTriangle,
  Building2,
  UserCheck,
  ChevronRight,
  Zap,
  Lock,
  Eye,
  Sliders,
} from "lucide-react";
import { useWorkspace } from "../context/WorkspaceContext";
import { Button } from "../design-system/Button";
import { Badge } from "../design-system/Badge";
import { Modal } from "../design-system/Modal";
import { Input } from "../design-system/FormControls";
import { useNotification } from "../context/NotificationContext";

export const LandingView: React.FC = () => {
  const { setIsAuthenticated, setCurrentRoute, setIsDemoMode, login, registerBrand } = useWorkspace();
  const { showToast } = useNotification();

  const [authModal, setAuthModal] = useState<"login" | "register" | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [emailError, setEmailError] = useState("");
  const [authError, setAuthError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLaunchDemo = () => {
    setIsDemoMode(true);
    setIsAuthenticated(true);
    setCurrentRoute("overview");
    showToast({
      type: "info",
      title: "Welcome to Inkloom Demo",
      message: "Exploring Nexus Cloud workspace with synthetic ground truth data.",
    });
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      setEmailError("Please enter a valid business email address.");
      return;
    }
    setEmailError("");
    setAuthError("");
    setIsLoading(true);

    try {
      if (authModal === "register") {
        const slug = companyName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
        await registerBrand({
          email,
          password,
          full_name: fullName,
          brand_name: companyName,
          brand_slug: slug || "my-brand",
        });
        showToast({
          type: "success",
          title: "Account Provisioned",
          message: "Organization workspace created. You are the brand owner.",
        });
      } else {
        await login({ email, password });
        showToast({
          type: "success",
          title: "Authenticated Successfully",
          message: "Signed in to your authorized brand workspace.",
        });
      }

      setAuthModal(null);
      setCurrentRoute("overview");
    } catch (err: any) {
      setAuthError(err.message || "Authentication failed. Please check credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-slate-900 selection:text-white dark:selection:bg-white dark:selection:text-slate-900">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center font-bold shadow-xs">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <span className="font-bold text-base tracking-tight block">Inkloom</span>
              <span className="text-[10px] text-slate-500 font-semibold tracking-wider uppercase block -mt-1">
                Brand Governance
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-xs font-medium text-slate-600 dark:text-slate-400">
            <a href="#how-it-works" className="hover:text-slate-900 dark:hover:text-slate-100 transition-colors">
              How it Works
            </a>
            <a href="#features" className="hover:text-slate-900 dark:hover:text-slate-100 transition-colors">
              Governance Engine
            </a>
            <a href="#solutions" className="hover:text-slate-900 dark:hover:text-slate-100 transition-colors">
              Brand vs Creator
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => setAuthModal("login")}>
              Sign In
            </Button>
            <Button variant="primary" size="sm" onClick={handleLaunchDemo} rightIcon={<ArrowRight className="h-3.5 w-3.5" />}>
              Enter Demo
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-16 pb-20 px-4 sm:px-6 border-b border-slate-200 dark:border-slate-800 bg-linear-to-b from-white to-slate-50/60 dark:from-slate-900 dark:to-slate-950">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300">
            <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
            <span className="font-semibold">Multi-Tenant Brand Governance Platform</span>
            <span className="text-slate-400">•</span>
            <span>RAG + Split Vision</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50 leading-[1.12]">
            Content velocity without <br className="hidden sm:inline" />
            <span className="text-indigo-600 dark:text-indigo-400">brand risk</span>.
          </h1>

          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Stop manual review bottlenecks. Inkloom audits marketing copy and visual assets in real time against approved <strong>Golden Facts</strong>, <strong>prohibited claims</strong>, and <strong>exact brand palettes</strong> directly inside creator workflows.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Button size="lg" variant="primary" onClick={handleLaunchDemo} rightIcon={<ArrowRight className="h-4 w-4" />}>
              Launch Live Workspace Demo
            </Button>
            <Button size="lg" variant="outline" onClick={() => setAuthModal("register")}>
              Create Brand Account
            </Button>
          </div>

          {/* Value Pillars */}
          <div className="pt-10 grid grid-cols-2 md:grid-cols-4 gap-4 text-left max-w-3xl mx-auto">
            <div className="p-3.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
              <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">Grounded Citations</div>
              <p className="text-[11px] text-slate-500 mt-0.5">Zero hallucinated policy flags. Every issue cites official ground truth.</p>
            </div>
            <div className="p-3.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
              <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">Split Vision CV</div>
              <p className="text-[11px] text-slate-500 mt-0.5">OpenCV exact hex math paired with Gemini multimodal aesthetic judging.</p>
            </div>
            <div className="p-3.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
              <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">Tenant Isolation</div>
              <p className="text-[11px] text-slate-500 mt-0.5">Brand-partitioned pgvector vector stores. Strict enterprise boundaries.</p>
            </div>
            <div className="p-3.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
              <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">Chrome MV3 Ready</div>
              <p className="text-[11px] text-slate-500 mt-0.5">Audits inside LinkedIn, WordPress, and Webflow without context switching.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Live Inspection Sample */}
      <section className="py-16 px-4 sm:px-6 max-w-5xl mx-auto">
        <div className="text-center mb-10 space-y-2">
          <Badge variant="brand">Interactive Demonstration</Badge>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
            See how Inkloom catches off-brand violations
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 max-w-xl mx-auto">
            Creators receive prescriptive, 1-click rewrites with citations to official guidelines instead of punitive rejections.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xs">
          {/* Draft Column */}
          <div className="md:col-span-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100">Active Creator Draft</span>
                <Badge variant="neutral" size="sm">LinkedIn Channel</Badge>
              </div>
              <span className="text-[11px] text-slate-400">Target: Nexus Cloud</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-mono">
              Nexus Cloud delivers{" "}
              <span className="bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 px-1 py-0.5 rounded border border-rose-300 dark:border-rose-800">
                guaranteed 100% uptime
              </span>{" "}
              with our{" "}
              <span className="bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 px-1 py-0.5 rounded border border-amber-300 dark:border-amber-800">
                unbeatable 30% discount
              </span>{" "}
              this quarter. It is the cheapest cloud infrastructure available!
            </div>

            <div className="text-[11px] text-slate-500">
              ⚡ Evaluated against 14 Golden Facts and 8 brand guardrails in 180ms.
            </div>
          </div>

          {/* Findings Column */}
          <div className="md:col-span-6 space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100">Inkloom Governance Findings</span>
              <Badge variant="warning" size="sm">Score: 54 / 100</Badge>
            </div>

            {/* Finding Item 1 */}
            <div className="p-3.5 rounded-lg border border-rose-200 dark:border-rose-900/60 bg-rose-50/40 dark:bg-rose-950/20 text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-rose-700 dark:text-rose-300 flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" /> FACTUAL_INACCURACY
                </span>
                <Badge variant="danger" size="sm">Critical</Badge>
              </div>
              <p className="text-slate-600 dark:text-slate-300 text-[11px]">
                Contradicts verified SLA agreement. Nexus commitment is 99.99%, not 100%.
              </p>
              <div className="text-[10px] text-slate-500 font-mono">
                <strong>Source:</strong> Enterprise SLA Agreement v2026.1
              </div>
              <div className="pt-1.5 flex items-center justify-between">
                <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
                  → "guaranteed 99.99% multi-region uptime"
                </span>
                <Badge variant="success" size="sm">1-Click Rewrite</Badge>
              </div>
            </div>

            {/* Finding Item 2 */}
            <div className="p-3.5 rounded-lg border border-amber-200 dark:border-amber-900/60 bg-amber-50/40 dark:bg-amber-950/20 text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" /> PROHIBITED_CLAIM
                </span>
                <Badge variant="warning" size="sm">Warning</Badge>
              </div>
              <p className="text-slate-600 dark:text-slate-300 text-[11px]">
                Superlative claim "cheapest" violates brand guardrail on competitive substantiation.
              </p>
              <div className="text-[10px] text-slate-500 font-mono">
                <strong>Source:</strong> Brand Guardrail #2 (Superlatives)
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" className="py-20 px-4 sm:px-6 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="text-center space-y-2">
            <Badge variant="neutral">The Architecture</Badge>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Three-stage brand governance loop
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 max-w-xl mx-auto">
              How Inkloom connects brand policy authoring with real-time creator enforcement and executive oversight.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 space-y-3">
              <div className="h-9 w-9 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-sm">
                01
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Ingest Golden Facts & Policies
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Brand managers upload spreadsheets of verified statistics, pricing matrices, SLAs, and guardrails. Vector embeddings are generated into brand-isolated partitions.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 space-y-3">
              <div className="h-9 w-9 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-sm">
                02
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                In-Context Creator Audits
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Creators draft in the Creator Studio or via Chrome Extension. The dual-engine checks facts, tone, and visual hex compliance, returning explanations and 1-click fixes.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 space-y-3">
              <div className="h-9 w-9 rounded-lg bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-sm">
                03
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Human Escalation & Analytics
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                High-risk policy deviations automatically route to authorized brand reviewers for sign-off. Compliance trend analytics identify ambiguous rules needing clarification.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Role Use Cases */}
      <section id="solutions" className="py-20 px-4 sm:px-6 max-w-5xl mx-auto space-y-12">
        <div className="text-center space-y-2">
          <Badge variant="brand">Role-Aware Workflows</Badge>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Built for compliance leaders and fast-moving creators
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold">For Brand Managers & Legal</h3>
                <span className="text-[11px] text-slate-500">Centralized governance without manual review burnout</span>
              </div>
            </div>
            <ul className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>Upload single-source-of-truth spreadsheets (CSV/Excel) and brand guardrails.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>Inspect recurring compliance violations and optimize ambiguous guidelines.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>Manage escalated high-risk claims with structured audit notes.</span>
              </li>
            </ul>
          </div>

          <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold">For Content Creators & Marketers</h3>
                <span className="text-[11px] text-slate-500">Immediate feedback directly in active publishing tools</span>
              </div>
            </div>
            <ul className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>Instant pre-publication checks inside WordPress, LinkedIn, or Webflow.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>Replace vague rejections with 1-click prescriptive rewrites that preserve tone.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>Submit exceptions directly to brand reviewers without messy email chains.</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Final CTA Banner */}
      <section className="py-20 px-4 sm:px-6 bg-slate-900 dark:bg-slate-950 text-white text-center border-t border-slate-800">
        <div className="max-w-3xl mx-auto space-y-6">
          <Badge variant="brand">Enterprise Brand Protection</Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Ready to experience frictionless brand governance?
          </h2>
          <p className="text-slate-400 text-sm max-w-xl mx-auto">
            Explore the multi-tenant workspace with pre-populated ground truth data for Nexus Cloud, Aura Health, and Veritas Financial.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button size="lg" variant="primary" onClick={handleLaunchDemo} rightIcon={<ArrowRight className="h-4 w-4" />}>
              Enter Live Demo Workspace
            </Button>
            <Button size="lg" variant="outline" onClick={() => setAuthModal("register")}>
              Register New Brand
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 sm:px-6 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-slate-700 dark:text-slate-300" />
            <span className="font-semibold text-slate-700 dark:text-slate-300">Inkloom Platform</span>
            <span>• Multi-Tenant Brand Governance</span>
          </div>
          <div className="flex items-center gap-4">
            <span>FastAPI Backend</span>
            <span>PostgreSQL + pgvector</span>
            <span>OpenCV Vision</span>
            <span>Gemini LLM</span>
          </div>
        </div>
      </footer>

      {/* Authentication Modal */}
      <Modal
        isOpen={authModal !== null}
        onClose={() => setAuthModal(null)}
        title={authModal === "register" ? "Create Brand Workspace Account" : "Sign In to Brand Workspace"}
        description={
          authModal === "register"
            ? "Register your enterprise brand to manage private Golden Facts and review policies."
            : "Enter your credentials to access your authorized brand workspace."
        }
      >
        <form onSubmit={handleAuthSubmit} className="space-y-4">
          {authError && (
            <div className="p-3 text-xs rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-400">
              {authError}
            </div>
          )}

          {authModal === "register" && (
            <>
              <Input
                label="Full Name"
                placeholder="Jane Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
              <Input
                label="Company / Brand Name"
                placeholder="Acme Technologies"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                required
              />
            </>
          )}

          <Input
            label="Work Email"
            type="email"
            placeholder="jane@company.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setEmailError("");
            }}
            error={emailError}
            required
          />

          <Input
            label="Password"
            type="password"
            placeholder="Min. 8 chars, Aa1"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <div className="pt-2 flex items-center justify-between">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setAuthError("");
                setAuthModal(authModal === "register" ? "login" : "register");
              }}
            >
              {authModal === "register" ? "Already have an account? Sign in" : "Need an account? Register"}
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isLoading}>
              {authModal === "register" ? "Create Account" : "Sign In"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

