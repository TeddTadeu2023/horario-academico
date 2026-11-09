// ─────────────────────────────────────────
// ROTAS — cada tela tem o seu endereço (URL)
//   #/grade/<plano>      grade de um plano
//   #/resumo[/<docente>] resumo de todos os planos ou de um professor
//   #/cursos  #/docentes  #/salas  #/conflitos  #/usuarios  #/guia
// Recarregar (F5), voltar/avançar e compartilhar o link mantêm a mesma tela.
// ─────────────────────────────────────────

const ROTA_PAGINA = {
  grade: 'horario', resumo: 'horario',
  cursos: 'cursos', docentes: 'docentes', salas: 'salas',
  conflitos: 'conflitos', usuarios: 'usuarios', guia: 'guia',
};

let aplicandoRota = false;

function appVisivel() {
  return !$('appRoot').hidden;
}

function lerRota() {
  const partes = location.hash.replace(/^#\/?/, '').split('/').map((p) => {
    try { return decodeURIComponent(p); } catch { return ''; }
  });
  const nome = ROTA_PAGINA[partes[0]] ? partes[0] : 'grade';
  return { nome, param: partes[1] || '' };
}

function paginaAtiva() {
  return document.querySelector('.page.active')?.id.replace('page-', '') || 'horario';
}

// Endereço que corresponde ao que está na tela agora
function montarRota() {
  const pagina = paginaAtiva();
  if (pagina !== 'horario') return '#/' + pagina;
  if (modoGeral) {
    const doc = $('resumoDocente').value;
    return '#/resumo' + (doc ? '/' + encodeURIComponent(doc) : '');
  }
  return '#/grade' + (state.planoAtivoId ? '/' + encodeURIComponent(state.planoAtivoId) : '');
}

// Ação do usuário: cria uma entrada no histórico (o botão Voltar funciona)
function registrarRota() {
  if (aplicandoRota || !appVisivel()) return;
  const h = montarRota();
  if (location.hash !== h) location.hash = h;
}

// Ajuste automático (redirecionamento, plano excluído): troca o endereço sem criar histórico
function corrigirRota() {
  if (aplicandoRota || !appVisivel()) return;
  const h = montarRota();
  if (location.hash !== h) history.replaceState(null, '', h);
}

// Mostra a tela indicada pelo endereço
function aplicarRota() {
  if (!appVisivel()) return;
  const { nome, param } = lerRota();
  aplicandoRota = true;
  try {
    showPage(ROTA_PAGINA[nome]);
    if (paginaAtiva() === 'horario') {
      if (nome === 'grade' && param && param !== state.planoAtivoId
          && state.planos.some((p) => p.id === param)) {
        selecionarPlano(param);
      }
      const querResumo = nome === 'resumo';
      if (querResumo !== modoGeral) toggleGeral();
      if (querResumo) {
        const sel = $('resumoDocente');
        const doc = state.docentes.some((d) => d.id === param) ? param : '';
        if (sel.value !== doc) { sel.value = doc; renderViewGeral(); }
      }
    }
  } finally {
    aplicandoRota = false;
  }
  corrigirRota();
}

function bindRotas() {
  window.addEventListener('hashchange', aplicarRota);
}
