// ─────────────────────────────────────────
// GRADE SEMANAL (plano ativo) + estatísticas + progresso
// ─────────────────────────────────────────

function populateCursoAtivo() {
  const sel = $('cursoAtivo');
  const atual = sel.value;
  sel.innerHTML = '<option value="">— Todos os cursos —</option>'
    + (state.cursos.length
      ? state.cursos.map((c) => {
        const info = joinInfo([c.semestre, c.ano, c.periodo]);
        return `<option value="${esc(c.id)}">${esc(c.nome)}${info ? ' — ' + esc(info) : ''}</option>`;
      }).join('')
      : '<option disabled>Nenhum curso cadastrado ainda</option>');
  if (atual && state.cursos.find((x) => x.id === atual)) sel.value = atual;
}

function atualizarFiltroInfo(filtro) {
  const c = filtro && state.cursos.find((x) => x.id === filtro);
  $('cursoAtivoLabel').textContent = c ? `📚 ${c.nome}` : '';
  $('cursoFiltroInfo').textContent = c
    ? joinInfo([c.semestre, c.ano, c.periodo, c.periodoLetivo ? 'Período ' + c.periodoLetivo : ''])
    : state.cursos.length ? `${state.cursos.length} curso(s) cadastrado(s)` : '';
}

// HTML de um bloco de aula (usado na grade e no resumo)
function aulaBlockHTML(a, { corPadrao = '#003E7E', editavel = false, mostrarDocente = true, mostrarPlano = false, conflito = false } = {}) {
  const curso = state.cursos.find((x) => x.id === a.cursoId);
  const docente = state.docentes.find((x) => x.id === a.docenteId);
  const sala = state.salas.find((x) => x.id === a.salaId);
  const plano = mostrarPlano && state.planos.find((x) => x.id === a._planoId);
  const cor = esc(curso?.cor || corPadrao);
  const click = editavel ? `onclick="event.stopPropagation();openModalAula('${esc(a.dia)}','${esc(a.horario)}','${esc(a.id)}')"` : '';
  return `
    <div class="aula-block${editavel ? '' : ' readonly'}" style="background:${cor}18;border-left-color:${cor};" ${click}>
      <div class="aula-curso" style="color:${cor}">${esc(curso?.nome || '?')}</div>
      ${plano ? `<div class="aula-plano">📄 ${esc(plano.labelAba || plano.nome)}</div>` : ''}
      ${mostrarDocente ? `<div class="aula-docente">👤 ${esc(nomeDocente(docente))}</div>` : ''}
      <div class="aula-sala">📍 ${esc(sala?.nome || '—')}</div>
      ${a.obs ? `<div class="aula-obs">${esc(a.obs)}</div>` : ''}
      ${editavel ? `<button class="del-aula" title="Remover aula" onclick="event.stopPropagation();excluirAula('${esc(a.id)}')">✕</button>` : ''}
      ${conflito ? '<div class="conflict-badge">!</div>' : ''}
    </div>`;
}

function gradeVaziaHTML() {
  return `
    <div class="grade-empty">
      <div class="grade-empty-icon">📅</div>
      <div>
        <div class="grade-empty-title">Nenhum plano criado ainda</div>
        <div class="grade-empty-text">
          Crie o seu primeiro plano de horário vinculado a um curso cadastrado.<br>
          Cada plano representa uma turma com sua própria grade semanal.
        </div>
      </div>
      ${state.cursos.length
        ? '<button class="btn btn-primary" style="padding:13px 36px;font-size:13px;" onclick="openModalNovoPlano()">📄 Criar Primeiro Plano</button>'
        : '<div class="alert alert-warn">⚠️ Cadastre os <strong>Cursos</strong> primeiro antes de criar um plano.</div>'}
    </div>`;
}

function renderGrade() {
  const dias = getDiasAtivos();
  const filtro = $('cursoAtivo').value;
  const wrap = $('gradeWrap');
  atualizarFiltroInfo(filtro);

  if (!state.planos.length) {
    $('statsRow').innerHTML = '';
    $('progressSection').innerHTML = '';
    wrap.innerHTML = gradeVaziaHTML();
    return;
  }

  const pa = planoAtivo();
  const aulasPlano = pa ? pa.aulas : [];
  atualizarStats();

  if (!horarios.length) {
    wrap.innerHTML = '<div class="alert alert-info">Nenhum horário configurado. Selecione um turno no painel lateral.</div>';
    return;
  }

  let html = `<div class="schedule-grid-wrap"><div class="schedule-grid" style="grid-template-columns:88px repeat(${dias.length},1fr);">`;
  html += '<div class="grid-cell corner"></div>';
  html += dias.map((d) => `<div class="grid-cell day-header">${DIAS_SHORT[d] || d}</div>`).join('');

  horarios.forEach((hr) => {
    html += `<div class="grid-cell time-header">${esc(hr.label)}</div>`;
    dias.forEach((d) => {
      const slot = aulasPlano.filter((a) => a.dia === d && a.horario === hr.value && (!filtro || a.cursoId === filtro));
      const conflito = slotTemConflito(d, hr.value, slot);
      html += `<div class="grid-cell" onclick="openModalAula('${d}','${esc(hr.value)}')">`
        + slot.map((a) => aulaBlockHTML(a, { editavel: true, conflito })).join('')
        + '</div>';
    });
  });
  html += '</div></div>';
  wrap.innerHTML = html;
  renderProgress(filtro, aulasPlano);
}

function renderProgress(filtro, aulasPlano) {
  const el = $('progressSection');
  const cursos = filtro ? state.cursos.filter((c) => c.id === filtro) : state.cursos;
  if (!cursos.length) { el.innerHTML = ''; return; }

  el.innerHTML = `
    <div class="section-label" style="margin-bottom:10px;">Progresso de Alocação — ${esc(planoAtivo()?.nome || '')}</div>
    <div class="progress-wrap">
      ${cursos.map((c) => {
        const alocadas = aulasPlano.filter((a) => a.cursoId === c.id).length;
        const pct = Math.min(100, Math.round(alocadas / c.aulasSemana * 100));
        return `
          <div class="progress-row">
            <div class="progress-label" title="${esc(c.nome)}">
              <span class="dot" style="width:8px;height:8px;background:${esc(c.cor)};margin-right:6px;"></span>${esc(c.nome)}
            </div>
            <div class="progress-bar-bg"><div class="progress-bar" style="width:${pct}%;background:${esc(c.cor)}"></div></div>
            <div class="progress-pct">${pct}%</div>
            <div class="progress-count">${alocadas}/${esc(c.aulasSemana)} aulas</div>
          </div>`;
      }).join('')}
    </div>`;
}

function atualizarStats() {
  if (!state.planos.length) { $('statsRow').innerHTML = ''; return; }
  const pa = planoAtivo();
  const aulasAtivas = pa ? pa.aulas.length : 0;
  const totalSlots = horarios.length * getDiasAtivos().length;
  const nConf = state.conflitos.length;

  const card = (val, label, cls = '') =>
    `<div class="stat-card"><div class="stat-val ${cls}">${val}</div><div class="stat-label">${label}</div></div>`;

  $('statsRow').innerHTML =
      card(state.planos.length, 'Planos')
    + card(aulasAtivas, 'Aulas neste plano')
    + card(state.docentes.length, 'Docentes')
    + card(state.salas.length, 'Salas')
    + card(nConf, 'Conflitos (todos os planos)', nConf ? 'red' : 'green')
    + card((totalSlots ? Math.round(aulasAtivas / totalSlots * 100) : 0) + '%', 'Ocupação');
}
