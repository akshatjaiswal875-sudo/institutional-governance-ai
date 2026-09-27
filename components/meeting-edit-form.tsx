"use client";

import { useState } from "react";
import { X } from "lucide-react";
import type { MockMeeting } from "@/lib/mock-data";

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/75 p-4"><div className="w-full max-w-xl rounded-xl border border-slate-700 bg-slate-900 shadow-2xl"><div className="flex items-center justify-between border-b border-slate-800 p-5"><h2 className="text-lg font-semibold">{title}</h2><button type="button" onClick={onClose} aria-label="Close"><X size={18} /></button></div><div className="max-h-[75vh] overflow-auto p-5">{children}</div></div></div>;
}

export function MeetingEditForm({ meeting, onClose, onSave }: { meeting: MockMeeting; onClose: () => void; onSave: (changes: Partial<MockMeeting>) => void }) {
  const [title, setTitle] = useState(meeting.title);
  const [date, setDate] = useState(meeting.date.slice(0, 10));
  const [time, setTime] = useState(meeting.date.slice(11, 16));
  const [location, setLocation] = useState(meeting.location);
  const [type, setType] = useState(meeting.type);
  const [description, setDescription] = useState(meeting.description);
  const [approver, setApprover] = useState(meeting.approver);
  const [agenda, setAgenda] = useState(meeting.agenda.join("\n"));
  const [error, setError] = useState("");
  return <Modal title="Edit meeting" onClose={onClose}><form onSubmit={event => { event.preventDefault(); if (!title.trim() || !date || !time || !location.trim()) { setError("Title, date, time, and location are required."); return; } onSave({ title: title.trim(), date: `${date}T${time}:00+05:30`, location: location.trim(), type, description, approver, agenda: agenda.split("\n").map(item => item.trim()).filter(Boolean) }); }} className="space-y-4"><label className="block text-sm text-slate-300">Title<input className="input mt-1" value={title} onChange={event => setTitle(event.target.value)} required /></label><div className="grid gap-3 sm:grid-cols-2"><label className="block text-sm text-slate-300">Date<input className="input mt-1" type="date" value={date} onChange={event => setDate(event.target.value)} required /></label><label className="block text-sm text-slate-300">Time<input className="input mt-1" type="time" value={time} onChange={event => setTime(event.target.value)} required /></label></div><label className="block text-sm text-slate-300">Location<input className="input mt-1" value={location} onChange={event => setLocation(event.target.value)} required /></label><label className="block text-sm text-slate-300">Meeting type<select className="select mt-1" value={type} onChange={event => setType(event.target.value as MockMeeting["type"])}><option>Board</option><option>Committee</option><option>Review</option></select></label><label className="block text-sm text-slate-300">Description<textarea className="textarea mt-1" value={description} onChange={event => setDescription(event.target.value)} /></label><label className="block text-sm text-slate-300">Participants<textarea className="textarea mt-1" defaultValue="Akshat Jaiswal\nIsha Mewada\nIshika Sharma" /></label><label className="block text-sm text-slate-300">Approver<select className="select mt-1" value={approver} onChange={event => setApprover(event.target.value)}><option>Dr. Ishika Sharma</option><option>Not assigned</option></select></label><label className="block text-sm text-slate-300">Agenda<textarea className="textarea mt-1" value={agenda} onChange={event => setAgenda(event.target.value)} /></label><div className="flex gap-3"><button className="btn btn-primary" type="submit">Save changes</button><button className="btn btn-secondary" type="button" onClick={onClose}>Cancel</button></div>{error && <p className="text-red-400" role="alert">{error}</p>}</form></Modal>;
}
