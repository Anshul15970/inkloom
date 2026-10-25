export type UserRole = "BRAND_MANAGER" | "CONTENT_CREATOR" | "COMPLIANCE_REVIEWER" | "SUPER_ADMIN";

export type RouteId =
  | "overview"
  | "brand-setup"
  | "golden-facts"
  | "brand-rules"
  | "visual-assets"
  | "creator-studio"
  | "audit-history"
  | "review-queue"
  | "analytics"
  | "settings";

export interface Brand {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  industry: string;
  primaryColor: string;
  secondaryColor: string;
  logoUrl?: string;
  toneGuidelines: string[];
  activeRulesCount: number;
  goldenFactsCount: number;
}

export interface GoldenFact {
  id: string;
  brandId: string;
  category: "Pricing & Plans" | "SLA & Performance" | "Legal & Disclaimers" | "Product Specs" | "Security & Privacy";
  title: string;
  claimStatement: string;
  sourceDocument: string;
  lastVerified: string;
  status: "INDEXED" | "PENDING_SYNC" | "OUTDATED";
  vectorDimensions?: number;
}

export interface BrandRule {
  id: string;
  brandId: string;
  ruleType: "PROHIBITED_CLAIM" | "MANDATORY_DISCLOSURE" | "TONE_OF_VOICE" | "TERMINOLOGY" | "VISUAL_IDENTITY";
  name: string;
  patternOrInstruction: string;
  severity: "CRITICAL" | "WARNING" | "SUGGESTION";
  explanation: string;
  channels: string[];
  isActive: boolean;
}

export interface VisualAsset {
  id: string;
  brandId: string;
  name: string;
  assetType: "LOGO_PRIMARY" | "LOGO_MONOCHROME" | "COLOR_SWATCH" | "REFERENCE_IMAGE";
  previewUrl: string;
  hexCode?: string;
  aspectRatio?: string;
  clearanceMarginPx?: number;
  updatedAt: string;
}

export interface AuditFinding {
  id: string;
  findingType: "FACTUAL_INACCURACY" | "PROHIBITED_TERM" | "PROHIBITED_CLAIM" | "MISSING_DISCLOSURE" | "TONE_DEVIATION" | "COLOR_MISMATCH" | "ASPECT_RATIO";
  severity: "CRITICAL" | "WARNING" | "SUGGESTION";
  originalSnippet: string;
  explanation: string;
  citationReference: string;
  suggestedFix: string;
  isApplied?: boolean;
}

export interface AuditRecord {
  id: string;
  brandId: string;
  timestamp: string;
  channel: "linkedin" | "twitter" | "blog" | "press_release" | "email";
  contentType: "TEXT" | "IMAGE" | "MULTIMODAL";
  contentSnippet: string;
  overallScore: number;
  status: "PASSED" | "WARNINGS_RESOLVABLE" | "NEEDS_REVIEW" | "REJECTED";
  summary: string;
  findings: AuditFinding[];
  authorName: string;
}

export interface ReviewQueueItem {
  id: string;
  brandId: string;
  auditId: string;
  creatorName: string;
  creatorNotes: string;
  submittedAt: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CHANGES_REQUESTED";
  reviewerComments?: string;
  contentSnippet: string;
  channel: string;
  overallScore: number;
  findingsCount: number;
}
