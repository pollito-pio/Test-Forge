-- Quién puede ver las respuestas del formulario desde el panel (admin.html).
-- Se decide acá, en la base: el navegador no puede saltearse estas reglas.
create table public.administradores (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

comment on table public.administradores is 'Usuarios autorizados a leer las consultas de contacto';

alter table public.administradores enable row level security;

-- Cada usuario solo puede comprobar si él mismo es administrador.
-- No hay permisos de escritura: los administradores se agregan desde el SQL Editor.
revoke all on table public.administradores from anon, authenticated;
grant select on table public.administradores to authenticated;

create policy "Cada usuario ve su propio registro"
on public.administradores for select
to authenticated
using ((select auth.uid()) = user_id);

-- Los administradores pueden leer las consultas, pero no modificarlas ni borrarlas.
grant select on table public.consultas_contacto to authenticated;

create policy "Los administradores leen las consultas"
on public.consultas_contacto for select
to authenticated
using (
  exists (
    select 1 from public.administradores a
    where a.user_id = (select auth.uid())
  )
);
