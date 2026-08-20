/**
 * Shared constants for the App Store review demo store.
 *
 * REVIEW CREDENTIALS — copy these into App Store Connect review notes:
 *
 *   MERCHANT LOGIN  https://www.ventzon.com/login
 *     email:    demo@ventzon.app
 *     password: VentzonDemo2026!
 *
 *   CUSTOMER LOGIN  https://www.ventzon.com/customer/auth
 *     email:    demo.customer1@ventzon.app (through demo.customer5)
 *     password: VentzonDemo2026!
 *
 * Everything here is demo-only: the @ventzon.app domain and DEMO_SHOP_SLUG
 * identify it, shops.is_demo flags the store, and the teardown script removes
 * it. Nothing impersonates a real business.
 */
export const DEMO_SHOP_SLUG = "bluebird-coffee-co";
export const DEMO_SHOP_NAME = "Bluebird Coffee Co.";
export const DEMO_PASSWORD = "VentzonDemo2026!";
export const DEMO_OWNER_EMAIL = "demo@ventzon.app";

export const DEMO_SHOP = {
  name: DEMO_SHOP_NAME,
  address: "186 Prospect Ave, Brooklyn, NY 11215",
  neighborhood: "Park Slope",
  city: "Brooklyn",
  latitude: 40.6662,
  longitude: -73.991,
  logo_url: "https://www.ventzon.com/dev-fixtures/feed-cafe.jpg",
  deal_title: "Free coffee after 8 visits",
  deal_details: "Eight visits in twelve weeks earns a free coffee of your choice.",
  reward_goal: 8,
};

export const DEMO_CUSTOMERS = [
  { email: "demo.customer1@ventzon.app", display_name: "Maya Chen", dob: "1992-04-18", visits: 5, total_spend: 34.5, bio: "Ritual cortado, corner seat." },
  { email: "demo.customer2@ventzon.app", display_name: "Alex Rivera", dob: "1988-11-02", visits: 2, total_spend: 12.0, bio: "" },
  { email: "demo.customer3@ventzon.app", display_name: "Priya Patel", dob: "1995-06-23", visits: 7, total_spend: 51.0, bio: "One away from my reward, watch out." },
  { email: "demo.customer4@ventzon.app", display_name: "Jonah Kim", dob: "1990-01-15", visits: 8, total_spend: 68.0, bio: "Reward ready. Free coffee loading." },
  { email: "demo.customer5@ventzon.app", display_name: "Sofia Marquez", dob: "1997-09-09", visits: 3, total_spend: 19.5, bio: "" },
];

export const DEMO_POSTS = [
  {
    id: "00000000-0000-4000-8000-000000000001",
    authorEmail: "demo.customer1@ventzon.app",
    body: "Morning light through the front window, before the rush.",
    media_url: "https://www.ventzon.com/dev-fixtures/grid-1.jpg",
    hoursAgo: 4,
    verifiedVisit: true,
  },
  {
    id: "00000000-0000-4000-8000-000000000002",
    authorEmail: "demo.customer2@ventzon.app",
    body: "First time back in a month, the espresso still holds up. Neighborhood staple.",
    media_url: "https://www.ventzon.com/dev-fixtures/feed-cafe.jpg",
    hoursAgo: 26,
    verifiedVisit: false,
  },
  {
    id: "00000000-0000-4000-8000-000000000003",
    authorEmail: "demo.customer3@ventzon.app",
    body: "Saturday pastry restock just landed, the cardamom bun is gone by noon. Get here early.",
    media_url: "https://www.ventzon.com/dev-fixtures/feed-bakery.jpg",
    hoursAgo: 49,
    verifiedVisit: true,
  },
  {
    id: "00000000-0000-4000-8000-000000000004",
    authorEmail: "demo.customer4@ventzon.app",
    body: "Corner seat, oat flat white, one hour of quiet before work.",
    media_url: "https://www.ventzon.com/dev-fixtures/grid-3.jpg",
    hoursAgo: 72,
    verifiedVisit: false,
  },
];

export const DEMO_LIKES = [
  { postId: "00000000-0000-4000-8000-000000000001", emails: ["demo.customer2@ventzon.app", "demo.customer3@ventzon.app", "demo.customer5@ventzon.app"] },
  { postId: "00000000-0000-4000-8000-000000000002", emails: ["demo.customer1@ventzon.app", "demo.customer4@ventzon.app"] },
  { postId: "00000000-0000-4000-8000-000000000003", emails: ["demo.customer1@ventzon.app", "demo.customer4@ventzon.app", "demo.customer5@ventzon.app"] },
  { postId: "00000000-0000-4000-8000-000000000004", emails: ["demo.customer2@ventzon.app", "demo.customer5@ventzon.app"] },
];

export const DEMO_COMMENTS = [
  { id: "00000000-0000-4000-8000-000000000101", postId: "00000000-0000-4000-8000-000000000001", email: "demo.customer2@ventzon.app", body: "That light is unreal." },
  { id: "00000000-0000-4000-8000-000000000102", postId: "00000000-0000-4000-8000-000000000001", email: "demo.customer3@ventzon.app", body: "Back again tomorrow." },
  { id: "00000000-0000-4000-8000-000000000103", postId: "00000000-0000-4000-8000-000000000002", email: "demo.customer1@ventzon.app", body: "Cortado confirmed. Every time." },
  { id: "00000000-0000-4000-8000-000000000104", postId: "00000000-0000-4000-8000-000000000003", email: "demo.customer4@ventzon.app", body: "Save me one?" },
];

export const DEMO_PROMOTIONS = [
  { name: "Friday double-punch", body: "Double punch Friday, every visit counts twice. See you at the counter!", status: "draft" },
  { name: "Spring menu launch", body: "Spring menu is live, new cold brew, same corner seats.", status: "draft" },
  { name: "Holiday hours", body: "Holiday hours: open 8am to 2pm on the 24th, closed the 25th.", status: "draft" },
];
