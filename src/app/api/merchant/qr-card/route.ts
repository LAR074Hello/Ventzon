import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import QRCode from "qrcode";
// pdfkit is server-external — imported via require so webpack doesn't try to bundle it
// eslint-disable-next-line @typescript-eslint/no-require-imports
const PDFDocument = require("pdfkit") as typeof import("pdfkit");

export const dynamic = "force-dynamic";
// Must run on Node.js runtime — pdfkit uses fs/stream internals
export const runtime = "nodejs";

/* ─── Constants ──────────────────────────────────────── */

// 4 × 6 inches at 72 pt/inch
const W = 4 * 72;   // 288 pt
const H = 6 * 72;   // 432 pt

const BLACK  = "#000000";
const WHITE  = "#ffffff";
const GRAY   = "#888888";
const LGRAY  = "#cccccc";

/* ─── PDF generation ─────────────────────────────────── */

async function buildPDF(opts: {
  shopName: string;
  shopSlug: string;
  joinUrl: string;
  qrBuffer: Buffer;
  logoBuffer: Buffer | null;
}): Promise<Buffer> {
  const { shopName, shopSlug, joinUrl, qrBuffer, logoBuffer } = opts;

  return new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({
      size: [W, H],
      margin: 0,
      info: { Title: `${shopName} Loyalty Card`, Author: "Ventzon" },
    });

    const chunks: Buffer[] = [];
    doc.on("data", (c: Buffer) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    /* ── Full white background ── */
    doc.rect(0, 0, W, H).fill(WHITE);

    /* ── Top dark bar (0 → 76pt) ── */
    const headerH = 76;
    doc.rect(0, 0, W, headerH).fill(BLACK);

    // "VENTZON" tiny top-left wordmark inside header
    doc
      .font("Helvetica")
      .fontSize(7)
      .fillColor("#444444")
      .text("VENTZON", 20, 14, { characterSpacing: 3, lineBreak: false });

    // Store name — scale font size to fit
    const nameFontSize = shopName.length > 18 ? 16 : shopName.length > 12 ? 19 : 22;
    doc
      .font("Helvetica")
      .fontSize(nameFontSize)
      .fillColor(WHITE)
      .text(shopName.toUpperCase(), 0, headerH / 2 - nameFontSize / 2 + 4, {
        width: W,
        align: "center",
        characterSpacing: 2,
        lineBreak: false,
      });

    /* ── Logo (if available) — centered below header ── */
    let logoBottomY = headerH + 16;
    if (logoBuffer) {
      const maxLogoH = 48;
      const maxLogoW = W - 64;
      try {
        // embed image — pdfkit auto-scales if we pass fit
        const logoX = 32;
        const logoY = headerH + 10;
        doc.image(logoBuffer, logoX, logoY, {
          fit: [maxLogoW, maxLogoH],
          align: "center",
        });
        logoBottomY = logoY + maxLogoH + 10;
      } catch {
        // logo failed to embed — skip it
        logoBottomY = headerH + 16;
      }
    }

    /* ── "Earn Rewards Here" headline ── */
    const headlineY = logoBottomY + 8;
    doc
      .font("Helvetica-Bold")
      .fontSize(18)
      .fillColor(BLACK)
      .text("Earn Rewards Here", 0, headlineY, {
        width: W,
        align: "center",
        lineBreak: false,
      });

    /* ── Subtext ── */
    doc
      .font("Helvetica")
      .fontSize(9.5)
      .fillColor(GRAY)
      .text("Scan to check in. Get rewarded for coming back.", 0, headlineY + 26, {
        width: W,
        align: "center",
        lineBreak: false,
      });

    /* ── QR code — pure black on white, centered ── */
    const qrSize = 172;
    const qrX = (W - qrSize) / 2;
    const qrY = headlineY + 54;

    // White padded box around QR (adds breathing room for scanners)
    const pad = 10;
    doc
      .roundedRect(qrX - pad, qrY - pad, qrSize + pad * 2, qrSize + pad * 2, 6)
      .lineWidth(1)
      .strokeColor(LGRAY)
      .fillAndStroke(WHITE, LGRAY);

    doc.image(qrBuffer, qrX, qrY, { width: qrSize, height: qrSize });

    /* ── URL below QR ── */
    const urlY = qrY + qrSize + pad + 10;
    doc
      .font("Helvetica")
      .fontSize(7.5)
      .fillColor(GRAY)
      .text(`ventzon.com/join/${shopSlug}`, 0, urlY, {
        width: W,
        align: "center",
        characterSpacing: 0.5,
        lineBreak: false,
      });

    /* ── Bottom dark bar ── */
    const footerH = 34;
    const footerY = H - footerH;
    doc.rect(0, footerY, W, footerH).fill(BLACK);

    // "POWERED BY VENTZON REWARDS" footer text
    doc
      .font("Helvetica")
      .fontSize(6.5)
      .fillColor("#555555")
      .text("POWERED BY VENTZON REWARDS", 0, footerY + 13, {
        width: W,
        align: "center",
        characterSpacing: 2,
        lineBreak: false,
      });

    doc.end();
  });
}

