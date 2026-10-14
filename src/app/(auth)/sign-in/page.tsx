import { redirectIfSignedIn } from "@/features/auth/actions";
import { SignInForm } from "@/components/forms/SignInForm";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; reset?: string }>;
}) {
  await redirectIfSignedIn();
  const params = await searchParams;
  const next = params.next?.startsWith("/") ? params.next : undefined;
  return <SignInForm next={next} reset={params.reset === "1"} />;
}
