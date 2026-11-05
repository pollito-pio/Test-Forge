import { withSupabase } from 'npm:@supabase/server@1'
import { armarMail, procesarConsulta, type Consulta } from './logica.ts'

const TABLA = 'consultas_contacto'

async function enviarMail(consulta: Consulta): Promise<void> {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
    },
    body: JSON.stringify({
      from: 'Test Forge <onboarding@resend.dev>',
      to: [Deno.env.get('CONTACT_TO_EMAIL')],
      ...armarMail(consulta),
    }),
  })
  if (!res.ok) throw new Error(`Resend respondió ${res.status}: ${await res.text()}`)
}

export default {
  fetch: withSupabase({ auth: 'publishable' }, async (req, ctx) => {
    if (req.method !== 'POST') {
      return Response.json({ ok: false, error: 'Método no permitido.' }, { status: 405 })
    }

    let datos: unknown
    try {
      datos = await req.json()
    } catch {
      return Response.json({ ok: false, error: 'Datos inválidos.' }, { status: 400 })
    }

    const db = ctx.supabaseAdmin
    try {
      const { status, body } = await procesarConsulta(datos, {
        enviarMail,
        contarDesde: async (desde, email) => {
          let consulta = db.from(TABLA).select('id', { count: 'exact', head: true }).gte('created_at', desde)
          if (email) consulta = consulta.eq('email', email)
          const { count, error } = await consulta
          if (error) throw error
          return count ?? 0
        },
        guardar: async (consulta) => {
          const { data, error } = await db.from(TABLA).insert(consulta).select('id').single()
          if (error) throw error
          return data.id
        },
        marcarEnviado: async (id) => {
          const { error } = await db.from(TABLA).update({ email_enviado: true }).eq('id', id)
          if (error) throw error
        },
      })
      return Response.json(body, { status })
    } catch (e) {
      console.error('Error al guardar la consulta', e)
      return Response.json({ ok: false, error: 'No pudimos guardar tu consulta.' }, { status: 500 })
    }
  }),
}
