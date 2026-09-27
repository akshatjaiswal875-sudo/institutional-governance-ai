import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const { supabase, profile } = await requireUser(["Super Admin", "Meeting Secretary", "Faculty / Officer"]);
    const body = await request.json();
    const task = typeof body.task === "string" ? body.task.trim() : "";
    if (!task) return NextResponse.json({ error: "Task is required." }, { status: 400 });
    const { data, error } = await supabase.from("action_items").insert({ meeting_id: params.id, decision_id: body.decisionId || null, task, assignee_id: body.assigneeId || null, due_date: body.dueDate || null, priority: ["Low", "Medium", "High", "Critical"].includes(body.priority) ? body.priority : "Medium", status: ["Pending", "In Progress", "Completed"].includes(body.status) ? body.status : "Pending", created_by: profile.id }).select("*").single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    await recordAudit(supabase, profile.id, "ADD_ACTION_ITEM", "action_items", data.id, { meeting_id: params.id });
    return NextResponse.json({ data }, { status: 201 });
  } catch { return NextResponse.json({ error: "Unable to add action item." }, { status: 401 }); }
}
