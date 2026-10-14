"use client";

import { useActionState } from "react";
import { COMPANY_SIZES, COUNTRIES, INDUSTRY_OPTIONS } from "@/lib/constants";
import { addContact, removeContact, updateOrganization } from "@/features/membership/actions";
import { SubmitButton } from "@/components/ui/SubmitButton";

type Org = {
  name: string;
  industry: string | null;
  website: string | null;
  country: string | null;
  city: string | null;
  sizeBand: string | null;
  about: string | null;
};

type Contact = { id: string; fullName: string; email: string | null; phone: string | null; jobTitle: string | null };

export function OrganizationEditor({ organization, contacts, canEdit }: { organization: Org; contacts: Contact[]; canEdit: boolean }) {
  const [state, action] = useActionState(updateOrganization, null);
  const [contactState, contactAction] = useActionState(addContact, null);
  return (
    <div className="split-page">
      <form action={action} className="form-grid card">
        <h2>Organisation profile</h2>
        <label className="field">
          <span>Name</span>
          <input name="name" defaultValue={organization.name} required disabled={!canEdit} />
        </label>
        <div className="form-row">
          <label className="field">
            <span>Industry</span>
            <select name="industry" defaultValue={organization.industry ?? ""} disabled={!canEdit}>
              <option value="">Select</option>
              {INDUSTRY_OPTIONS.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Size</span>
            <select name="sizeBand" defaultValue={organization.sizeBand ?? ""} disabled={!canEdit}>
              <option value="">Select</option>
              {COMPANY_SIZES.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </label>
        </div>
        <div className="form-row">
          <label className="field">
            <span>Country</span>
            <select name="country" defaultValue={organization.country ?? ""} disabled={!canEdit}>
              <option value="">Select</option>
              {COUNTRIES.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>City</span>
            <input name="city" defaultValue={organization.city ?? ""} disabled={!canEdit} />
          </label>
        </div>
        <label className="field">
          <span>Website</span>
          <input name="website" defaultValue={organization.website ?? ""} disabled={!canEdit} />
        </label>
        <label className="field">
          <span>About the organisation</span>
          <textarea name="about" defaultValue={organization.about ?? ""} disabled={!canEdit} />
        </label>
        {state?.error && <p className="alert">{state.error}</p>}
        {state?.success && <p className="alert alert-success">{state.success}</p>}
        {canEdit && <SubmitButton>Save profile</SubmitButton>}
      </form>
      <div className="form-grid">
        <div className="card">
          <h2>Additional contacts</h2>
          {contacts.length === 0 && <p className="muted">No extra contacts yet.</p>}
          <ul className="prose">
            {contacts.map((contact) => (
              <li key={contact.id}>
                <strong>{contact.fullName}</strong>
                {contact.jobTitle ? ` · ${contact.jobTitle}` : ""}
                <br />
                <span className="muted">{contact.email}</span>
                {canEdit && (
                  <form action={removeContact}>
                    <input type="hidden" name="id" value={contact.id} />
                    <button className="btn btn-line" type="submit">
                      Remove
                    </button>
                  </form>
                )}
              </li>
            ))}
          </ul>
        </div>
        {canEdit && (
          <form action={contactAction} className="form-grid card">
            <h2>Add a contact</h2>
            <label className="field"><span>Name</span><input name="fullName" required /></label>
            <label className="field"><span>Email</span><input name="email" type="email" required /></label>
            <label className="field"><span>Role</span><input name="jobTitle" /></label>
            <label className="field"><span>Phone</span><input name="phone" /></label>
            {contactState?.error && <p className="alert">{contactState.error}</p>}
            {contactState?.success && <p className="alert alert-success">{contactState.success}</p>}
            <SubmitButton pendingLabel="Adding">Add contact</SubmitButton>
          </form>
        )}
      </div>
    </div>
  );
}
