grant insert on table public.meetings to authenticated;
grant execute on function public.current_role() to authenticated;

drop policy if exists meetings_secretary_insert on public.meetings;

create policy meetings_secretary_insert
  on public.meetings
  for insert
  to authenticated
  with check (
    public.current_role() in ('Super Admin', 'Meeting Secretary')
    and created_by = auth.uid()
  );
