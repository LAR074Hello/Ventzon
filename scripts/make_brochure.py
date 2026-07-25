from fpdf import FPDF
from fpdf.enums import XPos, YPos

class VentzonBrochure(FPDF):
    def header(self):
        pass

    def footer(self):
        self.set_y(-12)
        self.set_font("Helvetica", size=8)
        self.set_text_color(150, 150, 150)
        self.cell(0, 8, "ventzon.com", align="C", new_x=XPos.LMARGIN, new_y=YPos.NEXT)

    def divider(self, y_offset=4):
        self.ln(y_offset)
        self.set_draw_color(210, 210, 210)
        self.set_line_width(0.3)
        self.line(self.l_margin, self.get_y(), self.w - self.r_margin, self.get_y())
        self.ln(y_offset)

    def section_label(self, text):
        self.set_font("Helvetica", "B", 8)
        self.set_text_color(120, 120, 120)
        self.cell(0, 5, text.upper(), new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        self.ln(2)

    def body(self, text, size=10.5):
        self.set_font("Helvetica", size=size)
        self.set_text_color(30, 30, 30)
        self.multi_cell(0, 6, text)

    def bullet(self, text, size=10.5):
        self.set_font("Helvetica", size=size)
        self.set_text_color(30, 30, 30)
        # indent + dash
        self.set_x(self.l_margin + 4)
        self.multi_cell(0, 6, "-  " + text)

    def callout(self, text):
        x = self.l_margin
        y = self.get_y()
        w = self.w - self.l_margin - self.r_margin
        # Estimate height
        self.set_font("Helvetica", "I", 10)
        # Count lines roughly
        chars_per_line = int((w - 10) / 2.1)
        import math
        lines_est = sum(math.ceil(len(p) / chars_per_line) for p in text.split('\n')) + len(text.split('\n'))
        box_h = max(lines_est * 5.5 + 14, 20)
        self.set_fill_color(247, 247, 247)
        self.set_draw_color(215, 215, 215)
        self.set_line_width(0.3)
        self.rect(x, y, w, box_h, style="FD")
        self.set_xy(x + 6, y + 6)
        self.set_font("Helvetica", "I", 10)
        self.set_text_color(55, 55, 55)
        self.multi_cell(w - 12, 5.5, text)
        # Make sure we're past the box
        if self.get_y() < y + box_h:
            self.set_y(y + box_h)
        self.ln(5)

pdf = VentzonBrochure(orientation="P", unit="mm", format="Letter")
pdf.set_margins(22, 22, 22)
pdf.set_auto_page_break(auto=True, margin=20)
pdf.add_page()

# ── COVER ─────────────────────────────────────────────────────
pdf.ln(6)
pdf.set_font("Helvetica", "B", 36)
pdf.set_text_color(0, 0, 0)
pdf.cell(0, 14, "VENTZON", new_x=XPos.LMARGIN, new_y=YPos.NEXT)

pdf.set_font("Helvetica", size=13)
pdf.set_text_color(90, 90, 90)
pdf.cell(0, 7, "Digital Loyalty Rewards for Local Businesses", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
pdf.ln(2)
pdf.divider(y_offset=6)

# ── WHAT IS VENTZON ───────────────────────────────────────────
pdf.section_label("What is Ventzon?")
pdf.body(
    "Ventzon is a digital loyalty program built for local businesses. "
    "We replace paper punch cards with a simple, modern system -- no app download "
    "required for customers, and no hardware needed for you.\n\n"
    "Customers check in by scanning a QR code and entering their email. "
    "You get a live dashboard with real customer data. They get rewarded for "
    "coming back. Everyone wins."
)
pdf.divider()

# ── VALUE PROPOSITION ─────────────────────────────────────────
pdf.section_label("What We Provide")

pdf.set_font("Helvetica", "B", 10.5)
pdf.set_text_color(20, 20, 20)
pdf.cell(0, 7, "For Your Business", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
pdf.ln(1)

for b in [
    "Your own branded loyalty program, live the same day",
    "A QR code for your counter, window, or receipts -- that's all the setup",
    "Real-time dashboard: see who's visiting, how often, and when",
    "Automated reward emails sent on your behalf when customers earn",
    "Full customer list with visit history",
    "No contracts. No hardware. No setup fees.",
]:
    pdf.bullet(b)

pdf.ln(5)
pdf.set_font("Helvetica", "B", 10.5)
pdf.set_text_color(20, 20, 20)
pdf.cell(0, 7, "For Your Customers", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
pdf.ln(1)

for b in [
    "No app download required -- works with just an email address",
    "A digital stamp card that never gets lost or left at home",
    "An automatic email when they're one visit away from a reward",
    "An automatic email when they've earned their reward, ready to redeem",
    "A real reason to choose you over a competitor",
]:
    pdf.bullet(b)

pdf.divider()

# ── HOW IT WORKS ──────────────────────────────────────────────
pdf.section_label("How It Works")

pdf.set_font("Helvetica", "B", 10.5)
pdf.set_text_color(20, 20, 20)
pdf.cell(0, 7, "The Customer Experience", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
pdf.ln(2)

pdf.callout(
    "Sarah visits your coffee shop for the first time. She scans the QR code on "
    "the counter and enters her email -- no app, no account creation.\n\n"
    "Every visit, she gives her email at the register. At visit 7 of 8, she gets "
    "an email: \"One more visit to earn your free coffee at Brewed Awakenings.\" "
    "At visit 8: \"You earned a reward. Show this at the register to redeem.\"\n\n"
    "She comes back. She redeems. She comes back again."
)

pdf.set_font("Helvetica", "B", 10.5)
pdf.set_text_color(20, 20, 20)
pdf.cell(0, 7, "The Business Experience", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
pdf.ln(2)

pdf.callout(
    "You sign up, enter your shop name, your deal (e.g. \"Buy 8 coffees, get 1 free\"), "
    "and the number of visits required. We generate your QR code -- print it or display "
    "it on screen.\n\n"
    "Your staff enter customer emails at checkout, or customers scan themselves. "
    "The system tracks everything automatically.\n\n"
    "Log into your dashboard anytime: total customers, check-ins today, who's close "
    "to a reward. No training required. No ongoing maintenance. It just runs."
)

pdf.divider()

# ── GET STARTED ───────────────────────────────────────────────
pdf.section_label("Get Started")

pdf.set_font("Helvetica", "B", 22)
pdf.set_text_color(0, 0, 0)
pdf.cell(0, 10, "$25 / month", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
pdf.set_font("Helvetica", size=10)
pdf.set_text_color(100, 100, 100)
pdf.cell(0, 6, "No setup fees. No contracts. Cancel anytime.", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
pdf.ln(5)

pdf.body("Your loyalty program can be live today.")
pdf.ln(5)

for label, value in [("Web", "ventzon.com"), ("Email", "contact@ventzon.com")]:
    pdf.set_font("Helvetica", "B", 10.5)
    pdf.set_text_color(30, 30, 30)
    pdf.cell(22, 6, label + ":", new_x=XPos.RIGHT, new_y=YPos.TOP)
    pdf.set_font("Helvetica", size=10.5)
    pdf.cell(0, 6, value, new_x=XPos.LMARGIN, new_y=YPos.NEXT)

out = "/Users/lukerichards/Desktop/Ventzon_Brochure.pdf"
pdf.output(out)
print(f"Saved: {out}")
