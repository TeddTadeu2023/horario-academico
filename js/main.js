// ─────────────────────────────────────────
// NAVEGAÇÃO + INICIALIZAÇÃO
// ─────────────────────────────────────────

function showPage(id) {
  // Páginas exclusivas da Gestão
  if (PAGINAS_SO_GESTAO.includes(id) && !podeEditar()) id = 'horario';
  document.querySelectorAll('.page').forEach((p) => p.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach((b) => b.classList.remove('active'));
  $('page-' + id).classList.add('active');
  $('nav-' + id).classList.add('active');
  if (id === 'cursos')    renderCursos();
  if (id === 'docentes')  renderDocentes();
  if (id === 'salas')     renderSalas();
  if (id === 'conflitos') { verificarConflitos(); renderConflitos(); }
  if (id === 'usuarios')  renderUsuarios();
  if (id === 'horario')   renderGrade();
}

// Re-renderiza tudo que depende do estado
function renderTudo() {
  populateCursoAtivo();
  verificarConflitos();
  renderPlanosTabs();
  renderGrade();
  renderCursos();
  renderDocentes();
  renderSalas();
  renderConflitos();
  if (modoGeral) { populateResumoDocente(); renderViewGeral(); }
  if (podeEditar() && $('page-usuarios').classList.contains('active')) renderUsuarios();
  corrigirRota();
}

function bindEventos() {
  // Navegação
  document.querySelectorAll('.nav-btn[data-page]').forEach((b) =>
    b.addEventListener('click', () => { showPage(b.dataset.page); registrarRota(); }));

  // Sidebar
  $('cursoAtivo').addEventListener('change', renderGrade);
  $('turnoSel').addEventListener('change', (e) => selecionarTurno(e.target.value));
  $('btnMenosAula').addEventListener('click', () => changeAulasTurno(-1));
  $('btnMaisAula').addEventListener('click', () => changeAulasTurno(+1));
  $('diasSemana').addEventListener('change', () => {
    renderGrade();
    if (modoGeral) renderViewGeral();
  });
  $('btnExportar').addEventListener('click', exportarJSON);
  $('inputImportar').addEventListener('change', importarJSON);
  $('btnLimpar').addEventListener('click', limparTudo);

  // Grade
  $('btnNovoPlano').addEventListener('click', () => openModalNovoPlano());
  $('btnAlocarAula').addEventListener('click', () => openModalAula(null, null));
  $('btnGeral').addEventListener('click', toggleGeral);
  $('resumoDocente').addEventListener('change', () => { renderViewGeral(); registrarRota(); });
  $('btnImprimir').addEventListener('click', () => window.print());

  // Cadastros
  $('btnNovoCurso').addEventListener('click', () => openModalCurso());
  $('btnNovoDocente').addEventListener('click', () => openModalDocente());
  $('btnNovaSala').addEventListener('click', () => openModalSala());
  $('btnReverificar').addEventListener('click', () => { verificarConflitos(); renderConflitos(); });

  // Modais
  $('btnSalvarCurso').addEventListener('click', salvarCurso);
  $('btnSalvarDocente').addEventListener('click', salvarDocente);
  $('btnSalvarSala').addEventListener('click', salvarSala);
  $('btnSalvarPlano').addEventListener('click', salvarPlano);
  $('planoCursoId').addEventListener('change', preencherDadosDoCurso);

  // Campo de disciplinas
  $('disciplinaInput').addEventListener('keydown', handleDisciplinaKey);
  $('disciplinaInput').addEventListener('input', showDisciplinaSuggestions);
  $('btnAddDisciplina').addEventListener('click', adicionarDisciplina);
  document.addEventListener('click', (e) => {
    if (!$('chipWrap').contains(e.target)) hideSuggestions();
  });

  initModais();
  initModalAula();
}

function init() {
  preencherSelects();
  bindEventos();
  bindAuth();
  bindRotas();
  buildHorariosFromEditor();

  try {
    initFirebase();
  } catch (e) {
    console.error(e);
    return mostrarTela('config');
  }
  if (fb.local) {
    $('avisoLocal').hidden = false;
    $('bannerLocal').hidden = false;
    $('btnApagarLocal').addEventListener('click', (e) => {
      e.preventDefault();
      if (confirm('Apagar TODAS as contas e dados do banco local deste navegador?')) fb.apagarTudo();
    });
  }
  mostrarTela('carregando');
  fb.auth.onAuthStateChanged(aoMudarAutenticacao);
}

init();
