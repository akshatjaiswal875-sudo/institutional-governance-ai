import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";

export default async function ProtectedLayout({ children }: { children: ReactNode }) {
  try {
    await requireUser();
    return children;
  } catch (error) {
    if (error instanceof Error && error.message !== "UNAUTHORIZED") throw error;
    redirect("/login");
  }
}
