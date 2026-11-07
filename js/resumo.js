// ─────────────────────────────────────────
// RESUMO — visão macro de todos os planos ou grade de um professor
// ─────────────────────────────────────────

let modoGeral = false;

function toggleGeral() {
  modoGeral = !modoGeral;
  const btn = $('btnGeral');
  btn.classList.toggle('ativo', modoGeral);
  btn.textContent = modoGeral ? '✕ FECHAR' : '📊 RESUMO';
  $('viewNormal').hidden = modoGeral;
  $('viewGeral').hidden = !modoGeral;
  $('planosTabs').hidden = modoGeral;
  if (modoGeral) {
    populateResumoDocente();
    renderViewGeral();
  }
}

function abrirPlanoDoResumo(id) {
  selecionarPlano(id);
  toggleGeral();
}

function populateResumoDocente() {
  const sel = $('resumoDocente');
  const atual = sel.value;
  sel.innerHTML = '<option value="">— Todos os planos (visão macro) —</option>'
    + state.docentes.map((d) =>
      `<option value="${esc(d.id)}">${esc(nomeDocente(d))}${d.regime ? '  ·  ' + esc(d.regime) : ''}</option>`).join('');
  if (atual && state.docentes.find((x) => x.id === atual)) sel.value = atual;
}

function renderViewGeral() {
  const docenteId = $('resumoDocente').value;
  const container = $('geralPlanos');
  const cardEl = $('resumoDocenteCard');
  container.innerHTML = '';

  $('geralConflitosLabel').innerHTML = state.conflitos.length
    ? `<span class="badge badge-red">⚠️ ${state.conflitos.length} conflito(s)</span>`
    : '<span class="badge badge-green">✅ Sem conflitos</span>';

  // ── Grade de UM professor ──
  if (docenteId) {
    const doc = state.docentes.find((x) => x.id === docenteId);
    if (!doc) {
      cardEl.hidden = true;
      container.innerHTML = '<div class="empty"><div class="empty-icon">👤</div><div class="empty-text">Professor não encontrado.</div></div>';
      return;
    }
    const aulasDoc = todasAulas().filter((a) => a.docenteId === docenteId);
    cardEl.hidden = false;
    cardEl.innerHTML = cardDocenteHTML(doc, aulasDoc);
    renderGradeDocente(doc, aulasDoc);
    return;
  }

  // ── Visão macro de todos os planos ──
  cardEl.hidden = true;
  if (!state.planos.length) {
    container.innerHTML = '<div class="empty"><div class="empty-icon">🗂</div><div class="empty-text">Nenhum plano criado ainda.</div></div>';
    return;
  }
  container.innerHTML = state.planos.map(blocoPlanoHTML).join('');
}

function cardDocenteHTML(doc, aulasDoc) {
  const nPlanos = new Set(aulasDoc.map((a) => a._planoId)).size;
  const nConf = state.conflitos.filter((c) => c.aulaIds.some((id) => aulasDoc.some((a) => a.id === id))).length;
  const disc = doc.disciplinas || [];
  return `
    <div class="docente-card">
      <div class="docente-card-name">${esc(nomeDocente(doc))}</div>
      <div class="docente-card-meta">
        <span>${esc(doc.regime || '')}</span>
        ${doc.email ? `<span>✉ ${esc(doc.email)}</span>` : ''}
        <span>📋 ${aulasDoc.length} aula(s) no total</span>
        <span>📄 ${nPlanos} plano(s)</span>
        ${nConf ? `<span class="bad">⚠️ ${nConf} conflito(s)</span>` : '<span class="good">✅ Sem conflitos</span>'}
      </div>
      ${disc.length ? `<div class="docente-card-tags">${disc.map((d) => `<span class="badge badge-blue">${esc(d)}</span>`).join('')}</div>` : ''}
    </div>`;
}

