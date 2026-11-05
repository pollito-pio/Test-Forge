# Conectar el formulario de contacto

El formulario guarda cada consulta en Supabase y envía un aviso por mail con Resend.
Hasta completar estos pasos, la página muestra "El envío del formulario todavía no está configurado".

## 1. Resend (envío de mails)

1. Creá la cuenta en https://resend.com **con `test.forge.001@gmail.com`**. Sin dominio propio, Resend solo deja enviar al mail de la cuenta.
2. En **API Keys**, creá una clave y copiala (se muestra una sola vez).

## 2. Supabase (base de datos)

1. Creá un proyecto en https://supabase.com y guardá la contraseña de la base en un gestor de contraseñas.
2. En **SQL Editor**, pegá y ejecutá el contenido de `migrations/20261104120000_crear_consultas_contacto.sql`.

## 3. Función de envío

1. En **Edge Functions**, creá una función llamada exactamente `contacto` desde el editor.
2. Cargá los dos archivos de `functions/contacto/`: `index.ts` y `logica.ts`.
3. Desactivá **Verify JWT** en la función: el formulario es público y la función valida la clave por su cuenta.
4. En **Edge Functions > Secrets**, agregá:
   - `RESEND_API_KEY`: la clave del paso 1.
   - `CONTACT_TO_EMAIL`: `test.forge.001@gmail.com`

## 4. Conectar la página

En `config.js` (junto a `index.html`), completá con lo que figura en **Project Settings > API Keys**:

- `supabaseUrl`: la URL del proyecto.
- `publishableKey`: la clave `sb_publishable_...`

**Nunca pongas en `config.js` la clave `sb_secret_...` ni la de Resend:** ese archivo lo puede leer cualquier visitante.

## 5. Probar

Enviá una consulta desde la página y comprobá:

- Que aparezca en **Table Editor > consultas_contacto** con `email_enviado` en `true`.
- Que llegue el mail a `test.forge.001@gmail.com` (revisá también Spam).

Si la fila está pero `email_enviado` quedó en `false`, el problema es el mail: mirá **Edge Functions > contacto > Logs**.

## 6. Panel de administración (`admin.html`)

Hacelo en este orden, antes de crear el usuario:

1. En **SQL Editor**, ejecutá `migrations/20261104130000_panel_admin.sql`.
2. En **Authentication > Providers > Email**, o en la sección de contraseñas de la configuración de Auth:
   - Desactivá los registros públicos (**Allow new users to sign up**): así nadie puede crearse una cuenta sola.
   - Poné una longitud mínima de 16 caracteres y exigí minúsculas, mayúsculas, números y símbolos.
3. En **Authentication > Users > Add user**, creá el usuario con su correo y una contraseña generada por un gestor de contraseñas, con **Auto Confirm User** activado.
4. Autorizalo en **SQL Editor** (sin este paso, puede iniciar sesión pero no ve nada):

   ```sql
   insert into public.administradores (user_id)
   select id from auth.users where email = 'CORREO-DEL-ADMIN';
   ```

5. Entrá a `admin.html` (también hay un enlace en el pie de la página) y comprobá que se vean las respuestas.

**La contraseña nunca va en un archivo del proyecto ni en `config.js`.** Vive solo en Supabase y en tu gestor de contraseñas.

## Cuentas de administrador

Quien entra al panel, a Supabase, a Resend o a ese Gmail puede ver las consultas, que incluyen datos personales. En todas:

- Usá una contraseña distinta, larga (16 caracteres o más) y generada por un gestor de contraseñas. Nunca `admin`.
- Activá la verificación en dos pasos en Supabase, Resend y Gmail.
- No compartas contraseñas ni claves por chat, ni las dejes en archivos del proyecto.
