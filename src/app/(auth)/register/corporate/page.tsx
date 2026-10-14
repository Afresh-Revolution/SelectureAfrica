import { redirectIfSignedIn } from "@/features/auth/actions";
import { CorporateRegisterForm } from "@/components/forms/RegisterForms";

export default async function CorporateRegisterPage() {
  await redirectIfSignedIn();
  return <CorporateRegisterForm />;
}
