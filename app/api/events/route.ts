import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";

export async function GET() {
	try {
		const { supabase } = await requireUser();
		const { data, error } = await supabase.from("events").select("*").order("start_time");
		if (error) throw error;
		return NextResponse.json({ data: data ?? [] });
	} catch { return NextResponse.json({ error: "Unable to load events." }, { status: 401 }); }
}

export async function POST(request: Request) {
	try {
		const { supabase, profile } = await requireUser(["Super Admin", "Meeting Secretary"]);
		const body = await request.json();
		const title = typeof body.title === "string" ? body.title.trim() : "";
		const startTime = typeof body.startTime === "string" ? body.startTime : "";
		const endTime = typeof body.endTime === "string" ? body.endTime : "";
		if (!title || !startTime || !endTime) return NextResponse.json({ error: "Title, start time, and end time are required." }, { status: 400 });
		const { data, error } = await supabase.from("events").insert({
			title,
			start_time: startTime,
			end_time: endTime,
			description: typeof body.description === "string" ? body.description.trim() || null : null,
			location: typeof body.location === "string" ? body.location.trim() || null : null,
			organizer_id: profile.id,
			status: body.status ?? "Upcoming",
		}).select("id").single();
		if (error) return NextResponse.json({ error: error.message }, { status: 400 });
		await recordAudit(supabase, profile.id, "CREATE_EVENT", "events", data.id, { title });
		return NextResponse.json({ data }, { status: 201 });
	} catch { return NextResponse.json({ error: "Unable to create event." }, { status: 401 }); }
}
