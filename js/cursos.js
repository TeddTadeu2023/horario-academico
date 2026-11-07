// ─────────────────────────────────────────
// CURSOS
// ─────────────────────────────────────────

function openModalCurso(id) {
  if (!exigirGestao()) return;
  $('cursoId').value = '';
  $('cursoNome').value = '';
  $('cursoSemestre').value = '';
  $('cursoAno').value = ANO_PADRAO;
  $('cursoPeriodo').value = '';
  $('cursoPeriodoLetivo').value = '';
  $('cursoAulasSemana').value = 2;
  $('cursoObs').value = '';
  $('modalCursoTitle').textContent = '📚 Novo Curso';
  renderColorPicker('colorRow', CORES_CURSO, null);

  const c = id && state.cursos.find((x) => x.id === id);
  if (c) {
    $('cursoId').value = c.id;
    $('cursoNome').value = c.nome;
    $('cursoSemestre').value = c.semestre || '';
    $('cursoAno').value = c.ano || ANO_PADRAO;
    $('cursoPeriodo').value = c.periodo || '';
    $('cursoPeriodoLetivo').value = c.periodoLetivo || '';
    $('cursoAulasSemana').value = c.aulasSemana;
    $('cursoObs').value = c.obs || '';
    $('modalCursoTitle').textContent = '📚 Editar Curso';
    renderColorPicker('colorRow', CORES_CURSO, c.cor);
  }
  openModal('overlayModalCurso');
  setTimeout(() => $('cursoNome').focus(), 120);
}

function salvarCurso() {
  if (!exigirGestao()) return;
  const nome = $('cursoNome').value.trim();
  if (!nome) { toast('Preencha o nome do curso', 'error'); return; }
  const id = $('cursoId').value || uid();
  const obj = {
    id, nome,
    semestre: $('cursoSemestre').value,
    ano: $('cursoAno').value,
    periodo: $('cursoPeriodo').value,
    periodoLetivo: $('cursoPeriodoLetivo').value,
    aulasSemana: parseInt($('cursoAulasSemana').value, 10) || 2,
    obs: $('cursoObs').value.trim(),
    cor: getSelectedColor('colorRow', CORES_CURSO[0]),
  };
  const idx = state.cursos.findIndex((x) => x.id === id);
  if (idx >= 0) state.cursos[idx] = obj; else state.cursos.push(obj);
  save(); closeModal('overlayModalCurso');
  renderCursos(); populateCursoAtivo();
  toast(idx >= 0 ? 'Curso atualizado!' : 'Curso criado!');
}

function excluirCurso(id) {
  if (!exigirGestao()) return;
  if (!confirm('Excluir este curso? Aulas vinculadas também serão removidas.')) return;
  state.cursos = state.cursos.filter((x) => x.id !== id);
  state.planos.forEach((p) => { p.aulas = p.aulas.filter((x) => x.cursoId !== id); });
  verificarConflitos(); save();
  renderCursos(); populateCursoAtivo(); renderPlanosTabs(); renderGrade();
  toast('Curso removido.', 'warn');
}

function renderCursos() {
  const el = $('listaCursos');
  if (!state.cursos.length) {
    el.innerHTML = '<div class="empty"><div class="empty-icon">📚</div><div class="empty-text">Nenhum curso cadastrado ainda</div></div>';
    return;
  }
  const aulas = todasAulas();
  el.innerHTML = state.cursos.map((c) => {
    const alocadas = aulas.filter((a) => a.cursoId === c.id).length;
    const pct = Math.min(100, Math.round(alocadas / c.aulasSemana * 100));
    const info = joinInfo([c.semestre, c.ano, c.periodo, c.periodoLetivo ? 'Período ' + c.periodoLetivo : '']);
    return `
      <div class="list-item">
        <div style="display:flex;align-items:center;gap:12px;flex:1;min-width:0;">
          <div style="width:4px;height:52px;border-radius:4px;background:${esc(c.cor)};flex-shrink:0;"></div>
          <div class="list-item-info">
            <div class="list-item-name">${esc(c.nome)}</div>
            <div class="list-item-sub">${esc(info)}</div>
            <div style="margin-top:6px;display:flex;align-items:center;gap:8px;">
              <div class="progress-bar-bg" style="width:140px;flex:none;">
                <div class="progress-bar" style="width:${pct}%;background:${esc(c.cor)}"></div>
              </div>
              <span class="progress-count">${alocadas}/${esc(c.aulasSemana)} aulas</span>
            </div>
          </div>
        </div>
        <div class="list-item-actions so-gestao">
          <button class="btn btn-ghost btn-sm" onclick="openModalCurso('${esc(c.id)}')">✏️ Editar</button>
          <button class="btn btn-danger" onclick="excluirCurso('${esc(c.id)}')">🗑</button>
        </div>
      </div>`;
  }).join('');
}
