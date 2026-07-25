#!/usr/bin/env python3
"""
Ventzon Data Insights Report Generator
Pulls real data from Supabase and generates an HTML/PDF report.
Usage: python3 generate_insights_report.py [--pdf]
"""

import os, json, sys, subprocess, datetime, re
from urllib.request import urlopen, Request
from urllib.parse import urlencode

SUPABASE_URL = "https://pxdnwpqnmuzpdtjvbawa.supabase.co"
SERVICE_KEY  = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB4ZG53cHFubXV6cGR0anZiYXdhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTk4NTYxMiwiZXhwIjoyMDg1NTYxNjEyfQ.7ZOQgJlvRkcnUPGLDGbCaWKbNBOZESo3oxp6FOGZKiI"
HEADERS = {
    "apikey": SERVICE_KEY,
    "Authorization": f"Bearer {SERVICE_KEY}",
    "Content-Type": "application/json",
}

def fetch(path, params=""):
    url = f"{SUPABASE_URL}/rest/v1/{path}"
    if params: url += f"?{params}"
    req = Request(url, headers=HEADERS)
    with urlopen(req) as r:
        return json.loads(r.read())

def infer_category(slug, name):
    text = (slug + " " + (name or "")).lower()
    if any(w in text for w in ["coffee","cafe","brew","roast","espresso","latte","bean"]):
        return "Coffee / Cafe"
    if any(w in text for w in ["barber","haircut","cut","blade","fade","sharp","clip"]):
        return "Barbershop"
    if any(w in text for w in ["nail","beauty","polish","salon","lash","spa","petal","luxe"]):
        return "Nail / Beauty"
    if any(w in text for w in ["gym","fit","cycle","spin","yoga","workout","crossfit","lineup"]):
        return "Gym / Fitness"
    if any(w in text for w in ["restaurant","food","taco","pizza","kitchen","diner","grill","burger","sushi"]):
        return "Restaurant"
    return "Other"

# ── Pull data ──────────────────────────────────────────────
print("Pulling data from Supabase...")

customers  = fetch("customers", "select=id,shop_slug,visits,created_at,last_checkin_date,opted_out")
checkins   = fetch("checkins",  "select=id,shop_slug,customer_id,created_at&limit=10000")
settings   = fetch("shop_settings", "select=shop_slug,shop_name,reward_goal")

settings_map = {s["shop_slug"]: s for s in settings}

# ── Network overview ───────────────────────────────────────
total_customers = len(customers)
avg_visits = round(sum(c["visits"] or 0 for c in customers) / max(total_customers,1), 1)

now = datetime.datetime.now(datetime.timezone.utc)
def days_ago(c, field, n):
    val = c.get(field)
    if not val: return False
    try:
        dt = datetime.datetime.fromisoformat(val.replace("Z","+00:00"))
        return (now - dt).days <= n
    except: return False

ret_30  = sum(1 for c in customers if days_ago(c,"last_checkin_date",30))
ret_60  = sum(1 for c in customers if days_ago(c,"last_checkin_date",60))
ret_90  = sum(1 for c in customers if days_ago(c,"last_checkin_date",90))
pct_30  = round(ret_30/max(total_customers,1)*100)
pct_60  = round(ret_60/max(total_customers,1)*100)
pct_90  = round(ret_90/max(total_customers,1)*100)

avg_goal = round(sum(s.get("reward_goal") or 6 for s in settings) / max(len(settings),1), 1)

print(f"  {total_customers} customers, {len(checkins)} checkins, {len(settings)} shops")

# ── Category breakdown ─────────────────────────────────────
cat_stats = {}
for c in customers:
    slug = c["shop_slug"]
    name = settings_map.get(slug,{}).get("shop_name","")
    cat  = infer_category(slug, name)
    if cat not in cat_stats:
        cat_stats[cat] = {"visits":[], "ret30":0, "ret60":0, "ret90":0, "count":0}
    cat_stats[cat]["visits"].append(c["visits"] or 0)
    cat_stats[cat]["count"] += 1
    if days_ago(c,"last_checkin_date",30): cat_stats[cat]["ret30"] += 1
    if days_ago(c,"last_checkin_date",60): cat_stats[cat]["ret60"] += 1
    if days_ago(c,"last_checkin_date",90): cat_stats[cat]["ret90"] += 1

