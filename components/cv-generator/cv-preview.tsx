"use client";

import type { CVData } from "@/types/cv";

/* Project-compatible colors: indigo/violet palette */
const SIDEBAR_BG = "#312e81"; /* indigo-900 - matches project */
const ACCENT = "#6366f1"; /* indigo-500 - matches project accents */

export default function CVPreview({ data }: { data: CVData }) {
  const { fullName, roles, profileImageUrl, contact, skills, aboutMe, education, experience, skillsList, socialLinks, topClients, testimonials } = data;

  return (
    <div
      className="mx-auto max-w-[210mm] overflow-hidden rounded-lg shadow-2xl print:shadow-none"
      style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}
    >
      <div className="flex min-h-[297mm]">
        {/* Left sidebar - indigo-900 */}
        <aside
          className="flex w-[35%] min-w-[140px] flex-col"
          style={{ backgroundColor: SIDEBAR_BG }}
        >
          {/* Profile image */}
          <div className="relative mx-auto mt-6 h-24 w-24 overflow-hidden rounded-full border-2 border-white/30 shadow-lg sm:h-28 sm:w-28">
            {profileImageUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={profileImageUrl} alt={fullName || "Profile"} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-indigo-800/80 text-3xl text-white">
                {(fullName || "?")[0]}
              </div>
            )}
          </div>

          {/* CONTACT */}
          <div className="mt-6 px-4 pb-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-white/90">Contact</h3>
            <div className="mt-2 space-y-2 text-sm text-white/90">
              {contact.location && (
                <div className="flex items-start gap-2">
                  <svg className="mt-0.5 h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>{contact.location}</span>
                </div>
              )}
              {contact.phone && (
                <div className="flex items-center gap-2">
                  <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span>{contact.phone}</span>
                </div>
              )}
              {contact.email && (
                <div className="flex items-center gap-2">
                  <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span className="break-all">{contact.email}</span>
                </div>
              )}
            </div>
          </div>

          {/* KNOWLEDGE / LANGUAGE with proficiency bars */}
          {skills.length > 0 && (
            <div className="mt-4 px-4 pb-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-white/90">Knowledge</h3>
              <h3 className="mt-1 text-xs font-semibold uppercase tracking-wider text-white/90">Language</h3>
              <div className="mt-2 space-y-3">
                {skills.map((s, i) => (
                  <div key={i}>
                    <div className="mb-1 flex items-center gap-2">
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-white/20">
                        <span className="text-[10px] font-bold text-white">{s.name[0]}</span>
                      </div>
                      <span className="text-sm text-white/90">{s.name}</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/20">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${s.proficiency}%`, backgroundColor: ACCENT }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>

        {/* Main content - light background for print readability */}
        <main className="flex-1 bg-gray-50 px-6 py-6 text-gray-800">
          <header className="mb-4">
            <h1 className="text-xl font-bold text-gray-900">{fullName || "Your Name"}</h1>
            {roles.length > 0 && (
              <p className="text-sm text-gray-600">{roles.join(" • ")}</p>
            )}
          </header>

          {aboutMe && (
            <section className="mb-4">
              <h2 className="mb-2 border-b border-gray-300 pb-1 text-xs font-semibold uppercase tracking-wider text-gray-800">
                About Me
              </h2>
              <p className="text-[13px] leading-relaxed text-gray-700">{aboutMe}</p>
            </section>
          )}

          {education.length > 0 && (
            <section className="mb-4">
              <h2 className="mb-2 border-b border-gray-300 pb-1 text-xs font-semibold uppercase tracking-wider text-gray-800">
                Education
              </h2>
              {education.map((e, i) => (
                <div key={i} className="mb-3">
                  <p className="text-[11px] text-gray-500">{e.startDate} - {e.endDate}</p>
                  <p className="text-sm font-medium" style={{ color: ACCENT }}>{e.institution}</p>
                  <p className="text-[13px] text-gray-700">{e.description}</p>
                </div>
              ))}
            </section>
          )}

          {experience.length > 0 && (
            <section className="mb-4">
              <h2 className="mb-2 border-b border-gray-300 pb-1 text-xs font-semibold uppercase tracking-wider text-gray-800">
                Experience
              </h2>
              {experience.map((exp, i) => (
                <div key={i} className="mb-3">
                  <p className="text-[11px] text-gray-500">{exp.startDate} - {exp.endDate}</p>
                  <div className="flex items-center gap-2">
                    <svg className="h-4 w-4 shrink-0 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span className="text-sm font-semibold text-gray-800">{exp.employer} - {exp.role}</span>
                  </div>
                  <p className="mt-1 text-[13px] leading-relaxed text-gray-700">{exp.description}</p>
                </div>
              ))}
            </section>
          )}

          {skillsList.length > 0 && (
            <section className="mb-4">
              <h2 className="mb-2 border-b border-gray-300 pb-1 text-xs font-semibold uppercase tracking-wider text-gray-800">
                Skills
              </h2>
              <p className="text-[13px] text-gray-700">{skillsList.join(", ")}</p>
            </section>
          )}

          {(socialLinks.email || socialLinks.linkedin || socialLinks.instagram) && (
            <section className="mb-4">
              <h2 className="mb-2 border-b border-gray-300 pb-1 text-xs font-semibold uppercase tracking-wider text-gray-800">
                Social Media Links
              </h2>
              <div className="space-y-2 text-[13px] text-gray-700">
                {socialLinks.email && (
                  <div className="flex items-center gap-2">
                    <span>✉️</span>
                    <span>{socialLinks.email}</span>
                  </div>
                )}
                {socialLinks.linkedin && (
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-[#0A66C2] text-[10px] font-bold text-white">in</span>
                    <span className="break-all">{socialLinks.linkedin}</span>
                  </div>
                )}
                {socialLinks.instagram && (
                  <div className="flex items-center gap-2">
                    <span>📷</span>
                    <span className="break-all">{socialLinks.instagram}</span>
                  </div>
                )}
              </div>
            </section>
          )}

          {topClients.length > 0 && (
            <section className="mb-4">
              <h2 className="mb-2 border-b border-gray-300 pb-1 text-xs font-semibold uppercase tracking-wider text-gray-800">
                Top Clients
              </h2>
              <div className="flex flex-wrap gap-4">
                {topClients.map((c, i) => (
                  <div key={i} className="flex flex-col items-center gap-1">
                    <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-lg bg-gray-200 text-lg font-bold text-gray-600">
                      {c.logoUrl ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={c.logoUrl} alt={c.name} className="h-full w-full object-cover" />
                      ) : (
                        c.name[0]
                      )}
                    </div>
                    <span className="text-xs text-gray-600">{c.name}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {testimonials.length > 0 && (
            <section>
              <div
                className="-mx-6 -mb-6 flex items-center gap-3 px-6 py-2"
                style={{ backgroundColor: SIDEBAR_BG }}
              >
                <h2 className="text-sm font-semibold uppercase tracking-wider text-white">
                  Testimonials
                </h2>
              </div>
              <div className="mt-3 space-y-2">
                {testimonials.map((t, i) => (
                  <blockquote key={i} className="text-[13px] italic text-gray-700">
                    &ldquo;{t.quote}&rdquo; — {t.author}
                    {t.role && <span className="text-gray-500">, {t.role}</span>}
                  </blockquote>
                ))}
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
