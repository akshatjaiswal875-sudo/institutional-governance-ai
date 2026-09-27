import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try { const { supabase } = await requireUser(); const { data, error } = await supabase.from("events").select("*").eq("id", params.id).maybeSingle(); if (error) throw error; return NextResponse.json({ data }); } catch { return NextResponse.json({ error: "Unable to load event." }, { status: 401 }); }
}
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try { const { supabase, profile } = await requireUser(["Super Admin", "Meeting Secretary"]); const body = await request.json(); const { data, error } = await supabase.from("events").update({ title: body.title, start_time: body.startTime, end_time: body.endTime, location: body.location ?? null, description: body.description ?? null, organizer_id: body.organizerId ?? profile.id, status: body.status ?? "Upcoming" }).eq("id", params.id).select("*").single(); if (error) throw error; await recordAudit(supabase, profile.id, "UPDATE_EVENT", "events", params.id); return NextResponse.json({ data }); } catch { return NextResponse.json({ error: "Unable to update event." }, { status: 400 }); }
}
export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  try { const { supabase, profile } = await requireUser(["Super Admin", "Meeting Secretary"]); const { error } = await supabase.from("events").delete().eq("id", params.id); if (error) throw error; await recordAudit(supabase, profile.id, "DELETE_EVENT", "events", params.id); return NextResponse.json({ success: true }); } catch { return NextResponse.json({ error: "Unable to delete event." }, { status: 400 }); }
}
