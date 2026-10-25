import React, { useState } from "react";
import {
  Palette,
  Upload,
  Copy,
  Check,
  Image as ImageIcon,
  Crop,
  Layers,
  Sparkles,
} from "lucide-react";
import { useWorkspace } from "../context/WorkspaceContext";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../design-system/Card";
import { Button } from "../design-system/Button";
import { Badge } from "../design-system/Badge";
import { useNotification } from "../context/NotificationContext";
import { MOCK_VISUAL_ASSETS } from "../data/mockData";
import { VisualAsset } from "../types";

export const VisualAssetsView: React.FC = () => {
  const { activeBrand } = useWorkspace();
  const { showToast } = useNotification();

  const [assets, setAssets] = useState<VisualAsset[]>(MOCK_VISUAL_ASSETS);
  const [copiedHex, setCopiedHex] = useState<string | null>(null);

  const colorSwatches = assets.filter((a) => a.assetType === "COLOR_SWATCH");
  const logos = assets.filter((a) => a.assetType.startsWith("LOGO"));

  const handleCopyHex = (hex: string) => {
    navigator.clipboard.writeText(hex);
    setCopiedHex(hex);
    showToast({
      type: "info",
      title: "Color Copied",
      message: `${hex} copied to clipboard for design tools.`,
    });
    setTimeout(() => setCopiedHex(null), 2000);
  };

  const handleSimulateUpload = () => {
    showToast({
      type: "success",
      title: "Asset Analyzed (OpenCV)",
      message: "Computed aspect ratio 1.91:1. Extracted primary hex #0F172A. Added to active palette.",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Palette className="h-5 w-5 text-indigo-500" />
            Visual Identity & Brand Assets
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Deterministic color swatches and logo boundaries for <strong>{activeBrand.name}</strong>
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={handleSimulateUpload}
          leftIcon={<Upload className="h-4 w-4" />}
        >
          Upload Brand Asset
        </Button>
      </div>

      {/* Approved Color Swatches */}
      <Card>
        <CardHeader>
          <CardTitle>Approved Hex Palette</CardTitle>
          <CardDescription>
            OpenCV extracts dominant colors from uploads and flags deviations where CIELAB ΔE &gt; 25.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {colorSwatches.map((swatch) => (
              <div
                key={swatch.id}
                className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 space-y-3"
              >
                <div
                  className="h-20 w-full rounded-lg shadow-inner flex items-end justify-end p-2"
                  style={{ backgroundColor: swatch.hexCode }}
                >
                  <button
                    onClick={() => handleCopyHex(swatch.hexCode || "")}
                    className="p-1 rounded bg-black/40 hover:bg-black/60 text-white backdrop-blur-xs transition-colors"
                    title="Copy hex code"
                  >
                    {copiedHex === swatch.hexCode ? (
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
                <div>
                  <div className="font-semibold text-xs text-slate-900 dark:text-slate-100">
                    {swatch.name}
                  </div>
                  <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                    {swatch.hexCode}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Approved Logo Assets & Clearance Guidelines */}
      <Card>
        <CardHeader>
          <CardTitle>Logo Templates & Clear Space Rules</CardTitle>
          <CardDescription>
            Template matching algorithms verify safe margins and aspect ratio integrity.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {logos.map((logo) => (
              <div
                key={logo.id}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 flex items-start gap-4"
              >
                <div className="h-16 w-24 rounded-lg bg-slate-900 flex items-center justify-center text-white shrink-0">
                  <span className="font-bold text-xs tracking-tight">NEXUS</span>
                </div>
                <div className="space-y-1">
                  <div className="font-semibold text-xs text-slate-900 dark:text-slate-100">
                    {logo.name}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Target Ratio: <strong>{logo.aspectRatio}</strong>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Minimum Clearance Zone: <strong>{logo.clearanceMarginPx}px</strong>
                  </div>
                  <Badge variant="success" size="sm" dot>
                    Active Template
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Channel Specifications Reference */}
      <Card>
        <CardHeader>
          <CardTitle>Channel Aspect Ratio Specifications</CardTitle>
          <CardDescription>
            Enforced during creative asset pre-publication evaluations.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <span className="text-slate-400 block font-semibold text-[10px] uppercase">LinkedIn Feed</span>
              <strong className="text-slate-900 dark:text-slate-100 text-sm">1.91:1</strong>
              <span className="text-[11px] text-slate-500 block mt-0.5">1200 x 627 px</span>
            </div>
            <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <span className="text-slate-400 block font-semibold text-[10px] uppercase">X / Twitter</span>
              <strong className="text-slate-900 dark:text-slate-100 text-sm">16:9</strong>
              <span className="text-[11px] text-slate-500 block mt-0.5">1200 x 675 px</span>
            </div>
            <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <span className="text-slate-400 block font-semibold text-[10px] uppercase">Instagram Square</span>
              <strong className="text-slate-900 dark:text-slate-100 text-sm">1:1</strong>
              <span className="text-[11px] text-slate-500 block mt-0.5">1080 x 1080 px</span>
            </div>
            <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <span className="text-slate-400 block font-semibold text-[10px] uppercase">Blog / Webflow</span>
              <strong className="text-slate-900 dark:text-slate-100 text-sm">16:9 / 2:1</strong>
              <span className="text-[11px] text-slate-500 block mt-0.5">High Res Hero</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

