// ─────────────────────────────────────────
// AUTENTICAÇÃO E NÍVEIS DE ACESSO
// ─────────────────────────────────────────

let usuarioAtual = null;     // { uid, email, nome, papel }
let cancelarPerfil = null;

function normalizarEmail(email) {
  return String(email || '').trim().toLowerCase();
}
function emailPermitido(email) {
  return normalizarEmail(email).endsWith('@' + DOMINIO_PERMITIDO);
}
function ehAdminInicial(email) {
  return ADMINS_INICIAIS.includes(normalizarEmail(email));
}
function podeEditar() {
  return usuarioAtual?.papel === 'gestao';
}
function exigirGestao() {
  if (podeEditar()) return true;
  toast('Somente a Gestão pode alterar dados.', 'warn');
  return false;
}

// ── Telas: carregando | login | cadastro | recuperar | verificar | pendente | bloqueado | config | app ──
function mostrarTela(nome) {
  const app = nome === 'app';
  $('appRoot').hidden = !app;
  $('telaAuth').hidden = app;
  document.querySelectorAll('#telaAuth [data-tela]').forEach((el) => {
    el.hidden = el.dataset.tela !== nome;
  });
  $('authTabs').hidden = !['login', 'cadastro', 'recuperar'].includes(nome);
  ['login', 'cadastro'].forEach((t) => $('tab-' + t).classList.toggle('active', t === nome));
  limparMsgAuth();
}

function msgAuth(texto, tipo = 'danger') {
  const el = $('authMsg');
  el.className = `alert alert-${tipo} auth-msg`;
  el.textContent = texto;
  el.hidden = false;
}
function limparMsgAuth() {
  $('authMsg').hidden = true;
}

async function comBotao(btn, fn) {
  const txt = btn.textContent;
  btn.disabled = true;
  btn.textContent = 'Aguarde…';
  try { await fn(); } finally { btn.disabled = false; btn.textContent = txt; }
}

// ── Ações dos formulários ──
async function entrar(e) {
  e.preventDefault();
  const email = normalizarEmail($('loginEmail').value);
  const senha = $('loginSenha').value;
  if (!emailPermitido(email)) return msgAuth(`Use seu e-mail institucional @${DOMINIO_PERMITIDO}.`);
  await comBotao($('btnEntrar'), async () => {
    try {
      await fb.auth.signInWithEmailAndPassword(email, senha);
    } catch (err) {
      msgAuth(traduzErro(err));
    }
  });
}

async function cadastrar(e) {
  e.preventDefault();
  const nome  = $('cadNome').value.trim();
  const email = normalizarEmail($('cadEmail').value);
  const senha = $('cadSenha').value;
  const conf  = $('cadSenha2').value;
  if (!nome) return msgAuth('Informe seu nome.');
  if (!emailPermitido(email)) return msgAuth(`Apenas e-mails @${DOMINIO_PERMITIDO} podem se cadastrar.`);
  if (senha.length < 8) return msgAuth('A senha precisa ter pelo menos 8 caracteres.');
  if (senha !== conf) return msgAuth('As senhas não conferem.');

  await comBotao($('btnCadastrar'), async () => {
    try {
      const cred = await fb.auth.createUserWithEmailAndPassword(email, senha);
      await cred.user.updateProfile({ displayName: nome });
      await criarPerfil(cred.user, nome);
      if (!cred.user.emailVerified) {
        await cred.user.sendEmailVerification();
        mostrarTelaVerificar(cred.user);
        msgAuth('Conta criada! Enviamos um link de confirmação para o seu e-mail.', 'success');
      }
      // Modo local: e-mail já conta como confirmado → segue direto (aoMudarAutenticacao)
    } catch (err) {
      msgAuth(traduzErro(err));
    }
  });
}

async function recuperarSenha(e) {
  e.preventDefault();
  const email = normalizarEmail($('recEmail').value);
  if (!emailPermitido(email)) return msgAuth(`Informe seu e-mail @${DOMINIO_PERMITIDO}.`);
  await comBotao($('btnRecuperar'), async () => {
    try {
      await fb.auth.sendPasswordResetEmail(email);
    } catch (err) {
      // Não revela se o e-mail existe ou não
      if (err?.code !== 'auth/user-not-found') return msgAuth(traduzErro(err));
    }
    msgAuth('Se houver uma conta com este e-mail, você receberá um link para criar uma nova senha.', 'success');
  });
}

async function reenviarVerificacao() {
  await comBotao($('btnReenviar'), async () => {
    try {
      await fb.auth.currentUser.sendEmailVerification();
      msgAuth('E-mail de confirmação reenviado. Confira também a caixa de spam.', 'success');
    } catch (err) {
      msgAuth(traduzErro(err));
    }
  });
}

