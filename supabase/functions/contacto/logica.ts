// Reglas del formulario, separadas de Supabase y Resend para poder probarlas solas.

export const ASUNTOS = [
  'Consulta general',
  'Contenido de calidad',
  'Metodologías ágiles',
  'Reportar un error',
]

export const LIMITE_POR_EMAIL = 3 // en 10 minutos
export const LIMITE_GLOBAL = 100 // en 24 horas, para no agotar el cupo de mails

const DIEZ_MINUTOS = 10 * 60 * 1000
const UN_DIA = 24 * 60 * 60 * 1000
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export interface Consulta {
  nombre: string
  email: string
  asunto: string
  mensaje: string
}

export interface Dependencias {
  contarDesde: (desde: string, email?: string) => Promise<number>
  guardar: (consulta: Consulta) => Promise<string>
  marcarEnviado: (id: string) => Promise<void>
  enviarMail: (consulta: Consulta) => Promise<void>
  ahora?: () => number
}

export interface Resultado {
  status: number
  body: { ok: boolean; error?: string }
}

function texto(valor: unknown): string {
  return typeof valor === 'string' ? valor.trim() : ''
}

export function validar(datos: Record<string, unknown>): { consulta?: Consulta; error?: string } {
  // Sin saltos de línea: estos campos van en el asunto y las cabeceras del mail
  const nombre = texto(datos.nombre).replace(/[\r\n]+/g, ' ')
  const email = texto(datos.email)
  const asunto = texto(datos.asunto)
  const mensaje = texto(datos.mensaje)

  if (!nombre || nombre.length > 100) return { error: 'Revisá el nombre.' }
  if (email.length > 254 || !EMAIL_RE.test(email)) return { error: 'Revisá el correo electrónico.' }
  if (!ASUNTOS.includes(asunto)) return { error: 'Elegí un asunto de la lista.' }
  if (mensaje.length < 10 || mensaje.length > 5000) {
    return { error: 'El mensaje debe tener entre 10 y 5000 caracteres.' }
  }
  return { consulta: { nombre, email, asunto, mensaje } }
}

export function escaparHtml(valor: string): string {
  return valor.replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string
  ))
}

export function armarMail(c: Consulta) {
  const nombre = escaparHtml(c.nombre)
  const email = escaparHtml(c.email)
  const asunto = escaparHtml(c.asunto)
  const mensaje = escaparHtml(c.mensaje).replace(/\n/g, '<br>')
  return {
    subject: `Nueva consulta de ${c.nombre}: ${c.asunto}`,
    reply_to: c.email,
    text: `Nombre: ${c.nombre}\nCorreo: ${c.email}\nAsunto: ${c.asunto}\n\n${c.mensaje}`,
    html: `<h2>Nueva consulta desde SGCS2026</h2>
<p><strong>Nombre:</strong> ${nombre}<br>
<strong>Correo:</strong> ${email}<br>
<strong>Asunto:</strong> ${asunto}</p>
<p>${mensaje}</p>`,
  }
}

export async function procesarConsulta(datos: unknown, deps: Dependencias): Promise<Resultado> {
  if (typeof datos !== 'object' || datos === null) {
    return { status: 400, body: { ok: false, error: 'Datos inválidos.' } }
  }
  const campos = datos as Record<string, unknown>

  // Campo oculto que solo completan los bots: se responde bien, pero no se guarda
  if (texto(campos.sitio_web)) return { status: 200, body: { ok: true } }

  const { consulta, error } = validar(campos)
  if (!consulta) return { status: 400, body: { ok: false, error } }

  const ahora = (deps.ahora ?? Date.now)()
  const porEmail = await deps.contarDesde(new Date(ahora - DIEZ_MINUTOS).toISOString(), consulta.email)
  const total = await deps.contarDesde(new Date(ahora - UN_DIA).toISOString())
  if (porEmail >= LIMITE_POR_EMAIL || total >= LIMITE_GLOBAL) {
    return { status: 429, body: { ok: false, error: 'Recibimos muchas consultas. Probá de nuevo más tarde.' } }
  }

  const id = await deps.guardar(consulta)

  // Si el mail falla, la consulta ya quedó guardada con email_enviado en false
  try {
    await deps.enviarMail(consulta)
    await deps.marcarEnviado(id)
  } catch (e) {
    console.error('No se pudo enviar el aviso de la consulta', id, e instanceof Error ? e.message : e)
  }
  return { status: 200, body: { ok: true } }
}
