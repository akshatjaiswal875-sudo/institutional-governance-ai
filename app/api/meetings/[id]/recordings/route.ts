import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";

const maxFileSize = 100 * 1024 * 1024;

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { supabase } = await requireUser();
    const { data, error } = await supabase.from("meeting_recordings").select("id,meeting_id,original_filename,mime_type,file_size,status,error_message,created_at,updated_at").eq("meeting_id", params.id).order("created_at", { ascending: false });
    if (error) throw error;
    return NextResponse.json({ data: data ?? [] });
  } catch { return NextResponse.json({ error: "Unable to load recordings." }, { status: 401 }); }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { supabase, profile } = await requireUser(["Super Admin", "Meeting Secretary"]);
    const { data: meeting } = await supabase.from("meetings").select("id").eq("id", params.id).maybeSingle();
    if (!meeting) return NextResponse.json({ error: "Meeting not found." }, { status: 404 });
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "Recording file is required." }, { status: 400 });
    if (!file.type.startsWith("audio/") && !file.type.startsWith("video/")) return NextResponse.json({ error: "Upload an audio or video recording." }, { status: 400 });
    if (file.size > maxFileSize) return NextResponse.json({ error: "Recording must be 100 MB or smaller." }, { status: 400 });
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storagePath = `meetings/${params.id}/${Date.now()}-${safeName}`;
    const upload = await supabase.storage.from("meeting-media").upload(storagePath, file, { upsert: false, contentType: file.type });
    if (upload.error) throw upload.error;
    const { data, error } = await supabase.from("meeting_recordings").insert({ meeting_id: params.id, storage_path: storagePath, original_filename: file.name, mime_type: file.type, file_size: file.size, status: "uploaded", created_by: profile.id }).select("id,meeting_id,original_filename,mime_type,file_size,status,created_at,updated_at").single();
    if (error) throw error;
    await recordAudit(supabase, profile.id, "RECORDING_UPLOADED", "meeting_recordings", data.id, { meeting_id: params.id, original_filename: file.name, file_size: file.size });
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to upload recording." }, { status: 400 }); }
}
