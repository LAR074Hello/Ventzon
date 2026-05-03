"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { ArrowRight, Upload, CheckCircle } from "lucide-react";

type FormState = {
  // Personal
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  city: string;

  // Legal
  authorizedToWork: string;       // yes | no
  requiresSponsorship: string;    // yes | no
  over18: string;                 // yes | no
  felony: string;                 // yes | no | prefer-not
  felonyExplanation: string;
  startDate: string;

  // Experience
  salesExperience: string;
  whyVentzon: string;
  linkedIn: string;

  // Resume
  resume: File | null;
};

const INITIAL: FormState = {
  firstName: "", lastName: "", email: "", phone: "", city: "",
  authorizedToWork: "", requiresSponsorship: "", over18: "", felony: "", felonyExplanation: "",
  startDate: "",
  salesExperience: "", whyVentzon: "", linkedIn: "",
  resume: null,
};

function Field({ label, required, children, hint }: { label: string; required?: boolean; children: React.ReactNode; hint?: string }) {
  return (
    <div>
      <label className="mb-2 block text-[11px] font-light tracking-[0.25em] text-[#aaa]">
        {label.toUpperCase()}{required && <span className="ml-1 text-[#777]">*</span>}
      </label>
      {children}
      {hint && <p className="mt-1.5 text-[11px] font-light text-[#777]">{hint}</p>}
    </div>
  );
}

function TextInput({ value, onChange, placeholder, type = "text", disabled }: {
  value: string; onChange: (v: string) => void; placeholder?: string; type?: string; disabled?: boolean;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className="w-full rounded-xl border border-[#333] bg-[#0d0d0d] px-4 py-3.5 text-[14px] font-light text-[#ededed] outline-none transition-colors placeholder:text-[#555] focus:border-[#555] disabled:opacity-40"
    />
  );
}

function Textarea({ value, onChange, placeholder, rows = 4, disabled }: {
  value: string; onChange: (v: string) => void; placeholder?: string; rows?: number; disabled?: boolean;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      disabled={disabled}
      className="w-full rounded-xl border border-[#333] bg-[#0d0d0d] px-4 py-3.5 text-[14px] font-light leading-relaxed text-[#ededed] outline-none transition-colors placeholder:text-[#555] focus:border-[#555] disabled:opacity-40 resize-none"
    />
  );
}