/* ─── Route handler ──────────────────────────────────── */

export async function GET(req: Request) {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
    }

    // Auth
    const supabaseAuth = await createSupabaseServerClient();
    const { data: { user }, error: authErr } = await supabaseAuth.auth.getUser();
    if (authErr || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const url = new URL(req.url);
    const shopSlug = String(url.searchParams.get("shop") ?? "").trim().toLowerCase();
    if (!shopSlug) return NextResponse.json({ error: "Missing shop" }, { status: 400 });

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Verify ownership + pull logo_url
    const { data: shop, error: shopErr } = await supabase
      .from("shops")
      .select("id, slug, user_id, logo_url")
      .eq("slug", shopSlug)
      .eq("user_id", user.id)
      .maybeSingle();

    if (shopErr || !shop) {
      return NextResponse.json({ error: "Shop not found" }, { status: 404 });
    }

    // Pull display name from shop_settings
    const { data: settings } = await supabase
      .from("shop_settings")
      .select("shop_name, join_token")
      .eq("shop_slug", shopSlug)
      .maybeSingle();

    const shopName = settings?.shop_name || shopSlug;

    // Build join URL (with token if available)
    const joinToken: string | undefined = (settings as any)?.join_token;
    const joinUrl = joinToken
      ? `https://www.ventzon.com/join/${shopSlug}?t=${joinToken}`
      : `https://www.ventzon.com/join/${shopSlug}`;

    // Generate QR code as PNG buffer — pure black on white, no border (we add our own)
    const qrBuffer = await QRCode.toBuffer(joinUrl, {
      type: "png",
      width: 400,
      margin: 1,
      errorCorrectionLevel: "H",
      color: { dark: BLACK, light: WHITE },
    });

    // Fetch logo if present (best-effort)
    let logoBuffer: Buffer | null = null;
    if (shop.logo_url) {
      try {
        const logoRes = await fetch(shop.logo_url);
        if (logoRes.ok) {
          logoBuffer = Buffer.from(await logoRes.arrayBuffer());
        }
      } catch {
        // skip — logo fetch failure is non-fatal
      }
    }

    // Build the PDF
    const pdfBuffer = await buildPDF({
      shopName,
      shopSlug,
      joinUrl,
      qrBuffer,
      logoBuffer,
    });

    const fileName = `${shopSlug}-qr-card.pdf`;
    return new Response(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Content-Length": String(pdfBuffer.length),
        "Cache-Control": "private, no-cache",
      },
    });
  } catch (e: any) {
    console.error("[qr-card] exception:", e);
    return NextResponse.json({ error: e?.message ?? "Unknown error" }, { status: 500 });
  }
}
