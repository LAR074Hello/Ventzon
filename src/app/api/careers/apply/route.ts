import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const get = (key: string) => String(formData.get(key) ?? "").trim();

    const application = {
      first_name: get("firstName"),
      last_name: get("lastName"),
      email: get("email"),
      phone: get("phone"),
      city: get("city"),
      linkedin_url: get("linkedIn"),
      authorized_to_work: get("authorizedToWork"),
      requires_sponsorship: get("requiresSponsorship"),
      over_18: get("over18"),
      felony_disclosure: get("felony"),
      felony_explanation: get("felonyExplanation"),
      available_full_summer: get("availableFullSummer"),
      start_date: get("startDate") || null,
      sales_experience: get("salesExperience"),
      why_ventzon: get("whyVentzon"),
      role: "business-development-representative",
      submitted_at: new Date().toISOString(),
    };

    // Validate required fields
    if (!application.first_name || !application.last_name || !application.email) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Store in DB
    const { error: dbError } = await supabase
      .from("job_applications")
      .insert(application);

    if (dbError) {
      console.error("DB error:", dbError.message);
      // Don't block the submission — still send email
    }

    // Handle resume file
    const resumeFile = formData.get("resume") as File | null;
    let resumeAttachment: { filename: string; content: Buffer } | null = null;

    if (resumeFile && resumeFile.size > 0) {
      const buffer = Buffer.from(await resumeFile.arrayBuffer());
      resumeAttachment = { filename: resumeFile.name, content: buffer };
    }

    // Send email notification
    const resend = new Resend(process.env.RESEND_API_KEY);

    const emailBody = `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:600px;margin:0 auto;padding:32px 24px;background:#000;color:#ededed">
        <p style="font-size:11px;letter-spacing:0.3em;color:#555;margin:0">NEW APPLICATION</p>
        <h1 style="font-size:24px;font-weight:300;color:#ededed;margin:16px 0 4px">Business Development Representative</h1>
        <p style="font-size:13px;color:#555;margin:0">${application.submitted_at}</p>

        <hr style="border:none;border-top:1px solid #1a1a1a;margin:24px 0"/>

        <table style="width:100%;border-collapse:collapse;font-size:14px;font-weight:300">
          <tr><td style="padding:8px 0;color:#555;width:180px">Name</td><td style="color:#ededed">${application.first_name} ${application.last_name}</td></tr>
          <tr><td style="padding:8px 0;color:#555">Email</td><td style="color:#ededed"><a href="mailto:${application.email}" style="color:#ededed">${application.email}</a></td></tr>
          ${application.phone ? `<tr><td style="padding:8px 0;color:#555">Phone</td><td style="color:#ededed">${application.phone}</td></tr>` : ""}
          <tr><td style="padding:8px 0;color:#555">City</td><td style="color:#ededed">${application.city}</td></tr>
          ${application.linkedin_url ? `<tr><td style="padding:8px 0;color:#555">LinkedIn</td><td style="color:#ededed"><a href="https://${application.linkedin_url.replace(/^https?:\/\//, "")}" style="color:#888">${application.linkedin_url}</a></td></tr>` : ""}
        </table>

        <hr style="border:none;border-top:1px solid #1a1a1a;margin:24px 0"/>

        <p style="font-size:11px;letter-spacing:0.3em;color:#555;margin:0 0 16px">EMPLOYMENT ELIGIBILITY</p>
        <table style="width:100%;border-collapse:collapse;font-size:14px;font-weight:300">
          <tr><td style="padding:8px 0;color:#555;width:280px">Authorized to work in the US</td><td style="color:#ededed">${application.authorized_to_work}</td></tr>
          <tr><td style="padding:8px 0;color:#555">Requires visa sponsorship</td><td style="color:#ededed">${application.requires_sponsorship}</td></tr>
          <tr><td style="padding:8px 0;color:#555">18 or older</td><td style="color:#ededed">${application.over_18}</td></tr>
          <tr><td style="padding:8px 0;color:#555">Felony disclosure</td><td style="color:#ededed">${application.felony_disclosure}${application.felony_explanation ? ` — ${application.felony_explanation}` : ""}</td></tr>
          <tr><td style="padding:8px 0;color:#555">Available full summer</td><td style="color:#ededed">${application.available_full_summer}</td></tr>
          ${application.start_date ? `<tr><td style="padding:8px 0;color:#555">Start date</td><td style="color:#ededed">${application.start_date}</td></tr>` : ""}
        </table>

        <hr style="border:none;border-top:1px solid #1a1a1a;margin:24px 0"/>

        <p style="font-size:11px;letter-spacing:0.3em;color:#555;margin:0 0 12px">SALES EXPERIENCE</p>
        <p style="font-size:14px;font-weight:300;color:#888;line-height:1.7;white-space:pre-wrap">${application.sales_experience || "Not provided"}</p>

        <p style="font-size:11px;letter-spacing:0.3em;color:#555;margin:24px 0 12px">WHY VENTZON</p>
        <p style="font-size:14px;font-weight:300;color:#888;line-height:1.7;white-space:pre-wrap">${application.why_ventzon}</p>

        ${resumeAttachment ? `<p style="font-size:12px;color:#555;margin-top:24px">📎 Resume attached: ${resumeAttachment.filename}</p>` : ""}

        <hr style="border:none;border-top:1px solid #1a1a1a;margin:24px 0"/>
        <p style="font-size:11px;color:#333;margin:0">Ventzon Careers · ventzon.com/careers</p>
      </div>
    `;

    await resend.emails.send({
      from: "Ventzon Careers <rewards@ventzon.com>",
      to: "lukerichards@ventzon.com",
      replyTo: application.email,
      subject: `New Application: ${application.first_name} ${application.last_name} — Business Development Representative`,
      html: emailBody,
      ...(resumeAttachment ? { attachments: [resumeAttachment] } : {}),
    });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("Application error:", err);
    return NextResponse.json({ error: err?.message ?? "Unknown error" }, { status: 500 });
  }
}
