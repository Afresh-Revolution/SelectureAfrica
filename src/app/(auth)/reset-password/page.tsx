import Link from "next/link";
import { ResetForm } from "@/components/forms/PasswordForms";

export default async function ResetPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  if (!token) {
    return (
      <div>
        <h1>Missing reset token.</h1>
        <Link href="/forgot-password">Request a new link</Link>
      </div>
    );
  }
  return <ResetForm token={token} />;
}
