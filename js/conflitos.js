// ─────────────────────────────────────────
// CONFLITOS (docente ou sala em aulas simultâneas, entre todos os planos)
// ─────────────────────────────────────────

function descreverAulas(lista) {
  return lista.map((a) => {
    const c = state.cursos.find((x) => x.id === a.cursoId);
    return `${c ? c.nome : '?'} [${a._planoNome || '?'}]`;
  }).join(', ');
}

function agruparPor(lista, campo) {
  const map = {};
  lista.forEach((a) => { (map[a[campo]] ||= []).push(a); });
  return map;
}

function verificarConflitos() {
  state.conflitos = [];
  const porSlot = agruparPor(
    todasAulas().map((a) => ({ ...a, _slot: `${a.dia}|${a.horario}` })), '_slot');

  Object.entries(porSlot).forEach(([key, aulas]) => {
    const [dia, horario] = key.split('|');
    const registrar = (tipo, lista, msg) => state.conflitos.push({
      tipo, dia, horario, msg,
      aulaIds: lista.map((a) => a.id),
      planoIds: [...new Set(lista.map((a) => a._planoId))],
    });

    Object.entries(agruparPor(aulas, 'docenteId')).forEach(([docId, lista]) => {
      if (lista.length < 2) return;
      const d = state.docentes.find((x) => x.id === docId);
      registrar('docente', lista,
        `Docente ${d ? d.nome : '?'} em ${lista.length} aulas simultâneas: ${descreverAulas(lista)}`);
    });

    Object.entries(agruparPor(aulas, 'salaId')).forEach(([salId, lista]) => {
      if (lista.length < 2) return;
      const s = state.salas.find((x) => x.id === salId);
      registrar('sala', lista,
        `Sala ${s ? s.nome : '?'} para ${lista.length} aulas simultâneas: ${descreverAulas(lista)}`);
    });
  });

  const badge = $('badgeConflitos');
  badge.hidden = !state.conflitos.length;
  badge.textContent = state.conflitos.length;
}

// Retorna mensagens de conflito para alocar (dia, horario, docente, sala)
function checkConflict(dia, horario, docenteId, salaId, excludeId) {
  const erros = [];
  const todas = todasAulas().filter((a) => a.dia === dia && a.horario === horario && a.id !== excludeId);

  const descOutro = (a) => {
    const c = state.cursos.find((x) => x.id === a.cursoId);
    const outroPlano = a._planoNome && a._planoId !== state.planoAtivoId ? ` [Plano: ${a._planoNome}]` : '';
    return `${c ? c.nome : '?'}${outroPlano}`;
  };

  const mesmoDoc = todas.find((a) => a.docenteId === docenteId);
  if (mesmoDoc) {
    const d = state.docentes.find((x) => x.id === docenteId);
    erros.push(`Docente ${d ? d.nome : '?'} já está em outra aula neste horário (${descOutro(mesmoDoc)})`);
  }
  const mesmaSala = todas.find((a) => a.salaId === salaId);
  if (mesmaSala) {
    const s = state.salas.find((x) => x.id === salaId);
    erros.push(`Sala ${s ? s.nome : '?'} já está ocupada neste horário (${descOutro(mesmaSala)})`);
  }
  return erros;
}

function slotTemConflito(dia, horario, aulasSlot) {
  return state.conflitos.some((c) =>
    c.dia === dia && c.horario === horario && aulasSlot.some((a) => c.aulaIds.includes(a.id)));
}

function renderConflitos() {
  const el = $('listaConflitos');
  if (!state.conflitos.length) {
    el.innerHTML = '<div class="alert alert-success">✅ Nenhum conflito detectado! Grade consistente e pronta.</div>';
    return;
  }
  el.innerHTML = `<div class="alert alert-danger" style="margin-bottom:16px;">⚠️ ${state.conflitos.length} conflito(s) encontrado(s)</div>`
    + state.conflitos.map((c) => `
      <div class="conflict-item">
        <div class="conflict-icon">${c.tipo === 'docente' ? '👤' : '🏫'}</div>
        <div>
          <div class="conflict-when">${esc(DIAS_FULL[c.dia] || c.dia)} — ${esc(c.horario)}</div>
          <div>${esc(c.msg)}</div>
        </div>
      </div>`).join('');
}
