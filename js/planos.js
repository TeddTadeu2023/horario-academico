// ─────────────────────────────────────────
// PLANOS DE HORÁRIO (cada plano = uma turma com grade própria)
// ─────────────────────────────────────────

function openModalNovoPlano(id) {
  if (!exigirGestao()) return;
  const selCurso = $('planoCursoId');
  selCurso.innerHTML = '<option value="">— selecione um curso cadastrado —</option>'
    + state.cursos.map((c) => {
      const info = joinInfo([c.semestre, c.ano, c.periodo]);
      return `<option value="${esc(c.id)}">${esc(c.nome)}${info ? ' — ' + esc(info) : ''}</option>`;
    }).join('');

  // Reseta campos
  $('planoId').value = '';
  selCurso.value = '';
  $('planoInfoCurso').hidden = true;
  $('planoInfoCurso').innerHTML = '';
  $('planoSemestre').value = '';
  $('planoAno').value = ANO_PADRAO;
  $('planoTurma').value = '';
  $('planoPeriodo').value = '';
  $('modalPlanoTitle').textContent = '📄 Novo Plano de Horário';
  $('btnSalvarPlano').textContent = 'Criar Plano';
  renderColorPicker('colorRowPlano', CORES_PLANO, null);

  const p = id && state.planos.find((x) => x.id === id);
  if (p) {
    $('planoId').value = p.id;
    selCurso.value = p.cursoId || '';
    preencherDadosDoCurso();
    $('planoSemestre').value = p.semestre || '';
    $('planoAno').value = p.ano || ANO_PADRAO;
    $('planoTurma').value = p.turma || '';
    $('planoPeriodo').value = p.periodo || '';
    $('modalPlanoTitle').textContent = '📄 Editar Plano';
    $('btnSalvarPlano').textContent = 'Salvar Alterações';
    renderColorPicker('colorRowPlano', CORES_PLANO, p.cor);
  }
  openModal('overlayModalPlano');
}

// Preenche campos automaticamente com dados do curso selecionado
function preencherDadosDoCurso() {
  const infoEl = $('planoInfoCurso');
  const c = state.cursos.find((x) => x.id === $('planoCursoId').value);
  if (!c) { infoEl.hidden = true; return; }

  if (c.semestre) $('planoSemestre').value = c.semestre;
  if (c.ano)      $('planoAno').value = c.ano;
  if (c.periodo)  $('planoPeriodo').value = c.periodo;
  renderColorPicker('colorRowPlano', CORES_PLANO, c.cor);

  infoEl.hidden = false;
  infoEl.innerHTML = `
    <div class="plano-info-name">
      <span class="dot" style="background:${esc(c.cor)}"></span>
      <strong>${esc(c.nome)}</strong>
    </div>
    <div class="plano-info-meta">
      ${esc(joinInfo([c.semestre, c.ano, c.periodo, c.periodoLetivo ? 'Período ' + c.periodoLetivo : '']))}
      ${c.aulasSemana ? ' · ' + esc(c.aulasSemana) + ' aulas/sem' : ''}
    </div>`;
}

function salvarPlano() {
  if (!exigirGestao()) return;
  const cursoId = $('planoCursoId').value;
  if (!cursoId) { toast('Selecione um curso cadastrado', 'error'); return; }
  const curso = state.cursos.find((x) => x.id === cursoId);
  if (!curso) { toast('Curso não encontrado', 'error'); return; }

  const id       = $('planoId').value || uid();
  const semestre = $('planoSemestre').value;
  const ano      = $('planoAno').value;
  const turma    = $('planoTurma').value.trim().toUpperCase();
  const periodo  = $('planoPeriodo').value;
  const cor      = getSelectedColor('colorRowPlano', curso.cor);
  const nome     = curso.nome;

  const labelAba = joinInfo([nome, semestre, ano]) + (turma ? ' — ' + turma : '');
  const desc     = joinInfo([periodo, turma ? 'Turma ' + turma : ''], ' | ');
  const dados    = { cursoId, nome, semestre, ano, turma, periodo, cor, labelAba, desc };

  const existente = state.planos.find((p) => p.id === id);
  if (existente) {
    Object.assign(existente, dados);
    toast('Plano atualizado!');
  } else {
    state.planos.push({ id, ...dados, aulas: [] });
    state.planoAtivoId = id;
    toast(`Plano "${labelAba}" criado!`);
  }
  save();
  closeModal('overlayModalPlano');
  renderPlanosTabs(); renderGrade();
}

