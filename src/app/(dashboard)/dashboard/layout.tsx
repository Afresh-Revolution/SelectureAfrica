import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { MemberShell } from "@/components/dashboard/MemberShell";
import { requireUser } from "@/lib/auth";
import { isStaff } from "@/lib/constants";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  if (isStaff(user.accountType)) redirect("/admin");
  const headerList = await headers();
  const pathname = headerList.get("x-pathname") || "/dashboard";
  return (
    <MemberShell user={user} pathname={pathname}>
      {children}
    </MemberShell>
  );
}
