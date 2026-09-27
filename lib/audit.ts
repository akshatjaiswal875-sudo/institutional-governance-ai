import type { SupabaseClient } from "@supabase/supabase-js";

export async function recordAudit(
	supabase: SupabaseClient,
	userId: string,
	action: string,
	targetTable: string,
	targetId: string,
	changes: Record<string, unknown> = {},
) {
	await supabase.from("audit_logs").insert({
		user_id: userId,
		action,
		target_table: targetTable,
		target_id: targetId,
		changes,
	});
}