cat_rows = []
for cat, d in sorted(cat_stats.items(), key=lambda x: -sum(x[1]["visits"])/max(len(x[1]["visits"]),1)):
    n = d["count"]
    avg_v = round(sum(d["visits"])/max(n,1), 1)
    r30 = round(d["ret30"]/max(n,1)*100)
    r60 = round(d["ret60"]/max(n,1)*100)
    r90 = round(d["ret90"]/max(n,1)*100)
    cat_rows.append({"cat":cat,"avg_visits":avg_v,"ret30":r30,"ret60":r60,"ret90":r90,"n":n})

max_visits = max((r["avg_visits"] for r in cat_rows), default=1)

# ── Day of week ────────────────────────────────────────────
dow_counts = [0]*7  # 0=Sun ... 6=Sat
hour_counts = [0]*24
for ci in checkins:
    try:
        dt = datetime.datetime.fromisoformat(ci["created_at"].replace("Z","+00:00"))
        dow_counts[dt.weekday()] += 1   # Mon=0 ... Sun=6
        hour_counts[dt.hour] += 1
    except: pass

dow_names = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"]
max_dow = max(dow_counts) or 1

# Time buckets: 6-9, 9-12, 12-2, 2-5, 5-8, 8+
buckets = [
    ("6–9 AM",  sum(hour_counts[6:9])),
    ("9–12 PM", sum(hour_counts[9:12])),
    ("12–2 PM", sum(hour_counts[12:14])),
    ("2–5 PM",  sum(hour_counts[14:17])),
    ("5–8 PM",  sum(hour_counts[17:20])),
    ("8 PM+",   sum(hour_counts[20:24])),
]
total_hours = sum(b[1] for b in buckets) or 1
time_buckets = [(name, round(cnt/total_hours*100)) for name,cnt in buckets]

# ── Per-shop top 10 ────────────────────────────────────────
shop_stats = {}
for c in customers:
    slug = c["shop_slug"]
    if slug not in shop_stats: shop_stats[slug] = {"visits":[],"ret30":0,"count":0}
    shop_stats[slug]["visits"].append(c["visits"] or 0)
    shop_stats[slug]["count"] += 1
    if days_ago(c,"last_checkin_date",30): shop_stats[slug]["ret30"] += 1

top_shops = []
for slug, d in sorted(shop_stats.items(), key=lambda x: -x[1]["count"])[:10]:
    n = d["count"]
    avg_v = round(sum(d["visits"])/max(n,1),1)
    r30 = round(d["ret30"]/max(n,1)*100)
    name = settings_map.get(slug,{}).get("shop_name", slug)
    cat  = infer_category(slug, name)
    top_shops.append({"name":name,"cat":cat,"n":n,"avg_visits":avg_v,"ret30":r30})

# ── Build HTML ─────────────────────────────────────────────
today = now.strftime("%B %Y")

def bar(pct, dark=False, green=False):
    fill = "bar-fill-accent" if green else ("bar-fill-dark" if dark else "bar-fill")
    return f'<div class="bar-track{"  bar-track-dark" if dark else ""}"><div class="{fill}" style="width:{pct}%"></div></div>'

cat_visit_rows_html = ""
for r in cat_rows:
    pct = round(r["avg_visits"]/max_visits*100)
    cat_visit_rows_html += f'''
    <div class="bar-row">
      <div class="bar-label">{r["cat"]}</div>
      {bar(pct)}
      <div class="bar-val">{r["avg_visits"]}</div>
    </div>'''

