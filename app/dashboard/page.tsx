"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";


// ── Markdown renderer ──────────────────────────────────────────────────────────
function renderMarkdown(text: string): string {
  const lines = text.split("\n");
  const result: string[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const nextLine = lines[i + 1] || "";
    if (line.includes("|") && /^[|\-\s]+$/.test(nextLine)) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].includes("|")) {
        tableLines.push(lines[i]);
        i++;
      }
      const headers = tableLines[0].split("|").map((c) => c.trim()).filter(Boolean);
      const rows = tableLines.slice(2).map((l) => l.split("|").map((c) => c.trim()).filter(Boolean));
      const thead = "<thead><tr>" + headers.map((h) => "<th>" + h + "</th>").join("") + "</tr></thead>";
      const tbody = "<tbody>" + rows.map((r) => "<tr>" + r.map((c) => "<td>" + c + "</td>").join("") + "</tr>").join("") + "</tbody>";
      result.push('<div class="table-wrap"><table>' + thead + tbody + "</table></div>");
    } else {
      result.push(line);
      i++;
    }
  }
  let html = result.join("<br/>");
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/`([^`]+)`/g, "<code>$1</code>");
  html = html.replace(
    /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g,
    '<a href="$2" target="_blank" style="color:#0099DA;text-decoration:underline;">$1</a>'
  );
  return html;
}

// ── Types ──────────────────────────────────────────────────────────────────────
type ChatMode = "closed" | "open";

interface MasterItem { id: number; name: string; }
interface MasterData { requestTypes: MasterItem[]; urgencies: MasterItem[]; statuses: MasterItem[]; }
interface FormData {
  Summary: string;
  Description: string;
  RequestType: string;
  Urgency: string;
  Status: string;
  Budget: string;
}

const MANUAL_STEPS = [
  { key: "Summary", label: "Summary", type: "text", placeholder: "Enter a brief summary..." },
  { key: "Description", label: "Description", type: "text", placeholder: "Enter description (optional)..." },
  { key: "RequestType", label: "Request Type", type: "dropdown", placeholder: "" },
  { key: "Urgency", label: "Urgency", type: "dropdown", placeholder: "" },
  { key: "Status", label: "Status", type: "dropdown", placeholder: "" },
  { key: "Budget", label: "Budget", type: "text", placeholder: "e.g. $5000 (optional)..." },
];

const EDIT_STEPS = [
  { key: "Summary", label: "Summary", type: "text", placeholder: "Enter new summary..." },
  { key: "Description", label: "Description", type: "text", placeholder: "Enter new description..." },
  { key: "RequestType", label: "Request Type", type: "dropdown", placeholder: "" },
  { key: "Urgency", label: "Urgency", type: "dropdown", placeholder: "" },
  { key: "Status", label: "Status", type: "dropdown", placeholder: "" },
  { key: "Budget", label: "Budget", type: "text", placeholder: "e.g. $5000..." },
];

// ── API helpers ────────────────────────────────────────────────────────────────
const NEXT_PUBLIC_DOMAIN_ASK_EF_BACKEND = process.env.NEXT_PUBLIC_DOMAIN_ASK_EF_BACKEND
async function submitIntake(form: FormData, userId?: number) {
  const res = await fetch(`${NEXT_PUBLIC_DOMAIN_ASK_EF_BACKEND}/intake-records`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      Summary: form.Summary,
      Description: form.Description,
      RequestType: parseInt(form.RequestType),
      Urgency: parseInt(form.Urgency),
      Status: parseInt(form.Status),
      Budget: form.Budget,
      UserID: userId ?? null,
    }),
  });
  return res.json();
}

async function checkDuplicate(summary: string, description: string) {
  try {
    const res = await fetch("http://localhost:8000/check-duplicate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ Summary: summary, Description: description }),
    });
    return res.json();
  } catch {
    return { isDuplicate: false };
  }
}

// ── Duplicate Modal ────────────────────────────────────────────────────────────
function DuplicateModal({ duplicateId, duplicateLink, reason, onContinue, onCancel }: {
  duplicateId: number; duplicateLink: string; reason: string;
  onContinue: () => void; onCancel: () => void;
}) {
  return (
    <div style={modalOverlay}>
      <div style={{ ...modalBox, width: "min(440px,95vw)" }}>
        <div style={{ ...modalHeader, background: "#fffbeb", borderBottom: "1px solid #fde68a" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 20 }}>⚠️</span>
            <span style={{ fontWeight: 700, fontSize: 15, color: "#92400e" }}>Possible Duplicate Found</span>
          </div>
        </div>
        <div style={{ ...modalBody, gap: 14 }}>
          <p style={{ fontSize: 14, color: "#374151", margin: 0 }}>This intake appears similar to an existing record.</p>
          <div style={{ background: "#fef3c7", border: "1px solid #fde68a", borderRadius: 8, padding: "10px 14px" }}>
            <div style={{ fontSize: 12, color: "#92400e", fontWeight: 600, marginBottom: 4 }}>Reason:</div>
            <div style={{ fontSize: 13, color: "#78350f" }}>{reason}</div>
          </div>
          <div style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 8, padding: "10px 14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 12, color: "#6b7280", fontWeight: 600 }}>Existing Record</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>Intake #{duplicateId}</div>
            </div>
            <a href={duplicateLink} target="_blank" rel="noreferrer"
              style={{ padding: "7px 14px", background: "#003087", color: "#fff", borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: "none" }}>
              View / Edit →
            </a>
          </div>
          <p style={{ fontSize: 13, color: "#6b7280", margin: 0 }}>Would you like to continue creating a new record anyway, or cancel?</p>
        </div>
        <div style={{ ...modalFooter, justifyContent: "space-between" }}>
          <button style={cancelBtn} onClick={onCancel}>✕ Cancel</button>
          <button style={{ ...submitBtn, background: "#f59e0b" }} onClick={onContinue}>Continue Anyway →</button>
        </div>
      </div>
    </div>
  );
}

// ── Intake Form Modal ──────────────────────────────────────────────────────────
function IntakeFormModal({ masterData, onClose, onSuccess, userId }: {
  masterData: MasterData; onClose: () => void;
  onSuccess: (id: number, link: string) => void; userId?: number;
}) {
  const [form, setForm] = useState<FormData>({ Summary: "", Description: "", RequestType: "", Urgency: "", Status: "", Budget: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [dupData, setDupData] = useState<{ duplicateId: number; link: string; reason: string } | null>(null);
  const set = (f: keyof FormData, v: string) => setForm((p) => ({ ...p, [f]: v }));

  const submit = async (force = false) => {
    if (!form.Summary || !form.RequestType || !form.Urgency || !form.Status) {
      setError("Please fill in all required fields."); return;
    }
    setSubmitting(true); setError("");
    try {
      if (!force) {
        const dup = await checkDuplicate(form.Summary, form.Description);
        if (dup.isDuplicate) {
          setDupData({ duplicateId: dup.duplicateId, link: dup.link, reason: dup.reason });
          setSubmitting(false); return;
        }
      }
      const data = await submitIntake(form, userId);
      if (data.success) onSuccess(data.id, data.link);
      else setError(data.message || "Failed to create record.");
    } catch { setError("Network error."); } finally { setSubmitting(false); }
  };

  if (dupData) return (
    <DuplicateModal
      duplicateId={dupData.duplicateId} duplicateLink={dupData.link} reason={dupData.reason}
      onContinue={() => { setDupData(null); submit(true); }}
      onCancel={() => { setDupData(null); onClose(); }}
    />
  );

  return (
    <div style={modalOverlay}>
      <div style={modalBox}>
        <div style={modalHeader}>
          <span style={{ fontWeight: 700, fontSize: 15 }}>➕ New Demand</span>
          <button style={closeBtnSm} onClick={onClose}>✕</button>
        </div>
        <div style={modalBody}>
          <label style={lbl}>Summary <span style={req}>*</span></label>
          <input style={fInput} value={form.Summary} onChange={(e) => set("Summary", e.target.value)} placeholder="Enter summary..." />

          <label style={lbl}>Description</label>
          <textarea style={{ ...fInput, height: 72, resize: "none" }} value={form.Description} onChange={(e) => set("Description", e.target.value)} placeholder="Enter description..." />

          <div style={row2}>
            <div style={{ flex: 1 }}>
              <label style={lbl}>Request Type <span style={req}>*</span></label>
              <select style={fSelect} value={form.RequestType} onChange={(e) => set("RequestType", e.target.value)}>
                <option value="">Select...</option>
                {masterData.requestTypes.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={lbl}>Urgency <span style={req}>*</span></label>
              <select style={fSelect} value={form.Urgency} onChange={(e) => set("Urgency", e.target.value)}>
                <option value="">Select...</option>
                {masterData.urgencies.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
          </div>

          <div style={row2}>
            <div style={{ flex: 1 }}>
              <label style={lbl}>Status <span style={req}>*</span></label>
              <select style={fSelect} value={form.Status} onChange={(e) => set("Status", e.target.value)}>
                <option value="">Select...</option>
                {masterData.statuses.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={lbl}>Budget</label>
              <input style={fInput} value={form.Budget} onChange={(e) => set("Budget", e.target.value)} placeholder="e.g. $5000" />
            </div>
          </div>

          {error && <div style={errMsg}>{error}</div>}
        </div>
        <div style={modalFooter}>
          <button style={cancelBtn} onClick={onClose}>Cancel</button>
          <button style={submitBtn} onClick={() => submit(false)} disabled={submitting}>
            {submitting ? "Checking..." : "Create Record"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── MoM Modal ──────────────────────────────────────────────────────────────────
function MoMModal({ masterData, onClose, onSuccess, userId }: {
  masterData: MasterData; onClose: () => void;
  onSuccess: (id: number, link: string) => void; userId?: number;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [form, setForm] = useState<FormData | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [dupData, setDupData] = useState<{ duplicateId: number; link: string; reason: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const set = (f: keyof FormData, v: string) => setForm((p) => p ? { ...p, [f]: v } : p);

  const handleFile = async (f: File) => {
    setFile(f); setParsing(true); setError("");
    try {
      const fd = new FormData(); fd.append("file", f);
      const res = await fetch(`${process.env.NEXT_PUBLIC_DOMAIN_ASK_EF_BACKEND}/parse-mom`, { method: "POST", body: fd });
      const data = await res.json();
      if (data.success) {
        setForm({ Summary: data.Summary || "", Description: data.Description || "", RequestType: data.RequestType || "", Urgency: data.Urgency || "", Status: data.Status || "", Budget: data.Budget || "" });
      } else {
        setError(data.message || "Could not parse.");
        setForm({ Summary: "", Description: "", RequestType: "", Urgency: "", Status: "", Budget: "" });
      }
    } catch {
      setError("Failed to parse.");
      setForm({ Summary: "", Description: "", RequestType: "", Urgency: "", Status: "", Budget: "" });
    } finally { setParsing(false); }
  };

  const submit = async (force = false) => {
    if (!form) return;
    if (!form.Summary || !form.RequestType || !form.Urgency || !form.Status) {
      setError("Please fill in all required fields."); return;
    }
    setSubmitting(true); setError("");
    try {
      if (!force) {
        const dup = await checkDuplicate(form.Summary, form.Description);
        if (dup.isDuplicate) {
          setDupData({ duplicateId: dup.duplicateId, link: dup.link, reason: dup.reason });
          setSubmitting(false); return;
        }
      }
      const data = await submitIntake(form, userId);
      if (data.success) onSuccess(data.id, data.link);
      else setError(data.message || "Failed.");
    } catch { setError("Network error."); } finally { setSubmitting(false); }
  };

  if (dupData) return (
    <DuplicateModal
      duplicateId={dupData.duplicateId} duplicateLink={dupData.link} reason={dupData.reason}
      onContinue={() => { setDupData(null); submit(true); }}
      onCancel={() => { setDupData(null); onClose(); }}
    />
  );

  return (
    <div style={modalOverlay}>
      <div style={{ ...modalBox, width: "min(560px,95vw)" }}>
        <div style={modalHeader}>
          <span style={{ fontWeight: 700, fontSize: 15 }}>📄 New Intake from MoM</span>
          <button style={closeBtnSm} onClick={onClose}>✕</button>
        </div>
        <div style={modalBody}>
          <div style={uploadArea}
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}>
            <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.txt" style={{ display: "none" }}
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
            <div style={{ fontSize: 28 }}>📎</div>
            <div style={{ fontWeight: 600, fontSize: 14, color: "#374151" }}>
              {file ? file.name : "Click or drag & drop your MoM document"}
            </div>
            <div style={{ fontSize: 12, color: "#9ca3af" }}>PDF, DOC, DOCX, TXT supported</div>
          </div>

          {parsing && <div style={parsingMsg}>⏳ Parsing document with AI...</div>}

          {form && !parsing && (
            <>
              <div style={{ height: 1, background: "#e5e7eb", margin: "4px 0 8px" }} />
              <div style={{ fontSize: 13, fontWeight: 600, color: "#6b7280", marginBottom: 4 }}>✏️ Review & Edit before submitting</div>

              <label style={lbl}>Summary <span style={req}>*</span></label>
              <input style={fInput} value={form.Summary} onChange={(e) => set("Summary", e.target.value)} placeholder="Enter summary..." />

              <label style={lbl}>Description</label>
              <textarea style={{ ...fInput, height: 72, resize: "none" }} value={form.Description} onChange={(e) => set("Description", e.target.value)} />

              <div style={row2}>
                <div style={{ flex: 1 }}>
                  <label style={lbl}>Request Type <span style={req}>*</span></label>
                  <select style={fSelect} value={form.RequestType} onChange={(e) => set("RequestType", e.target.value)}>
                    <option value="">Select...</option>
                    {masterData.requestTypes.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={lbl}>Urgency <span style={req}>*</span></label>
                  <select style={fSelect} value={form.Urgency} onChange={(e) => set("Urgency", e.target.value)}>
                    <option value="">Select...</option>
                    {masterData.urgencies.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </div>
              </div>

              <div style={row2}>
                <div style={{ flex: 1 }}>
                  <label style={lbl}>Status <span style={req}>*</span></label>
                  <select style={fSelect} value={form.Status} onChange={(e) => set("Status", e.target.value)}>
                    <option value="">Select...</option>
                    {masterData.statuses.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={lbl}>Budget</label>
                  <input style={fInput} value={form.Budget} onChange={(e) => set("Budget", e.target.value)} placeholder="e.g. $5000" />
                </div>
              </div>
            </>
          )}

          {error && <div style={errMsg}>{error}</div>}
        </div>
        <div style={modalFooter}>
          <button style={cancelBtn} onClick={onClose}>Cancel</button>
          {form && !parsing && (
            <button style={submitBtn} onClick={() => submit(false)} disabled={submitting}>
              {submitting ? "Checking..." : "Create Record"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Manual Step Widget ─────────────────────────────────────────────────────────
function ManualStepWidget({ step, masterData, onAnswer }: {
  step: typeof MANUAL_STEPS[0]; masterData: MasterData;
  onAnswer: (v: string, l: string) => void;
}) {
  const [val, setVal] = useState("");
  const options =
    step.key === "RequestType" ? masterData.requestTypes :
      step.key === "Urgency" ? masterData.urgencies :
        step.key === "Status" ? masterData.statuses : [];

  const submit = () => {
    if (step.type === "dropdown") {
      const f = options.find((o) => String(o.id) === val);
      if (!f) return;
      onAnswer(val, f.name);
    } else {
      onAnswer(val, val);
    }
  };

  return (
    <div style={{ background: "#fff", border: "1px solid #e8eaf0", borderRadius: 10, padding: 12, marginTop: 4 }}>
      {step.type === "dropdown" ? (
        <select style={{ ...fSelect, marginBottom: 8 }} value={val} onChange={(e) => setVal(e.target.value)}>
          <option value="">Select {step.label}...</option>
          {options.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
        </select>
      ) : (
        <input
          style={{ ...fInput, marginBottom: 8 }}
          value={val}
          onChange={(e) => setVal(e.target.value)}
          placeholder={step.placeholder}
          onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
          autoFocus
        />
      )}
      <div style={{ display: "flex", gap: 8 }}>
        <button style={submitBtn} onClick={submit}>Next →</button>
        {(step.key === "Description" || step.key === "Budget") && (
          <button style={cancelBtn} onClick={() => onAnswer("", "")}>Skip</button>
        )}
      </div>
    </div>
  );
}

// ── Dashboard static data ──────────────────────────────────────────────────────
const RECENT_DEMANDS = [
  { id: 142, title: "ERP Module Upgrade — Finance", type: "IT Infrastructure", time: "2h ago", urgency: "High", urgencyClass: "badge-high", status: "Open", statusClass: "badge-open" },
  { id: 141, title: "New CRM Integration for Sales Team", type: "Application Dev", time: "1d ago", urgency: "Med", urgencyClass: "badge-med", status: "Review", statusClass: "badge-review" },
  { id: 140, title: "Power BI Dashboard — HR Analytics", type: "Data & Reporting", time: "2d ago", urgency: "Low", urgencyClass: "badge-low", status: "Done", statusClass: "badge-done" },
  { id: 139, title: "SSO Setup for Azure AD Federation", type: "Security", time: "3d ago", urgency: "High", urgencyClass: "badge-high", status: "Open", statusClass: "badge-open" },
  { id: 138, title: "Automated Invoice Processing — AP", type: "Application Dev", time: "4d ago", urgency: "Med", urgencyClass: "badge-med", status: "Open", statusClass: "badge-open" },
];

const CHART_DATA = [
  { month: "Nov", value: 55 }, { month: "Dec", value: 65 }, { month: "Jan", value: 48 },
  { month: "Feb", value: 72 }, { month: "Mar", value: 82 }, { month: "Apr", value: 100 },
];

const DEMAND_TYPES = [
  { name: "Application Development", pct: 34, color: "#003087" },
  { name: "IT Infrastructure", pct: 26, color: "#0099DA" },
  { name: "Data & Reporting", pct: 21, color: "#00833E" },
  { name: "Security & Compliance", pct: 12, color: "#f59e0b" },
  { name: "Other", pct: 7, color: "#d1d5db" },
];

const ACTIVITY = [
  { color: "#003087", text: "Intake #142 created by John Doe", time: "2 hours ago" },
  { color: "#0099DA", text: "Intake #141 moved to Review", time: "Yesterday, 4:12 PM" },
  { color: "#00833E", text: "Intake #140 marked as complete", time: "2 days ago" },
  { color: "#f59e0b", text: "Budget updated on intake #138", time: "3 days ago" },
  { color: "#dc2626", text: "Intake #137 flagged as high urgency", time: "4 days ago" },
];

const NAV_ITEMS = [
  { icon: "grid", label: "Dashboard", badge: null, active: true },
  { icon: "inbox", label: "Demand Intakes", badge: "24", active: false },
  { icon: "star", label: "Projects", badge: null, active: false },
  { icon: "chart", label: "Reports", badge: null, active: false },
];

const NAV_ADMIN = [
  { icon: "user", label: "Users", badge: null, active: false },
  { icon: "gear", label: "Settings", badge: null, active: false },
];


// ── SVG Icons ──────────────────────────────────────────────────────────────────
function Icon({ name, size = 14, color = "currentColor" }: { name: string; size?: number; color?: string }) {
  const paths: Record<string, React.ReactNode> = {
    grid: <><rect x="1" y="1" width="6" height="6" rx="1.5" fill={color} /><rect x="9" y="1" width="6" height="6" rx="1.5" fill={color} /><rect x="1" y="9" width="6" height="6" rx="1.5" fill={color} /><rect x="9" y="9" width="6" height="6" rx="1.5" fill={color} /></>,
    inbox: <path d="M2 4h12M2 8h12M2 12h7" stroke={color} strokeWidth="1.5" strokeLinecap="round" fill="none" />,
    star: <path d="M8 1l2 4.5L15 6l-3.5 3.5.8 5L8 12l-4.3 2.5.8-5L1 6l5-.5z" stroke={color} strokeWidth="1.3" strokeLinejoin="round" fill="none" />,
    chart: <path d="M2 12l3-4 3 2 3-5 3 3" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />,
    user: <><circle cx="8" cy="6" r="3" stroke={color} strokeWidth="1.3" fill="none" /><path d="M2 14c0-3 2.7-5 6-5s6 2 6 5" stroke={color} strokeWidth="1.3" strokeLinecap="round" fill="none" /></>,
    gear: <><circle cx="8" cy="8" r="3" stroke={color} strokeWidth="1.3" fill="none" /><path d="M8 2v1M8 13v1M2 8H1M15 8h-1M3.5 3.5l.7.7M11.8 11.8l.7.7M3.5 12.5l.7-.7M11.8 4.2l.7-.7" stroke={color} strokeWidth="1.3" strokeLinecap="round" fill="none" /></>,
    search: <><circle cx="7" cy="7" r="4.5" stroke={color} strokeWidth="1.4" fill="none" /><path d="M10.5 10.5L14 14" stroke={color} strokeWidth="1.4" strokeLinecap="round" /></>,
    filter: <path d="M2 4h12M4 8h8M6 12h4" stroke={color} strokeWidth="1.4" strokeLinecap="round" fill="none" />,
    plus: <path d="M8 3v10M3 8h10" stroke={color} strokeWidth="2" strokeLinecap="round" fill="none" />,
    person: <><circle cx="8" cy="6" r="3.5" stroke={color} strokeWidth="1.4" fill="none" /><path d="M2 15c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5" stroke={color} strokeWidth="1.4" strokeLinecap="round" fill="none" /></>,
    logout: <path d="M10 3H4a1 1 0 00-1 1v8a1 1 0 001 1h6M7 8h8M12 5l3 3-3 3" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />,
    send: <path d="M16 9L2 2l3.5 7L2 16l14-7z" fill={color} stroke={color} strokeWidth="0.5" strokeLinejoin="round" />,
    maximize: <path d="M1 5V2a1 1 0 011-1h3M9 1h3a1 1 0 011 1v3M13 9v3a1 1 0 01-1 1H9M5 13H2a1 1 0 01-1-1V9" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />,
    restore: <><rect x="3" y="1" width="10" height="10" rx="1.5" stroke={color} strokeWidth="1.5" fill="none" /><path d="M1 4v8a1 1 0 001 1h8" stroke={color} strokeWidth="1.5" strokeLinecap="round" fill="none" /></>,
    chat: <path d="M18 10c0 4-3.6 7-8 7-1.2 0-2.3-.2-3.4-.6L2 18l1.7-4A6.8 6.8 0 012 10c0-4 3.6-7 8-7s8 3 8 7z" stroke={color} strokeWidth="1.5" strokeLinejoin="round" fill="none" />,
    trendUp: <path d="M2 12l3-4 3 2 3-6 3 2" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />,
    arrowUp: <path d="M5 8V2M2 5l3-3 3 3" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />,
    arrowDown: <path d="M5 2v6M2 5l3 3 3-3" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />,
    cpu: <><rect x="3" y="3" width="10" height="10" rx="1" stroke={color} strokeWidth="1.3" fill="none" /><path d="M6 6h4v4H6zM1 6h2M13 6h2M1 10h2M13 10h2M6 1v2M10 1v2M6 13v2M10 13v2" stroke={color} strokeWidth="1.3" strokeLinecap="round" fill="none" /></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      {paths[name]}
    </svg>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [chatMode, setChatMode] = useState<ChatMode>("closed");
  const [chatMax, setChatMax] = useState(false);
  const [msg, setMsg] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [masterData, setMasterData] = useState<MasterData>({ requestTypes: [], urgencies: [], statuses: [] });
  const [showFormModal, setShowFormModal] = useState(false);
  const [showMomModal, setShowMomModal] = useState(false);
  const [manualStep, setManualStep] = useState<number | null>(null);
  const [manualData, setManualData] = useState<Partial<FormData>>({});
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeNav, setActiveNav] = useState("Dashboard");
  const [editIntakeId, setEditIntakeId] = useState<string | null>(null);
  const [editStep, setEditStep] = useState<number | null>(null);
  const [editData, setEditData] = useState<Partial<FormData>>({});
  const [editMode, setEditMode] = useState<"choose" | "manual" | null>(null);
  const chatBoxRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Auth guard
  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem("user");
    if (!stored) { router.push("/login"); return; }
    setUser(JSON.parse(stored));
  }, []);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_DOMAIN_ASK_EF_BACKEND}/master-data`)
      .then((r) => r.json())
      .then(setMasterData)
      .catch(() => { });
  }, []);

  useEffect(() => {
    if (chatBoxRef.current) chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
  }, [messages, loading, manualStep]);

  const addMsg = (role: string, content: string, type?: string) =>
    setMessages((prev) => [...prev, { role, content, type }]);

  const logout = () => { localStorage.removeItem("user"); router.push("/login"); };

  const triggerNewIntake = () => {
    setChatMode("open");
    setTimeout(() => {
      setMessages((prev) => [...prev, {
        role: "assistant",
        content: "Sure! How would you like to submit a new demand?",
        type: "intake-options",
      }]);
    }, 100);
  };

 
  const startPortalLink = () => {
  addMsg("user", "📋 By Portal Link");
  const username = encodeURIComponent(user?.Username || "");
  addMsg(
    "assistant",
    `<a href="http://127.0.0.1:5000/auto-login?username=${username}" target="_blank" rel="noopener noreferrer">
       Click here for Portal Submission
     </a>`
  );

  intervalRef.current = setInterval(async () => {
    try {
        const res = await fetch("/api/intake-notify");
        const data = await res.json();

        if (data.intake_id) {
          clearInterval(intervalRef.current!); // ✅ now correctly stops
          intervalRef.current = null;
          const link = `${process.env.NEXT_PUBLIC_DOMAIN_DEMAND_INTAKE}/edit_intake/${data.intake_id}`;
          addMsg("assistant", `✅ **New Intake Created!**\n\n🆔 **Demand ID:** ${data.intake_id}\n\n🔗 **View / Edit:** [Open Demand #${data.intake_id}](${link})`);
        }
      } catch (e) {
        // silent fail
      }
    }, 5000);
  };
 
  const NEW_INTAKE_KEYWORDS = [
    "new intake", "create intake", "add intake", "new record", "create record",
    "new demand", "create demand", "submit demand", "add demand", "add", "create", "new"
  ];

  const EDIT_INTAKE_KEYWORDS = [
    "edit intake", "update intake", "modify intake",
    "edit record", "update record", "modify record",
    "edit demand", "update demand", "modify demand",
    "change intake", "change record", "edit id", 
    "intake id", "edit", "update", "modify", "change"
  ];

  const send = async () => {
    if (!msg.trim()) return;
    const userMsg = msg.trim();
    const updated = [...messages, { role: "user", content: userMsg }];
    setMessages(updated); setMsg("");

    if (NEW_INTAKE_KEYWORDS.some((kw) => userMsg.toLowerCase().includes(kw))) {
      setTimeout(() => setMessages((prev) => [...prev, {
        role: "assistant",
        content: "Sure! How would you like to submit a new demand?",
        type: "intake-options",
      }]), 400);
      return;
    }

    const isEditIntent = EDIT_INTAKE_KEYWORDS.some((kw) => userMsg.toLowerCase().includes(kw))
      || messages.slice(-4).some((m) =>
        m.role === "assistant" &&
        m.content.includes("Intake ID number you want to edit")
      );

    if (isEditIntent) {
      const idMatch = userMsg.match(/(?:intake\s*id\s*|id\s*)?(\d+)/i);
      if (idMatch) {
        const intakeId = idMatch[1];
        setEditIntakeId(intakeId);
        setEditMode("choose");
        setTimeout(() => setMessages((prev) => [...prev, {
          role: "assistant",
          content: `How would you like to edit **Intake #${intakeId}**?`,
          type: "edit-choose",
        }]), 400);
      } else {
        setTimeout(() => setMessages((prev) => [...prev, {
          role: "assistant",
          content: "Please provide the Intake ID number you want to edit (e.g. *249*).",
        }]), 400);
      }
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_DOMAIN_ASK_EF_BACKEND}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updated, user_id: user?.UserID, intent: "" }),
      });
      const data = await res.json();
      setMessages([...updated, data.messages[data.messages.length - 1]]);
    } finally { setLoading(false); }
  };


  const handleEditAction = (action: "edit-link" | "manually") => {
    if (action === "edit-link") {
      const link = `${process.env.NEXT_PUBLIC_DOMAIN_DEMAND_INTAKE}/edit_intake/${editIntakeId}`;
      setEditMode(null);
      addMsg("user", "🔗 Edit Link");
      addMsg("assistant", `✅ Here is your edit link for Intake #${editIntakeId}: [Edit Intake #${editIntakeId}](${link})`);
    } else {
      addMsg("user", "✍️ Manually");
      setEditMode("manual");
      setEditData({});
      setEditStep(-1);
      addMsg("assistant", `Which field would you like to edit for Intake #${editIntakeId}?`, "edit-field-select");
    }
  };

  const handleEditAnswer = async (value: string, label: string) => {
    if (editStep === -1) {
      const fieldIndex = EDIT_STEPS.findIndex(s => s.key === value);
      if (fieldIndex === -1) return;
      setEditStep(fieldIndex);
      addMsg("user", label);
      addMsg("assistant", `Enter the new value for **${label}**:`);
      return;
    }
    const step = EDIT_STEPS[editStep!];
    const newData = { ...editData, [step.key]: value };
    setEditData(newData);
    addMsg("user", label || "(skipped)");
    addMsg("assistant", `Got it! **${step.label}** updated to: *${label || value}*<br><br>Would you like to edit another field?`, "edit-another");
    setEditStep(-1);
  };

  const handleEditSubmit = async () => {
    if (Object.keys(editData).length === 0) {
      addMsg("assistant", "No changes to submit.");
      return;
    }
    setEditStep(null);
    setEditMode(null);
    addMsg("assistant", "⏳ Updating your intake record...");
    try {
      `${process.env.NEXT_PUBLIC_DOMAIN_ASK_EF_BACKEND}/login`
        const res = await fetch(`${process.env.NEXT_PUBLIC_DOMAIN_ASK_EF_BACKEND}/intake-records/${editIntakeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editData),
      });
      const data = await res.json();
      const link = `${process.env.NEXT_PUBLIC_DOMAIN_DEMAND_INTAKE}/edit_intake/${editIntakeId}`;
      if (data.success) {
        addMsg("assistant", `✅ Intake #${editIntakeId} updated!\n\n🔗 [View / Edit Intake #${editIntakeId}](${link})`);
      } else {
        addMsg("assistant", `❌ Update failed: ${data.message || "Unknown error."}`);
      }
    } catch { addMsg("assistant", "❌ Network error. Please try again."); }
    setEditIntakeId(null);
  };

  const startManual = () => {
    setManualData({});
    setManualStep(0);
    addMsg("assistant", "Let's go step by step.<br><br><b>" + MANUAL_STEPS[0].label + ":</b>");
  };

  const handleManualAnswer = async (value: string, label: string) => {
    const step = MANUAL_STEPS[manualStep!];
    const newData = { ...manualData, [step.key]: value };
    setManualData(newData);
    addMsg("user", label || "(skipped)");
    const nextStep = manualStep! + 1;
    if (nextStep < MANUAL_STEPS.length) {
      setManualStep(nextStep);
      setTimeout(() => addMsg("assistant", "<b>" + MANUAL_STEPS[nextStep].label + ":</b>"), 200);
    } else {
      setManualStep(null);
      addMsg("assistant", "⏳ Submitting your demand record...");
      try {
        const data = await submitIntake(newData as FormData, user?.UserID);
        if (data.success) handleSuccess(data.id, data.link);
        else addMsg("assistant", "❌ Failed: " + (data.message || "Unknown error"));
      } catch { addMsg("assistant", "❌ Network error. Please try again."); }
    }
  };

  const handleSuccess = (id: number, link: string) => {
    setShowFormModal(false); setShowMomModal(false);
    setMessages((prev) => [...prev, {
      role: "assistant",
      content: "✅ **New Demand Submitted Successfully!**\n\n🆔 **Demand ID:** " + id + "\n\n🔗 **View / Edit:** [Open Demand #" + id + "](" + link + ")",
    }]);
  };

  if (!user) return null;

  const firstName = user?.Name?.split(" ")[0] || "User";

  // ── TODAY DATE ──────────────────────────────────────────────────────────────
  const today = new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { height: 100%; }

        @keyframes fadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: .4; } }
        @keyframes slideIn { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(.97); } to { opacity: 1; transform: scale(1); } }

        .ef-root {
          display: flex;
          height: 100vh;
          font-family: 'Plus Jakarta Sans', sans-serif;
          background: #f0f2f7;
          overflow: hidden;
        }

        /* ── SIDEBAR ── */
        .ef-sidebar {
          width: 232px;
          background: #003087;
          display: flex;
          flex-direction: column;
          flex-shrink: 0;
          position: relative;
          overflow: hidden;
        }
        .ef-sidebar::before {
          content: '';
          position: absolute;
          top: -60px; right: -60px;
          width: 220px; height: 220px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(0,153,218,.22) 0%, transparent 70%);
          pointer-events: none;
        }
        .ef-sidebar::after {
          content: '';
          position: absolute;
          bottom: -40px; left: -40px;
          width: 180px; height: 180px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(0,87,168,.3) 0%, transparent 70%);
          pointer-events: none;
        }

        .sb-logo {
          padding: 22px 18px 18px;
          border-bottom: 1px solid rgba(255,255,255,.09);
          position: relative; z-index: 1;
          display: flex; align-items: center; gap: 12px;
        }
        .sb-monogram {
          width: 40px; height: 40px; border-radius: 12px;
          background: rgba(255,255,255,.13);
          border: 1px solid rgba(255,255,255,.2);
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .sb-ef-letters { font-size: 15px; font-weight: 800; color: #fff; letter-spacing: -1.5px; line-height: 1; }
        .sb-ef-sub { font-size: 6px; font-weight: 600; color: rgba(255,255,255,.45); letter-spacing: 1.5px; text-transform: uppercase; }
        .sb-brand-name { font-size: 15px; font-weight: 700; color: #fff; line-height: 1.2; }
        .sb-brand-tagline { font-size: 10px; color: rgba(255,255,255,.45); }

        .sb-nav { flex: 1; padding: 12px 10px 8px; position: relative; z-index: 1; overflow-y: auto; }
        .sb-section-label {
          font-size: 9px; font-weight: 700;
          color: rgba(255,255,255,.3); letter-spacing: 1.5px;
          text-transform: uppercase; padding: 10px 8px 4px;
        }
        .sb-item {
          display: flex; align-items: center; gap: 9px;
          padding: 8px 10px; border-radius: 9px;
          margin-bottom: 1px; cursor: pointer;
          font-size: 13px; font-weight: 500;
          color: rgba(255,255,255,.65);
          transition: background .15s, color .15s;
          user-select: none;
        }
        .sb-item:hover { background: rgba(255,255,255,.08); color: rgba(255,255,255,.9); }
        .sb-item.active {
          background: rgba(0,153,218,.25);
          color: #fff;
          font-weight: 600;
        }
        .sb-item-icon { width: 16px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .sb-badge {
          margin-left: auto; font-size: 10px; font-weight: 700;
          background: rgba(0,153,218,.35); color: #0099DA;
          border-radius: 10px; padding: 1px 8px; min-width: 24px;
          text-align: center;
        }

        .sb-footer {
          border-top: 1px solid rgba(255,255,255,.09);
          padding: 14px 14px; position: relative; z-index: 1;
          display: flex; align-items: center; gap: 10px;
        }
        .sb-avatar {
          width: 32px; height: 32px; border-radius: 50%;
          background: rgba(255,255,255,.15); border: 1.5px solid rgba(255,255,255,.2);
          display: flex; align-items: center; justify-content: center;
          font-size: 11px; font-weight: 700; color: #fff; flex-shrink: 0;
        }
        .sb-user-name { font-size: 12.5px; font-weight: 600; color: #fff; }
        .sb-user-role { font-size: 10px; color: rgba(255,255,255,.4); margin-top: 1px; }
        .sb-logout {
          margin-left: auto; cursor: pointer; opacity: .45;
          transition: opacity .15s; flex-shrink: 0;
        }
        .sb-logout:hover { opacity: .8; }

        /* ── MAIN ── */
        .ef-main {
          flex: 1; display: flex; flex-direction: column;
          overflow: hidden; min-width: 0;
        }

        /* TOPBAR */
        .ef-topbar {
          background: #fff; border-bottom: 1px solid #e4e7ee;
          padding: 0 28px; height: 60px;
          display: flex; align-items: center; justify-content: space-between;
          flex-shrink: 0; gap: 16px;
        }
        .tb-left h1 { font-size: 16px; font-weight: 800; color: #003087; }
        .tb-left p { font-size: 11px; color: #94a3b8; margin-top: 1px; }
        .tb-right { display: flex; align-items: center; gap: 10px; }

        .tb-search {
          display: flex; align-items: center; gap: 7px;
          background: #f4f6fb; border: 1px solid #e4e7ee;
          border-radius: 9px; padding: 7px 12px;
          font-size: 12.5px; color: #94a3b8;
          font-family: 'Plus Jakarta Sans', sans-serif;
          width: 200px;
        }

        .tb-btn {
          display: flex; align-items: center; gap: 6px;
          padding: 8px 14px; border-radius: 9px;
          font-size: 12.5px; font-weight: 600;
          cursor: pointer; border: none;
          font-family: 'Plus Jakarta Sans', sans-serif;
          transition: opacity .15s, transform .1s;
        }
        .tb-btn:active { transform: scale(.98); }
        .tb-btn.secondary { background: #f4f6fb; color: #374151; border: 1px solid #e4e7ee; }
        .tb-btn.secondary:hover { background: #eef0f6; }
        .tb-btn.primary { background: #003087; color: #fff; }
        .tb-btn.primary:hover { background: #002470; }

        .tb-user-wrap { position: relative; }
        .tb-user-btn {
          display: flex; align-items: center; gap: 8px;
          padding: 5px 10px 5px 5px;
          border: 1px solid #e4e7ee; border-radius: 10px;
          background: #fff; cursor: pointer; font-family: 'Plus Jakarta Sans', sans-serif;
          transition: background .15s;
        }
        .tb-user-btn:hover { background: #f4f6fb; }
        .tb-user-avatar {
          width: 28px; height: 28px; border-radius: 50%;
          background: #003087; color: #fff;
          display: flex; align-items: center; justify-content: center;
          font-size: 10px; font-weight: 700;
        }
        .tb-user-name { font-size: 12.5px; font-weight: 600; color: #0d1b2e; }
        .tb-user-caret { color: #94a3b8; font-size: 10px; margin-left: 2px; }

        .user-dropdown {
          position: absolute; top: calc(100% + 8px); right: 0;
          background: #fff; border: 1px solid #e4e7ee;
          border-radius: 12px; box-shadow: 0 8px 28px rgba(0,48,135,.1);
          min-width: 200px; z-index: 1000; overflow: hidden;
          animation: scaleIn .15s ease;
        }
        .ud-header { padding: 12px 16px; background: #f8faff; border-bottom: 1px solid #e4e7ee; }
        .ud-header .name { font-size: 13px; font-weight: 700; color: #003087; }
        .ud-header .dept { font-size: 11px; color: #94a3b8; margin-top: 2px; }
        .ud-item {
          display: flex; align-items: center; gap: 10px;
          padding: 10px 16px; font-size: 12.5px; color: #374151;
          cursor: pointer; transition: background .1s;
        }
        .ud-item:hover { background: #f4f6fb; }
        .ud-item.danger { color: #dc2626; }
        .ud-item.danger:hover { background: #fef2f2; }

        /* QUICK CHIPS */
        .ef-chips {
          background: #fff; border-bottom: 1px solid #e4e7ee;
          padding: 10px 28px; display: flex; align-items: center;
          gap: 8px; flex-wrap: wrap; flex-shrink: 0;
        }
        .chip {
          display: inline-flex; align-items: center; gap: 6px;
          background: #f4f6fb; border: 1px solid #e4e7ee;
          border-radius: 20px; padding: 6px 14px;
          font-size: 12px; font-weight: 600; color: #003087;
          cursor: pointer; transition: background .15s, border-color .15s;
          white-space: nowrap; font-family: 'Plus Jakarta Sans', sans-serif;
        }
        .chip:hover { background: #ebf3ff; border-color: #b3d4f0; color: #0057a8; }
        .chip-icon { color: #0099DA; }

        /* CONTENT */
        .ef-content {
          flex: 1; overflow-y: auto;
          padding: 22px 28px 24px;
          display: flex; flex-direction: column; gap: 20px;
        }

        /* METRICS */
        .metrics-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }
        .metric-card {
          background: #fff; border: 1px solid #e4e7ee;
          border-radius: 14px; padding: 18px;
          animation: fadeUp .4s ease both;
        }
        .metric-card:nth-child(1) { animation-delay: .05s; }
        .metric-card:nth-child(2) { animation-delay: .1s; }
        .metric-card:nth-child(3) { animation-delay: .15s; }
        .metric-card:nth-child(4) { animation-delay: .2s; }
        .mc-label { font-size: 11px; color: #94a3b8; font-weight: 600; text-transform: uppercase; letter-spacing: .5px; margin-bottom: 8px; }
        .mc-value { font-size: 30px; font-weight: 800; color: #003087; line-height: 1; font-variant-numeric: tabular-nums; }
        .mc-trend { display: flex; align-items: center; gap: 4px; font-size: 11.5px; font-weight: 600; margin-top: 8px; }
        .trend-up { color: #00833E; } .trend-down { color: #dc2626; }
        .mc-bar { height: 4px; background: #eef0f5; border-radius: 2px; margin-top: 12px; overflow: hidden; }
        .mc-bar-fill { height: 100%; border-radius: 2px; transition: width .6s ease; }

        /* GRID 2 */
        .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .grid-3-2 { display: grid; grid-template-columns: 3fr 2fr; gap: 16px; }

        .panel {
          background: #fff; border: 1px solid #e4e7ee;
          border-radius: 14px; padding: 20px;
          animation: fadeUp .4s ease both; animation-delay: .2s;
        }
        .panel-header {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 16px;
        }
        .panel-title { font-size: 13.5px; font-weight: 700; color: #0d1b2e; }
        .panel-action { font-size: 12px; color: #0099DA; cursor: pointer; font-weight: 600; transition: color .15s; }
        .panel-action:hover { color: #0077b3; }

        /* DEMAND LIST */
        .demand-list { display: flex; flex-direction: column; gap: 8px; }
        .demand-row {
          display: flex; align-items: center; gap: 10px;
          padding: 10px 12px; border-radius: 10px;
          background: #f8faff; border: 1px solid #eef0f7;
          transition: background .15s, border-color .15s;
        }
        .demand-row:hover { background: #f0f4ff; border-color: #d8e4f4; }
        .demand-id {
          font-size: 10.5px; font-weight: 700; color: #003087;
          background: #e8eff9; border-radius: 6px;
          padding: 3px 8px; flex-shrink: 0; font-family: 'DM Mono', monospace;
        }
        .demand-body { flex: 1; min-width: 0; }
        .demand-title { font-size: 12.5px; font-weight: 600; color: #0d1b2e; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .demand-meta { font-size: 10.5px; color: #94a3b8; margin-top: 2px; }
        .badge {
          font-size: 10.5px; font-weight: 700; padding: 3px 9px;
          border-radius: 20px; flex-shrink: 0; white-space: nowrap;
        }
        .badge-high { background: #fee2e2; color: #991b1b; }
        .badge-med  { background: #fef3c7; color: #78350f; }
        .badge-low  { background: #dcfce7; color: #14532d; }
        .badge-open   { background: #dbeafe; color: #1e40af; }
        .badge-review { background: #f3e8ff; color: #581c87; }
        .badge-done   { background: #dcfce7; color: #14532d; }
        .badge-pending { background: #fef9c3; color: #713f12; }

        /* CHART */
        .bar-chart { display: flex; align-items: flex-end; gap: 6px; height: 120px; padding-bottom: 0; }
        .bar-col { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px; height: 100%; }
        .bar-wrap { flex: 1; display: flex; align-items: flex-end; width: 100%; }
        .bar { width: 100%; border-radius: 5px 5px 0 0; cursor: pointer; transition: opacity .15s; }
        .bar:hover { opacity: .8; }
        .bar-label { font-size: 10px; color: #94a3b8; font-weight: 500; }

        /* TYPE BREAKDOWN */
        .type-list { display: flex; flex-direction: column; gap: 10px; }
        .type-row { display: flex; flex-direction: column; gap: 3px; }
        .type-header { display: flex; justify-content: space-between; font-size: 12px; }
        .type-name { color: #374151; font-weight: 500; }
        .type-pct { color: #94a3b8; font-weight: 600; }
        .type-track { height: 5px; background: #eef0f5; border-radius: 3px; overflow: hidden; }
        .type-fill { height: 100%; border-radius: 3px; transition: width .8s ease; }

        /* ACTIVITY */
        .activity-list { display: flex; flex-direction: column; gap: 12px; }
        .activity-item { display: flex; align-items: flex-start; gap: 10px; }
        .act-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; margin-top: 4px; }
        .act-content { flex: 1; }
        .act-text { font-size: 12.5px; color: #374151; line-height: 1.4; }
        .act-time { font-size: 10.5px; color: #94a3b8; margin-top: 2px; }

        /* BOTTOM STAT ROW */
        .stat-pills { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 4px; }
        .stat-pill {
          display: flex; align-items: center; gap: 7px;
          background: #f4f6fb; border: 1px solid #e4e7ee;
          border-radius: 10px; padding: 8px 14px;
          font-size: 12px;
        }
        .stat-pill-label { color: #94a3b8; font-weight: 500; }
        .stat-pill-value { color: #003087; font-weight: 700; }
        .stat-pill-bar { flex: 1; height: 4px; background: #e4e7ee; border-radius: 2px; min-width: 60px; overflow: hidden; }
        .stat-pill-fill { height: 100%; border-radius: 2px; }

        /* ── CHAT WIDGET ── */
        .chat-fab {
          position: fixed; bottom: 24px; right: 24px;
          width: 52px; height: 52px; border-radius: 50%;
          border: none; background: #003087; color: #fff;
          cursor: pointer; display: flex; align-items: center; justify-content: center;
          box-shadow: 0 6px 20px rgba(0,48,135,.35);
          transition: transform .2s, background .15s;
          z-index: 900;
        }
        .chat-fab:hover { transform: scale(1.07); background: #002470; }
        .chat-fab-badge {
          position: absolute; top: -3px; right: -3px;
          width: 18px; height: 18px; border-radius: 50%;
          background: #0099DA; font-size: 9px; font-weight: 700;
          color: #fff; display: flex; align-items: center; justify-content: center;
          border: 2px solid #fff;
        }

        .chat-panel {
          position: fixed; z-index: 1000;
          background: #fff; display: flex; flex-direction: column;
          box-shadow: 0 20px 50px rgba(0,0,0,.2);
          transition: all .25s cubic-bezier(.4,0,.2,1);
          overflow: hidden;
        }
        .chat-panel.normal {
          width: 400px; height: min(540px, calc(100vh - 44px));
          bottom: 24px; right: 24px; border-radius: 18px;
          animation: slideIn .25s ease;
        }
        .chat-panel.maximized {
          width: 100vw; height: 100vh;
          bottom: 0; right: 0; border-radius: 0;
        }

        .chat-header {
          height: 54px; min-height: 54px; padding: 0 14px;
          display: flex; align-items: center; justify-content: space-between;
          border-bottom: 1px solid #eef0f5; flex-shrink: 0;
          background: #fff;
        }
        .chat-header-left { display: flex; align-items: center; gap: 10px; }
        .chat-online-dot { width: 9px; height: 9px; border-radius: 50%; background: #00a854; animation: pulse 2.5s ease-in-out infinite; }
        .chat-title { font-size: 14px; font-weight: 700; color: #0d1b2e; }
        .chat-header-right { display: flex; align-items: center; gap: 6px; }
        .chat-icon-btn {
          border: none; background: #f4f6fb; padding: 6px 9px;
          border-radius: 8px; cursor: pointer; display: flex;
          align-items: center; justify-content: center;
          transition: background .15s;
        }
        .chat-icon-btn:hover { background: #eef0f5; }
        .chat-close-btn {
          border: none; background: #fee2e2; color: #b91c1c;
          padding: 6px 9px; border-radius: 8px; cursor: pointer;
          font-size: 12px; font-weight: 600; transition: background .15s;
        }
        .chat-close-btn:hover { background: #fecaca; }

        .chat-messages {
          flex: 1 1 auto; min-height: 0; overflow-y: auto;
          padding: 14px; background: #f8faff;
          display: flex; flex-direction: column; gap: 6px;
        }

        .chat-empty {
          flex: 1; display: flex; flex-direction: column;
          align-items: flex-start; gap: 10px;
          background: #fff; border: 1px solid #e4e7ee;
          border-radius: 14px; padding: 16px 18px;
          margin-bottom: 4px;
        }
        .ce-greeting { font-size: 15px; font-weight: 700; color: #0d1b2e; }
        .ce-sub { font-size: 12.5px; color: #64748b; line-height: 1.6; }
        .ce-btn {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 7px 14px; background: #003087; color: #fff;
          border: none; border-radius: 8px; font-size: 12px;
          font-weight: 600; cursor: pointer; font-family: 'Plus Jakarta Sans', sans-serif;
          transition: background .15s;
        }
        .ce-btn:hover { background: #002470; }
        .ce-btn-outline {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 7px 14px; background: #fff; color: #003087;
          border: 1px solid #003087; border-radius: 8px; font-size: 12px;
          font-weight: 600; cursor: pointer; font-family: 'Plus Jakarta Sans', sans-serif;
          transition: background .15s;
        }
        .ce-btn-outline:hover { background: #f0f4ff; }

        .msg-row { display: flex; }
        .msg-row.user { justify-content: flex-end; }
        .msg-row.assistant { justify-content: flex-start; }
        .msg-bubble {
          padding: 10px 13px; border-radius: 14px;
          font-size: 13.5px; line-height: 1.6;
        }
        .msg-bubble.user { background: #003087; color: #fff; border-bottom-right-radius: 4px; max-width: 75%; }
        .msg-bubble.assistant {
          background: #fff; color: #0d1b2e;
          border: 1px solid #e4e7ee; border-bottom-left-radius: 4px;
          box-shadow: 0 1px 4px rgba(0,0,0,.04); max-width: 92%;
        }

        .option-btns { display: flex; gap: 8px; flex-wrap: wrap; padding: 4px 0 8px; }

        .option-btns.vertical {
          flex-direction: column;
          max-height: 220px;
          overflow-y: auto;
          flex-wrap: nowrap;
          padding-right: 4px;
        }
        .option-btns.vertical .option-btn {
          text-align: left;
          border-radius: 8px;
          width: 100%;
        }
        .option-btn {
          border: 1.5px solid #003087; background: #fff; color: #003087;
          padding: 7px 14px; border-radius: 20px; cursor: pointer;
          font-size: 12.5px; font-weight: 600;
          font-family: 'Plus Jakarta Sans', sans-serif;
          transition: all .15s;
        }
        .option-btn:hover { background: #003087; color: #fff; }

        .chat-input-bar {
          display: flex; align-items: flex-end; gap: 8px;
          padding: 10px 12px; border-top: 1px solid #eef0f5;
          background: #fff; flex-shrink: 0;
        }
        .chat-textarea {
          flex: 1; padding: 9px 12px; border-radius: 10px;
          border: 1.5px solid #dde1ea; outline: none;
          font-size: 13.5px; line-height: 1.5; resize: none;
          font-family: 'Plus Jakarta Sans', sans-serif;
          background: #f8faff; color: #0d1b2e;
          transition: border-color .15s, background .15s;
        }
        .chat-textarea:focus { border-color: #003087; background: #fff; }
        .chat-textarea::placeholder { color: #b0bac9; }
        .chat-send-btn {
          width: 40px; height: 40px; border: none; background: #003087;
          color: #fff; border-radius: 10px; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0; box-shadow: 0 2px 8px rgba(0,48,135,.3);
          transition: background .15s;
        }
        .chat-send-btn:hover { background: #002470; }

        .chat-footer {
          padding: 7px 14px; border-top: 1px solid #eef0f5;
          display: flex; align-items: center; justify-content: space-between;
          flex-shrink: 0; background: #fff;
        }
        .cf-powered { font-size: 10.5px; color: #b0bac9; display: flex; align-items: center; gap: 5px; }
        .cf-user { font-size: 10.5px; color: #b0bac9; }

        .chat-thinking { font-size: 12px; color: #94a3b8; padding: 4px 0; font-style: italic; }

        .table-wrap { overflow-x: auto; margin: 8px 0; border-radius: 8px; border: 1px solid #e4e7ee; }
        .table-wrap table { border-collapse: collapse; width: 100%; font-size: 12.5px; }
        .table-wrap th { background: #003087; color: #fff; padding: 8px 12px; text-align: left; font-weight: 600; }
        .table-wrap td { padding: 7px 12px; border-bottom: 1px solid #eef0f5; color: #374151; }
        .table-wrap tr:last-child td { border-bottom: none; }
        .table-wrap tr:nth-child(even) td { background: #f8faff; }
        code { background: #eef0f5; padding: 1px 5px; border-radius: 4px; font-size: 12px; font-family: 'DM Mono', monospace; }

        @media (max-width: 900px) {
          .ef-sidebar { display: none; }
          .metrics-grid { grid-template-columns: repeat(2, 1fr); }
          .grid-2, .grid-3-2 { grid-template-columns: 1fr; }
        }
        @media (max-width: 600px) {
          .ef-topbar { padding: 0 16px; }
          .ef-content { padding: 16px; }
          .chat-panel.normal { width: calc(100vw - 20px); right: 10px; bottom: 10px; }
        }
      `}</style>

      <div className="ef-root">

        {/* ── SIDEBAR ─────────────────────────────────────────────── */}
        <aside className="ef-sidebar">
          <div className="sb-logo">
            <div className="sb-monogram">
              <span className="sb-ef-letters">EF</span>
              <span className="sb-ef-sub">Ask EF</span>
            </div>
            <div>
              <div className="sb-brand-name">Ask EF</div>
              <div className="sb-brand-tagline">Experience Factory</div>
            </div>
          </div>

          <nav className="sb-nav">
            <div className="sb-section-label">Main</div>
            {NAV_ITEMS.map((item) => (
              <div
                key={item.label}
                className={`sb-item ${activeNav === item.label ? "active" : ""}`}
                onClick={() => setActiveNav(item.label)}
              >
                <span className="sb-item-icon">
                  <Icon name={item.icon} size={14} color="rgba(255,255,255,0.8)" />
                </span>
                {item.label}
                {item.badge && <span className="sb-badge">{item.badge}</span>}
              </div>
            ))}

            <div className="sb-section-label" style={{ marginTop: 8 }}>Admin</div>
            {NAV_ADMIN.map((item) => (
              <div
                key={item.label}
                className={`sb-item ${activeNav === item.label ? "active" : ""}`}
                onClick={() => setActiveNav(item.label)}
              >
                <span className="sb-item-icon">
                  <Icon name={item.icon} size={14} color="rgba(255,255,255,0.8)" />
                </span>
                {item.label}
              </div>
            ))}
          </nav>

          <div className="sb-footer">
            <div className="sb-avatar">
              {user?.Name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="sb-user-name">{user?.Name}</div>
              <div className="sb-user-role">{user?.Department || "IT Department"}</div>
            </div>
            <div className="sb-logout" onClick={logout} title="Sign out">
              <Icon name="logout" size={15} color="rgba(255,255,255,0.7)" />
            </div>
          </div>
        </aside>

        {/* ── MAIN ────────────────────────────────────────────────── */}
        <div className="ef-main">
          {/* QUICK CHIPS */}
          <div className="ef-chips">
            <span className="chip" onClick={triggerNewIntake}>
              <span className="chip-icon"><Icon name="plus" size={12} color="#0099DA" /></span>
              Submit New Demand
            </span>
            <span className="chip">
              <span className="chip-icon"><Icon name="chart" size={12} color="#0099DA" /></span>
              Power BI Insights
            </span>
            <span className="chip">
              <span className="chip-icon"><Icon name="inbox" size={12} color="#0099DA" /></span>
              Analyse Data
            </span>
            <span className="chip">
              <span className="chip-icon"><Icon name="gear" size={12} color="#0099DA" /></span>
              Raise IT Request
            </span>
            <span className="chip">
              <span className="chip-icon"><Icon name="chart" size={12} color="#0099DA" /></span>
              Generate Report
            </span>
          </div>

          {/* CONTENT AREA */}
          <main className="ef-content">

          </main>
        </div>
      </div>

      {/* ── CHAT WIDGET ─────────────────────────────────────────────────── */}
      {chatMode === "closed" && (
        <button className="chat-fab" onClick={() => setChatMode("open")}>
          <Icon name="chat" size={20} color="#fff" />
          <div className="chat-fab-badge">AI</div>
        </button>
      )}

      {chatMode === "open" && (
        <div className={`chat-panel ${chatMax ? "maximized" : "normal"}`}>
          {/* Header */}
          <div className="chat-header">
            <div className="chat-header-left">
              <div className="chat-online-dot" />
              <span className="chat-title">Ask EF</span>
            </div>
            <div className="chat-header-right">
              <button
                className="chat-icon-btn"
                title="Reset conversation"
                onClick={() => {
                  setMessages([]);
                  setManualStep(null);
                  setManualData({});
                  setEditStep(null);
                  setEditMode(null);
                  setEditIntakeId(null);
                }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
                  <path d="M3 3v5h5"></path>
                </svg>
              </button>
              <button className="chat-icon-btn" onClick={() => setChatMax(!chatMax)} title={chatMax ? "Restore" : "Maximize"}>
                <Icon name={chatMax ? "restore" : "maximize"} size={13} color="#555" />
              </button>
              <button className="chat-close-btn" onClick={() => setChatMode("closed")}>✕</button>
            </div>
          </div>

          {/* Messages */}
          <div className="chat-messages" ref={chatBoxRef}>
            {messages.length === 0 && (
              <div className="chat-empty">
                <div className="ce-greeting">👋 Hi {firstName}!</div>
                <div className="ce-sub">
                  Welcome to <strong>Ask EF</strong> — your unified AI interface for all Abbott enterprise use cases.
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 4 }}>
                  <button className="ce-btn" onClick={triggerNewIntake}>+ Submit a New Demand</button>
                  <button className="ce-btn-outline">Query Demand</button>
                </div>
              </div>
            )}

            {messages.map((m, i) => (
              <div key={i}>
                <div className={`msg-row ${m.role}`}>
                  <div
                    className={`msg-bubble ${m.role}`}
                    dangerouslySetInnerHTML={m.role === "assistant" ? { __html: renderMarkdown(m.content) } : undefined}
                  >
                    {m.role === "user" ? m.content : undefined}
                  </div>
                </div>

                {m.type === "intake-options" && i === messages.length - 1 && (
                  <div className="option-btns">
                    <button className="option-btn" onClick={startPortalLink}>📋 By Portal Link?</button>
                    <button className="option-btn" onClick={() => setShowFormModal(true)}>📋 Form?</button>
                    <button className="option-btn" onClick={startManual}>✍️ Manually?</button>
                    <button className="option-btn" onClick={() => setShowMomModal(true)}>📄 MoM Document?</button>
                  </div>
                )}

                {m.type === "edit-choose" && i === messages.length - 1 && editMode === "choose" && (
                  <div className="option-btns">
                    <button className="option-btn" onClick={() => handleEditAction("edit-link")}>🔗 Edit by Portal Link?</button>
                    <button className="option-btn" onClick={() => handleEditAction("manually")}>✍️ Manually?</button>
                  </div>
                )}

                {m.type === "edit-field-select" && i === messages.length - 1 && editStep === -1 && (
                  <div className="option-btns vertical">
                    {EDIT_STEPS.map(s => (
                      <button key={s.key} className="option-btn"
                        onClick={() => handleEditAnswer(s.key, s.label)}>
                        {s.label}
                      </button>
                    ))}
                  </div>
                )}

                {m.type === "edit-another" && i === messages.length - 1 && editStep === -1 && (
                  <div className="option-btns">
                    <button className="option-btn" onClick={() => {
                      addMsg("user", "Edit another field");
                      addMsg("assistant", `Which field would you like to edit next?`, "edit-field-select");
                    }}>✏️ Edit Another Field</button>
                    <button style={submitBtn} onClick={() => {
                      addMsg("user", "Submit");
                      handleEditSubmit();
                    }}>✅ Submit</button>
                  </div>
                )}
              </div>
            ))}

            {manualStep !== null && (
              <ManualStepWidget
                step={MANUAL_STEPS[manualStep]}
                masterData={masterData}
                onAnswer={handleManualAnswer}
              />
            )}

            {editStep !== null && editStep >= 0 && (
              <ManualStepWidget
                step={EDIT_STEPS[editStep]}
                masterData={masterData}
                onAnswer={handleEditAnswer}
              />
            )}

            {loading && <div className="chat-thinking">⏳ Thinking...</div>}
          </div>

          {/* Input */}
          <div className="chat-input-bar">
            <textarea
              className="chat-textarea"
              value={msg}
              onChange={(e) => setMsg(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder="Type your message... (Shift+Enter for new line)"
              rows={2}
            />
            <button className="chat-send-btn" onClick={send} title="Send">
              <Icon name="send" size={16} color="#fff" />
            </button>
          </div>

          <div className="chat-footer">
            <div className="cf-powered">
              <Icon name="cpu" size={11} color="#b0bac9" />
              Powered by Azure OpenAI
            </div>
            <div className="cf-user">{user?.Username}</div>
          </div>
        </div>
      )}

      {/* ── MODALS ──────────────────────────────────────────────────────── */}
      {showFormModal && (
        <IntakeFormModal
          masterData={masterData}
          onClose={() => setShowFormModal(false)}
          onSuccess={handleSuccess}
          userId={user?.UserID}
        />
      )}
      {showMomModal && (
        <MoMModal
          masterData={masterData}
          onClose={() => setShowMomModal(false)}
          onSuccess={handleSuccess}
          userId={user?.UserID}
        />
      )}
    </>
  );
}

// ── SHARED MODAL STYLES ────────────────────────────────────────────────────────
const modalOverlay: any = {
  position: "fixed", inset: 0, background: "rgba(0,0,0,.5)",
  display: "flex", alignItems: "center", justifyContent: "center", zIndex: 99999,
};
const modalBox: any = {
  background: "#fff", borderRadius: 16, width: "min(480px,95vw)",
  maxHeight: "90vh", display: "flex", flexDirection: "column",
  boxShadow: "0 25px 60px rgba(0,0,0,.25)", overflow: "hidden",
};
const modalHeader: any = {
  padding: "16px 20px", borderBottom: "1px solid #eee",
  display: "flex", alignItems: "center", justifyContent: "space-between",
  background: "#f8faff",
};
const modalBody: any = {
  padding: "16px 20px", overflowY: "auto",
  display: "flex", flexDirection: "column", gap: 10,
};
const modalFooter: any = {
  padding: "12px 20px", borderTop: "1px solid #eee",
  display: "flex", justifyContent: "flex-end", gap: 10, background: "#f8faff",
};
const lbl: any = { fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 2 };
const req: any = { color: "#ef4444" };
const fInput: any = {
  width: "100%", padding: "9px 12px", borderRadius: 8,
  border: "1px solid #d1d5db", fontSize: 14, outline: "none",
  fontFamily: "'Plus Jakarta Sans', sans-serif", boxSizing: "border-box",
};
const fSelect: any = {
  width: "100%", padding: "9px 12px", borderRadius: 8,
  border: "1px solid #d1d5db", fontSize: 14, outline: "none",
  background: "#fff", boxSizing: "border-box",
  fontFamily: "'Plus Jakarta Sans', sans-serif",
};
const row2: any = { display: "flex", gap: 12 };
const errMsg: any = { background: "#fee2e2", color: "#b91c1c", padding: "8px 12px", borderRadius: 8, fontSize: 13 };
const cancelBtn: any = {
  padding: "9px 18px", border: "1px solid #d1d5db", background: "#fff",
  borderRadius: 8, cursor: "pointer", fontSize: 14, color: "#374151",
  fontFamily: "'Plus Jakarta Sans', sans-serif",
};
const submitBtn: any = {
  padding: "9px 18px", border: "none", background: "#003087",
  color: "#fff", borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: 600,
  fontFamily: "'Plus Jakarta Sans', sans-serif",
};
const closeBtnSm: any = {
  border: "none", background: "#fee2e2", color: "#b91c1c",
  padding: "4px 8px", borderRadius: 6, cursor: "pointer", fontSize: 12,
};
const uploadArea: any = {
  border: "2px dashed #d1d5db", borderRadius: 12, padding: "24px 16px",
  textAlign: "center", cursor: "pointer", display: "flex",
  flexDirection: "column", alignItems: "center", gap: 6, background: "#f9fafb",
};
const parsingMsg: any = {
  background: "#eff6ff", color: "#003087", padding: "10px 14px",
  borderRadius: 8, fontSize: 13, textAlign: "center",
};