/**
 * Sample data for the merchant-dashboard marketing page — everything
 * here is an EXAMPLE SCREEN, clearly labeled as such on the page. The
 * shapes mirror the real product — MerchantAnalytics
 * (src/components/MerchantAnalytics.tsx) and the shop dashboard
 * (src/app/merchant/[shop]/page.tsx) — so the showcase is the product,
 * not a fictional concept. The shop, its numbers, and its metrics are
 * illustrative; none of them belong to a real business.
 */

export type PreviewPoint = { date: string; count: number };

function series(
  base: number,
  variance: number,
  weekendBoost: number,
  days = 30,
  min = 3
): PreviewPoint[] {
  const points: PreviewPoint[] = [];
  const anchor = new Date("2026-08-06T12:00:00");
  for (let i = days - 1; i >= 0; i--) {
    const dt = new Date(anchor);
    dt.setDate(dt.getDate() - i);
    const dow = dt.getDay();
    const weekend = dow === 0 || dow === 6 ? weekendBoost : 1;
    const wave = Math.sin(i / 4.1) * variance;
    const count = Math.max(min, Math.round(base + wave + base * 0.3 * (weekend - 1)));
    points.push({ date: dt.toISOString().slice(0, 10), count });
  }
  return points;
}

const HOURS = Array.from({ length: 15 }, (_, k) => {
  const h = 7 + k;
  return {
    hour: h,
    label: `${h % 12 === 0 ? 12 : h % 12}${h < 12 ? "a" : "p"}`,
    count: Math.round(4 + 22 * Math.exp(-((h - 9.5) ** 2) / 9) + (h >= 15 && h <= 17 ? 6 : 0) + (h === 8 || h === 9 ? 10 : 0)),
  };
});

/** Rewards on the showcase are sample rows in the SAME shape the real
 *  analytics API returns: rewards_earned / rewards_redeemed series read
 *  from real reward_events. The numbers below are illustrative only. */
const rewardsEarnedSeries = series(1.2, 0.7, 1.25, 30, 0);
const rewardsRedeemedSeries = series(0.6, 0.4, 1.3, 30, 0);
const rewardsEarnedPeriod = rewardsEarnedSeries.reduce((s, d) => s + d.count, 0);
const rewardsRedeemedPeriod = rewardsRedeemedSeries.reduce(
  (s, d) => s + d.count,
  0
);
const sampleRedemptionRate =
  rewardsEarnedPeriod > 0
    ? Math.round((rewardsRedeemedPeriod / rewardsEarnedPeriod) * 1000) / 10
    : 0;

/** Feeds the real <MerchantAnalytics> component — charts, retention,
 *  lifecycle, top customers. */
export const analyticsMock = {
  shop: "northside-coffee",
  period: "30d",
  goal: 8,
  startDate: "2026-07-08",
  endDate: "2026-08-06",
  checkins: series(33, 8, 1.28),
  rewards_earned: rewardsEarnedSeries,
  rewards_redeemed: rewardsRedeemedSeries,
  rewards_earned_period: rewardsEarnedPeriod,
  rewards_redeemed_period: rewardsRedeemedPeriod,
  rewards_pending_period: Math.max(0, rewardsEarnedPeriod - rewardsRedeemedPeriod),
  retention_rate: 38,
  top_customers: [
    { id: "c1", phone: "(555) 214-9902", email: null, visits: 12 },
    { id: "c2", phone: "(555) 042-7781", email: null, visits: 9 },
    { id: "c3", phone: "(555) 903-4418", email: null, visits: 8 },
    { id: "c4", phone: "(555) 512-0063", email: null, visits: 7 },
    { id: "c5", phone: "(555) 733-1884", email: null, visits: 6 },
  ],
  day_of_week: [
    { day: "Sun", count: 38 },
    { day: "Mon", count: 27 },
    { day: "Tue", count: 30 },
    { day: "Wed", count: 33 },
    { day: "Thu", count: 36 },
    { day: "Fri", count: 41 },
    { day: "Sat", count: 44 },
  ],
  hour_of_day: HOURS,
  time_blocks: [
    { label: "Morning rush", sublabel: "7–10", count: 142 },
    { label: "Midday", sublabel: "11–2", count: 126 },
    { label: "Afternoon", sublabel: "3–5", count: 88 },
    { label: "Evening", sublabel: "6–9", count: 74 },
  ],
  new_vs_returning: { new: 214, returning: 428, total: 642 },
  avg_visits_per_customer: 2.6,
  lapsed_count: 84,
  total_unique_customers: 1284,
  at_risk_count: 62,
  churned_count: 48,
  avg_lifetime_days: 96,
  loyal_count: 96,
  redemption_rate: sampleRedemptionRate,
  period_vs_previous: { checkins_pct_change: 12, customers_pct_change: 8 },
  lifecycle: { new: 214, returning: 428, loyal: 96 },
  reward_mode: "stamps" as const,
};

/** The dashboard top — shown in the hero mockup. */
export const previewOverview = {
  shopName: "Northside Coffee",
  meta: "Brooklyn, NY · Loyalty since 2024",
  totalCustomers: "1,284",
  newMembersToday: "18",
  checkinsToday: "42",
  rewardGoal: "8",
  insight:
    "Tuesday evenings are your quietest window. A two-visit bonus could fill them.",
};

/** Customer list rows for the "regulars" act — statuses match the real
 *  product's vocabulary (ACTIVE / REWARD READY / OPTED OUT). */
export const previewCustomers = [
  { id: "1", contact: "(555) 214-9902", visits: 8, lastVisit: "2d ago", status: "REWARD READY" },
  { id: "2", contact: "(555) 042-7781", visits: 5, lastVisit: "3d ago", status: "ACTIVE" },
  { id: "3", contact: "(555) 903-4418", visits: 4, lastVisit: "4d ago", status: "ACTIVE" },
  { id: "4", contact: "(555) 702-1134", visits: 6, lastVisit: "1d ago", status: "ACTIVE" },
  { id: "5", contact: "(555) 377-2955", visits: 1, lastVisit: "12d ago", status: "ACTIVE" },
  { id: "6", contact: "(555) 861-4073", visits: 3, lastVisit: "Today", status: "OPTED OUT" },
] as const;

/** The email campaign composer, as built — subject, message, and the
 *  send action. No campaign performance exists in the product yet, so
 *  the showcase does not claim any. */
export const previewCampaign = {
  subject: "Double stamps this weekend",
  message:
    "Bring a friend this Saturday and both of you earn an extra stamp toward your reward.",
};
