"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BarChart3, Calendar, FileText, LayoutDashboard, Menu, MessageSquare, Search, Users, X, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Role = "Super Admin" | "Meeting Secretary" | "Faculty / Officer" | "Member" | "Auditor";
const links = [["/dashboard", "Dashboard", LayoutDashboard], ["/meetings", "Meetings", Calendar], ["/events", "Events", Calendar], ["/policies", "Policies", FileText], ["/search", "Search", Search], ["/assistant", "Assistant", MessageSquare], ["/reports", "Reports", BarChart3], ["/users", "Users", Users]] as const;

export function Nav() {
	const pathname = usePathname();
	const router = useRouter();
	const [open, setOpen] = useState(false);
	const [email, setEmail] = useState("");
	const [role, setRole] = useState<Role | null>(null);
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState("");
	useEffect(() => {
		const supabase = createClient();
		let active = true;
		supabase.auth.getUser().then(async ({ data }) => {
			if (!active || !data.user) return;
			setEmail(data.user.email ?? "");
			const { data: profile } = await supabase.from("users").select("role").eq("id", data.user.id).maybeSingle();
			if (active) setRole(profile?.role ?? null);
		});
		return () => { active = false; };
		const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
			if (!active) return;
			if (event === "SIGNED_OUT" || !session?.user) {
				setEmail("");
				setRole(null);
			}
		});
		return () => { active = false; listener.subscription.unsubscribe(); };
	}, []);
	if (pathname === "/login") return null;
	async function logout() {
		if (busy) return;
		setBusy(true); setError("");
		const { error: signOutError } = await createClient().auth.signOut();
		if (signOutError) { setError("Unable to sign out. Please try again."); setBusy(false); return; }
		router.replace("/login"); router.refresh();
	}
	const visibleLinks = links.filter(([href]) => href !== "/users" || role === "Super Admin").filter(([href]) => href !== "/reports" || ["Super Admin", "Auditor", "Meeting Secretary"].includes(role ?? ""));
	return <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-950/95 backdrop-blur"><div className="mx-auto flex max-w-7xl items-center gap-3 p-4"><Link href="/dashboard" className="mr-auto text-lg font-bold tracking-tight"><span className="text-cyan-300">G</span>ovAI</Link><div className="hidden items-center gap-2 lg:flex">{visibleLinks.map(([href, label, Icon]) => <Link key={href} href={href} className={`btn text-sm ${pathname.startsWith(href) ? "btn-primary" : "btn-secondary"}`}><Icon size={15} className="mr-1" />{label}</Link>)}</div><div className="hidden items-center gap-3 border-l border-slate-800 pl-4 lg:flex"><div className="text-right"><p className="text-sm">{email || "Authenticated user"}</p><p className="text-xs text-slate-400">{role || "Loading role..."}</p></div><button type="button" className="btn btn-secondary" onClick={logout} disabled={busy} title="Sign out"><LogOut size={16} />{busy ? "Signing out..." : "Logout"}</button></div><button type="button" className="btn btn-secondary lg:hidden" onClick={() => setOpen(!open)} aria-label="Toggle navigation">{open ? <X size={19} /> : <Menu size={19} />}</button></div>{open && <div className="border-t border-slate-800 p-4 lg:hidden"><div className="grid gap-2">{visibleLinks.map(([href, label, Icon]) => <Link key={href} href={href} onClick={() => setOpen(false)} className={`btn justify-start text-sm ${pathname.startsWith(href) ? "btn-primary" : "btn-secondary"}`}><Icon size={15} className="mr-2" />{label}</Link>)}<div className="mt-2 border-t border-slate-800 pt-3"><p className="text-sm">{email || "Authenticated user"}</p><p className="mb-3 text-xs text-slate-400">{role || "Loading role..."}</p><button type="button" className="btn btn-secondary w-full" onClick={logout} disabled={busy}><LogOut size={16} className="mr-2" />{busy ? "Signing out..." : "Logout"}</button>{error && <p className="mt-2 text-sm text-red-400" role="alert">{error}</p>}</div></div></div>}</header>;
}
