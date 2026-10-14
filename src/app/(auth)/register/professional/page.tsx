import { redirectIfSignedIn } from "@/features/auth/actions";
import { ProfessionalRegisterForm } from "@/components/forms/RegisterForms";

export default async function ProfessionalRegisterPage() {
  await redirectIfSignedIn();
  return <ProfessionalRegisterForm />;
}
