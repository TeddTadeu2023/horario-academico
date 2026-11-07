// ─────────────────────────────────────────
// ESTADO DA APLICAÇÃO
// ─────────────────────────────────────────
// O banco (Firestore, documento DOC_DADOS) é a fonte da verdade.
// `planoAtivoId` e `conflitos` são locais: não vão para o banco.

function estadoVazio() {
  return {
    cursos: [], docentes: [], salas: [],
    planos: [],        // [{id, cursoId, nome, semestre, ano, turma, periodo, cor, labelAba, desc, aulas:[]}]
    turnos: null,      // {manha:[{ini,fim}], tarde:[...], noite:[...]}
    conflitos: [],     // calculado (verificarConflitos)
    planoAtivoId: '',  // aba em foco nesta tela
  };
}

let state = estadoVazio();

// Linhas da grade do turno ativo: [{label, value}]
let horarios = [];

// Grava no banco (só a Gestão; as regras do Firestore também bloqueiam os demais)
function save() {
  if (podeEditar()) agendarGravacao();
}

// Parte do estado que é persistida
function dadosParaSalvar() {
  const { cursos, docentes, salas, planos, turnos } = state;
  // JSON round-trip remove `undefined`, que o Firestore não aceita
  return JSON.parse(JSON.stringify({ cursos, docentes, salas, planos, turnos }));
}

// Garante consistência (usado ao receber do banco e ao importar JSON)
function normalizarEstado(s, planoAtivoId = '') {
  const out = estadoVazio();
  ['cursos', 'docentes', 'salas', 'planos'].forEach((k) => {
    if (Array.isArray(s?.[k])) out[k] = s[k];
  });
  if (s?.turnos && typeof s.turnos === 'object') out.turnos = s.turnos;
  // Só ficam planos vinculados a um curso
  out.planos = out.planos.filter((p) => p && p.cursoId);
  out.planos.forEach((p) => { if (!Array.isArray(p.aulas)) p.aulas = []; });
  out.planoAtivoId = out.planos.find((p) => p.id === planoAtivoId)
    ? planoAtivoId
    : (out.planos[0]?.id || '');
  return out;
}

// Dados salvos no navegador pela versão antiga (sem login) — para migração
function lerDadosLocaisLegados() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = normalizarEstado(JSON.parse(raw));
    const turnos = JSON.parse(localStorage.getItem(STORAGE_KEY_TURNOS) || 'null');
    if (turnos) data.turnos = turnos;
    const vazio = !data.cursos.length && !data.docentes.length && !data.salas.length && !data.planos.length;
    return vazio ? null : data;
  } catch (e) {
    return null;
  }
}

// Plano ativo (objeto)
function planoAtivo() {
  return state.planos.find((p) => p.id === state.planoAtivoId) || state.planos[0];
}

// Todas as aulas de todos os planos (para verificação global de conflitos)
function todasAulas() {
  return state.planos.flatMap((p) =>
    p.aulas.map((a) => ({ ...a, _planoId: p.id, _planoNome: p.nome })));
}

function getDiasAtivos() {
  return [...document.querySelectorAll('#diasSemana input[type=checkbox]:checked')].map((c) => c.value);
}
