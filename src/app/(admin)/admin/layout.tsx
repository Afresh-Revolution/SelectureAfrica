import { headers } from "next/headers";
import { AdminShell } from "@/components/admin/AdminShell";
import { requireStaff } from "@/lib/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireStaff();
  const pathname = (await headers()).get("x-pathname") || "/admin";
  return (
    <AdminShell user={user} pathname={pathname}>
      {children}
    </AdminShell>
  );
}
