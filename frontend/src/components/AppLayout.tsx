import React, { useState } from "react";
import {
  ShieldCheck,
  LayoutDashboard,
  Sparkles,
  BookOpen,
  Sliders,
  Palette,
  FileCheck2,
  History,
  BarChart3,
  Settings as SettingsIcon,
  ChevronDown,
  Building2,
  UserCheck,
  Menu,
  X,
  ArrowLeft,
  ExternalLink,
  Info,
} from "lucide-react";
import { useWorkspace } from "../context/WorkspaceContext";
import { RouteId, UserRole } from "../types";
import { Badge } from "../design-system/Badge";

interface NavItem {
  id: RouteId;
  label: string;
  icon: React.ReactNode;
  roles: UserRole[];
  badge?: string;
}

export const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    activeBrand,
    setActiveBrand,
    activeRole,
    setActiveRole,
    currentRoute,
    setCurrentRoute,
    setIsAuthenticated,
    brands,
  } = useWorkspace();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [brandDropdownOpen, setBrandDropdownOpen] = useState(false);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);

  const navItems: NavItem[] = [
    {
      id: "overview",
      label: "Overview",
      icon: <LayoutDashboard className="h-4 w-4" />,
      roles: ["BRAND_MANAGER", "CONTENT_CREATOR", "COMPLIANCE_REVIEWER", "SUPER_ADMIN"],
    },
    {
      id: "creator-studio",
      label: "Creator Studio",
      icon: <Sparkles className="h-4 w-4" />,
      roles: ["BRAND_MANAGER", "CONTENT_CREATOR", "SUPER_ADMIN"],
      badge: "Live",
    },
    {
      id: "review-queue",
      label: "Review Queue",
      icon: <FileCheck2 className="h-4 w-4" />,
      roles: ["BRAND_MANAGER", "COMPLIANCE_REVIEWER", "SUPER_ADMIN"],
      badge: "1 Pending",
    },
    {
      id: "golden-facts",
      label: "Golden Facts",
      icon: <BookOpen className="h-4 w-4" />,
      roles: ["BRAND_MANAGER", "CONTENT_CREATOR", "SUPER_ADMIN"],
    },
    {
      id: "brand-rules",
      label: "Guardrails & Rules",
      icon: <Sliders className="h-4 w-4" />,
      roles: ["BRAND_MANAGER", "SUPER_ADMIN"],
    },
    {
      id: "visual-assets",
      label: "Visual Identity",
      icon: <Palette className="h-4 w-4" />,
      roles: ["BRAND_MANAGER", "SUPER_ADMIN"],
    },
    {
      id: "audit-history",
      label: "Audit History",
      icon: <History className="h-4 w-4" />,
      roles: ["BRAND_MANAGER", "CONTENT_CREATOR", "COMPLIANCE_REVIEWER", "SUPER_ADMIN"],
    },
    {
      id: "analytics",
      label: "Governance Analytics",
      icon: <BarChart3 className="h-4 w-4" />,
      roles: ["BRAND_MANAGER", "COMPLIANCE_REVIEWER", "SUPER_ADMIN"],
    },
    {
      id: "brand-setup",
      label: "Brand Profile",
      icon: <Building2 className="h-4 w-4" />,
      roles: ["BRAND_MANAGER", "SUPER_ADMIN"],
    },
    {
      id: "settings",
      label: "Workspace Settings",
      icon: <SettingsIcon className="h-4 w-4" />,
      roles: ["BRAND_MANAGER", "SUPER_ADMIN"],
    },
  ];

  const filteredNavItems = navItems.filter((item) => item.roles.includes(activeRole));

  const roleLabels: Record<UserRole, string> = {
    BRAND_MANAGER: "Brand Manager",
    CONTENT_CREATOR: "Content Creator",
    COMPLIANCE_REVIEWER: "Compliance Reviewer",
    SUPER_ADMIN: "Super Admin",
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans overflow-hidden">
      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex flex-col w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shrink-0">
        {/* Brand Platform Logo */}
        <div className="h-14 px-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center font-bold text-sm tracking-tighter">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div>
              <span className="font-semibold text-sm tracking-tight block">Inkloom</span>
              <span className="text-[10px] text-slate-500 font-medium -mt-1 block">Brand Governance</span>
            </div>
          </div>
          <Badge variant="neutral" size="sm">v1.0</Badge>
        </div>

        {/* Workspace Brand Selector */}
        <div className="p-3 border-b border-slate-100 dark:border-slate-800/80">
          <div className="relative">
            <button
              onClick={() => setBrandDropdownOpen(!brandDropdownOpen)}
              className="w-full flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition-colors"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span
                  className="h-3 w-3 rounded-full shrink-0"
                  style={{ backgroundColor: activeBrand.secondaryColor }}
                />
                <div className="truncate">
                  <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                    {activeBrand.name}
                  </div>
                  <div className="text-[10px] text-slate-500 truncate">{activeBrand.industry}</div>
                </div>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            </button>

            {brandDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-lg z-20 py-1">
                <div className="px-3 py-1 text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                  Switch Brand Tenant
                </div>
                {brands.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => {
                      setActiveBrand(b);
                      setBrandDropdownOpen(false);
                    }}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-xs text-left hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${
                      activeBrand.id === b.id ? "font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/20" : ""
                    }`}
                  >
                    <span
                      className="h-2.5 w-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: b.secondaryColor }}
                    />
                    <span className="truncate">{b.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          <div className="px-2 pb-1.5 text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
            Governance Navigation
          </div>
          {filteredNavItems.map((item) => {
            const isActive = currentRoute === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentRoute(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  isActive
                    ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-2xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60"
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <span className={isActive ? "text-white dark:text-slate-900" : "text-slate-400"}>
                    {item.icon}
                  </span>
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-sm font-semibold shrink-0 ${
                      isActive
                        ? "bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900"
                        : "bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom Role Preview & Exit Link */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
          {/* Role Preview Switcher */}
          <div className="relative">
            <button
              onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/70 text-left transition-colors"
            >
              <div className="flex items-center gap-2 min-w-0">
                <UserCheck className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                <div className="truncate">
                  <span className="text-[10px] text-slate-500 uppercase block font-semibold leading-tight">
                    Active Role
                  </span>
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate block">
                    {roleLabels[activeRole]}
                  </span>
                </div>
              </div>
              <ChevronDown className="h-3 w-3 text-slate-400 shrink-0" />
            </button>

            {roleDropdownOpen && (
              <div className="absolute bottom-full left-0 right-0 mb-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-lg z-20 py-1">
                <div className="px-3 py-1 text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                  Test Role Navigation
                </div>
                {(["BRAND_MANAGER", "CONTENT_CREATOR", "COMPLIANCE_REVIEWER"] as UserRole[]).map((r) => (
                  <button
                    key={r}
                    onClick={() => {
                      setActiveRole(r);
                      setRoleDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${
                      activeRole === r ? "font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50/40" : ""
                    }`}
                  >
                    {roleLabels[r]}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => setIsAuthenticated(false)}
            className="w-full flex items-center justify-center gap-2 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 py-1.5 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Public Site
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header Bar */}
        <header className="h-14 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-1.5 rounded-md text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Breadcrumb Path */}
            <div className="flex items-center gap-2 text-xs truncate">
              <span className="font-semibold text-slate-900 dark:text-slate-100">{activeBrand.name}</span>
              <span className="text-slate-400">/</span>
              <span className="text-slate-600 dark:text-slate-400 capitalize">
                {currentRoute.replace("-", " ")}
              </span>
            </div>
          </div>

          {/* Right Header Badges */}
          <div className="flex items-center gap-3">
            {/* Demo Mode Notice */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-[11px] font-medium text-amber-800 dark:text-amber-300">
              <Info className="h-3.5 w-3.5 text-amber-500" />
              <span>Demo Mode (Synthetic Ground Truth)</span>
            </div>

            <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />

            {/* Role indicator */}
            <Badge variant="brand" size="sm">
              {roleLabels[activeRole]}
            </Badge>
          </div>
        </header>

        {/* Workspace View Container */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-6xl mx-auto">{children}</div>
        </main>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-slate-900 dark:text-white" />
                  <span className="font-bold text-sm">Inkloom</span>
                </div>
                <button onClick={() => setMobileMenuOpen(false)}>
                  <X className="h-5 w-5 text-slate-500" />
                </button>
              </div>

              <nav className="mt-4 space-y-1">
                {filteredNavItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setCurrentRoute(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium ${
                      currentRoute === item.id
                        ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                        : "text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      {item.icon}
                      <span>{item.label}</span>
                    </div>
                  </button>
                ))}
              </nav>
            </div>

            <button
              onClick={() => {
                setIsAuthenticated(false);
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center justify-center gap-2 text-xs text-slate-500 py-2 border-t border-slate-200 dark:border-slate-800"
            >
              <ArrowLeft className="h-4 w-4" /> Exit Demo
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

