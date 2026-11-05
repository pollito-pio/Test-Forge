-- Respuestas del formulario de contacto.
-- Solo la función "contacto" (service_role) accede a esta tabla: el navegador
-- nunca puede leerla ni escribirla directamente.
create table public.consultas_contacto (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  nombre text not null check (char_length(nombre) between 1 and 100),
  email text not null check (char_length(email) between 3 and 254),
  asunto text not null check (char_length(asunto) between 1 and 60),
  mensaje text not null check (char_length(mensaje) between 10 and 5000),
  email_enviado boolean not null default false
);

comment on table public.consultas_contacto is 'Respuestas del formulario de contacto de SGCS2026';
comment on column public.consultas_contacto.email_enviado is 'Indica si el aviso por mail se envió correctamente';

-- Sin políticas: con RLS activo, anon y authenticated no ven ninguna fila.
alter table public.consultas_contacto enable row level security;

revoke all on table public.consultas_contacto from anon, authenticated;
grant select, insert, update on table public.consultas_contacto to service_role;

-- Para el límite de envíos, que cuenta las consultas recientes
create index consultas_contacto_created_at_idx on public.consultas_contacto (created_at);
create index consultas_contacto_email_created_at_idx on public.consultas_contacto (email, created_at);
