/* =========================================================
   SGCS2026 – Panel de administración
   Quién puede leer las respuestas lo decide la base de datos (RLS):
   este archivo solo muestra lo que Supabase le permite ver.
   ========================================================= */
(function () {
  'use strict';

  var $ = function (sel) { return document.querySelector(sel); };
  var MAX_FILAS = 200;

  var loading = $('#loadingView');
  var loginView = $('#loginView');
  var panelView = $('#panelView');
  var loginForm = $('#loginForm');
  var loginError = $('#loginError');
  var loginSubmit = $('#loginSubmit');
  var panelError = $('#panelError');
  var panelInfo = $('#panelInfo');
  var tableWrap = $('#tableWrap');
  var emptyState = $('#emptyState');
  var rows = $('#rows');

  function show(view) {
    loading.hidden = true;
    loginView.hidden = view !== loginView;
    panelView.hidden = view !== panelView;
  }
  function showLoginError(msg) {
    loginError.textContent = msg;
    loginError.hidden = false;
  }

  var config = window.SGCS_CONFIG || {};
  if (!config.supabaseUrl || !config.publishableKey) {
    show(loginView);
    loginSubmit.disabled = true;
    showLoginError('El panel todavía no está configurado.');
    return;
  }

  // La sesión vive solo en esta pestaña y se pierde al cerrarla
  var client = window.supabase.createClient(config.supabaseUrl, config.publishableKey, {
    auth: { storage: window.sessionStorage, persistSession: true, autoRefreshToken: true }
  });

  function celda(fila, valor) {
    var td = document.createElement('td');
    td.textContent = valor;
    fila.appendChild(td);
    return td;
  }

  function pintar(consultas) {
    rows.textContent = '';
    consultas.forEach(function (c) {
      var tr = document.createElement('tr');
      celda(tr, new Date(c.created_at).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' }));
      celda(tr, c.nombre);
      var correo = celda(tr, '');
      var link = document.createElement('a');
      link.href = 'mailto:' + encodeURIComponent(c.email);
      link.textContent = c.email;
      correo.appendChild(link);
      celda(tr, c.asunto);
      celda(tr, c.mensaje).className = 'admin-msg';
      var aviso = celda(tr, c.email_enviado ? 'Enviado' : 'No enviado');
      if (!c.email_enviado) aviso.className = 'admin-warn';
      rows.appendChild(tr);
    });
    tableWrap.hidden = consultas.length === 0;
    emptyState.hidden = consultas.length > 0;
  }

  function cargar() {
    panelError.hidden = true;
    panelInfo.textContent = 'Cargando…';
    return client
      .from('consultas_contacto')
      .select('id, created_at, nombre, email, asunto, mensaje, email_enviado')
      .order('created_at', { ascending: false })
      .limit(MAX_FILAS)
      .then(function (res) {
        if (res.error) {
          panelInfo.textContent = '';
          tableWrap.hidden = true;
          emptyState.hidden = true;
          panelError.textContent = 'No se pudieron cargar las respuestas. Probá de nuevo.';
          panelError.hidden = false;
          return;
        }
        var n = res.data.length;
        panelInfo.textContent = n === MAX_FILAS
          ? 'Mostrando las ' + MAX_FILAS + ' más recientes'
          : n + (n === 1 ? ' respuesta' : ' respuestas');
        pintar(res.data);
      });
  }

  // Sin registro en "administradores", la base no devuelve ninguna consulta
  function entrar(userId) {
    return client
      .from('administradores')
      .select('user_id')
      .eq('user_id', userId)
      .maybeSingle()
      .then(function (res) {
        if (res.error || !res.data) {
          return client.auth.signOut().then(function () {
            show(loginView);
            showLoginError(res.error
              ? 'No se pudo comprobar tu acceso. Probá de nuevo.'
              : 'Esta cuenta no tiene permisos de administrador.');
          });
        }
        show(panelView);
        return cargar();
      });
  }

  loginForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var email = $('#adminEmail').value.trim();
    var password = $('#adminPassword').value;
    loginError.hidden = true;
    if (!email || !password) { showLoginError('Completá el correo y la contraseña.'); return; }

    loginSubmit.disabled = true;
    loginSubmit.textContent = 'Ingresando…';
    client.auth.signInWithPassword({ email: email, password: password }).then(function (res) {
      if (res.error) {
        // Mismo mensaje para correo y contraseña: no se revela qué cuentas existen
        showLoginError(res.error.status === 429
          ? 'Demasiados intentos. Esperá unos minutos y probá de nuevo.'
          : res.error.status === 400
            ? 'Correo o contraseña incorrectos.'
            : 'No pudimos conectarnos. Probá de nuevo.');
        return;
      }
      loginForm.reset();
      return entrar(res.data.user.id);
    }).catch(function () {
      showLoginError('No pudimos conectarnos. Probá de nuevo.');
    }).then(function () {
      loginSubmit.disabled = false;
      loginSubmit.textContent = 'Ingresar';
    });
  });

  $('#refreshBtn').addEventListener('click', cargar);

  $('#logoutBtn').addEventListener('click', function () {
    client.auth.signOut().then(function () {
      rows.textContent = '';
      show(loginView);
    });
  });

  client.auth.onAuthStateChange(function (evento) {
    if (evento === 'SIGNED_OUT') {
      rows.textContent = '';
      show(loginView);
    }
  });

  client.auth.getSession().then(function (res) {
    var sesion = res.data && res.data.session;
    if (sesion) return entrar(sesion.user.id);
    show(loginView);
  }).catch(function () {
    show(loginView);
  });
})();
