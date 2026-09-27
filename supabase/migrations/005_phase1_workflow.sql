create table if not exists public.agenda_items(
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid not null references public.meetings(id) on delete cascade,
  sort_order integer not null default 0,
  topic text not null,
  description text,
  presenter text,
  duration_minutes integer,
  status text not null default 'Planned',
  created_at timestamptz not null default now()
);

create table if not exists public.action_items(
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid not null references public.meetings(id) on delete cascade,
  decision_id uuid references public.decisions(id) on delete set null,
  task text not null,
  assignee_id uuid references public.users(id),
  due_date date,
  priority text not null default 'Medium' check(priority in ('Low','Medium','High','Critical')),
  status public.action_status not null default 'Pending',
  created_by uuid not null references public.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.events add column if not exists organizer_id uuid references public.users(id);
alter table public.events add column if not exists status text not null default 'Upcoming' check(status in ('Upcoming','Ongoing','Completed','Cancelled'));

alter table public.agenda_items enable row level security;
alter table public.action_items enable row level security;

create policy agenda_items_read on public.agenda_items for select using(public.is_staff() or exists(select 1 from public.meetings m where m.id=meeting_id and m.status='Published'));
create policy agenda_items_staff_write on public.agenda_items for all using(public.current_role() in ('Super Admin','Meeting Secretary')) with check(public.current_role() in ('Super Admin','Meeting Secretary'));
create policy action_items_read on public.action_items for select using(public.is_staff() or assignee_id=auth.uid() or exists(select 1 from public.meetings m where m.id=meeting_id and m.status='Published'));
create policy action_items_staff_write on public.action_items for all using(public.current_role() in ('Super Admin','Meeting Secretary','Faculty / Officer')) with check(public.current_role() in ('Super Admin','Meeting Secretary','Faculty / Officer'));

grant select, insert, update, delete on table public.agenda_items to authenticated;
grant select, insert, update, delete on table public.action_items to authenticated;
create index if not exists agenda_items_meeting_idx on public.agenda_items(meeting_id, sort_order);
create index if not exists action_items_meeting_idx on public.action_items(meeting_id, status);
