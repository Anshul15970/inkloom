import React, { useState } from "react";
import {
  BookOpen,
  Plus,
  Upload,
  Search,
  CheckCircle2,
  Filter,
  FileSpreadsheet,
  Layers,
  ArrowUpRight,
} from "lucide-react";
import { useWorkspace } from "../context/WorkspaceContext";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../design-system/Card";
import { Button } from "../design-system/Button";
import { Badge } from "../design-system/Badge";
import { Input, Textarea, Select } from "../design-system/FormControls";
import { Modal } from "../design-system/Modal";
import { EmptyState } from "../design-system/EmptyState";
import { useNotification } from "../context/NotificationContext";
import { MOCK_GOLDEN_FACTS } from "../data/mockData";
import { GoldenFact } from "../types";

export const GoldenFactsView: React.FC = () => {
  const { activeBrand } = useWorkspace();
  const { showToast } = useNotification();

  const [facts, setFacts] = useState<GoldenFact[]>(MOCK_GOLDEN_FACTS);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  // Form State
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState<GoldenFact["category"]>("SLA & Performance");
  const [newClaim, setNewClaim] = useState("");
  const [newSource, setNewSource] = useState("");

  const categories = ["All", "SLA & Performance", "Pricing & Plans", "Security & Privacy", "Product Specs", "Legal & Disclaimers"];

  const filteredFacts = facts.filter((fact) => {
    const matchesCategory = selectedCategory === "All" || fact.category === selectedCategory;
    const matchesSearch =
      fact.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fact.claimStatement.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fact.sourceDocument.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleAddFact = (e: React.FormEvent) => {
    e.preventDefault();
    const created: GoldenFact = {
      id: `fact-${Date.now()}`,
      brandId: activeBrand.id,
      category: newCategory,
      title: newTitle,
      claimStatement: newClaim,
      sourceDocument: newSource,
      lastVerified: new Date().toISOString().split("T")[0],
      status: "INDEXED",
      vectorDimensions: 768,
    };

    setFacts([created, ...facts]);
    setIsAddModalOpen(false);
    setNewTitle("");
    setNewClaim("");
    setNewSource("");

    showToast({
      type: "success",
      title: "Golden Fact Indexed",
      message: `Generated 768-dim embedding into pgvector partition for ${activeBrand.name}.`,
    });
  };

  const handleSimulateCSVUpload = () => {
    setIsUploadModalOpen(false);
    showToast({
      type: "success",
      title: "Spreadsheet Ingested",
      message: "Parsed 12 facts from enterprise_spec_v2.xlsx. Vector index synchronized.",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-indigo-500" />
            Golden Facts Knowledge Base
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Verified ground-truth claims indexed in pgvector for <strong>{activeBrand.name}</strong>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsUploadModalOpen(true)}
            leftIcon={<Upload className="h-4 w-4" />}
          >
            Import CSV / Excel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsAddModalOpen(true)}
            leftIcon={<Plus className="h-4 w-4" />}
          >
            Add Golden Fact
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card>
        <CardContent className="p-4 flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Search Input */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search facts, claims, or source docs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-400"
            />
          </div>

          {/* Category Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`text-xs px-2.5 py-1 rounded-md whitespace-nowrap transition-colors ${
                  selectedCategory === cat
                    ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-semibold"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Facts Table */}
      <Card>
        <CardContent className="p-0">
          {filteredFacts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    <th className="py-3 px-4">Title & Category</th>
                    <th className="py-3 px-4">Approved Ground Truth Claim</th>
                    <th className="py-3 px-4">Source Document</th>
                    <th className="py-3 px-4">Vector Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {filteredFacts.map((fact) => (
                    <tr key={fact.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900 dark:text-slate-100">
                          {fact.title}
                        </div>
                        <span className="text-[10px] text-slate-500">{fact.category}</span>
                      </td>
                      <td className="py-3.5 px-4 max-w-md">
                        <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                          {fact.claimStatement}
                        </p>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">
                        {fact.sourceDocument}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <Badge variant="success" size="sm" dot>
                          Indexed (768d)
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              icon={<BookOpen className="h-6 w-6" />}
              title="No Golden Facts Found"
              description="No factual ground-truth records match your search criteria."
              action={
                <Button variant="primary" size="sm" onClick={() => setIsAddModalOpen(true)}>
                  Create New Golden Fact
                </Button>
              }
            />
          )}
        </CardContent>
      </Card>

      {/* Add Fact Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Author Approved Golden Fact"
        description="Add a single source of truth factual statement for AI claim verification."
      >
        <form onSubmit={handleAddFact} className="space-y-4">
          <Input
            label="Fact Title"
            placeholder="e.g., Enterprise Uptime SLA"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            required
          />

          <Select
            label="Category"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value as any)}
            options={[
              { value: "SLA & Performance", label: "SLA & Performance" },
              { value: "Pricing & Plans", label: "Pricing & Plans" },
              { value: "Security & Privacy", label: "Security & Privacy" },
              { value: "Product Specs", label: "Product Specs" },
              { value: "Legal & Disclaimers", label: "Legal & Disclaimers" },
            ]}
          />

          <Textarea
            label="Approved Ground Truth Claim Statement"
            placeholder="State the factual ground truth exactly as legally certified..."
            value={newClaim}
            onChange={(e) => setNewClaim(e.target.value)}
            required
            rows={4}
          />

          <Input
            label="Official Source Document / Guideline"
            placeholder="e.g., Master Services Agreement v4.2"
            value={newSource}
            onChange={(e) => setNewSource(e.target.value)}
            required
          />

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="ghost" size="sm" type="button" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Index Golden Fact
            </Button>
          </div>
        </form>
      </Modal>

      {/* Upload Spreadsheet Modal */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        title="Ingest Golden Facts via Spreadsheet"
        description="Upload a CSV or Excel (.xlsx) file containing bulk approved brand claims."
      >
        <div className="space-y-4">
          <div
            onClick={handleSimulateCSVUpload}
            className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-8 text-center hover:bg-slate-50/50 dark:hover:bg-slate-900/50 cursor-pointer transition-colors"
          >
            <FileSpreadsheet className="h-8 w-8 text-indigo-500 mx-auto mb-2" />
            <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100">
              Click to select CSV or Excel sheet
            </h4>
            <p className="text-[11px] text-slate-500 mt-1">
              Columns: category, title, claim_statement, source_document
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="ghost" size="sm" onClick={() => setIsUploadModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleSimulateCSVUpload}>
              Simulate Import
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

