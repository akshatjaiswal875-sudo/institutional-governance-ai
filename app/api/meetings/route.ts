import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";

export async function GET() {
  try {
    const { supabase } = await requireUser();
    const { data, error } = await supabase.from("meetings").select("*").order("date", { ascending: false });
    if (error) throw error;
    return NextResponse.json({ data: data ?? [] });
  } catch { return NextResponse.json({ error: "Unable to load meetings." }, { status: 401 }); }
}

export async function POST(request: NextRequest) {
  try {
    const { supabase, user, profile } = await requireUser([
      "Super Admin",
      "Meeting Secretary",
    ]);
    const body = await request.json();
    const title = typeof body.title === "string" ? body.title.trim() : "";
    const date = typeof body.date === "string" ? body.date : "";
    const location =
      typeof body.location === "string" && body.location.trim()
        ? body.location.trim()
        : null;
    const type = body.type === "online" ? "online" : "offline";
    const payload = {
      title,
      date,
      location,
      type,
      created_by: user.id,
      status: "Draft" as const,
    };

    const { data: currentRole } = await supabase.rpc("current_role");
    console.info("[meeting auth]", {
      authUserId: user.id,
      authEmail: user.email,
      currentRole,
      profileExists: Boolean(profile),
    });

    if (!title || !date) {
      return NextResponse.json(
        { error: "Meeting title and date are required." },
        { status: 400 },
      );
    }

    const { data, error } = await supabase
      .from("meetings")
      .insert(payload)
      .select("id")
      .single();

    if (error) {
      return NextResponse.json(
        {
          error: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        },
        { status: 403 },
      );
    }

    await recordAudit(supabase, profile.id, "CREATE_MEETING", "meetings", data.id, {
      title,
      status: "Draft",
    });

    return NextResponse.json({ data });
  } catch {
    return NextResponse.json(
      { error: "Unable to create meeting." },
      { status: 401 },
    );
  }
}
