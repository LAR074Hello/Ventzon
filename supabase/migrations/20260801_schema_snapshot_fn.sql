-- A read-only description of the public schema, callable by service_role.
--
-- WHY THIS EXISTS. Twice now production has been found missing indexes its own
-- migrations create — `job_applications` (2026-07-25) and `checkins`
-- (2026-08-01) — and both times it surfaced by accident, while looking for
-- something else. Migration files describe an *intended* database; nothing
-- verified production against them. This turns that from luck into a test.
--
-- WHY A FUNCTION. PostgREST exposes tables, not catalogs, so a script holding
-- a service-role key cannot read `information_schema` or `pg_indexes` directly.
-- Supabase does not expose the database password either, so there is no psql
-- path. A fixed, parameterless function is the one mechanism actually
-- available — and being parameterless is the point: it takes no SQL, builds no
-- SQL, and cannot be asked for anything other than this one snapshot.
--
-- SECURITY DEFINER with a pinned search_path, and EXECUTE revoked from anon and
-- authenticated. It returns schema shape, never row data, and service_role can
-- already read everything, so this grants no access that did not exist.
--
-- ⚠ DO NOT "SIMPLIFY" INDEXES OR CONSTRAINTS DOWN TO NAMES OR COUNTS.
--
-- Storing the full `indexdef` / `pg_get_constraintdef` output looks redundant
-- next to a name, and it is the only reason the first real find was found:
-- `rep_commission_logs_logged_at_idx` was `btree (logged_at)` on dev and
-- `btree (logged_at DESC)` on production. Same name. Same count. Same table.
-- Different index. A name-only or count-only comparison reports a clean match
-- and the drift survives the check that exists to catch it.
--
-- The same argument applies to constraint definitions: two CHECKs can share a
-- name and enforce different things.

create or replace function public.schema_snapshot()
returns jsonb
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select jsonb_build_object(
    'columns', (
      select coalesce(jsonb_agg(s.x order by s.x->>'k'), '[]'::jsonb)
      from (
        select jsonb_build_object(
          'k', c.table_name || '.' || c.column_name,
          'type', c.data_type,
          'nullable', c.is_nullable,
          'default', coalesce(c.column_default, '')
        ) as x
        from information_schema.columns c
        join information_schema.tables t
          on t.table_schema = c.table_schema and t.table_name = c.table_name
        where c.table_schema = 'public' and t.table_type = 'BASE TABLE'
      ) s
    ),
    'constraints', (
      select coalesce(jsonb_agg(s.x order by s.x->>'k'), '[]'::jsonb)
      from (
        select jsonb_build_object(
          'k', rel.relname || '.' || con.conname,
          'def', pg_get_constraintdef(con.oid)
        ) as x
        from pg_constraint con
        join pg_class rel on rel.oid = con.conrelid
        join pg_namespace ns on ns.oid = rel.relnamespace
        where ns.nspname = 'public'
      ) s
    ),
    'indexes', (
      select coalesce(jsonb_agg(s.x order by s.x->>'k'), '[]'::jsonb)
      from (
        select jsonb_build_object(
          'k', i.tablename || '.' || i.indexname,
          'def', i.indexdef
        ) as x
        from pg_indexes i
        where i.schemaname = 'public'
      ) s
    ),
    'policies', (
      select coalesce(jsonb_agg(s.x order by s.x->>'k'), '[]'::jsonb)
      from (
        select jsonb_build_object(
          'k', p.tablename || '.' || p.policyname,
          'cmd', p.cmd,
          'permissive', p.permissive,
          'roles', array_to_string(p.roles, ','),
          'using', coalesce(p.qual, ''),
          'check', coalesce(p.with_check, '')
        ) as x
        from pg_policies p
        where p.schemaname = 'public'
      ) s
    ),
    'rls', (
      select coalesce(jsonb_agg(s.x order by s.x->>'k'), '[]'::jsonb)
      from (
        select jsonb_build_object(
          'k', rel.relname,
          'enabled', rel.relrowsecurity
        ) as x
        from pg_class rel
        join pg_namespace ns on ns.oid = rel.relnamespace
        where ns.nspname = 'public' and rel.relkind = 'r'
      ) s
    ),
    'functions', (
      select coalesce(jsonb_agg(s.x order by s.x->>'k'), '[]'::jsonb)
      from (
        select jsonb_build_object(
          'k', p.proname || '(' || pg_get_function_identity_arguments(p.oid) || ')',
          'returns', pg_get_function_result(p.oid),
          'security_definer', p.prosecdef
        ) as x
        from pg_proc p
        join pg_namespace ns on ns.oid = p.pronamespace
        where ns.nspname = 'public'
      ) s
    ),
    'triggers', (
      select coalesce(jsonb_agg(s.x order by s.x->>'k'), '[]'::jsonb)
      from (
        select jsonb_build_object(
          'k', rel.relname || '.' || tg.tgname,
          'def', pg_get_triggerdef(tg.oid)
        ) as x
        from pg_trigger tg
        join pg_class rel on rel.oid = tg.tgrelid
        join pg_namespace ns on ns.oid = rel.relnamespace
        where ns.nspname = 'public' and not tg.tgisinternal
      ) s
    )
  );
$$;

revoke all on function public.schema_snapshot() from public;
revoke all on function public.schema_snapshot() from anon;
revoke all on function public.schema_snapshot() from authenticated;
grant execute on function public.schema_snapshot() to service_role;
