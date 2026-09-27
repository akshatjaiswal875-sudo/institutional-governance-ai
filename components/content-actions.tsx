"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function EventForm() {
	const [open, setOpen] = useState(false);
	const [error, setError] = useState("");
	const [saving, setSaving] = useState(false);
	const router = useRouter();
	async function submit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault(); if (saving) return; setSaving(true); setError("");
		const form = new FormData(event.currentTarget);
		try { const response = await fetch("/api/events", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(Object.fromEntries(form)) }); const result = await response.json(); if (!response.ok) { setError(result.error ?? "Could not create event."); return; } setOpen(false); event.currentTarget.reset(); router.refresh(); } catch { setError("Could not create event. Please try again."); } finally { setSaving(false); }
	}
	return <div className="space-y-3"><button type="button" className="btn btn-primary" onClick={() => setOpen(!open)}>{open ? "Cancel" : "New event"}</button>{open && <form onSubmit={submit} className="card max-w-xl space-y-3 p-5"><input className="input" name="title" placeholder="Event title" required /><div className="grid gap-3 sm:grid-cols-2"><input className="input" name="startTime" type="datetime-local" required /><input className="input" name="endTime" type="datetime-local" required /></div><input className="input" name="location" placeholder="Location" /><textarea className="textarea" name="description" placeholder="Description" /><button className="btn btn-primary" type="submit" disabled={saving}>{saving ? "Saving..." : "Save event"}</button>{error && <p className="text-red-400" role="alert">{error}</p>}</form>}</div>;
}

export function PolicyForm() {
	const [open, setOpen] = useState(false);
	const [error, setError] = useState("");
	const [saving, setSaving] = useState(false);
	const router = useRouter();
	async function submit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault(); if (saving) return; setSaving(true); setError("");
		const form = new FormData(event.currentTarget);
		try { const response = await fetch("/api/policies", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(Object.fromEntries(form)) }); const result = await response.json(); if (!response.ok) { setError(result.error ?? "Could not create policy."); return; } setOpen(false); event.currentTarget.reset(); router.refresh(); } catch { setError("Could not create policy. Please try again."); } finally { setSaving(false); }
	}
	return <div className="space-y-3"><button type="button" className="btn btn-primary" onClick={() => setOpen(!open)}>{open ? "Cancel" : "New policy"}</button>{open && <form onSubmit={submit} className="card max-w-xl space-y-3 p-5"><input className="input" name="title" placeholder="Policy title" required /><textarea className="textarea" name="content" placeholder="Policy content" required /><input className="input" name="effectiveDate" type="date" /><button className="btn btn-primary" type="submit" disabled={saving}>{saving ? "Saving..." : "Save policy"}</button>{error && <p className="text-red-400" role="alert">{error}</p>}</form>}</div>;
}
