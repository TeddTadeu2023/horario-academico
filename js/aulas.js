// ─────────────────────────────────────────
// AULAS — modal de alocação
// ─────────────────────────────────────────

// Estado dos checkboxes de horário (preservado ao trocar docente/sala)
let hrCheckState = {};

function preencherSelect(sel, itens, labelFn) {
  sel.innerHTML = '<option value="">— selecione —</option>'
    + itens.map((x) => `<option value="${esc(x.id)}">${esc(labelFn(x))}</option>`).join('');
}

function openModalAula(dia, horario, aulaId) {
  if (!exigirGestao()) return;
  // Sem planos: abre o modal de novo plano
  if (!state.planos.length) {
    toast('Crie um Plano de Horário antes de alocar aulas.', 'warn');
    openModalNovoPlano();
    return;
  }

  $('aulaId').value = aulaId || '';
  $('aulaObs').value = '';
  $('conflitosAvisoModal').innerHTML = '';
  $('modalAulaTitle').textContent = aulaId ? '📋 Editar Aula' : '📋 Alocar Aula';
  $('btnSalvarAula').textContent = aulaId ? 'Salvar Alterações' : 'Salvar Aula(s)';

  // Dias ativos
  const selDia = $('aulaDia');
  selDia.innerHTML = getDiasAtivos()
    .map((d) => `<option value="${d}" ${d === dia ? 'selected' : ''}>${DIAS_FULL[d] || d}</option>`).join('');

  preencherSelect($('aulaCurso'),   state.cursos,   (c) => c.nome + (c.semestre ? ' – ' + c.semestre : ''));
  preencherSelect($('aulaDocente'), state.docentes, nomeDocente);
  preencherSelect($('aulaSala'),    state.salas,    (s) => (TIPO_ICONE[s.tipo] || '') + ' ' + s.nome);

  const pa = planoAtivo();
  const a = aulaId && pa ? pa.aulas.find((x) => x.id === aulaId) : null;
  if (a) {
    // Modo edição: horário fixo
    selDia.value = a.dia;
    $('aulaCurso').value = a.cursoId;
    $('aulaDocente').value = a.docenteId;
    $('aulaSala').value = a.salaId;
    $('aulaObs').value = a.obs || '';
    const hr = horarios.find((h) => h.value === a.horario);
    $('horariosCheckList').innerHTML = `<div class="hr-single">${esc(hr ? hr.label : a.horario)}</div>`;
    $('horariosCheckCount').textContent = '';
  } else {
    // Pré-seleciona o curso do plano ativo
    if (pa) $('aulaCurso').value = pa.cursoId;
    renderHorariosCheckbox(horario);
  }

  openModal('overlayModalAula');
}

// Checkboxes dos horários do dia selecionado.
// modo: undefined → marca o 1º livre | valor de horário → marca só ele | '__manter__' → preserva marcação
function renderHorariosCheckbox(modo) {
  const wrap = $('horariosCheckList');
  const manter = modo === '__manter__';
  if (manter) salvarEstadoCheckboxes();

  if (!horarios.length) {
    wrap.innerHTML = '<div class="hr-empty">Nenhum horário configurado no turno.</div>';
    return;
  }

  const dia = $('aulaDia').value;
  const docenteId = $('aulaDocente').value;
  const salaId = $('aulaSala').value;
  const aulas = todasAulas();
  wrap.innerHTML = '';

  let primeiroLivreMarcado = false;
  horarios.forEach((h, i) => {
    const slot = aulas.filter((a) => a.dia === dia && a.horario === h.value);
    const conflitoDocente = !!docenteId && slot.some((a) => a.docenteId === docenteId);
    const conflitoSala = !!salaId && slot.some((a) => a.salaId === salaId);
    const ocupado = conflitoDocente || conflitoSala;

    let marcar = false;
    if (!ocupado) {
      if (manter) marcar = hrCheckState[h.value] === true;
      else if (modo) marcar = modo === h.value;
      else if (!primeiroLivreMarcado) { marcar = true; primeiroLivreMarcado = true; }
    }

    let motivo = h.label;
    if (conflitoDocente) motivo = `Docente ${state.docentes.find((x) => x.id === docenteId)?.nome || '?'} já alocado`;
    else if (conflitoSala) motivo = `Sala ${state.salas.find((x) => x.id === salaId)?.nome || '?'} já ocupada`;

    const row = document.createElement('label');
    row.className = 'hr-option' + (ocupado ? ' ocupado' : '') + (marcar ? ' checked' : '');
    row.title = motivo;
    row.innerHTML = `
      <input type="checkbox" id="hr_check_${i}" value="${esc(h.value)}" ${marcar ? 'checked' : ''} ${ocupado ? 'disabled' : ''}>
      <span class="hr-label">${esc(h.label)}</span>
      ${ocupado ? `<span class="badge badge-red">${conflitoDocente ? 'Prof. ocupado' : 'Sala ocupada'}</span>` : ''}`;
    row.querySelector('input').onchange = (e) => {
      row.classList.toggle('checked', e.target.checked);
      salvarEstadoCheckboxes();
      atualizarContadorCheckbox();
    };
    wrap.appendChild(row);
  });

  salvarEstadoCheckboxes();
  atualizarContadorCheckbox();
}