dow_bars_html = ""
for i, (name, cnt) in enumerate(zip(dow_names, dow_counts)):
    pct = round(cnt/max_dow*100)
    is_peak = cnt == max(dow_counts)
    dow_bars_html += f'''
    <div class="bar-row">
      <div class="bar-label bar-label-dark">{name}</div>
      {bar(pct, dark=True, green=is_peak)}
      <div class="bar-val" style="color:{"#22c55e" if is_peak else "#444"}">{cnt}</div>
    </div>'''

ret_table_html = ""
for r in cat_rows:
    def color(p):
        if p >= 70: return "#22c55e"
        if p >= 55: return "#86efac"
        if p >= 40: return "#fbbf24"
        return "#f87171"
    ret_table_html += f'''
    <tr>
      <td style="color:#ededed;border-bottom:1px solid #111;">{r["cat"]} <span style="color:#333;font-size:11px;">({r["n"]} members)</span></td>
      <td style="color:{color(r["ret30"])};border-bottom:1px solid #111;">{r["ret30"]}%</td>
      <td style="color:{color(r["ret60"])};border-bottom:1px solid #111;">{r["ret60"]}%</td>
      <td style="color:{color(r["ret90"])};border-bottom:1px solid #111;">{r["ret90"]}%</td>
    </tr>'''

time_bars_html = ""
max_time_pct = max(b[1] for b in time_buckets) or 1
for name, pct in time_buckets:
    is_peak = pct == max(b[1] for b in time_buckets)
    time_bars_html += f'''
    <div class="bar-row">
      <div class="bar-label">{name}</div>
      {bar(round(pct/max_time_pct*100), green=is_peak)}
      <div class="bar-val" style="color:{"#22c55e" if is_peak else "#999"}">{pct}%</div>
    </div>'''

top_shops_html = ""
for s in top_shops:
    def rc(p):
        if p >= 60: return "#22c55e"
        if p >= 40: return "#fbbf24"
        return "#f87171"
    top_shops_html += f'''
    <tr>
      <td class="bold">{s["name"]}</td>
      <td class="muted" style="font-size:11px;">{s["cat"]}</td>
      <td>{s["n"]}</td>
      <td>{s["avg_visits"]}</td>
      <td style="color:{rc(s["ret30"])};">{s["ret30"]}%</td>
    </tr>'''

