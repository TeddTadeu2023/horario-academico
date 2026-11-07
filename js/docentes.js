// ─────────────────────────────────────────
// DOCENTES (+ campo incremental de disciplinas)
// ─────────────────────────────────────────

// Disciplinas do docente em edição
let disciplinasAtual = [];

// ── Campo de disciplinas (chips) ──
function renderDisciplinasChips() {
  $('disciplinasChips').innerHTML = disciplinasAtual.map((d, i) =>
    `<span class="chip">${esc(d)}<span class="chip-del" onclick="removerDisciplina(${i})">×</span></span>`
  ).join('');
}

function adicionarDisciplina() {
  const input = $('disciplinaInput');
  const val = input.value.trim();
  if (!val) return;
  if (disciplinasAtual.some((d) => d.toLowerCase() === val.toLowerCase())) {
    toast('Disciplina já adicionada', 'warn');
  } else {
    disciplinasAtual.push(val);
    renderDisciplinasChips();
  }
  input.value = '';
  hideSuggestions();
  input.focus();
}

function removerDisciplina(i) {
  disciplinasAtual.splice(i, 1);
  renderDisciplinasChips();
}

function handleDisciplinaKey(e) {
  if (e.key === 'Enter')  { e.preventDefault(); adicionarDisciplina(); }
  if (e.key === 'Escape') { e.stopPropagation(); hideSuggestions(); }
}

function showDisciplinaSuggestions() {
  const q = $('disciplinaInput').value.trim().toLowerCase();
  const wrap = $('disciplinaSuggestions');
  if (!q) { hideSuggestions(); return; }

  // Lista padrão + disciplinas já usadas por outros docentes
  const pool = [...new Set([...DISCIPLINAS_COMUNS, ...state.docentes.flatMap((d) => d.disciplinas || [])])];
  const matches = pool
    .filter((d) => d.toLowerCase().includes(q) && !disciplinasAtual.some((x) => x.toLowerCase() === d.toLowerCase()))
    .slice(0, 6);
  if (!matches.length) { hideSuggestions(); return; }

  wrap.innerHTML = '';
  wrap.classList.add('open');
  matches.forEach((m) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'suggestion-btn';
    btn.textContent = m;
    btn.onclick = () => { $('disciplinaInput').value = m; adicionarDisciplina(); };
    wrap.appendChild(btn);
  });
}

function hideSuggestions() {
  const w = $('disciplinaSuggestions');
  w.classList.remove('open');
  w.innerHTML = '';
}

// ── CRUD ──
function openModalDocente(id) {
  disciplinasAtual = [];
  $('docenteId').value = '';
  $('docenteNome').value = '';
  $('docenteTitulo').value = '';
  $('docenteRegime').value = '40h';
  $('docenteEmail').value = '';
  $('docenteMaxAulas').value = 20;
  $('disciplinaInput').value = '';
  $('modalDocenteTitle').textContent = '👤 Novo Docente';

  const d = id && state.docentes.find((x) => x.id === id);
  if (d) {
    $('docenteId').value = d.id;
    $('docenteNome').value = d.nome;
    $('docenteTitulo').value = d.titulo || '';
    $('docenteRegime').value = d.regime || '40h';
    $('docenteEmail').value = d.email || '';
    $('docenteMaxAulas').value = d.maxAulas || 20;
    disciplinasAtual = [...(d.disciplinas || [])];
    $('modalDocenteTitle').textContent = '👤 Editar Docente';
  }
  renderDisciplinasChips();
  hideSuggestions();
  openModal('overlayModalDocente');
  setTimeout(() => $('docenteNome').focus(), 120);
}

function salvarDocente() {
  const nome = $('docenteNome').value.trim();
  if (!nome) { toast('Informe o nome do docente', 'error'); return; }
  const id = $('docenteId').value || uid();
  const obj = {
    id, nome,
    titulo: $('docenteTitulo').value,
    regime: $('docenteRegime').value,
    email: $('docenteEmail').value.trim(),
    maxAulas: parseInt($('docenteMaxAulas').value, 10) || 20,
    disciplinas: [...disciplinasAtual],
  };
  const idx = state.docentes.findIndex((x) => x.id === id);
  if (idx >= 0) state.docentes[idx] = obj; else state.docentes.push(obj);
  save(); closeModal('overlayModalDocente');
  renderDocentes(); atualizarStats();
  toast(idx >= 0 ? 'Docente atualizado!' : 'Docente cadastrado!');
}

function excluirDocente(id) {
  if (!confirm('Excluir este docente? Aulas vinculadas serão removidas.')) return;
  state.docentes = state.docentes.filter((x) => x.id !== id);
  state.planos.forEach((p) => { p.aulas = p.aulas.filter((x) => x.docenteId !== id); });
  verificarConflitos(); save();
  renderDocentes(); renderPlanosTabs(); renderGrade();
  toast('Docente removido.', 'warn');
}

function renderDocentes() {
  const el = $('listaDocentes');
  if (!state.docentes.length) {
    el.innerHTML = '<div class="empty"><div class="empty-icon">👤</div><div class="empty-text">Nenhum docente cadastrado ainda</div></div>';
    return;
  }
  const aulas = todasAulas();
  el.innerHTML = state.docentes.map((d) => {
    const aulasDoc = aulas.filter((a) => a.docenteId === d.id);
    const cursosDoc = [...new Set(aulasDoc.map((a) => a.cursoId))];
    const disc = d.disciplinas || [];

    const discChips = disc.slice(0, 4).map((x) => `<span class="badge badge-blue">${esc(x)}</span>`).join('')
      + (disc.length > 4 ? `<span class="badge badge-gray">+${disc.length - 4} mais</span>` : '');

    const cursoChips = cursosDoc.map((cid) => {
      const c = state.cursos.find((x) => x.id === cid);
      return c ? `<span class="badge" style="background:${esc(c.cor)}22;color:${esc(c.cor)};border:1px solid ${esc(c.cor)}44;">${esc(c.nome)}</span>` : '';
    }).join('');

    return `
      <div class="list-item">
        <div class="list-item-info">
          <div class="list-item-name">${esc(nomeDocente(d))}</div>
          <div class="list-item-sub">${esc(d.regime)}${d.email ? ' · ' + esc(d.email) : ''} · máx ${esc(d.maxAulas)} aulas/sem</div>
          ${disc.length ? `<div class="list-item-tags"><span class="tag-label">Disciplinas:</span>${discChips}</div>` : ''}
          ${cursosDoc.length ? `<div class="list-item-tags"><span class="tag-label">Cursos:</span>${cursoChips}
            <span class="badge badge-green">${aulasDoc.length} aulas</span></div>` : ''}
        </div>
        <div class="list-item-actions">
          <button class="btn btn-ghost btn-sm" onclick="openModalDocente('${esc(d.id)}')">✏️ Editar</button>
          <button class="btn btn-danger" onclick="excluirDocente('${esc(d.id)}')">🗑</button>
        </div>
      </div>`;
  }).join('');
}