function excluirPlano(id) {
  if (!exigirGestao()) return;
  if (state.planos.length <= 1) { toast('É necessário ter pelo menos um plano.', 'warn'); return; }
  const p = state.planos.find((x) => x.id === id);
  if (!confirm(`Excluir o plano "${p?.labelAba || p?.nome}"? As aulas deste plano serão perdidas.`)) return;
  state.planos = state.planos.filter((x) => x.id !== id);
  if (state.planoAtivoId === id) state.planoAtivoId = state.planos[0].id;
  verificarConflitos(); save();
  renderPlanosTabs(); renderGrade();
  toast('Plano excluído.', 'warn');
}

// A aba selecionada é local (não grava no banco)
function selecionarPlano(id) {
  state.planoAtivoId = id;
  renderPlanosTabs(); renderGrade();
}

function renderPlanosTabs() {
  const bar = $('planosTabs');
  const gestao = podeEditar();
  bar.innerHTML = '';

  const btnNovo = document.createElement('button');
  btnNovo.className = 'btn-novo-plano';
  btnNovo.onclick = () => openModalNovoPlano();

  if (!state.planos.length) {
    if (gestao) {
      btnNovo.textContent = '＋ Criar Primeiro Plano';
      bar.appendChild(btnNovo);
    }
    $('planoSubtitle').textContent = gestao
      ? 'Crie um plano vinculado a um curso para começar a alocar aulas'
      : 'Nenhum plano de horário publicado ainda';
    return;
  }

  state.planos.forEach((p) => {
    const ativo = p.id === state.planoAtivoId;
    const qtd = p.aulas.length;
    const confl = state.conflitos.filter((c) => c.planoIds?.includes(p.id)).length;

    const tab = document.createElement('button');
    tab.className = 'plano-tab' + (ativo ? ' active' : '');
    tab.innerHTML = `
      <span class="tab-dot" style="background:${esc(p.cor)}"></span>
      ${esc(p.labelAba || p.nome)}
      <span class="tab-count" ${ativo ? `style="background:${esc(p.cor)};color:#fff"` : ''}>${qtd} aula${qtd !== 1 ? 's' : ''}</span>
      ${confl ? `<span class="tab-conf">⚠️${confl}</span>` : ''}
      ${gestao && state.planos.length > 1 ? '<span class="tab-del" title="Excluir plano">×</span>' : ''}`;
    tab.onclick = () => selecionarPlano(p.id);
    if (gestao) tab.ondblclick = (e) => { e.stopPropagation(); openModalNovoPlano(p.id); };
    const del = tab.querySelector('.tab-del');
    if (del) del.onclick = (e) => { e.stopPropagation(); excluirPlano(p.id); };
    bar.appendChild(tab);
  });

  if (gestao) {
    btnNovo.textContent = '＋ Novo Plano';
    bar.appendChild(btnNovo);
  }

  // Subtítulo com dados do plano ativo
  const pa = planoAtivo();
  if (pa) {
    const info = joinInfo([pa.semestre, pa.ano, pa.periodo, pa.turma ? 'Turma: ' + pa.turma : '']);
    const sub = info ? ` — ${info}` : pa.desc ? ' — ' + pa.desc : '';
    $('planoSubtitle').textContent = `Plano ativo: ${pa.nome}${sub}`;
  }
}
