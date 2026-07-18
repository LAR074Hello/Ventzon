-- ============================================================
-- Posts media + engagement: media columns and post_kind on posts,
-- likes / saves / comments tables, and a public storage bucket for
-- post media (same per-user-folder policy shape as avatars).
-- ------------------------------------------------------------
-- post_kind exists ONLY as a stub: 'community' (posts with no linked
-- business) is deliberately not built — a city-wide open community
-- feed stays off until there is sufficient local density and a
-- moderation/reporting system, neither of which exists yet. All feed
-- queries filter to post_kind = 'business' AND shop_slug IS NOT NULL.
-- ============================================================

ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS media_url  text,
  ADD COLUMN IF NOT EXISTS media_type text CHECK (media_type IN ('image', 'video')),
  ADD COLUMN IF NOT EXISTS post_kind  text NOT NULL DEFAULT 'business'
    CHECK (post_kind IN ('business', 'community'));

CREATE TABLE IF NOT EXISTS public.post_likes (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id    uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  email      text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (post_id, email)
);
CREATE INDEX IF NOT EXISTS idx_post_likes_post ON public.post_likes(post_id);

CREATE TABLE IF NOT EXISTS public.post_saves (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id    uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  email      text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (post_id, email)
);
CREATE INDEX IF NOT EXISTS idx_post_saves_post  ON public.post_saves(post_id);
CREATE INDEX IF NOT EXISTS idx_post_saves_email ON public.post_saves(email);

CREATE TABLE IF NOT EXISTS public.post_comments (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id    uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  email      text NOT NULL,
  body       text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_post_comments_post ON public.post_comments(post_id, created_at);

ALTER TABLE public.post_likes    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_saves    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;

-- Post media bucket — public read, authenticated users write to their
-- own auth.uid() folder (mirrors the avatars bucket policies).
INSERT INTO storage.buckets (id, name, public)
VALUES ('posts', 'posts', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public post media read" ON storage.objects
  FOR SELECT USING (bucket_id = 'posts');
CREATE POLICY "Users upload own post media" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'posts' AND (storage.foldername(name))[1] = (auth.uid())::text
  );
CREATE POLICY "Users update own post media" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'posts' AND (storage.foldername(name))[1] = (auth.uid())::text
  );
CREATE POLICY "Users delete own post media" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'posts' AND (storage.foldername(name))[1] = (auth.uid())::text
  );