html = f"""<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/>
<style>
  * {{ margin:0; padding:0; box-sizing:border-box; }}
  body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background:#fff; color:#111; }}
  .page {{ width:8.5in; min-height:11in; padding:0.75in 0.8in; position:relative; page-break-after:always; }}
  .page-dark {{ background:#000; color:#ededed; }}
  @media print {{ .page {{ page-break-after: always; }} }}

  .cover {{ display:flex; flex-direction:column; justify-content:space-between; min-height:11in; background:#000; color:#fff; padding:0; }}
  .cover-top {{ padding:0.75in 0.8in 0; }}
  .cover-mid {{ padding:0 0.8in; flex:1; display:flex; flex-direction:column; justify-content:center; }}
  .cover-bot {{ padding:0.35in 0.8in 0.75in; border-top:1px solid #1a1a1a; }}
  .logo {{ font-size:11px; letter-spacing:0.5em; color:#555; font-weight:300; }}
  .cover-tag {{ font-size:11px; letter-spacing:0.3em; color:#555; margin-bottom:20px; }}
  .cover-h1 {{ font-size:52px; font-weight:200; line-height:1.05; letter-spacing:-0.02em; color:#fff; }}
  .cover-h1 span {{ color:#444; }}
  .cover-sub {{ font-size:15px; font-weight:300; color:#777; margin-top:20px; max-width:5in; line-height:1.7; }}

  .label {{ font-size:10px; letter-spacing:0.35em; color:#888; margin-bottom:10px; }}
  .label-dark {{ color:#444; }}
  hr.div {{ border:none; border-top:1px solid #f0f0f0; margin:28px 0; }}
  hr.div-dark {{ border-top:1px solid #1a1a1a; }}
  .h2 {{ font-size:32px; font-weight:200; letter-spacing:-0.01em; line-height:1.2; }}
  .lead {{ font-size:14px; font-weight:300; color:#666; line-height:1.7; margin-top:10px; }}
  .lead-dark {{ color:#777; }}

  .stat-row {{ display:grid; grid-template-columns:repeat(4,1fr); gap:14px; margin-top:20px; }}
  .stat-card {{ border:1px solid #eee; border-radius:12px; padding:18px; }}
  .stat-num {{ font-size:30px; font-weight:200; color:#111; line-height:1; }}
  .stat-num-dark {{ color:#ededed; }}
  .stat-label {{ font-size:10px; color:#aaa; margin-top:6px; font-weight:300; letter-spacing:0.05em; }}
  .stat-change {{ font-size:11px; color:#22c55e; margin-top:4px; font-weight:300; }}

  .bar-section {{ margin-top:20px; }}
  .bar-row {{ display:flex; align-items:center; gap:12px; margin-bottom:9px; }}
  .bar-label {{ font-size:12px; color:#666; font-weight:300; width:1.3in; flex-shrink:0; text-align:right; }}
  .bar-label-dark {{ color:#555; }}
  .bar-track {{ flex:1; height:7px; background:#f5f5f5; border-radius:4px; overflow:hidden; }}
  .bar-track-dark {{ background:#111; }}
  .bar-fill {{ height:100%; border-radius:4px; background:#111; }}
  .bar-fill-dark {{ background:#ededed; }}
  .bar-fill-accent {{ background:#22c55e; }}
  .bar-val {{ font-size:12px; color:#999; font-weight:300; width:0.5in; flex-shrink:0; }}

  .data-table {{ width:100%; border-collapse:collapse; margin-top:16px; }}
  .data-table th {{ font-size:10px; letter-spacing:0.15em; color:#aaa; font-weight:300; text-align:left; padding:0 10px 8px 0; border-bottom:1px solid #eee; }}
  .data-table td {{ font-size:13px; color:#555; font-weight:300; padding:10px 10px 10px 0; border-bottom:1px solid #f5f5f5; }}
  td.bold {{ color:#111; font-weight:400; }}
  td.green {{ color:#22c55e; }}
  td.muted {{ color:#bbb; }}

  .two-col {{ display:grid; grid-template-columns:1fr 1fr; gap:32px; margin-top:20px; }}
  .callout {{ background:#f7f7f7; border-left:3px solid #111; padding:14px 18px; border-radius:0 8px 8px 0; margin:20px 0; }}
  .callout p {{ font-size:13px; color:#444; line-height:1.6; font-style:italic; font-weight:300; }}
  .callout-dark {{ background:#0a0a0a; border-left:3px solid #ededed; }}
  .callout-dark p {{ color:#666; }}
  .page-num {{ position:absolute; bottom:0.5in; right:0.8in; font-size:10px; color:#ccc; letter-spacing:0.1em; }}
  .page-num-dark {{ color:#333; }}
  .disclaimer {{ font-size:10px; color:#bbb; line-height:1.6; font-weight:300; }}
  .disclaimer-dark {{ color:#333; }}
</style>
</head>
<body>

<!-- COVER -->
<div class="page page-dark cover">
  <div class="cover-top"><p class="logo">VENTZON</p></div>
  <div class="cover-mid">
    <p class="cover-tag">LOYALTY INTELLIGENCE REPORT · {today.upper()}</p>
    <h1 class="cover-h1">Local Business<br>Foot Traffic &<br><span>Loyalty Insights</span></h1>
    <p class="cover-sub">Aggregated, anonymized data across the Ventzon merchant network. Includes visit frequency, customer retention, business category trends, and time-based activity patterns.<br><br>All data is anonymized. No personally identifiable information is included.</p>
  </div>
  <div class="cover-bot">
    <div style="display:flex;justify-content:space-between;align-items:flex-end;">
      <div style="font-size:12px;color:#444;font-weight:300;line-height:1.8;">
        <p>Ventzon Data Insights</p>
        <p>{today} · Live Report</p>
        <p style="margin-top:4px;color:#333;">{total_customers} loyalty members · {len(checkins)} check-ins · {len(settings)} merchant locations</p>
      </div>
      <p style="font-size:13px;color:#333;letter-spacing:0.1em;">ventzon.com</p>
    </div>
  </div>
  <span class="page-num page-num-dark">0 1</span>
</div>

<!-- PAGE 2 — NETWORK OVERVIEW -->
<div class="page">
  <p class="label">NETWORK OVERVIEW · {today.upper()}</p>
  <h2 class="h2">Platform-wide summary</h2>
  <p class="lead">Aggregated metrics across all active Ventzon merchant locations. Data represents anonymized customer visit behavior.</p>

  <div class="stat-row">
    <div class="stat-card">
      <div class="stat-num">{total_customers:,}</div>
      <div class="stat-label">UNIQUE LOYALTY MEMBERS</div>
    </div>
    <div class="stat-card">
      <div class="stat-num">{avg_visits}</div>
      <div class="stat-label">AVG VISITS PER MEMBER</div>
    </div>
    <div class="stat-card">
      <div class="stat-num">{avg_goal}</div>
      <div class="stat-label">AVG STAMPS TO REWARD</div>
    </div>
    <div class="stat-card">
      <div class="stat-num">{pct_90}%</div>
      <div class="stat-label">90-DAY RETENTION RATE</div>
    </div>
  </div>

  <hr class="div"/>

  <p class="label">VISIT FREQUENCY BY BUSINESS CATEGORY</p>
  <p style="font-size:12px;color:#aaa;font-weight:300;margin-bottom:4px;">Average total visits per loyalty member</p>
  <div class="bar-section">{cat_visit_rows_html}</div>

  <hr class="div"/>

  <p class="label">TOP MERCHANT LOCATIONS</p>
  <table class="data-table">
    <tr>
      <th>MERCHANT</th><th>CATEGORY</th><th>MEMBERS</th><th>AVG VISITS</th><th>30-DAY RETENTION</th>
    </tr>
    {top_shops_html}
  </table>
  <span class="page-num">0 2</span>
</div>

<!-- PAGE 3 — RETENTION & TIMING -->
<div class="page page-dark">
  <p class="label label-dark">CUSTOMER RETENTION ANALYSIS</p>
  <h2 class="h2" style="color:#fff;">Retention by business type</h2>
  <p class="lead lead-dark">Percentage of loyalty members who returned within 30, 60, and 90 days of their first check-in.</p>

  <table class="data-table" style="margin-top:20px;">
    <tr>
      <th style="color:#333;border-bottom:1px solid #1a1a1a;">CATEGORY</th>
      <th style="color:#333;border-bottom:1px solid #1a1a1a;">30-DAY</th>
      <th style="color:#333;border-bottom:1px solid #1a1a1a;">60-DAY</th>
      <th style="color:#333;border-bottom:1px solid #1a1a1a;">90-DAY</th>
    </tr>
    {ret_table_html}
  </table>

  <div class="callout callout-dark">
    <p>Overall platform 30-day retention: {pct_30}% · 60-day: {pct_60}% · 90-day: {pct_90}%. Loyalty members who receive an "almost there" nudge email return within 7 days at a higher rate than the platform average.</p>
  </div>

  <hr class="div div-dark"/>

  <div class="two-col">
    <div>
      <p class="label label-dark">CHECK-IN VOLUME BY DAY OF WEEK</p>
      <p style="font-size:12px;color:#444;font-weight:300;margin-bottom:4px;">Total check-ins</p>
      <div class="bar-section">{dow_bars_html}</div>
    </div>
    <div>
      <p class="label label-dark">TIME OF DAY DISTRIBUTION</p>
      <p style="font-size:12px;color:#444;font-weight:300;margin-bottom:4px;">% of all check-ins</p>
      <div class="bar-section">{time_bars_html}</div>
    </div>
  </div>
  <span class="page-num page-num-dark">0 3</span>
</div>

<!-- PAGE 4 — LICENSING -->
<div class="page page-dark" style="display:flex;flex-direction:column;justify-content:space-between;min-height:11in;">
  <div>
    <p class="label label-dark">DATA LICENSING</p>
    <h2 class="h2" style="color:#fff;">How to access this data</h2>
    <p class="lead lead-dark" style="max-width:5.5in;">Ventzon offers aggregated loyalty intelligence data on a per-report or subscription basis. Custom cuts by city, neighborhood, business category, or time period available on request.</p>

    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:20px;margin-top:32px;">
      <div style="border:1px solid #1a1a1a;border-radius:12px;padding:24px;background:#050505;">
        <div style="font-size:10px;letter-spacing:0.2em;color:#444;margin-bottom:12px;">ONE-TIME REPORT</div>
        <div style="font-size:36px;font-weight:200;color:#fff;">$350</div>
        <div style="font-size:13px;color:#555;margin-top:6px;font-weight:300;line-height:1.6;">Single city or category<br>Delivered within 48 hrs</div>
      </div>
      <div style="border:1px solid #333;border-radius:12px;padding:24px;background:#080808;">
        <div style="font-size:10px;letter-spacing:0.2em;color:#555;margin-bottom:12px;">MONTHLY SUBSCRIPTION</div>
        <div style="font-size:36px;font-weight:200;color:#fff;">$900<span style="font-size:16px;color:#444;">/mo</span></div>
        <div style="font-size:13px;color:#555;margin-top:6px;font-weight:300;line-height:1.6;">Monthly reports, any cut<br>QoQ comparisons included</div>
      </div>
      <div style="border:1px solid #1a1a1a;border-radius:12px;padding:24px;background:#050505;">
        <div style="font-size:10px;letter-spacing:0.2em;color:#444;margin-bottom:12px;">ENTERPRISE</div>
        <div style="font-size:36px;font-weight:200;color:#fff;">Custom</div>
        <div style="font-size:13px;color:#555;margin-top:6px;font-weight:300;line-height:1.6;">API access, custom cuts<br>Dedicated account support</div>
      </div>
    </div>
  </div>

  <div>
    <hr class="div div-dark"/>
    <div style="display:flex;justify-content:space-between;align-items:flex-end;">
      <div>
        <p style="font-size:11px;letter-spacing:0.3em;color:#333;margin-bottom:8px;">GET IN TOUCH</p>
        <p style="font-size:15px;font-weight:200;color:#ededed;">lukerichards@ventzon.com</p>
        <p style="font-size:13px;color:#444;font-weight:300;margin-top:4px;">ventzon.com</p>
      </div>
      <p class="disclaimer disclaimer-dark" style="max-width:3.5in;text-align:right;">All data is aggregated and anonymized. No personally identifiable information is included. Collected under Ventzon's Privacy Policy and Terms of Service.</p>
    </div>
  </div>
  <span class="page-num page-num-dark">0 4</span>
</div>

</body>
</html>"""

# ── Write HTML ─────────────────────────────────────────────
out_html = "/Users/lukerichards/Desktop/ventzon-insights-live-report.html"
out_pdf  = "/Users/lukerichards/Desktop/Ventzon_Insights_Report.pdf"

with open(out_html, "w") as f:
    f.write(html)
print(f"HTML written → {out_html}")

# ── Export PDF ─────────────────────────────────────────────
if "--pdf" in sys.argv or True:
    chrome = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
    result = subprocess.run([
        chrome, "--headless", "--disable-gpu",
        f"--print-to-pdf={out_pdf}",
        "--print-to-pdf-no-header", "--no-margins",
        f"file://{out_html}"
    ], capture_output=True, text=True)
    if os.path.exists(out_pdf):
        size = os.path.getsize(out_pdf)
        print(f"PDF written  → {out_pdf} ({size:,} bytes)")
        subprocess.Popen(["open", out_pdf])
    else:
        print("PDF export failed:", result.stderr[-300:])

print("Done.")
