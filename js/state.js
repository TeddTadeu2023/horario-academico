// ─────────────────────────────────────────
// ESTADO DA APLICAÇÃO + PERSISTÊNCIA
// ─────────────────────────────────────────

function estadoVazio() {
  return {
    cursos: [], docentes: [], salas: [], conflitos: [],
    planos: [],        // [{id, cursoId, nome, semestre, ano, turma, periodo, cor, labelAba, desc, aulas:[]}]
    planoAtivoId: '',  // id do plano em foco
  };
}

let state = estadoVazio();

// Linhas da grade do turno ativo: [{label, value}]
let horarios = [];

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

// Garante consistência do estado (usado no load e no import)
function normalizarEstado(s) {
  const base = estadoVazio();
  const out = { ...base, ...s };
  ['cursos', 'docentes', 'salas', 'conflitos', 'planos'].forEach((k) => {
    if (!Array.isArray(out[k])) out[k] = [];
  });
  // Só ficam planos vinculados a um curso
  out.planos = out.planos.filter((p) => p.cursoId);
  out.planos.forEach((p) => { if (!Array.isArray(p.aulas)) p.aulas = []; });
  if (!out.planos.find((p) => p.id === out.planoAtivoId)) {
    out.planoAtivoId = out.planos.length ? out.planos[0].id : '';
  }
  return out;
}

function load() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try { state = JSON.parse(raw); } catch (e) { console.warn('Estado salvo inválido', e); }
  }
  state = normalizarEstado(state);
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