function salvarEstadoCheckboxes() {
  hrCheckState = {};
  document.querySelectorAll('#horariosCheckList input[type=checkbox]').forEach((cb) => {
    hrCheckState[cb.value] = cb.checked;
  });
}

function atualizarContadorCheckbox() {
  const n = document.querySelectorAll('#horariosCheckList input[type=checkbox]:checked').length;
  $('horariosCheckCount').textContent = n ? `(${n} selecionado${n > 1 ? 's' : ''})` : '';
}

function mostrarConflitosModal(html) {
  $('conflitosAvisoModal').innerHTML = html;
}

function salvarAula() {
  if (!exigirGestao()) return;
  const dia      = $('aulaDia').value;
  const cursoId   = $('aulaCurso').value;
  const docenteId = $('aulaDocente').value;
  const salaId    = $('aulaSala').value;
  const obs       = $('aulaObs').value.trim();
  const aulaId    = $('aulaId').value;

  if (!dia || !cursoId || !docenteId || !salaId) {
    toast('Preencha todos os campos obrigatórios', 'error'); return;
  }
  const pa = planoAtivo();
  if (!pa) { toast('Nenhum plano ativo!', 'error'); return; }

  // ── Edição (horário único) ──
  if (aulaId) {
    const idx = pa.aulas.findIndex((x) => x.id === aulaId);
    if (idx < 0) { toast('Aula não encontrada.', 'error'); return; }
    const horario = pa.aulas[idx].horario;
    const erros = checkConflict(dia, horario, docenteId, salaId, aulaId);
    if (erros.length) {
      mostrarConflitosModal(erros.map((c) => `<div class="alert alert-danger alert-sm">⚠️ ${esc(c)}</div>`).join(''));
      toast('Há conflitos! Corrija antes de salvar.', 'error'); return;
    }
    pa.aulas[idx] = { id: aulaId, cursoId, docenteId, salaId, dia, horario, obs };
    finalizarAlteracaoAulas();
    closeModal('overlayModalAula');
    toast('Aula atualizada!');
    return;
  }

  // ── Criação (um ou mais horários) ──
  const selecionados = [...document.querySelectorAll('#horariosCheckList input[type=checkbox]:checked')].map((cb) => cb.value);
  if (!selecionados.length) { toast('Selecione pelo menos um horário.', 'warn'); return; }

  const novas = [];
  const conflitos = [];
  selecionados.forEach((hrValue) => {
    const hr = horarios.find((h) => h.value === hrValue);
    const erros = checkConflict(dia, hrValue, docenteId, salaId, '');
    if (erros.length) conflitos.push(`${hr ? hr.label : hrValue}: ${erros.join(' | ')}`);
    else novas.push({ id: uid(), cursoId, docenteId, salaId, dia, horario: hrValue, obs });
  });

  if (conflitos.length) {
    mostrarConflitosModal(`
      <div class="alert alert-danger alert-sm">
        <div>⚠️ ${conflitos.length} conflito(s) detectado(s):
          <ul>${conflitos.map((e) => `<li>${esc(e)}</li>`).join('')}</ul>
        </div>
      </div>`);
    if (!novas.length) { toast('Nenhuma aula pôde ser alocada.', 'error'); return; }
    toast(`${novas.length} salva(s), ${conflitos.length} com conflito.`, 'warn');
  } else {
    toast(`${novas.length} aula(s) alocada(s) em "${pa.nome}"!`);
  }

  pa.aulas.push(...novas);
  finalizarAlteracaoAulas();
  if (conflitos.length) renderHorariosCheckbox();   // atualiza ocupados após salvar parcial
  else closeModal('overlayModalAula');
}

function excluirAula(id) {
  if (!exigirGestao()) return;
  const pa = planoAtivo();
  if (pa) pa.aulas = pa.aulas.filter((x) => x.id !== id);
  finalizarAlteracaoAulas();
  toast('Aula removida.', 'warn');
}

function finalizarAlteracaoAulas() {
  verificarConflitos(); save();
  renderGrade(); renderPlanosTabs();
}

function initModalAula() {
  // Trocar dia: reinicia seleção. Trocar docente/sala: só reavalia conflitos.
  $('aulaDia').addEventListener('change', () => { if (!$('aulaId').value) renderHorariosCheckbox(); });
  ['aulaDocente', 'aulaSala'].forEach((id) =>
    $(id).addEventListener('change', () => { if (!$('aulaId').value) renderHorariosCheckbox('__manter__'); }));
  $('btnSalvarAula').addEventListener('click', salvarAula);
}
