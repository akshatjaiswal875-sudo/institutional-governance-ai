"use client";

import { ChangeEvent, useEffect, useState } from "react";
import { Badge, Card } from "@/components/ui";

type Intelligence = { recordings: any[]; transcripts: any[]; analyses: any[] };

export function MeetingIntelligence({ meetingId }: { meetingId: string }) {
  const [data, setData] = useState<Intelligence>({ recordings: [], transcripts: [], analyses: [] });
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [summary, setSummary] = useState("");
  const [suggestedMinutes, setSuggestedMinutes] = useState("");
  const [decisions, setDecisions] = useState("[]");
  const [actionItems, setActionItems] = useState("[]");

  async function load() {
    const response = await fetch(`/api/meetings/${meetingId}/intelligence`);
    const result = await response.json();
    if (!response.ok) throw new Error(result.error ?? "Unable to load intelligence.");
    setData(result.data);
    const analysis = result.data.analyses?.[0];
    if (analysis) {
      setSummary(analysis.summary ?? "");
      setSuggestedMinutes(analysis.suggested_minutes ?? "");
      setDecisions(JSON.stringify(analysis.extracted_decisions ?? [], null, 2));
      setActionItems(JSON.stringify(analysis.extracted_action_items ?? [], null, 2));
    }
  }
  useEffect(() => { load().catch(value => setError(value instanceof Error ? value.message : "Unable to load intelligence.")); }, [meetingId]);

  async function upload(event: ChangeEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file || loading) return;
    setLoading(true); setError(""); setMessage("");
    try {
      const form = new FormData(); form.append("file", file);
      const response = await fetch(`/api/meetings/${meetingId}/recordings`, { method: "POST", body: form });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Upload failed.");
      setMessage("Recording uploaded. Start processing when ready."); setFile(null); await load();
    } catch (value) { setError(value instanceof Error ? value.message : "Upload failed."); } finally { setLoading(false); }
  }
  async function process(recordingId: string) {
    if (processing) return;
    setProcessing(true); setError(""); setMessage("Transcribing and analyzing recording...");
    try {
      const response = await fetch(`/api/meetings/${meetingId}/intelligence/process`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ recordingId }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Processing failed.");
      setMessage("AI analysis completed and is ready for review."); await load();
    } catch (value) { setError(value instanceof Error ? value.message : "Processing failed."); await load().catch(() => undefined); } finally { setProcessing(false); }
  }
  async function approve() {
    const analysis = data.analyses[0];
    if (!analysis) return;
    setLoading(true); setError("");
    try {
      const response = await fetch(`/api/meetings/${meetingId}/intelligence/approve`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ analysisId: analysis.id, summary, suggestedMinutes, decisions: JSON.parse(decisions), actionItems: JSON.parse(actionItems) }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Approval failed.");
      setMessage("AI results approved and saved to the meeting record."); await load();
    } catch (value) { setError(value instanceof Error ? value.message : "Approval failed. Check the JSON fields."); } finally { setLoading(false); }
  }
  const latestAnalysis = data.analyses[0];
  return <Card title="AI Meeting Intelligence"><div className="space-y-5"><div><h3 className="mb-2 font-semibold">Upload recording</h3><form onSubmit={upload} className="flex flex-wrap items-center gap-3"><input type="file" accept="audio/*,video/*" onChange={event => setFile(event.target.files?.[0] ?? null)} required /><button className="btn btn-primary" disabled={loading || !file}>{loading ? "Uploading..." : "Upload recording"}</button></form>{file && <p className="mt-2 text-sm text-slate-400">{file.name} · {(file.size / 1024 / 1024).toFixed(2)} MB</p>}</div>{data.recordings.map(recording => <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-800 p-3" key={recording.id}><div><p>{recording.original_filename}</p><p className="text-sm text-slate-400">{recording.status} · {(recording.file_size / 1024 / 1024).toFixed(2)} MB</p>{recording.error_message && <p className="text-sm text-red-400">{recording.error_message}</p>}</div>{["uploaded", "failed"].includes(recording.status) && <button className="btn btn-secondary" onClick={() => process(recording.id)} disabled={processing}>{processing ? "Processing..." : recording.status === "failed" ? "Retry processing" : "Process recording"}</button>}</div>)}{latestAnalysis && <div className="space-y-4 border-t border-slate-800 pt-5"><div className="flex flex-wrap items-center justify-between gap-3"><h3 className="font-semibold">AI Generated - Requires Review</h3><Badge>{latestAnalysis.status}</Badge></div><label className="block text-sm text-slate-300">Summary<textarea className="textarea mt-1" value={summary} onChange={event => setSummary(event.target.value)} /></label><label className="block text-sm text-slate-300">Suggested minutes<textarea className="textarea mt-1" value={suggestedMinutes} onChange={event => setSuggestedMinutes(event.target.value)} /></label><label className="block text-sm text-slate-300">Extracted decisions (JSON)<textarea className="textarea mt-1 font-mono text-xs" value={decisions} onChange={event => setDecisions(event.target.value)} /></label><label className="block text-sm text-slate-300">Extracted action items (JSON)<textarea className="textarea mt-1 font-mono text-xs" value={actionItems} onChange={event => setActionItems(event.target.value)} /></label>{latestAnalysis.status !== "approved" && <button className="btn btn-primary" onClick={approve} disabled={loading}>{loading ? "Saving..." : "Approve AI results"}</button>}</div>}{message && <p className="text-emerald-300" role="status">{message}</p>}{error && <p className="text-red-400" role="alert">{error}</p>}</div></Card>;
}
