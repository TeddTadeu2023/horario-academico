// ─────────────────────────────────────────
// BANCO DE DADOS (Firebase / Firestore)
// ─────────────────────────────────────────

let fb = null;               // { auth, db, serverTimestamp, local }
let gravacaoTimer = null;
let cancelarDados = null;
let dadosCarregados = false;

function firebaseConfigurado() {
  return typeof FIREBASE_CONFIG === 'object'
    && FIREBASE_CONFIG.apiKey
    && !String(FIREBASE_CONFIG.apiKey).startsWith('COLE');
}

// Firebase real se configurado; senão, o banco local de teste (js/banco-local.js)
function initFirebase() {
  if (!firebaseConfigurado()) {
    fb = criarBancoLocal();
    return;
  }
  firebase.initializeApp(FIREBASE_CONFIG);
  fb = {
    local: false,
    auth: firebase.auth(),
    db: firebase.firestore(),
    serverTimestamp: () => firebase.firestore.FieldValue.serverTimestamp(),
  };
  fb.auth.languageCode = 'pt';
}

function setStatusSync(status) {
  const el = $('syncStatus');
  if (!el) return;
  const txt = {
    leitura:  '👁 somente leitura',
    salvando: '⏳ salvando…',
    salvo:    '✓ salvo',
    erro:     '⚠ erro ao salvar',
  };
  el.textContent = txt[status] || '';
  el.dataset.status = status;
}

// Agrupa várias alterações seguidas em uma única gravação
function agendarGravacao() {
  clearTimeout(gravacaoTimer);
  setStatusSync('salvando');
  gravacaoTimer = setTimeout(gravarAgora, 600);
}

async function gravarAgora() {
  clearTimeout(gravacaoTimer);
  gravacaoTimer = null;
  if (!podeEditar()) return;
  try {
    await fb.db.doc(DOC_DADOS).set({
      ...dadosParaSalvar(),
      atualizadoEm: fb.serverTimestamp(),
      atualizadoPor: usuarioAtual.email,
    });
    setStatusSync('salvo');
  } catch (e) {
    console.error(e);
    setStatusSync('erro');
    toast('Erro ao salvar no banco: ' + traduzErro(e), 'error');
  }
}

// Escuta o planejamento em tempo real
function assinarDados() {
  pararDados();
  dadosCarregados = false;
  cancelarDados = fb.db.doc(DOC_DADOS).onSnapshot((snap) => {
    // Ignora o "eco" das próprias gravações e não atropela edição ainda não enviada
    if (snap.metadata.hasPendingWrites || gravacaoTimer) return;

    const primeiraCarga = !dadosCarregados;
    dadosCarregados = true;
    state = normalizarEstado(snap.exists ? snap.data() : {}, state.planoAtivoId);
    aplicarTurnosDoEstado();
    renderTudo();
    setStatusSync(podeEditar() ? 'salvo' : 'leitura');

    if (primeiraCarga) {
      mostrarTela('app');
      if (!snap.exists) oferecerMigracaoLocal();
    }
  }, (e) => {
    console.error(e);
    toast('Sem permissão para ler os dados: ' + traduzErro(e), 'error');
  });
}

function pararDados() {
  if (cancelarDados) cancelarDados();
  cancelarDados = null;
  clearTimeout(gravacaoTimer);
  gravacaoTimer = null;
}

// Banco vazio + dados da versão antiga neste navegador → oferece enviar
function oferecerMigracaoLocal() {
  if (!podeEditar()) return;
  const local = lerDadosLocaisLegados();
  if (!local) return;
  const resumo = `${local.cursos.length} curso(s), ${local.docentes.length} docente(s), `
    + `${local.salas.length} sala(s) e ${local.planos.length} plano(s)`;
  if (!confirm(`O banco ainda está vazio, mas este navegador tem dados da versão anterior (${resumo}).\n\nDeseja enviá-los para o banco?`)) return;
  state = normalizarEstado(local);
  aplicarTurnosDoEstado();
  renderTudo();
  gravarAgora().then(() => toast('Dados enviados para o banco!'));
}

function traduzErro(e) {
  const code = e?.code || '';
  const msgs = {
    'auth/invalid-credential':      'E-mail ou senha incorretos.',
    'auth/invalid-login-credentials': 'E-mail ou senha incorretos.',
    'auth/wrong-password':          'E-mail ou senha incorretos.',
    'auth/user-not-found':          'E-mail ou senha incorretos.',
    'auth/email-already-in-use':    'Já existe uma conta com este e-mail. Use "Entrar" ou "Esqueci a senha".',
    'auth/weak-password':           'Senha fraca: use pelo menos 8 caracteres.',
    'auth/invalid-email':           'E-mail inválido.',
    'auth/too-many-requests':       'Muitas tentativas. Aguarde alguns minutos e tente de novo.',
    'auth/network-request-failed':  'Sem conexão com a internet.',
    'auth/operation-not-allowed':   'Login por e-mail/senha não está ativado no Firebase.',
    'permission-denied':            'sem permissão.',
    'unavailable':                  'serviço indisponível (verifique a conexão).',
  };
  return msgs[code] || e?.message || String(e);
}
