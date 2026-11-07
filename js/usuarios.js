// ─────────────────────────────────────────
// USUÁRIOS — aprovação e níveis de acesso (somente Gestão)
// ─────────────────────────────────────────

let usuarios = [];
let cancelarUsuarios = null;

function assinarUsuarios() {
  if (cancelarUsuarios) return;
  cancelarUsuarios = fb.db.collection('usuarios').onSnapshot((snap) => {
    usuarios = snap.docs.map((d) => ({ uid: d.id, ...d.data() }));
    atualizarBadgePendentes();
    if ($('page-usuarios').classList.contains('active')) renderUsuarios();
  }, (e) => {
    console.error(e);
    toast('Erro ao carregar usuários: ' + traduzErro(e), 'error');
  });
}

function pararUsuarios() {
  if (cancelarUsuarios) cancelarUsuarios();
  cancelarUsuarios = null;
  usuarios = [];
  atualizarBadgePendentes();
}

function atualizarBadgePendentes() {
  const n = usuarios.filter((u) => u.papel === 'pendente').length;
  const b = $('badgePendentes');
  b.hidden = !n;
  b.textContent = n;
}

async function alterarPapel(uid, papel) {
  if (!exigirGestao()) return;
  if (uid === usuarioAtual.uid) { toast('Você não pode alterar o seu próprio nível.', 'warn'); return; }
  const u = usuarios.find((x) => x.uid === uid);
  if (papel === 'bloqueado' && !confirm(`Bloquear o acesso de ${u?.nome || u?.email}?`)) return;
  try {
    await fb.db.doc('usuarios/' + uid).update({ papel });
    toast(`${u?.nome || 'Usuário'}: ${PAPEIS[papel].label}`);
  } catch (e) {
    toast('Erro ao alterar: ' + traduzErro(e), 'error');
  }
}

function usuarioRowHTML(u) {
  const pap = PAPEIS[u.papel] || PAPEIS.pendente;
  const eu = u.uid === usuarioAtual?.uid;
  let acoes;
  if (eu) {
    acoes = '<span class="badge badge-gray">você</span>';
  } else if (u.papel === 'pendente') {
    acoes = `
      <button class="btn btn-primary btn-sm" onclick="alterarPapel('${esc(u.uid)}','professor')">✔ Aprovar como Professor</button>
      <button class="btn btn-ghost btn-sm" onclick="alterarPapel('${esc(u.uid)}','gestao')">Aprovar como Gestão</button>
      <button class="btn btn-danger" title="Recusar / bloquear" onclick="alterarPapel('${esc(u.uid)}','bloqueado')">✕ Recusar</button>`;
  } else {
    acoes = `
      <select class="papel-select" onchange="alterarPapel('${esc(u.uid)}', this.value)">
        ${['professor', 'gestao', 'bloqueado'].map((p) =>
          `<option value="${p}" ${p === u.papel ? 'selected' : ''}>${PAPEIS[p].label}</option>`).join('')}
      </select>`;
  }
  return `
    <div class="list-item">
      <div class="list-item-info">
        <div class="list-item-name">${esc(u.nome || '—')} <span class="badge ${pap.classe}">${pap.label}</span></div>
        <div class="list-item-sub">${esc(u.email)}</div>
      </div>
      <div class="list-item-actions">${acoes}</div>
    </div>`;
}

function renderUsuarios() {
  const el = $('listaUsuarios');
  if (!usuarios.length) {
    el.innerHTML = '<div class="empty"><div class="empty-icon">🔐</div><div class="empty-text">Nenhum usuário encontrado</div></div>';
    return;
  }
  const porNome = (a, b) => String(a.nome || a.email).localeCompare(String(b.nome || b.email), 'pt-BR');
  const pend = usuarios.filter((u) => u.papel === 'pendente').sort(porNome);
  const ativos = usuarios.filter((u) => u.papel === 'gestao' || u.papel === 'professor').sort(porNome);
  const bloq = usuarios.filter((u) => u.papel === 'bloqueado').sort(porNome);

  const secao = (titulo, lista, vazio) => `
    <div class="section-label" style="margin-top:18px;">${titulo} (${lista.length})</div>
    ${lista.length ? lista.map(usuarioRowHTML).join('') : `<div class="list-item-sub" style="padding:6px 2px;">${vazio}</div>`}`;

  el.innerHTML =
      secao('⏳ Aguardando aprovação', pend, 'Nenhum cadastro pendente.')
    + secao('✅ Com acesso', ativos, '—')
    + (bloq.length ? secao('⛔ Bloqueados', bloq, '') : '');
}
