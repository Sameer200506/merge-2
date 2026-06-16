"use client";

import { useState, useRef } from "react";
import { X, Upload, Check, AlertCircle, FileText, ChevronRight, CheckCircle2 } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import type { LeadStatus, LeadSource } from "@/types";
import { useLeadsStore } from "@/stores/leads.store";

interface ImportLeadsDialogProps {
  open: boolean;
  onClose: () => void;
}

type Step = "upload" | "map" | "preview" | "done";

interface ParsedRow {
  [key: string]: string;
}

interface ColumnMap {
  name: string;
  contactName: string;
  email: string;
  phone: string;
  value: string;
  source: string;
  status: string;
  notes: string;
}

export function ImportLeadsDialog({ open, onClose }: ImportLeadsDialogProps) {
  const importLeads = useLeadsStore((state) => state.importLeads);
  const [step, setStep] = useState<Step>("upload");
  const [fileName, setFileName] = useState("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [columnMap, setColumnMap] = useState<ColumnMap>({
    name: "",
    contactName: "",
    email: "",
    phone: "",
    value: "",
    source: "",
    status: "",
    notes: "",
  });
  const [importCount, setImportCount] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const parseCSV = (text: string) => {
    const lines = text.split(/\r?\n/);
    if (lines.length === 0) return;

    // Split headers
    const headerLine = lines[0];
    const parsedHeaders = headerLine.split(",").map((h) => h.trim().replace(/^["']|["']$/g, ""));
    setHeaders(parsedHeaders);

    const parsedRows: ParsedRow[] = [];
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      
      // Handle commas inside quotes
      const values: string[] = [];
      let matches = lines[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
      if (!matches) {
        // Fallback split
        values.push(...lines[i].split(",").map((v) => v.trim()));
      } else {
        values.push(...matches.map((v) => v.trim().replace(/^["']|["']$/g, "")));
      }

      const row: ParsedRow = {};
      parsedHeaders.forEach((header, index) => {
        row[header] = values[index] || "";
      });
      parsedRows.push(row);
    }

    setRows(parsedRows);

    // Auto-map headers
    const newMap = { ...columnMap };
    parsedHeaders.forEach((h) => {
      const lower = h.toLowerCase();
      if (lower.includes("company") || lower.includes("name") && !lower.includes("contact") && !lower.includes("person")) {
        newMap.name = h;
      } else if (lower.includes("contact") || lower.includes("person") || lower.includes("lead")) {
        newMap.contactName = h;
      } else if (lower.includes("email") || lower.includes("mail")) {
        newMap.email = h;
      } else if (lower.includes("phone") || lower.includes("mobile") || lower.includes("tel")) {
        newMap.phone = h;
      } else if (lower.includes("val") || lower.includes("worth") || lower.includes("amount") || lower.includes("deal")) {
        newMap.value = h;
      } else if (lower.includes("source") || lower.includes("origin")) {
        newMap.source = h;
      } else if (lower.includes("status") || lower.includes("stage")) {
        newMap.status = h;
      } else if (lower.includes("note") || lower.includes("desc") || lower.includes("comment")) {
        newMap.notes = h;
      }
    });

    // Fallbacks if no match found
    if (!newMap.name) newMap.name = parsedHeaders[0] || "";
    if (!newMap.contactName) newMap.contactName = parsedHeaders[1] || "";
    if (!newMap.email) newMap.email = parsedHeaders[2] || "";

    setColumnMap(newMap);
    setStep("map");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      parseCSV(text);
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    if (!file.name.endsWith(".csv") && !file.name.endsWith(".txt")) {
      toast.error("Please upload a CSV or TXT file");
      return;
    }
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      parseCSV(text);
    };
    reader.readAsText(file);
  };

  const handleMapSubmit = () => {
    if (!columnMap.name) {
      toast.error("Please map the 'Company Name' column");
      return;
    }
    if (!columnMap.contactName) {
      toast.error("Please map the 'Contact Name' column");
      return;
    }
    if (!columnMap.email) {
      toast.error("Please map the 'Email' column");
      return;
    }
    setStep("preview");
  };

  const getMappedLeads = () => {
    return rows.map((row) => {
      // Parse status safely
      let status: LeadStatus = "new";
      if (columnMap.status && row[columnMap.status]) {
        const val = row[columnMap.status].toLowerCase();
        if (val.includes("new")) status = "new";
        else if (val.includes("contact")) status = "contacted";
        else if (val.includes("qualif")) status = "qualified";
        else if (val.includes("nurtur")) status = "nurturing";
        else if (val.includes("unqual")) status = "unqualified";
      }

      // Parse source safely
      let source: LeadSource = "web";
      if (columnMap.source && row[columnMap.source]) {
        const val = row[columnMap.source].toLowerCase();
        if (val.includes("web")) source = "web";
        else if (val.includes("refer")) source = "referral";
        else if (val.includes("cold") || val.includes("outreach")) source = "cold_outreach";
        else if (val.includes("linkedin")) source = "linkedin";
        else if (val.includes("partner")) source = "partner";
        else source = "other";
      }

      const valNum = columnMap.value ? parseFloat(row[columnMap.value].replace(/[^0-9.]/g, "")) : 0;

      return {
        name: row[columnMap.name] || "Unknown Company",
        contactName: row[columnMap.contactName] || "Unknown Contact",
        email: row[columnMap.email] || "no-email@example.com",
        phone: columnMap.phone ? row[columnMap.phone] : undefined,
        value: isNaN(valNum) ? 0 : valNum,
        source,
        status,
        notes: columnMap.notes ? row[columnMap.notes] : undefined,
      };
    });
  };

  const executeImport = async () => {
    const leadsToImport = getMappedLeads();
    importLeads(leadsToImport);
    setImportCount(leadsToImport.length);
    setStep("done");
    toast.success(`Successfully imported ${leadsToImport.length} leads!`);
  };

  const handleReset = () => {
    setStep("upload");
    setFileName("");
    setHeaders([]);
    setRows([]);
    setColumnMap({
      name: "",
      contactName: "",
      email: "",
      phone: "",
      value: "",
      source: "",
      status: "",
      notes: "",
    });
  };

  const triggerUpload = () => {
    fileInputRef.current?.click();
  };

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 animate-fade-in"
        onClick={onClose}
      />
      <div
        className={cn(
          "fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50",
          "w-full max-w-xl bg-[var(--background)] border border-[var(--border)]",
          "rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-scale-in"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <Upload size={14} className="text-white" />
            </div>
            <div>
              <h3 className="text-[14.5px] font-semibold text-[var(--foreground)]">Import Leads</h3>
              <p className="text-[12px] text-[var(--foreground-muted)]">Upload leads list from CSV / Excel sheet</p>
            </div>
          </div>
          <button onClick={onClose} className="sos-btn sos-btn-ghost p-1.5" aria-label="Close">
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          
          {/* Step 1: Upload */}
          {step === "upload" && (
            <div className="space-y-4">
              <div
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={triggerUpload}
                className={cn(
                  "border-2 border-dashed border-[var(--border-strong)] hover:border-[var(--primary)]",
                  "rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer",
                  "bg-[var(--background-muted)] hover:bg-[var(--background-subtle)] transition-all space-y-3"
                )}
              >
                <div className="w-12 h-12 rounded-full bg-[var(--primary-subtle)] flex items-center justify-center">
                  <Upload size={22} className="text-[var(--primary)] animate-pulse" />
                </div>
                <div>
                  <p className="text-[13.5px] font-semibold text-[var(--foreground)]">Drag and drop your file here</p>
                  <p className="text-[12px] text-[var(--foreground-muted)] mt-1">Supports .csv or .txt (comma-separated value formats)</p>
                </div>
                <button type="button" className="sos-btn sos-btn-primary py-1 px-3 text-[12.5px]">
                  Browse Files
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.txt"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>

              {/* Sample format notice */}
              <div className="p-4 rounded-lg bg-[var(--background-subtle)] border border-[var(--border)] flex gap-3">
                <AlertCircle size={16} className="text-[var(--primary)] flex-shrink-0 mt-0.5" />
                <div className="text-[12px]">
                  <p className="font-semibold text-[var(--foreground)]">Recommended CSV Columns:</p>
                  <p className="text-[var(--foreground-muted)] mt-1">
                    Company Name, Contact Name, Email, Phone, Estimated Value, Source, Status, Notes
                  </p>
                  <p className="text-[var(--foreground-subtle)] mt-1.5">
                    Don't worry if your column names are different — you can map them in the next step!
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Mapping */}
          {step === "map" && (
            <div className="space-y-4">
              <div className="p-3 bg-[var(--primary-subtle)] text-[var(--primary)] rounded-lg text-[12px] flex items-center gap-2">
                <Check size={14} className="stroke-[3]" />
                <span>Successfully parsed <strong>{rows.length}</strong> rows. Match your columns below:</span>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-[11px] font-semibold text-[var(--foreground-muted)] px-1 uppercase tracking-wider">
                  <span>Lead Field</span>
                  <span>Your CSV Column</span>
                </div>
                
                <div className="divide-y divide-[var(--border)] border border-[var(--border)] rounded-lg bg-[var(--background-subtle)] overflow-hidden">
                  {[
                    { key: "name", label: "Company Name", required: true },
                    { key: "contactName", label: "Contact Name", required: true },
                    { key: "email", label: "Email Address", required: true },
                    { key: "phone", label: "Phone Number", required: false },
                    { key: "value", label: "Estimated Value", required: false },
                    { key: "source", label: "Lead Source", required: false },
                    { key: "status", label: "Lead Status", required: false },
                    { key: "notes", label: "Notes / Details", required: false },
                  ].map((field) => (
                    <div key={field.key} className="grid grid-cols-2 gap-4 items-center p-3 text-[13px]">
                      <span className="font-medium text-[var(--foreground)]">
                        {field.label} {field.required && <span className="text-[var(--danger)]">*</span>}
                      </span>
                      <div className="relative">
                        <select
                          value={columnMap[field.key as keyof ColumnMap]}
                          onChange={(e) => setColumnMap({ ...columnMap, [field.key]: e.target.value })}
                          className="sos-input py-1 text-[12.5px] pr-8 appearance-none bg-[var(--background)]"
                        >
                          <option value="">-- Skip Column --</option>
                          {headers.map((h) => (
                            <option key={h} value={h}>{h}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Preview */}
          {step === "preview" && (
            <div className="space-y-4">
              <div className="text-[13px]">
                <p className="font-medium text-[var(--foreground)]">Review Leads Import Preview</p>
                <p className="text-[11.5px] text-[var(--foreground-muted)]">Below is a preview of the first few leads to be imported.</p>
              </div>

              <div className="border border-[var(--border)] rounded-lg overflow-x-auto bg-[var(--background-subtle)]">
                <table className="w-full text-left text-[12.5px] border-collapse">
                  <thead>
                    <tr className="bg-[var(--background-muted)] border-b border-[var(--border)] text-[11px] font-semibold text-[var(--foreground-muted)] uppercase tracking-wider">
                      <th className="p-3">Company</th>
                      <th className="p-3">Contact</th>
                      <th className="p-3">Email</th>
                      <th className="p-3 text-right">Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {getMappedLeads().slice(0, 5).map((lead, i) => (
                      <tr key={i} className="hover:bg-[var(--background-muted)] transition-colors">
                        <td className="p-3 font-medium text-[var(--foreground)]">{lead.name}</td>
                        <td className="p-3 text-[var(--foreground-muted)]">{lead.contactName}</td>
                        <td className="p-3 text-[var(--foreground-muted)] truncate max-w-[120px]">{lead.email}</td>
                        <td className="p-3 text-right font-medium text-[#22c55e]">{formatCurrency(lead.value)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {rows.length > 5 && (
                <p className="text-[11.5px] text-[var(--foreground-subtle)] text-center">
                  Showing 5 of {rows.length} rows to import.
                </p>
              )}
            </div>
          )}

          {/* Step 4: Done */}
          {step === "done" && (
            <div className="flex flex-col items-center justify-center text-center py-8 space-y-4">
              <div className="w-14 h-14 rounded-full bg-[var(--success-subtle)] flex items-center justify-center text-[var(--success-foreground)]">
                <CheckCircle2 size={36} className="text-[#22c55e]" />
              </div>
              <div>
                <h4 className="text-[16px] font-bold text-[var(--foreground)]">Import Complete!</h4>
                <p className="text-[13px] text-[var(--foreground-muted)] mt-1">
                  Successfully imported <strong>{importCount}</strong> leads into your workspace.
                </p>
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="px-5 py-4 border-t border-[var(--border)] flex justify-between bg-[var(--background)]">
          {step === "upload" && (
            <>
              <span />
              <button onClick={onClose} className="sos-btn sos-btn-ghost py-1.5 px-4 text-[12.5px]">Cancel</button>
            </>
          )}

          {step === "map" && (
            <>
              <button onClick={handleReset} className="sos-btn sos-btn-ghost py-1.5 px-4 text-[12.5px]">Back</button>
              <button onClick={handleMapSubmit} className="sos-btn sos-btn-primary py-1.5 px-4 text-[12.5px] flex items-center gap-1">
                Continue <ChevronRight size={14} />
              </button>
            </>
          )}

          {step === "preview" && (
            <>
              <button onClick={() => setStep("map")} className="sos-btn sos-btn-ghost py-1.5 px-4 text-[12.5px]">Back</button>
              <button onClick={executeImport} className="sos-btn sos-btn-primary py-1.5 px-4 text-[12.5px]">
                Import All ({rows.length} Leads)
              </button>
            </>
          )}

          {step === "done" && (
            <>
              <button onClick={handleReset} className="sos-btn sos-btn-ghost py-1.5 px-4 text-[12.5px]">Import Another File</button>
              <button onClick={onClose} className="sos-btn sos-btn-primary py-1.5 px-4 text-[12.5px]">Close Dialog</button>
            </>
          )}
        </div>
      </div>
    </>
  );
}