// Grade semanal completa de um professor (cruza todos os planos)
function renderGradeDocente(doc, aulasDoc) {
  const container = $('geralPlanos');
  if (!aulasDoc.length) {
    container.innerHTML = '<div class="empty"><div class="empty-icon">📅</div><div class="empty-text">Nenhuma aula alocada para este professor.</div></div>';
    return;
  }
  const dias = getDiasAtivos();

  let html = `
    <div class="grade-docente-title"><span class="tag">GRADE SEMANAL</span> ${esc(nomeDocente(doc))}</div>
    <div class="schedule-grid-wrap" style="box-shadow:var(--shadow2);">
      <div class="schedule-grid" style="grid-template-columns:88px repeat(${dias.length},1fr);min-width:700px;">
        <div class="grid-cell corner"></div>
        ${dias.map((d) => `<div class="grid-cell day-header">${DIAS_SHORT[d] || d}</div>`).join('')}`;

  horarios.forEach((hr) => {
    html += `<div class="grid-cell time-header">${esc(hr.label)}</div>`;
    dias.forEach((d) => {
      const slot = aulasDoc.filter((a) => a.dia === d && a.horario === hr.value);
      if (!slot.length) {
        html += '<div class="grid-cell readonly livre"><span>livre</span></div>';
        return;
      }
      const conflito = slotTemConflito(d, hr.value, slot);
      html += '<div class="grid-cell readonly">'
        + slot.map((a) => aulaBlockHTML(a, { mostrarDocente: false, mostrarPlano: true, conflito })).join('')
        + '</div>';
    });
  });
  html += '</div></div>';

  // Lista de planos em que o professor leciona
  const planoIds = [...new Set(aulasDoc.map((a) => a._planoId))];
  html += `<div class="planos-do-docente"><div class="mini-label" style="color:var(--text3)">Aulas por plano</div>`
    + planoIds.map((pid) => {
      const pl = state.planos.find((x) => x.id === pid);
      if (!pl) return '';
      const qtd = aulasDoc.filter((a) => a._planoId === pid).length;
      return `
        <div class="list-item">
          <div style="display:flex;align-items:center;gap:10px;flex:1;">
            <span class="dot" style="background:${esc(pl.cor)}"></span>
            <div>
              <div class="list-item-name" style="font-size:12px;">${esc(pl.labelAba || pl.nome)}</div>
              <div class="list-item-sub" style="font-size:10px;">${esc(joinInfo([pl.semestre, pl.ano, pl.periodo, pl.turma ? 'Turma ' + pl.turma : '']))}</div>
            </div>
          </div>
          <span class="badge badge-blue">${qtd} aula${qtd !== 1 ? 's' : ''}</span>
          <button class="btn btn-ghost btn-sm btn-tiny" onclick="abrirPlanoDoResumo('${esc(pl.id)}')">✏️ Ver plano</button>
        </div>`;
    }).join('')
    + '</div>';

  container.innerHTML = html;
}

// Bloco de um plano na visão macro (mostra só as linhas com aulas)
function blocoPlanoHTML(plano) {
  const dias = getDiasAtivos();
  const meta = joinInfo([plano.semestre, plano.ano, plano.periodo, plano.turma ? 'Turma: ' + plano.turma : '']);
  const nConf = state.conflitos.filter((c) => c.planoIds?.includes(plano.id)).length;
  const qtd = plano.aulas.length;
  const cor = esc(plano.cor);

  let html = `
    <div class="geral-plano-bloco" style="border-top-color:${cor}">
      <div class="geral-plano-header" style="border-bottom-color:${cor}44;background:${cor}0d;">
        <div class="geral-plano-titulo">
          <span class="dot" style="width:12px;height:12px;background:${cor}"></span>
          ${esc(plano.labelAba || plano.nome)}
        </div>
        <div class="geral-plano-meta">
          ${meta ? `<span>${esc(meta)}</span>` : ''}
          <span class="badge badge-blue">${qtd} aula${qtd !== 1 ? 's' : ''}</span>
          ${nConf ? `<span class="badge badge-red">⚠️ ${nConf} conflito${nConf > 1 ? 's' : ''}</span>` : '<span class="badge badge-green">✅ ok</span>'}
          <button class="btn btn-ghost btn-sm btn-tiny" onclick="abrirPlanoDoResumo('${esc(plano.id)}')">📄 Abrir plano</button>
        </div>
      </div>`;

  if (!horarios.length || !dias.length) return html + '<div class="geral-vazio">Sem horários configurados.</div></div>';
  if (!qtd) return html + '<div class="geral-vazio">Nenhuma aula alocada neste plano.</div></div>';

  html += `
    <div class="schedule-grid-wrap">
      <div class="schedule-grid" style="grid-template-columns:80px repeat(${dias.length},1fr);min-width:700px;">
        <div class="grid-cell corner" style="min-height:38px"></div>
        ${dias.map((d) => `<div class="grid-cell day-header" style="min-height:38px">${DIAS_SHORT[d] || d}</div>`).join('')}`;

  horarios.forEach((hr) => {
    if (!dias.some((d) => plano.aulas.some((a) => a.dia === d && a.horario === hr.value))) return;
    html += `<div class="grid-cell time-header" style="font-size:9px;min-height:48px;">${esc(hr.label)}</div>`;
    dias.forEach((d) => {
      const slot = plano.aulas.filter((a) => a.dia === d && a.horario === hr.value);
      const conflito = slotTemConflito(d, hr.value, slot);
      html += '<div class="grid-cell readonly" style="min-height:48px;padding:5px 7px;">'
        + slot.map((a) => aulaBlockHTML(a, { corPadrao: plano.cor, conflito })).join('')
        + '</div>';
    });
  });
  return html + '</div></div></div>';
}
