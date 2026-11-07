// ─────────────────────────────────────────
// UTILITÁRIOS GERAIS
// ─────────────────────────────────────────

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

// Escapa texto do usuário antes de inserir via innerHTML
function esc(v) {
  return String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const $ = (id) => document.getElementById(id);

// Junta partes não vazias com " · "
function joinInfo(parts, sep = ' · ') {
  return parts.filter(Boolean).join(sep);
}

function nomeDocente(d) {
  return d ? (d.titulo ? d.titulo + ' ' : '') + d.nome : '—';
}

// ── Toast ──
function toast(msg, type = 'success') {
  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.textContent = msg;
  $('toastContainer').appendChild(el);
  setTimeout(() => el.remove(), 3100);
}

// ── Modais ──
function openModal(id)  { $(id).classList.add('open'); }
function closeModal(id) { $(id).classList.remove('open'); }

function initModais() {
  document.querySelectorAll('.overlay').forEach((ov) => {
    // Fecha ao clicar fora do modal
    ov.addEventListener('click', (e) => { if (e.target === ov) closeModal(ov.id); });
    // Botões com data-close (✕ e Cancelar)
    ov.querySelectorAll('[data-close]').forEach((b) =>
      b.addEventListener('click', () => closeModal(ov.id)));
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') document.querySelectorAll('.overlay.open').forEach((ov) => closeModal(ov.id));
  });
}

// ── <select data-options="..."> ──
function preencherSelects() {
  document.querySelectorAll('select[data-options]').forEach((sel) => {
    const lista = SELECT_OPTIONS[sel.dataset.options] || [];
    const placeholder = sel.dataset.options === 'tiposSala' ? '' : '<option value="">— selecione —</option>';
    sel.innerHTML = placeholder + lista.map((v) => `<option value="${esc(v)}">${esc(v)}</option>`).join('');
  });
}

// ── Seletor de cor reutilizável ──
function renderColorPicker(containerId, cores, selected) {
  const wrap = $(containerId);
  wrap.innerHTML = '';
  const sel = cores.includes(selected) ? selected : cores[0];
  cores.forEach((cor) => {
    const d = document.createElement('div');
    d.className = 'color-opt' + (cor === sel ? ' selected' : '');
    d.style.background = cor;
    d.dataset.cor = cor;
    d.onclick = () => {
      wrap.querySelectorAll('.color-opt').forEach((x) => x.classList.remove('selected'));
      d.classList.add('selected');
    };
    wrap.appendChild(d);
  });
}

function getSelectedColor(containerId, fallback) {
  const el = document.querySelector(`#${containerId} .color-opt.selected`);
  return el ? el.dataset.cor : fallback;
}
