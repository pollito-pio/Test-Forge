/* =========================================================
   SGCS2026 – Interactividad de la plataforma
   ========================================================= */
(function () {
  'use strict';

  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };

  /* ---------- Tema claro / oscuro ---------- */
  var root = document.documentElement;
  var themeBtn = $('#themeToggle');

  themeBtn.addEventListener('click', function () {
    var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('sgcs-theme', next); } catch (e) {}
  });

  /* ---------- Menú hamburguesa ---------- */
  var burger = $('#hamburger');
  var menu = $('#menu');

  function closeMenu() {
    menu.classList.remove('open');
    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-label', 'Abrir menú');
  }
  burger.addEventListener('click', function () {
    var open = menu.classList.toggle('open');
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
  });
  $$('a', menu).forEach(function (a) { a.addEventListener('click', closeMenu); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(); });

  /* ---------- Submenús: se cierran al elegir una opción o con Escape ---------- */
  function closeSubmenu(item) {
    item.classList.add('closed');
    if (item.contains(document.activeElement)) document.activeElement.blur();
  }
  $$('.menu-item').forEach(function (item) {
    $$('a', item).forEach(function (a) {
      a.addEventListener('click', function () { closeSubmenu(item); });
      a.addEventListener('focus', function () { item.classList.remove('closed'); });
    });
    item.addEventListener('mouseleave', function () { item.classList.remove('closed'); });
    item.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeSubmenu(item); });
  });

  /* ---------- Navbar con sombra + botón volver arriba ---------- */
  var navbar = $('#navbar');
  var toTop = $('#toTop');
  function onScroll() {
    var y = window.scrollY;
    navbar.classList.toggle('scrolled', y > 10);
    toTop.classList.toggle('show', y > 600);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  toTop.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: 'smooth' }); });

  /* ---------- Resaltado de sección activa + índice flotante ---------- */
  var navLinks = $$('[data-spy]', menu);
  var spySections = $$('[data-section]');
  var toc = $('#toc');
  var tocLinks = $$('a', toc);
  var tocTargets = tocLinks.map(function (a) { return $(a.getAttribute('href')); });

  function updateSpy() {
    var line = window.innerHeight * 0.35;
    var current = 'inicio';
    spySections.forEach(function (s) {
      if (s.getBoundingClientRect().top <= line) current = s.getAttribute('data-section');
    });
    navLinks.forEach(function (a) {
      var on = a.getAttribute('data-spy') === current;
      a.classList.toggle('active', on);
      if (on) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
    });

    // El índice flotante solo se muestra dentro de Metodologías Ágiles
    var ag = $('#agiles').getBoundingClientRect();
    toc.classList.toggle('visible', ag.top < line && ag.bottom > line);
    var activeIdx = 0;
    tocTargets.forEach(function (t, i) { if (t.getBoundingClientRect().top <= line) activeIdx = i; });
    tocLinks.forEach(function (a, i) { a.classList.toggle('active', i === activeIdx); });
  }
  window.addEventListener('scroll', updateSpy, { passive: true });
  window.addEventListener('resize', updateSpy);
  updateSpy();

  /* ---------- Pestañas de Fundamentos ---------- */
  $$('[data-tabs]').forEach(function (wrap) {
    var tabs = $$('[role="tab"]', wrap);
    function select(tab) {
      tabs.forEach(function (t) {
        var on = t === tab;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        $('#' + t.getAttribute('aria-controls')).hidden = !on;
      });
    }
    tabs.forEach(function (tab, i) {
      tab.addEventListener('click', function () { select(tab); });
      tab.addEventListener('keydown', function (e) {
        var idx = null;
        if (e.key === 'ArrowRight') idx = (i + 1) % tabs.length;
        if (e.key === 'ArrowLeft') idx = (i - 1 + tabs.length) % tabs.length;
        if (idx !== null) { e.preventDefault(); tabs[idx].focus(); select(tabs[idx]); }
      });
    });
  });

  /* ---------- Tarjetas que se dan vuelta (Técnicas) ---------- */
  $$('.flip').forEach(function (card) {
    card.addEventListener('click', function () {
      card.setAttribute('aria-pressed', card.getAttribute('aria-pressed') === 'true' ? 'false' : 'true');
    });
  });

  /* ---------- Filtro de herramientas ---------- */
  var filterBtns = $$('#herramientas [data-filter]');
  var toolCards = $$('#toolCards .card');
  filterBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var f = btn.getAttribute('data-filter');
      filterBtns.forEach(function (b) {
        b.classList.toggle('active', b === btn);
        b.setAttribute('aria-pressed', String(b === btn));
      });
      toolCards.forEach(function (c) {
        c.classList.toggle('hide', f !== 'all' && c.getAttribute('data-cat') !== f);
      });
    });
  });

  /* ---------- Visor de imágenes ---------- */
  var lb = $('#lightbox');
  var lbImg = $('#lightboxImg');
  var lbCap = $('#lightboxCaption');
  var lbClose = $('#lightboxClose');
  var lastFocus = null;

  function openLightbox(img, caption) {
    lastFocus = document.activeElement;
    lbImg.src = img.src;
    lbImg.alt = img.alt;
    lbCap.textContent = caption;
    lb.hidden = false;
    document.body.style.overflow = 'hidden';
    lbClose.focus();
  }
  function closeLightbox() {
    lb.hidden = true;
    document.body.style.overflow = '';
    if (lastFocus) lastFocus.focus();
  }
  $$('[data-lightbox]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      openLightbox($('img', btn), $('figcaption', btn.closest('figure')).textContent);
    });
  });
  lbClose.addEventListener('click', closeLightbox);
  lb.addEventListener('click', function (e) { if (e.target === lb) closeLightbox(); });
  document.addEventListener('keydown', function (e) {
    if (lb.hidden) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'Tab') { e.preventDefault(); lbClose.focus(); }
  });

  /* ---------- Diagrama de Sprint interactivo ---------- */
  var sprintSteps = [
    { t: 'Product Backlog', who: 'Product Owner', d: 'Lista ordenada de todo lo que podría necesitar el producto. El Product Owner la prioriza según el valor para el negocio.' },
    { t: 'Sprint Planning', who: 'Todo el equipo Scrum', d: 'Se define por qué es valioso el Sprint (Objetivo del Sprint), qué elementos del backlog se pueden terminar y cómo se hará el trabajo.' },
    { t: 'Sprint Backlog', who: 'Developers', d: 'Conjunto de elementos seleccionados más el plan para entregarlos. Es propiedad de los Developers y se actualiza durante el Sprint.' },
    { t: 'Daily Scrum', who: 'Developers', d: 'Reunión diaria de 15 minutos para inspeccionar el progreso hacia el Objetivo del Sprint y adaptar el plan del día.' },
    { t: 'Sprint Review', who: 'Equipo Scrum e interesados', d: 'Se inspecciona el Incremento con los interesados y se adapta el Product Backlog según la retroalimentación.' },
    { t: 'Retrospectiva', who: 'Todo el equipo Scrum', d: 'El equipo reflexiona sobre personas, interacciones, procesos y herramientas, y define mejoras para el próximo Sprint.' }
  ];
  var stepsWrap = $('.sprint-steps');
  var sprintDetail = $('#sprintDetail');
  var sprintIdx = 0;

  function showSprint(i) {
    sprintIdx = i;
    $$('button', stepsWrap).forEach(function (b, j) { b.setAttribute('aria-selected', String(i === j)); });
    var s = sprintSteps[i];
    sprintDetail.setAttribute('aria-labelledby', 'sprint-tab-' + i);
    sprintDetail.innerHTML = '<span class="tag">Paso ' + (i + 1) + ' de ' + sprintSteps.length + ' · ' + s.who + '</span>' +
      '<h4>' + s.t + '</h4><p>' + s.d + '</p>';
  }
  sprintSteps.forEach(function (s, i) {
    var b = document.createElement('button');
    b.className = 'filter';
    b.setAttribute('role', 'tab');
    b.id = 'sprint-tab-' + i;
    b.setAttribute('aria-controls', 'sprintDetail');
    b.textContent = (i + 1) + '. ' + s.t;
    b.addEventListener('click', function () { showSprint(i); });
    stepsWrap.appendChild(b);
  });
  $('#sprintPrev').addEventListener('click', function () { showSprint((sprintIdx - 1 + sprintSteps.length) % sprintSteps.length); });
  $('#sprintNext').addEventListener('click', function () { showSprint((sprintIdx + 1) % sprintSteps.length); });
  showSprint(0);

  /* ---------- Tablero Kanban con arrastre y límite WIP ---------- */
  var board = $('#board');
  var columns = $$('.column', board);
  var kanbanMsg = $('#kanbanMsg');
  var dragged = null;
  var msgTimer;

  function say(text) {
    kanbanMsg.textContent = text;
    clearTimeout(msgTimer);
    msgTimer = setTimeout(function () { kanbanMsg.textContent = ''; }, 3500);
  }
  function wipOf(col) { return parseInt(col.getAttribute('data-wip'), 10) || Infinity; }
  function countOf(col) { return $$('.kcard', col).length; }
  function canAccept(col, card) {
    return card.closest('.column') === col || countOf(col) < wipOf(col);
  }
  function refreshBoard() {
    columns.forEach(function (col, ci) {
      var n = countOf(col);
      var wip = wipOf(col);
      $('.count', col).textContent = wip === Infinity ? n : n + ' / ' + wip;
      col.classList.toggle('full', n >= wip);
      $$('.kcard', col).forEach(function (card) {
        $('[data-dir="-1"]', card).disabled = ci === 0;
        $('[data-dir="1"]', card).disabled = ci === columns.length - 1;
      });
    });
  }
  function moveCard(card, target) {
    if (!canAccept(target, card)) {
      say('Límite WIP alcanzado en «En progreso». Terminá una tarea antes de empezar otra.');
      target.classList.add('blocked');
      setTimeout(function () { target.classList.remove('blocked'); }, 600);
      return false;
    }
    $('.col-list', target).appendChild(card);
    refreshBoard();
    return true;
  }
  function setupCard(card) {
    var label = document.createElement('span');
    while (card.firstChild) label.appendChild(card.firstChild);
    card.appendChild(label);
    var moves = document.createElement('span');
    moves.className = 'moves';
    moves.innerHTML = '<button type="button" data-dir="-1" aria-label="Mover a la columna anterior">‹</button>' +
                      '<button type="button" data-dir="1" aria-label="Mover a la columna siguiente">›</button>';
    card.appendChild(moves);
    $$('button', moves).forEach(function (b) {
      b.addEventListener('click', function () {
        var ci = columns.indexOf(card.closest('.column'));
        var target = columns[ci + parseInt(b.getAttribute('data-dir'), 10)];
        if (target && moveCard(card, target)) b.focus();
      });
    });
    card.addEventListener('dragstart', function (e) {
      dragged = card;
      card.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', '');
    });
    card.addEventListener('dragend', function () {
      card.classList.remove('dragging');
      columns.forEach(function (c) { c.classList.remove('over'); });
      dragged = null;
    });
  }
  $$('.kcard', board).forEach(setupCard);
  columns.forEach(function (col) {
    col.addEventListener('dragover', function (e) {
      if (!dragged) return;
      e.preventDefault();
      col.classList.add('over');
    });
    col.addEventListener('dragleave', function (e) {
      if (!col.contains(e.relatedTarget)) col.classList.remove('over');
    });
    col.addEventListener('drop', function (e) {
      e.preventDefault();
      col.classList.remove('over');
      if (dragged) moveCard(dragged, col);
    });
  });
  $('#kanbanAdd').addEventListener('submit', function (e) {
    e.preventDefault();
    var input = $('#kanbanInput');
    var text = input.value.trim();
    if (!text) { say('Escribí el nombre de la tarea.'); input.focus(); return; }
    var li = document.createElement('li');
    li.className = 'kcard';
    li.draggable = true;
    li.textContent = text;
    $('.col-list', columns[0]).appendChild(li);
    setupCard(li);
    refreshBoard();
    input.value = '';
  });
  refreshBoard();

  /* ---------- Glosario ---------- */
  var glossary = [
    ['Aseguramiento de la calidad (QA)', 'Conjunto de actividades planificadas y sistemáticas para dar confianza en que el producto cumplirá los requisitos de calidad.'],
    ['Backlog del Producto', 'Lista ordenada y emergente de todo lo necesario para mejorar el producto. Es la única fuente de trabajo del equipo Scrum.'],
    ['Bug', 'Defecto en el software que provoca un comportamiento distinto al esperado.'],
    ['Burndown chart', 'Gráfico que muestra el trabajo restante a lo largo del tiempo en un Sprint o release.'],
    ['Caja blanca', 'Técnica de prueba que diseña los casos a partir de la estructura interna del código.'],
    ['Caja negra', 'Técnica de prueba basada en las entradas y salidas, sin conocer el código interno.'],
    ['Cascada', 'Modelo de ciclo de vida secuencial en el que cada fase comienza al terminar la anterior.'],
    ['Control de calidad (QC)', 'Actividades que inspeccionan el producto para detectar defectos antes de su entrega.'],
    ['Daily Scrum', 'Evento diario de 15 minutos en el que los Developers revisan el progreso hacia el Objetivo del Sprint.'],
    ['Definición de Terminado', 'Descripción formal del estado que debe cumplir el Incremento para considerarse terminado.'],
    ['Historia de usuario', 'Descripción breve de una funcionalidad desde el punto de vista del usuario: «Como… quiero… para…».'],
    ['Incremento', 'Resultado utilizable y terminado de un Sprint que se suma a los anteriores.'],
    ['Integración continua', 'Práctica de integrar el código al repositorio varias veces al día, con compilación y pruebas automáticas.'],
    ['ISO/IEC 25010', 'Norma de la familia SQuaRE que define el modelo de calidad del producto de software.'],
    ['Kanban', 'Método para gestionar el flujo de trabajo visualizándolo en un tablero y limitando el WIP.'],
    ['Lead time', 'Tiempo total desde que se solicita una tarea hasta que se entrega.'],
    ['Linter', 'Herramienta de análisis estático que detecta errores y problemas de estilo en el código.'],
    ['Métrica', 'Medida cuantitativa de un atributo del producto o del proceso de software.'],
    ['Modelo en V', 'Variante de la cascada que vincula cada fase de desarrollo con un nivel de prueba.'],
    ['Product Owner', 'Rol de Scrum responsable de maximizar el valor del producto y gestionar el Product Backlog.'],
    ['Programación en parejas', 'Práctica de XP en la que dos personas trabajan juntas en el mismo código.'],
    ['Prueba de regresión', 'Prueba que verifica que los cambios no rompieron funcionalidades que ya funcionaban.'],
    ['Refactorización', 'Mejorar la estructura interna del código sin cambiar su comportamiento externo.'],
    ['Retrospectiva', 'Evento de Scrum en el que el equipo analiza cómo trabajó y planifica mejoras.'],
    ['Scrum', 'Marco de trabajo ágil liviano basado en Sprints, con roles, eventos y artefactos definidos.'],
    ['Scrum Master', 'Rol responsable de que Scrum se entienda y se aplique, y de eliminar impedimentos.'],
    ['SDLC', 'Ciclo de vida del desarrollo de software: requisitos, diseño, desarrollo, pruebas, despliegue y mantenimiento.'],
    ['Sprint', 'Iteración de duración fija (1 a 4 semanas) en la que se crea un Incremento.'],
    ['TDD', 'Desarrollo guiado por pruebas: se escribe la prueba antes que el código que la hace pasar.'],
    ['Velocidad', 'Cantidad de trabajo que un equipo completa en un Sprint; se usa para planificar.'],
    ['WIP', 'Work In Progress: trabajo en curso. En Kanban se limita para mejorar el flujo.'],
    ['XP (Extreme Programming)', 'Metodología ágil centrada en prácticas técnicas como TDD, parejas e integración continua.']
  ];

  var glList = $('#glossaryList');
  var glLetters = $('#glossaryLetters');
  var glSearch = $('#glossarySearch');
  var glEmpty = $('#glossaryEmpty');
  var glQuery = $('#glossaryQuery');

  function norm(s) { return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase(); }
  function esc(s) { return s.replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function highlight(text, q) {
    var i = q ? norm(text).indexOf(q) : -1;
    if (i < 0) return esc(text);
    return esc(text.slice(0, i)) + '<mark>' + esc(text.slice(i, i + q.length)) + '</mark>' + esc(text.slice(i + q.length));
  }
  glossary.sort(function (a, b) { return a[0].localeCompare(b[0], 'es'); });

  function renderGlossary() {
    var q = norm(glSearch.value.trim());
    var groups = {};
    glossary.forEach(function (g) {
      if (q && norm(g[0] + ' ' + g[1]).indexOf(q) < 0) return;
      var letter = norm(g[0]).charAt(0).toUpperCase();
      (groups[letter] = groups[letter] || []).push(g);
    });
    var html = '';
    Object.keys(groups).sort().forEach(function (L) {
      html += '<div class="gl-group" id="gl-' + L + '"><h4>' + L + '</h4><dl>';
      groups[L].forEach(function (g) {
        html += '<div class="gl-item"><dt>' + highlight(g[0], q) + '</dt><dd>' + highlight(g[1], q) + '</dd></div>';
      });
      html += '</dl></div>';
    });
    glList.innerHTML = html;
    glEmpty.hidden = html !== '';
    glQuery.textContent = glSearch.value.trim();
    $$('button', glLetters).forEach(function (b) { b.disabled = !groups[b.textContent]; });
  }
  'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').forEach(function (L) {
    var b = document.createElement('button');
    b.type = 'button';
    b.textContent = L;
    b.setAttribute('aria-label', 'Ir a la letra ' + L);
    b.addEventListener('click', function () {
      var target = $('#gl-' + L);
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    glLetters.appendChild(b);
  });
  glSearch.addEventListener('input', renderGlossary);
  renderGlossary();

  /* ---------- Preguntas frecuentes (acordeón) ---------- */
  $$('.acc-btn').forEach(function (btn, i) {
    var panel = btn.closest('.acc-item').querySelector('.acc-panel');
    btn.id = 'faq-btn-' + i;
    panel.id = 'faq-panel-' + i;
    panel.setAttribute('role', 'region');
    panel.setAttribute('aria-labelledby', btn.id);
    btn.setAttribute('aria-controls', panel.id);
    btn.addEventListener('click', function () {
      var open = btn.getAttribute('aria-expanded') !== 'true';
      // Cierra las demás para que solo haya una abierta
      $$('.acc-btn').forEach(function (other) {
        if (other !== btn) {
          other.setAttribute('aria-expanded', 'false');
          other.closest('.acc-item').querySelector('.acc-panel').classList.remove('open');
        }
      });
      btn.setAttribute('aria-expanded', String(open));
      panel.classList.toggle('open', open);
    });
  });

  /* ---------- Ejercicios: mostrar / ocultar solución ---------- */
  $$('.sol-btn').forEach(function (btn, i) {
    var sol = btn.nextElementSibling;
    sol.id = 'sol-' + i;
    btn.setAttribute('aria-controls', sol.id);
    btn.addEventListener('click', function () {
      var show = sol.hidden;
      sol.hidden = !show;
      btn.setAttribute('aria-expanded', String(show));
      btn.textContent = show ? 'Ocultar solución' : 'Mostrar solución';
    });
  });

  /* ---------- Comparador de metodologías ---------- */
  var criteria = ['Tipo', 'Planificación', 'Entregas', 'Roles', 'Cambios en requisitos', 'Documentación', 'Participación del cliente', 'Ideal para'];
  var methods = {
    'Scrum': ['Ágil, iterativo e incremental', 'Por Sprint (1 a 4 semanas)', 'Un Incremento al final de cada Sprint', 'Product Owner, Scrum Master y Developers', 'Se incorporan en el próximo Sprint', 'Liviana: backlog e historias de usuario', 'Alta, en cada Sprint Review', 'Productos complejos con requisitos cambiantes'],
    'Kanban': ['Ágil, flujo continuo', 'Continua, según la capacidad', 'Continuas, cuando cada tarea está lista', 'No define roles nuevos', 'En cualquier momento, repriorizando el tablero', 'Mínima: tablero visual y políticas explícitas', 'Variable, según el flujo', 'Soporte, mantenimiento y trabajo con demanda variable'],
    'XP': ['Ágil, centrado en prácticas técnicas', 'Juego de planificación por iteración (1 a 2 semanas)', 'Frecuentes y pequeñas', 'Cliente, programadores, coach y tester', 'Bienvenidos en cada iteración', 'Mínima: el código y las pruebas documentan', 'Muy alta, cliente en el lugar', 'Equipos chicos que buscan alta calidad técnica'],
    'Cascada': ['Tradicional, secuencial', 'Completa al inicio del proyecto', 'Una entrega final', 'Por fase: analista, diseñador, programador, tester', 'Difíciles y costosos', 'Extensa y formal en cada fase', 'Baja: al inicio y al final', 'Requisitos estables y proyectos regulados'],
    'Modelo en V': ['Tradicional, secuencial con verificación', 'Completa, incluyendo el plan de pruebas', 'Una entrega final validada', 'Por fase, con equipos de prueba dedicados', 'Muy costosos', 'Extensa, con trazabilidad requisito–prueba', 'Baja, salvo en aceptación', 'Sistemas críticos (salud, aviación, industria)'],
    'Iterativo / Incremental': ['Tradicional evolutivo', 'Por iteración, con plan general', 'Un incremento por iteración', 'Roles tradicionales', 'Entre iteraciones', 'Moderada', 'Media, al cierre de cada iteración', 'Proyectos grandes que necesitan entregas parciales']
  };
  var cmpA = $('#cmpA');
  var cmpB = $('#cmpB');
  var cmpTable = $('#cmpTable');
  Object.keys(methods).forEach(function (m) {
    cmpA.add(new Option(m, m));
    cmpB.add(new Option(m, m));
  });
  cmpA.value = 'Scrum';
  cmpB.value = 'Kanban';

  function renderCompare() {
    var a = cmpA.value, b = cmpB.value;
    var html = '<caption class="visually-hidden">Comparación entre ' + a + ' y ' + b + '</caption>' +
      '<thead><tr><th scope="col">Criterio</th><th scope="col">' + a + '</th><th scope="col">' + b + '</th></tr></thead><tbody>';
    criteria.forEach(function (c, i) {
      html += '<tr><th scope="row">' + c + '</th><td>' + methods[a][i] + '</td><td>' + methods[b][i] + '</td></tr>';
    });
    cmpTable.innerHTML = html + '</tbody>';
  }
  cmpA.addEventListener('change', renderCompare);
  cmpB.addEventListener('change', renderCompare);
  renderCompare();

  /* ---------- Encuesta de preferencias ---------- */
  // Puntos de cada opción: [Scrum, Kanban, Cascada]
  var questions = [
    { q: '¿Cómo son los requisitos de tus proyectos?', o: [
      ['Cerrados y estables desde el inicio', [0, 1, 3]],
      ['Cambian cada tanto; prefiero adaptarme por ciclos', [3, 2, 0]],
      ['Cambian todo el tiempo y llegan sin aviso', [1, 3, 0]] ] },
    { q: '¿Cada cuánto te gustaría entregar?', o: [
      ['Una sola vez, al final del proyecto', [0, 1, 3]],
      ['Cada 1 a 4 semanas, en bloques planificados', [3, 2, 0]],
      ['Continuamente, apenas algo está listo', [1, 3, 0]] ] },
    { q: '¿Cómo preferís organizar al equipo?', o: [
      ['Roles por fase y una jerarquía clara', [0, 1, 3]],
      ['Equipo chico con roles definidos (PO, Scrum Master, Developers)', [3, 1, 0]],
      ['Sin roles nuevos; cada uno toma la siguiente tarea', [1, 3, 0]] ] },
    { q: '¿Cuánta documentación necesitás?', o: [
      ['Mucha, formal y aprobada en cada etapa', [0, 1, 3]],
      ['La justa: backlog e historias de usuario', [3, 2, 1]],
      ['Mínima: con un tablero visual alcanza', [1, 3, 0]] ] },
    { q: '¿Qué hacés cuando aparece un pedido urgente?', o: [
      ['Se evita: todo estaba planificado', [0, 1, 3]],
      ['Lo priorizamos para el próximo Sprint', [3, 1, 0]],
      ['Lo ponemos primero en el tablero de inmediato', [1, 3, 0]] ] }
  ];
  var names = ['Scrum', 'Kanban', 'Cascada'];
  var answers = new Array(questions.length).fill(null);
  var step = 0;
  var wBody = $('#wizardBody');
  var wPrev = $('#wizPrev');
  var wNext = $('#wizNext');
  var pBar = $('#progressBar');
  var pLabel = $('#progressLabel');

  function renderWizard() {
    var total = questions.length;
    var html;
    if (step < total) {
      var Q = questions[step];
      html = '<fieldset><legend>' + Q.q + '</legend>';
      Q.o.forEach(function (opt, i) {
        html += '<label class="option"><input type="radio" name="wq" value="' + i + '"' +
          (answers[step] === i ? ' checked' : '') + '> ' + opt[0] + '</label>';
      });
      wBody.innerHTML = html + '</fieldset>';
      $$('input', wBody).forEach(function (inp) {
        inp.addEventListener('change', function () { answers[step] = parseInt(inp.value, 10); wNext.disabled = false; });
      });
      pBar.style.width = (step / total * 100) + '%';
      pLabel.textContent = 'Pregunta ' + (step + 1) + ' de ' + total;
      wPrev.hidden = false;
      wPrev.disabled = step === 0;
      wNext.textContent = step === total - 1 ? 'Ver resultado' : 'Siguiente';
      wNext.disabled = answers[step] === null;
      return;
    }
    var scores = [0, 0, 0];
    answers.forEach(function (a, qi) {
      questions[qi].o[a][1].forEach(function (p, k) { scores[k] += p; });
    });
    var pct = scores.map(function (s) { return Math.round(s / (total * 3) * 100); });
    var best = pct.indexOf(Math.max.apply(null, pct));
    html = '<div class="result"><h4>Tu metodología ideal: ' + names[best] + '</h4>' +
      '<p class="lead">Coincidencia con cada metodología según tus respuestas:</p>';
    names.forEach(function (n, k) {
      html += '<div class="bar-row"><span>' + n + '</span><div class="bar" role="progressbar" aria-label="Coincidencia con ' + n +
        '" aria-valuenow="' + pct[k] + '" aria-valuemin="0" aria-valuemax="100"><span style="width:' + pct[k] + '%"></span></div><strong>' + pct[k] + '%</strong></div>';
    });
    wBody.innerHTML = html + '</div>';
    pBar.style.width = '100%';
    pLabel.textContent = 'Encuesta completa';
    wPrev.hidden = true;
    wNext.textContent = 'Volver a empezar';
    wNext.disabled = false;
  }
  wPrev.addEventListener('click', function () { if (step > 0) { step--; renderWizard(); } });
  wNext.addEventListener('click', function () {
    if (step >= questions.length) {
      answers = new Array(questions.length).fill(null);
      step = 0;
    } else {
      step++;
    }
    renderWizard();
  });
  renderWizard();

  /* ---------- Formulario de contacto ---------- */
  var form = $('#contactForm');
  var success = $('#contactSuccess');
  var formError = $('#contactError');
  var submitBtn = $('#contactSubmit');
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  function setError(input, msg) {
    input.closest('.field').classList.toggle('invalid', !!msg);
    input.setAttribute('aria-invalid', String(!!msg));
    $('#' + input.getAttribute('aria-describedby')).textContent = msg || '';
  }
  function validate(input) {
    var v = input.value.trim();
    if (!v) { setError(input, 'Este campo es obligatorio.'); return false; }
    if (input.type === 'email' && !EMAIL_RE.test(v)) { setError(input, 'Ingresá un correo válido (ej. nombre@dominio.com).'); return false; }
    if (input.name === 'mensaje' && v.length < 10) { setError(input, 'El mensaje debe tener al menos 10 caracteres.'); return false; }
    setError(input, '');
    return true;
  }
  var required = $$('[required]', form);
  required.forEach(function (inp) {
    inp.addEventListener('blur', function () { validate(inp); });
    inp.addEventListener('input', function () { if (inp.closest('.field').classList.contains('invalid')) validate(inp); });
  });
  function showFormError(msg) {
    success.hidden = true;
    formError.textContent = msg;
    formError.hidden = false;
  }
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var firstBad = null;
    required.forEach(function (inp) { if (!validate(inp) && !firstBad) firstBad = inp; });
    success.hidden = true;
    formError.hidden = true;
    if (firstBad) { firstBad.focus(); return; }

    var config = window.SGCS_CONFIG || {};
    if (!config.supabaseUrl || !config.publishableKey) {
      showFormError('El envío del formulario todavía no está configurado.');
      return;
    }

    var nombre = $('#cNombre').value.trim();
    var controller = new AbortController();
    var timer = setTimeout(function () { controller.abort(); }, 20000);
    submitBtn.disabled = true;
    submitBtn.textContent = 'Enviando…';

    // La función "contacto" de Supabase guarda la consulta y envía el mail
    fetch(config.supabaseUrl + '/functions/v1/contacto', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: config.publishableKey },
      body: JSON.stringify({
        nombre: nombre,
        email: $('#cEmail').value.trim(),
        asunto: $('#cAsunto').value,
        mensaje: $('#cMensaje').value.trim(),
        sitio_web: $('#cSitio').value
      }),
      signal: controller.signal
    }).then(function (res) {
      return res.json().catch(function () { return {}; }).then(function (body) {
        if (!res.ok || !body.ok) throw new Error(body.error || 'No pudimos enviar tu mensaje.');
      });
    }).then(function () {
      success.textContent = '¡Gracias, ' + nombre + '! Recibimos tu mensaje y te vamos a responder por correo.';
      success.hidden = false;
      form.reset();
      required.forEach(function (inp) { setError(inp, ''); });
    }).catch(function (err) {
      // Se conservan los datos escritos para poder reintentar
      var sinConexion = err.name === 'AbortError' || err.name === 'TypeError';
      showFormError(sinConexion ? 'No pudimos conectarnos. Revisá tu conexión y probá de nuevo.' : err.message);
    }).then(function () {
      clearTimeout(timer);
      submitBtn.disabled = false;
      submitBtn.textContent = 'Enviar mensaje';
    });
  });
})();
