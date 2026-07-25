"use client";

import SocialFeed from "@/app/customer/components/SocialFeed";
import PostGrid from "@/app/customer/components/PostGrid";
import PostComposer from "@/app/customer/components/PostComposer";
import { ProfileStats, BadgePills } from "@/app/customer/components/ProfileStats";
import SafetyMenu from "@/app/customer/components/SafetyMenu";
import FollowButton from "@/app/customer/components/FollowButton";

/* ═══════════════════════════════════════════════════════════════════
   /dev/components — the Slice 1.8 Phase B review surface.

   The shared components render here against fixtures, with no auth and
   no database. That matters beyond convenience: these seven appear on
   nearly every screen, so if one of them is subtly wrong the screen
   review would "confirm" it eleven times without anyone noticing.

   SocialFeed is the exception — it fetches its own data — so the script
   below stubs its two endpoints before hydration. Dev-only, this route
   only, and it never touches the real fetch path in the app.
   ═══════════════════════════════════════════════════════════════════ */

const IMG = (seed: string, w = 800, h = 1000) =>
  `https://picsum.photos/seed/${seed}/${w}/${h}`;

const GRID_POSTS = [
  { id: "1", body: "", media_url: IMG("a", 600, 600), media_type: "image" as const, created_at: "" },
  { id: "2", body: "", media_url: IMG("b", 600, 600), media_type: "video" as const, created_at: "" },
  { id: "3", body: "", media_url: IMG("c", 600, 600), media_type: "image" as const, created_at: "" },
  {
    id: "4",
    body: "The seasonal jam is made in small batches out the back and never appears on the menu board. Ask anyway.",
    media_url: null,
    media_type: null,
    created_at: "",
  },
  { id: "5", body: "", media_url: IMG("e", 600, 600), media_type: "image" as const, created_at: "" },
  { id: "6", body: "", media_url: IMG("f", 600, 600), media_type: "image" as const, created_at: "" },
];

const STATS = {
  followers: 1284,
  following: 312,
  posts: 64,
  businesses_visited: 27,
  total_points: 431,
  referrals: 9,
};

const BADGES = [
  { id: "1", label: "Early regular", description: "", earned: true },
  { id: "2", label: "50 check-ins", description: "", earned: true },
  { id: "3", label: "Neighbourhood scout", description: "", earned: true },
  { id: "4", label: "Unearned", description: "", earned: false },
];

const FEED_FIXTURE = {
  posts: [
    {
      id: "p1",
      body: "Corner table by the window, oat flat white, and the good pastries if you get there before ten on a weekday.",
      media_url: IMG("cafe", 800, 1000),
      media_type: "image",
      hours_ago: 3,
      author: { profile_id: "u1", display_name: "Mara Ellison", avatar_url: null, followed: false },
      shop: { slug: "cafe-mercado", name: "Cafe Mercado", logo_url: null, deal_title: null, reward_goal: 10 },
      counts: { likes: 42, comments: 6 },
      verified_visit: true,
      viewer: { liked: true, progress: { visits: 7, goal: 10 } },
    },
    {
      id: "p2",
      body: "Third time this month. The owner has been running this place since 1974 and still opens up herself.",
      media_url: IMG("bakery", 800, 1000),
      media_type: "image",
      hours_ago: 26,
      author: { profile_id: "u2", display_name: "Devon Park", avatar_url: null, followed: true },
      shop: { slug: "bao-down", name: "Bao Down", logo_url: null, deal_title: "5 visits, free bao", reward_goal: 5 },
      counts: { likes: 8, comments: 1 },
      verified_visit: false,
      viewer: { liked: false, progress: { visits: 5, goal: 5 } },
    },
  ],
  hasMore: false,
};

const SUGGESTIONS_FIXTURE = {
  suggestions: [
    { kind: "creator", profile_id: "u9", display_name: "Ilse Bergman", avatar_url: null, sub: "Posts about coffee" },
    { kind: "shop", shop_slug: "bloom-co", display_name: "Bloom & Co", avatar_url: null, sub: "Florist", distance_mi: 0.4 },
    { kind: "creator", profile_id: "u7", display_name: "Ray Okonkwo", avatar_url: null, sub: "42 places visited" },
  ],
};