async function jaConfirmei() {
  await comBotao($('btnJaConfirmei'), async () => {
    const user = fb.auth.currentUser;
    if (!user) return mostrarTela('login');
    await user.reload();
    if (fb.auth.currentUser.emailVerified) aoMudarAutenticacao(fb.auth.currentUser);
    else msgAuth('Ainda não identificamos a confirmação. Clique no link enviado ao seu e-mail.', 'warn');
  });
}

function sair() {
  pararTudo();
  fb.auth.signOut();
}

function pararTudo() {
  pararDados();
  pararUsuarios();
  if (cancelarPerfil) cancelarPerfil();
  cancelarPerfil = null;
}

function mostrarTelaVerificar(user) {
  $('verificarEmail').textContent = user.email;
  mostrarTela('verificar');
}

// ── Perfil no Firestore (usuarios/{uid}) ──
function criarPerfil(user, nome) {
  return fb.db.doc('usuarios/' + user.uid).set({
    nome: String(nome || user.displayName || user.email).slice(0, 120),
    email: user.email,
    papel: ehAdminInicial(user.email) ? 'gestao' : 'pendente',
    criadoEm: fb.serverTimestamp(),
  });
}

// ── Fluxo principal após login/logout ──
async function aoMudarAutenticacao(user) {
  pararTudo();
  usuarioAtual = null;

  if (!user) return mostrarTela('login');

  if (!emailPermitido(user.email)) {
    await fb.auth.signOut();
    mostrarTela('login');
    return msgAuth(`Apenas e-mails @${DOMINIO_PERMITIDO} têm acesso.`);
  }
  if (!user.emailVerified) return mostrarTelaVerificar(user);

  mostrarTela('carregando');
  const ref = fb.db.doc('usuarios/' + user.uid);
  try {
    await user.getIdToken(true);   // atualiza o token (email_verified) usado pelas regras
    const snap = await ref.get();
    if (!snap.exists) await criarPerfil(user, user.displayName);
  } catch (err) {
    console.error(err);
    mostrarTela('login');
    return msgAuth('Não foi possível carregar seu perfil: ' + traduzErro(err));
  }

  // Escuta o próprio perfil: aprovação/bloqueio têm efeito imediato
  cancelarPerfil = ref.onSnapshot((snap) => {
    const p = snap.data();
    if (!p) return;
    const papelAnterior = usuarioAtual?.papel;
    usuarioAtual = {
      uid: user.uid,
      email: user.email,
      nome: p.nome || user.displayName || user.email,
      papel: p.papel,
    };
    if (papelAnterior === usuarioAtual.papel) return;

    if (p.papel === 'pendente' || p.papel === 'bloqueado') {
      pararDados();
      pararUsuarios();
      $('pendenteEmail').textContent = user.email;
      return mostrarTela(p.papel);
    }
    aplicarPapel();
    if (!papelAnterior || papelAnterior === 'pendente' || papelAnterior === 'bloqueado') {
      mostrarTela('carregando');
      assinarDados();
    } else {
      renderTudo();   // mudou entre Professor ↔ Gestão
    }
  }, (err) => {
    console.error(err);
    msgAuth('Erro ao ler seu perfil: ' + traduzErro(err));
  });
}

// Ajusta a interface ao nível de acesso
function aplicarPapel() {
  const gestao = podeEditar();
  document.body.classList.toggle('modo-leitura', !gestao);
  $('userNome').textContent = usuarioAtual.nome;
  $('userEmail').textContent = usuarioAtual.email;
  const pap = PAPEIS[usuarioAtual.papel] || PAPEIS.pendente;
  $('userPapel').textContent = pap.label;
  $('userPapel').className = 'badge ' + pap.classe;
  setStatusSync(gestao ? 'salvo' : 'leitura');

  if (gestao) assinarUsuarios();
  else pararUsuarios();
  renderAulasEditor();
  // Mudou o nível com o app aberto: reabre a tela do endereço (Professor sai das abas da Gestão)
  aplicarRota();
}

function bindAuth() {
  $('formLogin').addEventListener('submit', entrar);
  $('formCadastro').addEventListener('submit', cadastrar);
  $('formRecuperar').addEventListener('submit', recuperarSenha);
  $('btnReenviar').addEventListener('click', reenviarVerificacao);
  $('btnJaConfirmei').addEventListener('click', jaConfirmei);
  document.querySelectorAll('[data-ir]').forEach((el) =>
    el.addEventListener('click', (e) => { e.preventDefault(); mostrarTela(el.dataset.ir); }));
  document.querySelectorAll('[data-sair]').forEach((el) => el.addEventListener('click', sair));
}
