import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
	const { searchParams, origin } = new URL(req.url);
	const code = searchParams.get("code");
	const next = searchParams.get("next");
	const destination = next?.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";

	if (!code) {
		return NextResponse.redirect(new URL("/login?error=Missing authentication callback code.", origin));
	}

	try {
		const supabase = await createClient();
		const { error } = await supabase.auth.exchangeCodeForSession(code);
		if (error) throw error;
		return NextResponse.redirect(new URL(destination, origin));
	} catch (error) {
		const message = error instanceof Error ? error.message : "Authentication callback failed.";
		return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(message)}`, origin));
	}
}
