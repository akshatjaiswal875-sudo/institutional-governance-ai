"use client";

import { FormEvent, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui";
import { mockEvents, type MockEvent } from "@/lib/mock-data";
import { useMockState } from "@/lib/mock-store";

export function EventEditForm() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [events, setEvents] = useMockState<MockEvent[]>("govai.events", mockEvents);
  const event = events.find(item => item.id === params.id);
  const [title, setTitle] = useState(event?.title ?? "");
  const [date, setDate] = useState(event?.date.slice(0, 10) ?? "");
  const [time, setTime] = useState(event?.date.slice(11, 16) ?? "");
  const [location, setLocation] = useState(event?.location ?? "");
  const [description, setDescription] = useState(event?.description ?? "");
  const [error, setError] = useState("");
  if (!event) return <p className="text-slate-400">Event not found.</p>;
  const eventId = event.id;
  function save(formEvent: FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    if (!title.trim() || !date || !time) { setError("Title, date, and time are required."); return; }
    setEvents(current => current.map(item => item.id === eventId ? { ...item, title: title.trim(), date: `${date}T${time}:00+05:30`, location: location.trim() || "Online", description: description.trim() || "No description" } : item));
    router.push(`/events/${eventId}`);
  }
  return <div className="mx-auto max-w-3xl space-y-6"><div><h1 className="text-3xl font-semibold">Edit event</h1><p className="mt-2 text-slate-400">Update the event details.</p></div><Card><form onSubmit={save} className="space-y-4"><label className="block text-sm text-slate-300">Title<input className="input mt-1" value={title} onChange={event => setTitle(event.target.value)} required /></label><div className="grid gap-4 sm:grid-cols-2"><label className="block text-sm text-slate-300">Date<input className="input mt-1" type="date" value={date} onChange={event => setDate(event.target.value)} required /></label><label className="block text-sm text-slate-300">Time<input className="input mt-1" type="time" value={time} onChange={event => setTime(event.target.value)} required /></label></div><label className="block text-sm text-slate-300">Location<input className="input mt-1" value={location} onChange={event => setLocation(event.target.value)} /></label><label className="block text-sm text-slate-300">Description<textarea className="textarea mt-1" value={description} onChange={event => setDescription(event.target.value)} /></label><div className="flex gap-3"><button className="btn btn-primary" type="submit">Save changes</button><button className="btn btn-secondary" type="button" onClick={() => router.push(`/events/${eventId}`)}>Cancel</button></div>{error && <p className="text-red-400" role="alert">{error}</p>}</form></Card></div>;
}
