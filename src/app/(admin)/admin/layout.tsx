import { AdminShell } from "@/components/admin/AdminShell";
import { requireStaff } from "@/lib/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireStaff();
  return <AdminShell user={user}>{children}</AdminShell>;
}