function Section({
  title,
  note,
  children,
}: {
  title: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-12">
      <h2 className="font-display text-xl font-semibold tracking-tight text-primary">
        {title}
      </h2>
      {note && <p className="mt-1 mb-4 text-sm text-secondary">{note}</p>}
      <div className={note ? "" : "mt-4"}>{children}</div>
    </section>
  );
}

export default function ComponentGallery() {
  return (
    <>
      {/* Stub SocialFeed's endpoints before hydration so the populated feed
          renders without a database. Scoped to this dev route; the original
          fetch is preserved for every other request. */}
      <script
        dangerouslySetInnerHTML={{
          __html: `(function(){try{
            var feed=${JSON.stringify(FEED_FIXTURE)};
            var sug=${JSON.stringify(SUGGESTIONS_FIXTURE)};
            /* created_at is derived here, at runtime in the browser, rather
               than baked into this string. Serialising Date.now() on the
               server produced a different literal than the client re-render
               and tripped a real hydration mismatch. */
            feed.posts.forEach(function(p){
              p.created_at=new Date(Date.now()-p.hours_ago*3600e3).toISOString();
            });
            var real=window.fetch.bind(window);
            window.fetch=function(input,init){
              var url=typeof input==="string"?input:(input&&input.url)||"";
              if(url.indexOf("/api/customer/feed")===0)return Promise.resolve(new Response(JSON.stringify(feed),{status:200,headers:{"Content-Type":"application/json"}}));
              if(url.indexOf("/api/customer/suggestions")===0)return Promise.resolve(new Response(JSON.stringify(sug),{status:200,headers:{"Content-Type":"application/json"}}));
              if(url.indexOf("/api/customer/memberships")===0)return Promise.resolve(new Response(JSON.stringify({memberships:[]}),{status:200,headers:{"Content-Type":"application/json"}}));
              return real(input,init);
            };
          }catch(e){}})()`,
        }}
      />

      <main className="min-h-dvh bg-surface px-5 py-12">
        <div className="mx-auto max-w-2xl">
          <header className="mb-12">
            <p className="font-mono text-2xs uppercase tracking-caps text-muted">
              Slice 1.8 · Phase B
            </p>
            <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-primary">
              Component gallery
            </h1>
            <p className="mt-4 text-base text-secondary">
              The seven shared components on the new type roles, against
              fixtures — no auth, no database. These appear on nearly every
              screen, so they are reviewed once here rather than eleven times
              during screen review.
            </p>
          </header>

          <Section
            title="FollowButton"
            note="Sentence case, tracking zero. The filled state stays ink rather than accent — a green fill here would read as “done”, not as Ventzon."
          >
            <div className="flex flex-wrap items-center gap-3">
              <FollowButton profileId="x" following={false} />
              <FollowButton profileId="x" following={true} />
              <FollowButton profileId="x" following={false} compact />
              <FollowButton profileId="x" following={true} compact />
            </div>
          </Section>

          <Section title="ProfileStats" note="Public Sans throughout: a stat grid is a summary, not a record.">
            <ProfileStats stats={STATS} showReferrals />
            <div className="mt-6">
              <BadgePills badges={BADGES} />
            </div>
          </Section>

          <Section title="PostGrid" note="3-up grid, lazy media, video indicator, and typographic tiles for text-only posts.">
            <PostGrid posts={GRID_POSTS} />
          </Section>

          <Section title="PostGrid — empty">
            <PostGrid posts={[]} />
          </Section>

          <Section title="PostComposer" note="Card padding p-4 on mobile so the prose surface is not double-padded.">
            <PostComposer onPosted={() => {}} />
          </Section>

          <Section title="SafetyMenu" note="Trigger only — the sheet is behind interaction; captured separately by the screenshot script.">
            <div className="flex items-center gap-4">
              <SafetyMenu targetType="post" targetId="1" blockProfileId="u1" targetName="Mara Ellison" />
              <span className="text-sm text-secondary">default</span>
              <SafetyMenu targetType="comment" targetId="2" compact />
              <span className="text-sm text-secondary">compact</span>
            </div>
          </Section>

          <Section title="SocialFeed" note="Rendered against stubbed endpoints: two posts, one with a verified visit, one at reward-ready.">
            <div className="-mx-5">
              <SocialFeed userLoc={null} />
            </div>
          </Section>
        </div>
      </main>
    </>
  );
}
