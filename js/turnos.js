// ─────────────────────────────────────────
// TURNOS — horário editável de cada aula
// ─────────────────────────────────────────
// Os horários ficam no banco (state.turnos) para que todos vejam a mesma grade.
// O turno selecionado (manhã/tarde/noite) é escolha local de cada tela.

let turnoAtivo = 'manha';

const clonarTurnos = (t) => ({
  manha: t.manha.map((h) => ({ ...h })),
  tarde: t.tarde.map((h) => ({ ...h })),
  noite: t.noite.map((h) => ({ ...h })),
});

let TURNO_HORARIOS = clonarTurnos(TURNO_DEFAULTS);

// Copia os horários vindos do banco (ou volta ao padrão)
function aplicarTurnosDoEstado() {
  const salvo = state.turnos || {};
  TURNO_HORARIOS = clonarTurnos(TURNO_DEFAULTS);
  ['manha', 'tarde', 'noite'].forEach((t) => {
    if (Array.isArray(salvo[t]) && salvo[t].length) TURNO_HORARIOS[t] = salvo[t].map((h) => ({ ...h }));
  });
  renderAulasEditor();
  buildHorariosFromEditor();
}

function saveTurnoPresets() {
  state.turnos = clonarTurnos(TURNO_HORARIOS);
  save();
}

// Editor de horários na sidebar para o turno ativo
function renderAulasEditor() {
  const wrap = $('aulasHorariosEditor');
  const bloqueado = !podeEditar() ? 'disabled' : '';
  wrap.innerHTML = '';
  TURNO_HORARIOS[turnoAtivo].forEach((aula, i) => {
    const row = document.createElement('div');
    row.className = 'aula-time-row';
    row.innerHTML = `
      <span class="num">${i + 1}ª</span>
      <input type="time" value="${esc(aula.ini)}" data-idx="${i}" data-campo="ini" ${bloqueado}>
      <span class="sep">–</span>
      <input type="time" value="${esc(aula.fim)}" data-idx="${i}" data-campo="fim" ${bloqueado}>`;
    row.querySelectorAll('input').forEach((inp) => {
      inp.addEventListener('input', () => updateAulaHorario(+inp.dataset.idx, inp.dataset.campo, inp.value));
    });
    wrap.appendChild(row);
  });
}

function updateAulaHorario(idx, campo, val) {
  if (!exigirGestao()) return;
  TURNO_HORARIOS[turnoAtivo][idx][campo] = val;
  saveTurnoPresets();
  buildHorariosFromEditor();
}

function minutosParaHora(total) {
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

function changeAulasTurno(delta) {
  if (!exigirGestao()) return;
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
  $('turnoSel').value = t;
  renderAulasEditor();
  buildHorariosFromEditor();
}