function RadioGroup({ name, value, onChange, options, disabled }: {
  name: string; value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[]; disabled?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          disabled={disabled}
          onClick={() => onChange(opt.value)}
          className={`rounded-full border px-4 py-2 text-[12px] font-light tracking-[0.05em] transition-all duration-200 ${
            value === opt.value
              ? "border-[#ededed] bg-[#ededed] text-black"
              : "border-[#333] bg-[#0d0d0d] text-[#888] hover:border-[#555] hover:text-[#bbb]"
          } disabled:opacity-40`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function SectionHeading({ number, title }: { number: string; title: string }) {
  return (
    <div className="flex items-center gap-4 pb-5 pt-2">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#444] text-[11px] font-light text-[#888]">
        {number}
      </span>
      <p className="text-[11px] font-light tracking-[0.3em] text-[#888]">{title.toUpperCase()}</p>
      <div className="h-px flex-1 bg-[#222]" />
    </div>
  );
}

export default function ApplyPage() {
  const [form, setForm] = useState<FormState>(INITIAL);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function set(key: keyof FormState) {
    return (value: string) => setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);

    if (!form.firstName || !form.lastName || !form.email || !form.city) {
      setErr("Please fill in all required fields.");
      return;
    }
    if (!form.authorizedToWork || !form.requiresSponsorship || !form.over18 || !form.felony) {
      setErr("Please answer all legal questions.");
      return;
    }
    if (!form.whyVentzon.trim()) {
      setErr("Please tell us why you want to work at Ventzon.");
      return;
    }

    setSubmitting(true);
    try {
      const data = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (k !== "resume" && v !== null) data.append(k, v as string);
      });
      if (form.resume) data.append("resume", form.resume);

      const res = await fetch("/api/careers/apply", { method: "POST", body: data });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? "Submission failed");
      setSubmitted(true);
    } catch (e: any) {
      setErr(e?.message ?? "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-black px-8 text-center">
        <CheckCircle className="h-12 w-12 text-emerald-400" />
        <h1 className="mt-6 text-[28px] font-extralight text-[#ededed]">Application received</h1>
        <p className="mt-3 max-w-sm text-[14px] font-light leading-relaxed text-[#999]">
          Thanks for applying to Ventzon. We review every application and will be in touch shortly.
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex items-center gap-2 text-[12px] font-light tracking-[0.15em] text-[#777] transition-colors hover:text-[#bbb]"
        >
          Back to Ventzon <ArrowRight className="h-3 w-3" />
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-[#ededed]">
      <div className="mx-auto max-w-2xl px-8 pb-24 pt-36">

        {/* Header */}
        <Link href="/careers/business-development-representative" className="text-[11px] font-light tracking-[0.3em] text-[#777] transition-colors hover:text-[#bbb]">
          ← JOB LISTING
        </Link>
        <h1 className="mt-6 text-[32px] font-extralight tracking-[-0.01em] text-[#ededed]">
          Apply
        </h1>
        <p className="mt-2 text-[14px] font-light text-[#999]">Business Development Representative · Ventzon</p>

        <form onSubmit={handleSubmit} className="mt-12 space-y-10">

          {/* ── 1. Personal info ── */}
          <div>
            <SectionHeading number="1" title="Personal information" />
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Field label="First name" required>
                  <TextInput value={form.firstName} onChange={set("firstName")} placeholder="Jane" disabled={submitting} />
                </Field>
                <Field label="Last name" required>
                  <TextInput value={form.lastName} onChange={set("lastName")} placeholder="Smith" disabled={submitting} />
                </Field>
              </div>
              <Field label="Email address" required>
                <TextInput type="email" value={form.email} onChange={set("email")} placeholder="jane@example.com" disabled={submitting} />
              </Field>
              <Field label="Phone number">
                <TextInput type="tel" value={form.phone} onChange={set("phone")} placeholder="(555) 123-4567" disabled={submitting} />
              </Field>
              <Field label="City you're based in" required hint="You'll be working in-person in your local area.">
                <TextInput value={form.city} onChange={set("city")} placeholder="e.g. Austin, TX" disabled={submitting} />
              </Field>
              <Field label="LinkedIn profile URL">
                <TextInput value={form.linkedIn} onChange={set("linkedIn")} placeholder="linkedin.com/in/janesmith" disabled={submitting} />
              </Field>
            </div>
          </div>

          {/* ── 2. Legal / employment eligibility ── */}
          <div>
            <SectionHeading number="2" title="Employment eligibility" />
            <div className="space-y-6">

              <Field label="Are you legally authorized to work in the United States?" required>
                <RadioGroup
                  name="authorizedToWork"
                  value={form.authorizedToWork}
                  onChange={set("authorizedToWork")}
                  options={[{ value: "yes", label: "Yes" }, { value: "no", label: "No" }]}
                  disabled={submitting}
                />
              </Field>

              <Field label="Will you now or in the future require visa sponsorship for employment?" required>
                <RadioGroup
                  name="requiresSponsorship"
                  value={form.requiresSponsorship}
                  onChange={set("requiresSponsorship")}
                  options={[{ value: "yes", label: "Yes" }, { value: "no", label: "No" }]}
                  disabled={submitting}
                />
              </Field>

              <Field label="Are you at least 18 years of age?" required hint="Applicants under 18 may be considered with a valid work permit.">
                <RadioGroup
                  name="over18"
                  value={form.over18}
                  onChange={set("over18")}
                  options={[{ value: "yes", label: "Yes" }, { value: "no", label: "No — I have a work permit" }]}
                  disabled={submitting}
                />
              </Field>

              <Field
                label="Have you been convicted of a felony in the past 7 years?"
                required
                hint="A conviction does not automatically disqualify you. We consider the nature, circumstances, and relevance to the role."
              >
                <RadioGroup
                  name="felony"
                  value={form.felony}
                  onChange={set("felony")}
                  options={[
                    { value: "no", label: "No" },
                    { value: "yes", label: "Yes" },
                    { value: "prefer-not", label: "Prefer not to say" },
                  ]}
                  disabled={submitting}
                />
                {form.felony === "yes" && (
                  <div className="mt-3">
                    <Textarea
                      value={form.felonyExplanation}
                      onChange={set("felonyExplanation")}
                      placeholder="Please briefly describe the nature of the conviction and when it occurred."
                      rows={3}
                      disabled={submitting}
                    />
                  </div>
                )}
              </Field>

              <Field label="Earliest available start date">
                <TextInput type="date" value={form.startDate} onChange={set("startDate")} disabled={submitting} />
              </Field>

            </div>
          </div>

          {/* ── 3. Experience ── */}
          <div>
            <SectionHeading number="3" title="Experience & motivation" />
            <div className="space-y-4">
              <Field label="Describe any sales, retail, or customer-facing experience you have" hint="No experience? Tell us about a time you persuaded someone of something.">
                <Textarea
                  value={form.salesExperience}
                  onChange={set("salesExperience")}
                  placeholder="e.g. I worked at a coffee shop for two summers and regularly upsold seasonal drinks…"
                  rows={4}
                  disabled={submitting}
                />
              </Field>

              <Field label="Why do you want to work at Ventzon?" required>
                <Textarea
                  value={form.whyVentzon}
                  onChange={set("whyVentzon")}
                  placeholder="Tell us what excites you about this role and what you'd bring to it…"
                  rows={5}
                  disabled={submitting}
                />
              </Field>
            </div>
          </div>

          {/* ── 4. Resume ── */}
          <div>
            <SectionHeading number="4" title="Resume" />
            <Field label="Upload your resume" hint="PDF, DOC, or DOCX. Max 5 MB. Optional but recommended.">
              <div
                onClick={() => fileRef.current?.click()}
                className={`flex cursor-pointer flex-col items-center gap-3 rounded-xl border border-dashed py-8 transition-colors duration-200 ${
                  form.resume ? "border-[#444] bg-[#0d0d0d]" : "border-[#333] bg-[#080808] hover:border-[#555]"
                }`}
              >
                <Upload className="h-5 w-5 text-[#777]" />
                {form.resume ? (
                  <div className="text-center">
                    <p className="text-[13px] font-light text-[#ededed]">{form.resume.name}</p>
                    <p className="mt-1 text-[11px] font-light text-[#888]">
                      {(form.resume.size / 1024 / 1024).toFixed(2)} MB · Click to change
                    </p>
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="text-[13px] font-light text-[#aaa]">Click to upload resume</p>
                    <p className="mt-1 text-[11px] font-light text-[#777]">PDF, DOC, DOCX up to 5 MB</p>
                  </div>
                )}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0] ?? null;
                  if (file && file.size > 5 * 1024 * 1024) {
                    setErr("Resume must be under 5 MB.");
                    return;
                  }
                  setForm((f) => ({ ...f, resume: file }));
                  setErr(null);
                }}
              />
            </Field>
          </div>

          {/* Error */}
          {err && (
            <div className="rounded-xl border border-red-900/30 bg-red-950/20 px-5 py-4 text-[13px] font-light text-red-300/80">
              {err}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-full border border-[#ededed] py-4 text-[12px] font-light tracking-[0.2em] text-[#ededed] transition-all duration-300 hover:bg-[#ededed] hover:text-black disabled:opacity-40"
          >
            {submitting ? "SUBMITTING…" : "SUBMIT APPLICATION"}
          </button>

          <p className="text-center text-[11px] font-light leading-relaxed text-[#666]">
            By submitting, you confirm all information provided is accurate. Ventzon is an equal opportunity employer.
          </p>

        </form>
      </div>
    </main>
  );
}
