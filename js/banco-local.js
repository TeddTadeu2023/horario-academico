// ─────────────────────────────────────────
// BANCO LOCAL DE TESTE
// ─────────────────────────────────────────
// Usado automaticamente quando js/firebase-config.js ainda não foi preenchido.
// Imita a parte da API do Firebase usada pelo sistema, guardando tudo no
// localStorage deste navegador:
//   • contas e perfis (senha guardada como hash SHA-256)
//   • o planejamento (cursos, docentes, salas, planos, turnos)
// A sessão (quem está logado) fica no sessionStorage: cada aba pode ter um
// usuário diferente — ex.: Gestão numa aba e Professor em outra.
// ⚠ Serve apenas para testes: não há regras de segurança no servidor.

function criarBancoLocal() {
  const KEY = 'planejador_banco_local_v1';
  const SESSAO = 'planejador_sessao_local';
  const tick = (f) => setTimeout(f, 0);
  const clone = (x) => (x === undefined ? undefined : JSON.parse(JSON.stringify(x)));
  const colOf = (p) => p.split('/').slice(0, -1).join('/');
  const erro = (code) => Object.assign(new Error(code), { code });

  const ler = () => {
    try { return JSON.parse(localStorage.getItem(KEY)) || { store: {}, users: {} }; }
    catch { return { store: {}, users: {} }; }
  };
  let dados = ler();
  const gravar = () => localStorage.setItem(KEY, JSON.stringify(dados));

  async function hash(s) {
    if (window.crypto?.subtle) {
      const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
      return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
    }
    return 'h' + [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) | 0, 7);
  }

  // ── Auth ──
  const authCbs = [];
  let current = null;

  function mkUser(email) {
    const u = () => dados.users[email];
    return {
      uid: u().uid,
      email,
      emailVerified: true,                 // modo local: sem confirmação de e-mail
      get displayName() { return u()?.displayName || ''; },
      getIdToken: async () => 'local',
      reload: async () => {},
      updateProfile: async (p) => { u().displayName = p.displayName; gravar(); },
      sendEmailVerification: async () => {},
    };
  }
  const emitirAuth = () => authCbs.forEach((cb) => tick(() => cb(current)));
  const sessao = sessionStorage.getItem(SESSAO);
  if (sessao && dados.users[sessao]) current = mkUser(sessao);

  const auth = {
    languageCode: 'pt',
    get currentUser() { return current; },
    onAuthStateChanged(cb) { authCbs.push(cb); tick(() => cb(current)); },
    async signInWithEmailAndPassword(email, senha) {
      const u = dados.users[email];
      if (!u || u.senhaHash !== await hash(senha)) throw erro('auth/invalid-credential');
      sessionStorage.setItem(SESSAO, email);
      current = mkUser(email);
      emitirAuth();
    },
    async createUserWithEmailAndPassword(email, senha) {
      dados = ler();
      if (dados.users[email]) throw erro('auth/email-already-in-use');
      dados.users[email] = { uid: 'local-' + uid(), email, senhaHash: await hash(senha), displayName: '' };
      gravar();
      sessionStorage.setItem(SESSAO, email);
      current = mkUser(email);
      emitirAuth();
      return { user: current };
    },
    async signOut() {
      sessionStorage.removeItem(SESSAO);
      current = null;
      emitirAuth();
    },
    async sendPasswordResetEmail() {},     // modo local: nada é enviado
  };

  // ── "Firestore" ──
  const docL = {}, colL = {};
  const snapDoc = (p) => ({
    id: p.split('/').pop(),
    exists: p in dados.store,
    data: () => clone(dados.store[p]),
    metadata: { hasPendingWrites: false },
  });
  const snapCol = (c) => ({ docs: Object.keys(dados.store).filter((p) => colOf(p) === c).map(snapDoc) });
  const avisarDoc = (p) => (docL[p] || []).forEach((cb) => tick(() => cb(snapDoc(p))));
  const avisarCol = (c) => (colL[c] || []).forEach((cb) => tick(() => cb(snapCol(c))));
  function alterou(p) { gravar(); avisarDoc(p); avisarCol(colOf(p)); }

  const db = {
    doc(p) {
      return {
        async get() { return snapDoc(p); },
        async set(d) { dados = ler(); dados.store[p] = clone(d); alterou(p); },
        async update(d) {
          dados = ler();
          if (!(p in dados.store)) throw erro('not-found');
          dados.store[p] = { ...dados.store[p], ...clone(d) };
          alterou(p);
        },
        onSnapshot(cb) {
          (docL[p] ||= []).push(cb);
          tick(() => cb(snapDoc(p)));
          return () => { docL[p] = docL[p].filter((x) => x !== cb); };
        },
      };
    },
    collection(c) {
      return {
        onSnapshot(cb) {
          (colL[c] ||= []).push(cb);
          tick(() => cb(snapCol(c)));
          return () => { colL[c] = colL[c].filter((x) => x !== cb); };
        },
      };
    },
  };

  // Outra aba alterou o banco → atualiza esta aba em tempo real
  window.addEventListener('storage', (e) => {
    if (e.key !== KEY) return;
    dados = ler();
    Object.keys(docL).forEach(avisarDoc);
    Object.keys(colL).forEach(avisarCol);
  });

  return {
    local: true,
    auth,
    db,
    serverTimestamp: () => new Date().toISOString(),
    apagarTudo() {
      localStorage.removeItem(KEY);
      sessionStorage.removeItem(SESSAO);
      location.reload();
    },
  };
}
