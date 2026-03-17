"use client";

import type { CVData, CVSkill, CVEducation, CVExperience, CVClient, CVTestimonial } from "@/types/cv";

type FieldErrors = Record<string, string>;

function isValidEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}

function isValidPhone(v: string) {
  const cleaned = v.trim().replace(/[\s()-]/g, "");
  return /^\+?\d{7,15}$/.test(cleaned);
}

function isValidUrl(v: string) {
  try {
    const u = new URL(v.trim());
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

function hostIs(u: URL, host: RegExp) {
  return host.test(u.hostname);
}

function isLinkedInUrl(v: string) {
  try {
    const u = new URL(v.trim());
    return hostIs(u, /(^|\.)linkedin\.com$/i);
  } catch {
    return false;
  }
}

function isInstagramUrl(v: string) {
  try {
    const u = new URL(v.trim());
    return hostIs(u, /(^|\.)instagram\.com$/i);
  } catch {
    return false;
  }
}

function isTwitterUrl(v: string) {
  try {
    const u = new URL(v.trim());
    return hostIs(u, /(^|\.)twitter\.com$/i) || hostIs(u, /(^|\.)x\.com$/i);
  } catch {
    return false;
  }
}

const ErrorText = ({ msg }: { msg?: string }) =>
  msg ? <p className="mt-1 text-xs text-red-300">{msg}</p> : null;

const STEPS = [
  { id: 1, title: "Personal & Contact", short: "Contact" },
  { id: 2, title: "Skills & About", short: "About" },
  { id: 3, title: "Education & Experience", short: "Experience" },
  { id: 4, title: "Social & Clients", short: "Social" },
];

const inputClass =
  "w-full rounded-xl border border-white/10 bg-gray-950/50 px-4 py-2.5 text-sm text-gray-200 outline-none transition-all placeholder:text-gray-500 focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20";

const labelClass = "mb-1 block text-xs font-medium uppercase tracking-wider text-gray-500";

export default function CVForm({
  data,
  onChange,
  step,
  setStep,
  onDownload,
  onSave,
  downloading,
  lastSavedAt,
}: {
  data: CVData;
  onChange: (d: CVData) => void;
  step: number;
  setStep: (s: number) => void;
  onDownload: () => void;
  onSave: () => void;
  downloading: boolean;
  lastSavedAt: string | null;
}) {
  const update = (partial: Partial<CVData>) => onChange({ ...data, ...partial });

  const validation = (() => {
    const errors: FieldErrors = {};
    const missing: string[] = [];

    const require = (key: string, label: string, value: string) => {
      if (!value.trim()) {
        missing.push(label);
        errors[key] = `${label} is required`;
      }
    };

    if (step === 1) {
      require("fullName", "Full name", data.fullName);
      require("contact.location", "Location", data.contact.location);
      require("contact.phone", "Phone", data.contact.phone);
      require("contact.email", "Email", data.contact.email);

      if (data.contact.email.trim() && !isValidEmail(data.contact.email)) {
        errors["contact.email"] = "Enter a valid email address";
      }
      if (data.contact.phone.trim() && !isValidPhone(data.contact.phone)) {
        errors["contact.phone"] = "Enter a valid phone number (7–15 digits, optional +)";
      }
    }

    if (step === 2) {
      require("aboutMe", "About me", data.aboutMe);
      data.skills.forEach((s, i) => {
        if (!s.name.trim()) errors[`skills.${i}.name`] = "Skill name is required";
        if (Number.isNaN(s.proficiency) || s.proficiency < 0 || s.proficiency > 100) {
          errors[`skills.${i}.proficiency`] = "Proficiency must be 0–100";
        }
      });
    }

    if (step === 3) {
      if (data.education.length === 0) {
        missing.push("At least one education entry");
        errors["education"] = "Add at least one education entry";
      }
      if (data.experience.length === 0) {
        missing.push("At least one experience entry");
        errors["experience"] = "Add at least one experience entry";
      }
      data.education.forEach((e, i) => {
        if (!e.startDate.trim()) errors[`education.${i}.startDate`] = "Start date is required";
        if (!e.endDate.trim()) errors[`education.${i}.endDate`] = "End date is required";
        if (!e.institution.trim()) errors[`education.${i}.institution`] = "Institution is required";
        if (!e.description.trim()) errors[`education.${i}.description`] = "Description is required";
      });
      data.experience.forEach((e, i) => {
        if (!e.startDate.trim()) errors[`experience.${i}.startDate`] = "Start date is required";
        if (!e.endDate.trim()) errors[`experience.${i}.endDate`] = "End date is required";
        if (!e.employer.trim()) errors[`experience.${i}.employer`] = "Employer is required";
        if (!e.role.trim()) errors[`experience.${i}.role`] = "Role is required";
        if (!e.description.trim()) errors[`experience.${i}.description`] = "Description is required";
      });
    }

    if (step === 4) {
      if (data.skillsList.length === 0) {
        missing.push("Skills list");
        errors["skillsList"] = "Enter at least one skill";
      }

      require("social.email", "Social email", data.socialLinks.email || "");
      const socialEmail = data.socialLinks.email || "";
      if (socialEmail.trim() && !isValidEmail(socialEmail)) errors["social.email"] = "Enter a valid email";

      const linkedin = data.socialLinks.linkedin || "";
      if (linkedin.trim()) {
        if (!isValidUrl(linkedin)) errors["social.linkedin"] = "Enter a valid URL";
        else if (!isLinkedInUrl(linkedin)) errors["social.linkedin"] = "Must be a LinkedIn link";
      }
      const instagram = data.socialLinks.instagram || "";
      if (instagram.trim()) {
        if (!isValidUrl(instagram)) errors["social.instagram"] = "Enter a valid URL";
        else if (!isInstagramUrl(instagram)) errors["social.instagram"] = "Must be an Instagram link";
      }
      const twitter = data.socialLinks.twitter || "";
      if (twitter.trim()) {
        if (!isValidUrl(twitter)) errors["social.twitter"] = "Enter a valid URL";
        else if (!isTwitterUrl(twitter)) errors["social.twitter"] = "Must be an X/Twitter link";
      }

      data.topClients.forEach((c, i) => {
        if (!c.name.trim()) errors[`clients.${i}.name`] = "Client name is required";
        if (c.logoUrl?.trim() && !isValidUrl(c.logoUrl)) errors[`clients.${i}.logoUrl`] = "Logo URL must be valid";
      });

      data.testimonials.forEach((t, i) => {
        if (!t.quote.trim()) errors[`testimonials.${i}.quote`] = "Quote is required";
        if (!t.author.trim()) errors[`testimonials.${i}.author`] = "Author is required";
      });
    }

    return {
      valid: Object.keys(errors).length === 0,
      message: missing.length ? `Required: ${missing.join(", ")}` : null,
      errors,
    };
  })();

  const goToStep = (nextStep: number) => {
    if (nextStep <= step) return setStep(nextStep);
    if (!validation.valid) return;
    setStep(nextStep);
  };

  const addSkill = () => update({ skills: [...data.skills, { name: "", proficiency: 75 }] });
  const removeSkill = (i: number) => update({ skills: data.skills.filter((_, j) => j !== i) });
  const updateSkill = (i: number, s: Partial<CVSkill>) => {
    const next = [...data.skills];
    next[i] = { ...next[i], ...s };
    update({ skills: next });
  };

  const addEducation = () =>
    update({ education: [...data.education, { startDate: "", endDate: "", institution: "", description: "" }] });
  const removeEducation = (i: number) => update({ education: data.education.filter((_, j) => j !== i) });
  const updateEducation = (i: number, e: Partial<CVEducation>) => {
    const next = [...data.education];
    next[i] = { ...next[i], ...e };
    update({ education: next });
  };

  const addExperience = () =>
    update({
      experience: [...data.experience, { startDate: "", endDate: "", employer: "", role: "", description: "" }],
    });
  const removeExperience = (i: number) => update({ experience: data.experience.filter((_, j) => j !== i) });
  const updateExperience = (i: number, e: Partial<CVExperience>) => {
    const next = [...data.experience];
    next[i] = { ...next[i], ...e };
    update({ experience: next });
  };

  const addClient = () => update({ topClients: [...data.topClients, { name: "" }] });
  const removeClient = (i: number) => update({ topClients: data.topClients.filter((_, j) => j !== i) });
  const updateClient = (i: number, c: Partial<CVClient>) => {
    const next = [...data.topClients];
    next[i] = { ...next[i], ...c };
    update({ topClients: next });
  };

  const addTestimonial = () =>
    update({ testimonials: [...data.testimonials, { quote: "", author: "", role: "" }] });
  const removeTestimonial = (i: number) => update({ testimonials: data.testimonials.filter((_, j) => j !== i) });
  const updateTestimonial = (i: number, t: Partial<CVTestimonial>) => {
    const next = [...data.testimonials];
    next[i] = { ...next[i], ...t };
    update({ testimonials: next });
  };

  const stepContent = (
    <div className="space-y-6">
      {step === 1 && (
        <>
          <section className="rounded-xl border border-white/10 bg-gray-900/40 p-5">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-indigo-300">Personal Info</h3>
            <div className="space-y-4">
              <div>
                <label className={labelClass}>Full Name</label>
                <input
                  className={inputClass}
                  value={data.fullName}
                  onChange={(e) => update({ fullName: e.target.value })}
                  placeholder="Your full name"
                  required
                />
                <ErrorText msg={validation.errors["fullName"]} />
              </div>
              <div>
                <label className={labelClass}>Roles (comma-separated)</label>
                <input
                  className={inputClass}
                  value={data.roles.join(", ")}
                  onChange={(e) =>
                    update({ roles: e.target.value.split(",").map((r) => r.trim()).filter(Boolean) })
                  }
                  placeholder="UI/UX designer, Full stack developer"
                />
              </div>
              <div>
                <label className={labelClass}>Profile Image (upload)</label>
                <input
                  className={`${inputClass} py-2`}
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    if (!file.type.startsWith("image/")) return;
                    const reader = new FileReader();
                    reader.onload = () => {
                      const result = typeof reader.result === "string" ? reader.result : "";
                      if (result) update({ profileImageUrl: result });
                    };
                    reader.readAsDataURL(file);
                  }}
                />
                <p className="mt-1 text-xs text-gray-500">Optional. JPG/PNG recommended.</p>
              </div>
            </div>
          </section>
          <section className="rounded-xl border border-white/10 bg-gray-900/40 p-5">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-indigo-300">Contact</h3>
            <div className="space-y-4">
              <div>
                <label className={labelClass}>Location</label>
                <input
                  className={inputClass}
                  value={data.contact.location}
                  onChange={(e) => update({ contact: { ...data.contact, location: e.target.value } })}
                  placeholder="City, Country"
                  required
                />
                <ErrorText msg={validation.errors["contact.location"]} />
              </div>
              <div>
                <label className={labelClass}>Phone</label>
                <input
                  className={inputClass}
                  value={data.contact.phone}
                  onChange={(e) => update({ contact: { ...data.contact, phone: e.target.value } })}
                  placeholder="+1234567890"
                  required
                />
                <ErrorText msg={validation.errors["contact.phone"]} />
              </div>
              <div>
                <label className={labelClass}>Email</label>
                <input
                  className={inputClass}
                  type="email"
                  value={data.contact.email}
                  onChange={(e) => update({ contact: { ...data.contact, email: e.target.value } })}
                  placeholder="your@email.com"
                  required
                />
                <ErrorText msg={validation.errors["contact.email"]} />
              </div>
            </div>
          </section>
        </>
      )}

      {step === 2 && (
        <>
          <section className="rounded-xl border border-white/10 bg-gray-900/40 p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-indigo-300">
                Skills with Proficiency
              </h3>
              <button
                type="button"
                onClick={addSkill}
                className="rounded-lg border border-indigo-500/50 px-3 py-1.5 text-xs font-medium text-indigo-400 transition-colors hover:bg-indigo-500/10"
              >
                + Add
              </button>
            </div>
            <div className="space-y-4">
              {data.skills.map((s, i) => (
                <div key={i} className="flex gap-3 rounded-lg border border-white/5 bg-gray-950/50 p-3">
                  <input
                    className={`${inputClass} flex-1`}
                    value={s.name}
                    onChange={(e) => updateSkill(i, { name: e.target.value })}
                    placeholder="e.g. Vue, Laravel"
                  />
                  <div className="flex w-24 shrink-0 items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      className={`${inputClass} w-16`}
                      value={s.proficiency}
                      onChange={(e) => updateSkill(i, { proficiency: Number(e.target.value) })}
                    />
                    <span className="text-xs text-gray-500">%</span>
                  </div>
                  <button type="button" onClick={() => removeSkill(i)} className="rounded-lg px-2 text-red-400 hover:bg-red-500/10">
                    ×
                  </button>
                </div>
              ))}
            </div>
            {data.skills.length > 0 && (
              <div className="mt-2 space-y-1">
                {data.skills.map((_, i) => (
                  <div key={i}>
                    <ErrorText msg={validation.errors[`skills.${i}.name`]} />
                    <ErrorText msg={validation.errors[`skills.${i}.proficiency`]} />
                  </div>
                ))}
              </div>
            )}
          </section>
          <section className="rounded-xl border border-white/10 bg-gray-900/40 p-5">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-indigo-300">About Me</h3>
            <textarea
              className={`${inputClass} min-h-[120px] resize-y`}
              value={data.aboutMe}
              onChange={(e) => update({ aboutMe: e.target.value })}
              placeholder="Write a brief bio..."
              required
            />
            <ErrorText msg={validation.errors["aboutMe"]} />
          </section>
        </>
      )}

      {step === 3 && (
        <>
          <section className="rounded-xl border border-white/10 bg-gray-900/40 p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-indigo-300">Education</h3>
              <button
                type="button"
                onClick={addEducation}
                className="rounded-lg border border-indigo-500/50 px-3 py-1.5 text-xs font-medium text-indigo-400 transition-colors hover:bg-indigo-500/10"
              >
                + Add
              </button>
            </div>
            <div className="space-y-4">
              {data.education.map((e, i) => (
                <div key={i} className="space-y-3 rounded-lg border border-white/5 bg-gray-950/50 p-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelClass}>Start</label>
                      <input
                        className={inputClass}
                        value={e.startDate}
                        onChange={(ev) => updateEducation(i, { startDate: ev.target.value })}
                        placeholder="2022-02-02"
                      />
                    </div>
                    <div>
                      <label className={labelClass}>End</label>
                      <input
                        className={inputClass}
                        value={e.endDate}
                        onChange={(ev) => updateEducation(i, { endDate: ev.target.value })}
                        placeholder="2024-12-03"
                      />
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Institution</label>
                    <input
                      className={inputClass}
                      value={e.institution}
                      onChange={(ev) => updateEducation(i, { institution: ev.target.value })}
                      placeholder="University name"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Description</label>
                    <textarea
                      className={`${inputClass} min-h-[60px]`}
                      value={e.description}
                      onChange={(ev) => updateEducation(i, { description: ev.target.value })}
                      placeholder="Brief description..."
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeEducation(i)}
                    className="text-xs text-red-400 hover:underline"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </section>
          <section className="rounded-xl border border-white/10 bg-gray-900/40 p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-indigo-300">
                Experience / Services
              </h3>
              <button
                type="button"
                onClick={addExperience}
                className="rounded-lg border border-indigo-500/50 px-3 py-1.5 text-xs font-medium text-indigo-400 transition-colors hover:bg-indigo-500/10"
              >
                + Add
              </button>
            </div>
            <div className="space-y-4">
              {data.experience.map((exp, i) => (
                <div key={i} className="space-y-3 rounded-lg border border-white/5 bg-gray-950/50 p-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelClass}>Start</label>
                      <input
                        className={inputClass}
                        value={exp.startDate}
                        onChange={(ev) => updateExperience(i, { startDate: ev.target.value })}
                        placeholder="2025-03-08"
                      />
                    </div>
                    <div>
                      <label className={labelClass}>End</label>
                      <input
                        className={inputClass}
                        value={exp.endDate}
                        onChange={(ev) => updateExperience(i, { endDate: ev.target.value })}
                        placeholder="2025-07-08"
                      />
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Employer / Company</label>
                    <input
                      className={inputClass}
                      value={exp.employer}
                      onChange={(ev) => updateExperience(i, { employer: ev.target.value })}
                      placeholder="Company name"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Role</label>
                    <input
                      className={inputClass}
                      value={exp.role}
                      onChange={(ev) => updateExperience(i, { role: ev.target.value })}
                      placeholder="Fullstack developer"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Description</label>
                    <textarea
                      className={`${inputClass} min-h-[80px]`}
                      value={exp.description}
                      onChange={(ev) => updateExperience(i, { description: ev.target.value })}
                      placeholder="Describe your responsibilities..."
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeExperience(i)}
                    className="text-xs text-red-400 hover:underline"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </section>
        </>
      )}

      {step === 4 && (
        <>
          <section className="rounded-xl border border-white/10 bg-gray-900/40 p-5">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-indigo-300">
              Skills (comma-separated)
            </h3>
            <input
              className={inputClass}
              value={data.skillsList.join(", ")}
              onChange={(e) =>
                update({ skillsList: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })
              }
              placeholder="Vue.js, Laravel, API integration, UI/UX"
              required
            />
            <ErrorText msg={validation.errors["skillsList"]} />
          </section>
          <section className="rounded-xl border border-white/10 bg-gray-900/40 p-5">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-indigo-300">
              Social Media Links
            </h3>
            <div className="space-y-4">
              <div>
                <label className={labelClass}>Email</label>
                <input
                  className={inputClass}
                  type="email"
                  value={data.socialLinks.email || ""}
                  onChange={(e) =>
                    update({ socialLinks: { ...data.socialLinks, email: e.target.value || undefined } })
                  }
                  placeholder="your@email.com"
                  required
                />
                <ErrorText msg={validation.errors["social.email"]} />
              </div>
              <div>
                <label className={labelClass}>LinkedIn URL</label>
                <input
                  className={inputClass}
                  type="url"
                  value={data.socialLinks.linkedin || ""}
                  onChange={(e) =>
                    update({ socialLinks: { ...data.socialLinks, linkedin: e.target.value || undefined } })
                  }
                  placeholder="https://linkedin.com/in/..."
                />
                <ErrorText msg={validation.errors["social.linkedin"]} />
              </div>
              <div>
                <label className={labelClass}>Instagram URL</label>
                <input
                  className={inputClass}
                  type="url"
                  value={data.socialLinks.instagram || ""}
                  onChange={(e) =>
                    update({ socialLinks: { ...data.socialLinks, instagram: e.target.value || undefined } })
                  }
                  placeholder="https://instagram.com/..."
                />
                <ErrorText msg={validation.errors["social.instagram"]} />
              </div>
              <div>
                <label className={labelClass}>X / Twitter URL</label>
                <input
                  className={inputClass}
                  type="url"
                  value={data.socialLinks.twitter || ""}
                  onChange={(e) =>
                    update({ socialLinks: { ...data.socialLinks, twitter: e.target.value || undefined } })
                  }
                  placeholder="https://x.com/..."
                />
                <ErrorText msg={validation.errors["social.twitter"]} />
              </div>
            </div>
          </section>
          <section className="rounded-xl border border-white/10 bg-gray-900/40 p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-indigo-300">Top Clients</h3>
              <button
                type="button"
                onClick={addClient}
                className="rounded-lg border border-indigo-500/50 px-3 py-1.5 text-xs font-medium text-indigo-400 transition-colors hover:bg-indigo-500/10"
              >
                + Add
              </button>
            </div>
            <div className="space-y-3">
              {data.topClients.map((c, i) => (
                <div key={i} className="rounded-lg border border-white/5 bg-gray-950/40 p-3">
                  <div className="flex gap-2">
                    <input
                      className={`${inputClass} flex-1`}
                      value={c.name}
                      onChange={(e) => updateClient(i, { name: e.target.value })}
                      placeholder="Client name"
                    />
                    <button
                      type="button"
                      onClick={() => removeClient(i)}
                      className="rounded-lg px-2 text-red-400 hover:bg-red-500/10"
                    >
                      ×
                    </button>
                  </div>
                  <ErrorText msg={validation.errors[`clients.${i}.name`]} />
                  <div className="mt-2">
                    <input
                      className={inputClass}
                      type="url"
                      value={c.logoUrl || ""}
                      onChange={(e) => updateClient(i, { logoUrl: e.target.value || undefined })}
                      placeholder="Logo URL (optional)"
                    />
                    <ErrorText msg={validation.errors[`clients.${i}.logoUrl`]} />
                  </div>
                </div>
              ))}
            </div>
          </section>
          <section className="rounded-xl border border-white/10 bg-gray-900/40 p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-indigo-300">Testimonials</h3>
              <button
                type="button"
                onClick={addTestimonial}
                className="rounded-lg border border-indigo-500/50 px-3 py-1.5 text-xs font-medium text-indigo-400 transition-colors hover:bg-indigo-500/10"
              >
                + Add
              </button>
            </div>
            <div className="space-y-4">
              {data.testimonials.map((t, i) => (
                <div key={i} className="space-y-2 rounded-lg border border-white/5 bg-gray-950/50 p-4">
                  <div>
                    <label className={labelClass}>Quote</label>
                    <textarea
                      className={`${inputClass} min-h-[60px]`}
                      value={t.quote}
                      onChange={(e) => updateTestimonial(i, { quote: e.target.value })}
                      placeholder="&quot;Great work...&quot;"
                    />
                    <ErrorText msg={validation.errors[`testimonials.${i}.quote`]} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelClass}>Author</label>
                      <input
                        className={inputClass}
                        value={t.author}
                        onChange={(e) => updateTestimonial(i, { author: e.target.value })}
                        placeholder="Name"
                      />
                      <ErrorText msg={validation.errors[`testimonials.${i}.author`]} />
                    </div>
                    <div>
                      <label className={labelClass}>Role</label>
                      <input
                        className={inputClass}
                        value={t.role || ""}
                        onChange={(e) => updateTestimonial(i, { role: e.target.value || undefined })}
                        placeholder="Optional"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeTestimonial(i)}
                    className="text-xs text-red-400 hover:underline"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );

  return (
    <div className="flex flex-col">
      {/* Step indicator */}
      <div className="mb-6 flex items-center justify-center gap-1 sm:gap-2">
        {STEPS.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => goToStep(s.id)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all sm:px-4 ${
              step === s.id
                ? "bg-indigo-500 text-white"
                : "border border-white/10 text-gray-400 hover:border-indigo-500/50 hover:text-indigo-300"
            }`}
          >
            <span className="hidden sm:inline">{s.title}</span>
            <span className="sm:hidden">{s.id}</span>
          </button>
        ))}
      </div>

      {step === 4 && (
        <div className="mb-4 flex flex-col items-start justify-between gap-2 rounded-xl border border-white/10 bg-gray-950/60 px-4 py-3 text-xs text-indigo-100/80 sm:flex-row sm:items-center">
          <div>
            <p className="font-semibold text-indigo-200">My CV</p>
            <p className="text-[11px] text-indigo-200/70">
              Save your latest changes so they&apos;re available next time you open the CV generator.
            </p>
            {lastSavedAt && (
              <p className="mt-1 text-[10px] text-indigo-200/60">
                Last saved {new Date(lastSavedAt).toLocaleString()}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onSave}
            className="mt-1 rounded-xl border border-indigo-500/60 px-4 py-2 text-xs font-medium text-indigo-200 transition-colors hover:bg-indigo-500/10 sm:mt-0"
          >
            Save to My CV
          </button>
        </div>
      )}

      {stepContent}

      {validation.message && (
        <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-xs text-red-200">
          {validation.message}
        </div>
      )}

      {/* Navigation */}
      <div className="mt-8 flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => goToStep(Math.max(1, step - 1))}
          disabled={step === 1}
          className="rounded-xl border border-white/10 px-4 py-2.5 text-sm font-medium text-gray-300 transition-colors hover:bg-white/5 disabled:opacity-40 disabled:hover:bg-transparent"
        >
          ← Previous
        </button>
        {step < 4 ? (
          <button
            type="button"
            onClick={() => goToStep(step + 1)}
            disabled={!validation.valid}
            className="rounded-xl bg-indigo-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-600 disabled:opacity-60 disabled:hover:bg-indigo-500"
          >
            Next →
          </button>
        ) : (
          <button
            type="button"
            onClick={onDownload}
            disabled={downloading || !validation.valid}
            className="rounded-xl bg-gradient-to-t from-indigo-600 to-indigo-500 px-6 py-2.5 text-sm font-medium text-white shadow-lg shadow-indigo-500/25 transition-all hover:scale-105 hover:shadow-indigo-500/40 disabled:opacity-60 disabled:hover:scale-100"
          >
            {downloading ? "Downloading..." : "Download CV"}
          </button>
        )}
      </div>
    </div>
  );
}
