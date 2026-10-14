"use client";

import { useActionState } from "react";
import { COUNTRIES, INDUSTRY_OPTIONS } from "@/lib/constants";
import { updatePreferences, updateProfessionalProfile, uploadCv } from "@/features/membership/actions";
import { SubmitButton } from "@/components/ui/SubmitButton";

type Profile = {
  headline: string | null;
  summary: string | null;
  city: string | null;
  country: string | null;
  diaspora: boolean;
  skills: string[];
  experienceYears: number | null;
  industries: string[];
  linkedinUrl: string | null;
  visibility: "private" | "selecture_only";
};

export function ProfileEditor({
  profile,
  cvName,
}: {
  profile: Profile | null;
  cvName: string | null;
}) {
  const [state, action] = useActionState(updateProfessionalProfile, null);
  const [cvState, cvAction] = useActionState(uploadCv, null);
  return (
    <div className="split-page">
      <form action={action} className="form-grid card">
        <h2>Professional profile</h2>
        <label className="field">
          <span>Headline</span>
          <input name="headline" defaultValue={profile?.headline ?? ""} />
        </label>
        <label className="field">
          <span>Summary</span>
          <textarea name="summary" defaultValue={profile?.summary ?? ""} />
        </label>
        <div className="form-row">
          <label className="field">
            <span>Country</span>
            <select name="country" defaultValue={profile?.country ?? ""}>
              <option value="">Select</option>
              {COUNTRIES.map((country) => (
                <option key={country}>{country}</option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>City</span>
            <input name="city" defaultValue={profile?.city ?? ""} />
          </label>
        </div>
        <label className="field">
          <span>Skills</span>
          <input name="skills" defaultValue={profile?.skills.join(", ") ?? ""} />
        </label>
        <label className="field">
          <span>Industries</span>
          <input name="industries" defaultValue={profile?.industries.join(", ") ?? ""} placeholder={INDUSTRY_OPTIONS.slice(0, 3).join(", ")} />
        </label>
        <div className="form-row">
          <label className="field">
            <span>Years of experience</span>
            <input name="experienceYears" type="number" min={0} defaultValue={profile?.experienceYears ?? ""} />
          </label>
          <label className="field">
            <span>LinkedIn</span>
            <input name="linkedinUrl" defaultValue={profile?.linkedinUrl ?? ""} />
          </label>
        </div>
        <label className="field">
          <span>Visibility</span>
          <select name="visibility" defaultValue={profile?.visibility ?? "selecture_only"}>
            <option value="selecture_only">Visible to Selecture staff</option>
            <option value="private">Hidden until I am in a live process</option>
          </select>
        </label>
        <label className="check">
          <input type="checkbox" name="diaspora" defaultChecked={profile?.diaspora} />
          <span>I am in the diaspora.</span>
        </label>
        {state?.error && <p className="alert">{state.error}</p>}
        {state?.success && <p className="alert alert-success">{state.success}</p>}
        <SubmitButton>Save profile</SubmitButton>
      </form>
      <form action={cvAction} className="form-grid card">
        <h2>Private CV</h2>
        <p className="muted">{cvName ? `Current file: ${cvName}` : "No CV stored yet. PDF or Word, up to 5 MB."}</p>
        <label className="field">
          <span>Upload</span>
          <input name="cv" type="file" accept=".pdf,.doc,.docx,application/pdf" required />
        </label>
        {cvState?.error && <p className="alert">{cvState.error}</p>}
        {cvState?.success && <p className="alert alert-success">{cvState.success}</p>}
        <SubmitButton pendingLabel="Uploading">Store CV</SubmitButton>
        {cvName && (
          <a href="/api/cv">Download current CV</a>
        )}
      </form>
    </div>
  );
}

export function PreferencesForm({
  newsletter,
  productUpdates,
  requestAlerts,
}: {
  newsletter: boolean;
  productUpdates: boolean;
  requestAlerts: boolean;
}) {
  const [state, action] = useActionState(updatePreferences, null);
  return (
    <form action={action} className="form-grid card" style={{ maxWidth: 640 }}>
      <label className="check">
        <input type="checkbox" name="newsletter" defaultChecked={newsletter} />
        <span>Briefings and newsletter</span>
      </label>
      <label className="check">
        <input type="checkbox" name="productUpdates" defaultChecked={productUpdates} />
        <span>Programme and service updates</span>
      </label>
      <label className="check">
        <input type="checkbox" name="requestAlerts" defaultChecked={requestAlerts} />
        <span>Alerts about my requests and registrations</span>
      </label>
      {state?.error && <p className="alert">{state.error}</p>}
      {state?.success && <p className="alert alert-success">{state.success}</p>}
      <SubmitButton>Save preferences</SubmitButton>
    </form>
  );
}
