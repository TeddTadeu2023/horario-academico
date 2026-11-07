// ─────────────────────────────────────────
// TURNOS — horário editável de cada aula
// ─────────────────────────────────────────

let turnoAtivo = 'manha';

// Horários por turno em memória (persistidos separadamente do estado principal)
let TURNO_HORARIOS = {
  manha: TURNO_DEFAULTS.manha.map((h) => ({ ...h })),
  tarde: TURNO_DEFAULTS.tarde.map((h) => ({ ...h })),
  noite: TURNO_DEFAULTS.noite.map((h) => ({ ...h })),
};

function saveTurnoPresets() {
  localStorage.setItem(STORAGE_KEY_TURNOS, JSON.stringify(TURNO_HORARIOS));
}

function loadTurnoPresets() {
  const raw = localStorage.getItem(STORAGE_KEY_TURNOS);
  if (!raw) return;
  try {
    const saved = JSON.parse(raw);
    ['manha', 'tarde', 'noite'].forEach((t) => {
      if (saved[t] && saved[t].length) TURNO_HORARIOS[t] = saved[t];
    });
  } catch (e) { console.warn('Turnos salvos inválidos', e); }
}

// Editor de horários na sidebar para o turno ativo
function renderAulasEditor() {
  const wrap = $('aulasHorariosEditor');
  wrap.innerHTML = '';
  TURNO_HORARIOS[turnoAtivo].forEach((aula, i) => {
    const row = document.createElement('div');
    row.className = 'aula-time-row';
    row.innerHTML = `
      <span class="num">${i + 1}ª</span>
      <input type="time" value="${esc(aula.ini)}" data-idx="${i}" data-campo="ini">
      <span class="sep">–</span>
      <input type="time" value="${esc(aula.fim)}" data-idx="${i}" data-campo="fim">`;
    row.querySelectorAll('input').forEach((inp) => {
      inp.addEventListener('input', () => updateAulaHorario(+inp.dataset.idx, inp.dataset.campo, inp.value));
    });
    wrap.appendChild(row);
  });
}

function updateAulaHorario(idx, campo, val) {
  TURNO_HORARIOS[turnoAtivo][idx][campo] = val;
  saveTurnoPresets();
  buildHorariosFromEditor();
}

function minutosParaHora(total) {
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

function changeAulasTurno(delta) {
  const lista = TURNO_HORARIOS[turnoAtivo];
  if (delta > 0) {
    // Nova aula começa no fim da última e dura DURACAO_AULA_MIN
    const [h, m] = lista[lista.length - 1].fim.split(':').map(Number);
    const ini = h * 60 + m;
    lista.push({ ini: minutosParaHora(ini), fim: minutosParaHora(ini + DURACAO_AULA_MIN) });
  } else {
    if (lista.length <= 1) return;
    lista.pop();
  }
  saveTurnoPresets();
  renderAulasEditor();
  buildHorariosFromEditor();
}

// Constrói o array global `horarios` a partir do editor
function buildHorariosFromEditor() {
  horarios = TURNO_HORARIOS[turnoAtivo].map((aula, i) => ({
    label: `${i + 1}ª ${aula.ini}–${aula.fim}`,
    value: `${aula.ini}-${aula.fim}`,
  }));
  renderGrade();
}

function selecionarTurno(t) {
  turnoAtivo = t;
  if (!TURNO_HORARIOS[t] || !TURNO_HORARIOS[t].length) {
    TURNO_HORARIOS[t] = TURNO_DEFAULTS[t].map((h) => ({ ...h }));
  }
  $('turnoSel').value = t;
  renderAulasEditor();
  buildHorariosFromEditor();
}
