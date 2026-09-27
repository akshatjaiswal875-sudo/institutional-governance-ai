-- Table grants expose operations to PostgREST; existing RLS policies remain authoritative.
grant select, update on table public.users to authenticated;
grant select, insert, update on table public.meetings to authenticated;
grant select, insert, update, delete on table public.participants to authenticated;
grant select, insert, update, delete on table public.minutes to authenticated;
grant select, insert, update, delete on table public.decisions to authenticated;
grant select, insert, update, delete on table public.events to authenticated;
grant select, insert, update, delete on table public.policies to authenticated;
grant select, insert on table public.audit_logs to authenticated;
grant select, insert, update, delete on table public.embeddings to authenticated;
