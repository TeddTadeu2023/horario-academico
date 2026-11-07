// ─────────────────────────────────────────
// SALAS & ESPAÇOS
// ─────────────────────────────────────────

function openModalSala(id) {
  if (!exigirGestao()) return;
  $('salaId').value = '';
  $('salaNome').value = '';
  $('salaTipo').value = 'Sala de Aula';
  $('salaCapacidade').value = 30;
  $('salaBloco').value = '';
  $('salaRecursos').value = '';
  $('modalSalaTitle').textContent = '🏫 Nova Sala / Espaço';

  const s = id && state.salas.find((x) => x.id === id);
  if (s) {
    $('salaId').value = s.id;
    $('salaNome').value = s.nome;
    $('salaTipo').value = s.tipo;
    $('salaCapacidade').value = s.capacidade;
    $('salaBloco').value = s.bloco || '';
    $('salaRecursos').value = s.recursos || '';
    $('modalSalaTitle').textContent = '🏫 Editar Sala';
  }
  openModal('overlayModalSala');
  setTimeout(() => $('salaNome').focus(), 120);
}

function salvarSala() {
  if (!exigirGestao()) return;
  const nome = $('salaNome').value.trim();
  if (!nome) { toast('Informe o nome da sala', 'error'); return; }
  const id = $('salaId').value || uid();
  const obj = {
    id, nome,
    tipo: $('salaTipo').value,
    capacidade: parseInt($('salaCapacidade').value, 10) || 30,
    bloco: $('salaBloco').value.trim(),
    recursos: $('salaRecursos').value.trim(),
  };
  const idx = state.salas.findIndex((x) => x.id === id);
  if (idx >= 0) state.salas[idx] = obj; else state.salas.push(obj);
  save(); closeModal('overlayModalSala');
  renderSalas(); atualizarStats();
  toast(idx >= 0 ? 'Sala atualizada!' : 'Sala cadastrada!');
}

function excluirSala(id) {
  if (!exigirGestao()) return;
  if (!confirm('Excluir esta sala? Aulas vinculadas serão removidas.')) return;
  state.salas = state.salas.filter((x) => x.id !== id);
  state.planos.forEach((p) => { p.aulas = p.aulas.filter((x) => x.salaId !== id); });
  verificarConflitos(); save();
  renderSalas(); renderPlanosTabs(); renderGrade();
  toast('Sala removida.', 'warn');
}

function renderSalas() {
  const el = $('listaSalas');
  if (!state.salas.length) {
    el.innerHTML = '<div class="empty"><div class="empty-icon">🏫</div><div class="empty-text">Nenhuma sala cadastrada ainda</div></div>';
    return;
  }
  const aulas = todasAulas();
  const grupos = {};
  state.salas.forEach((s) => { (grupos[s.tipo] ||= []).push(s); });

  el.innerHTML = Object.entries(grupos).map(([tipo, salas]) => `
    <div class="section-label" style="margin-top:14px;">${TIPO_ICONE[tipo] || '🏢'} ${esc(tipo)}</div>
    ${salas.map((s) => {
      const usada = aulas.filter((a) => a.salaId === s.id).length;
      return `
        <div class="list-item">
          <div class="list-item-info">
            <div class="list-item-name">${esc(s.nome)}</div>
            <div class="list-item-sub">Cap. ${esc(s.capacidade)} alunos${s.bloco ? ' · ' + esc(s.bloco) : ''}${s.recursos ? ' · ' + esc(s.recursos) : ''}</div>
          </div>
          <div class="list-item-actions">
            <span class="badge badge-blue">${usada} aulas</span>
            <button class="btn btn-ghost btn-sm so-gestao" onclick="openModalSala('${esc(s.id)}')">✏️ Editar</button>
            <button class="btn btn-danger so-gestao" onclick="excluirSala('${esc(s.id)}')">🗑</button>
          </div>
        </div>`;
    }).join('')}`).join('');
}
