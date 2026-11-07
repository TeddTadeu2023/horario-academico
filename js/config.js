// ─────────────────────────────────────────
// CONFIGURAÇÃO / CONSTANTES
// ─────────────────────────────────────────

// ── Acesso ──
// Só e-mails deste domínio podem criar conta / entrar
const DOMINIO_PERMITIDO = 'anchieta.br';
// Contas que já nascem como Gestão (precisa haver ao menos uma para aprovar as demais).
// Se mudar esta lista, mude também em firestore.rules.
const ADMINS_INICIAIS = ['tedd.ribeiro@anchieta.br'];

const PAPEIS = {
  gestao:    { label: 'Gestão',    classe: 'badge-blue' },
  professor: { label: 'Professor', classe: 'badge-green' },
  pendente:  { label: 'Pendente',  classe: 'badge-yellow' },
  bloqueado: { label: 'Bloqueado', classe: 'badge-red' },
};

// Abas que o Professor não vê
const PAGINAS_SO_GESTAO = ['salas', 'usuarios'];

// Documento do Firestore com todo o planejamento
const DOC_DADOS = 'dados/planejamento';

// Chaves do localStorage das versões antigas (usadas só para migrar dados para o banco)
const STORAGE_KEY        = 'anchieta_horario_v5';
const STORAGE_KEY_TURNOS = 'anchieta_turnos_v2';

// Disciplinas frequentes para o autocomplete do cadastro de docentes
const DISCIPLINAS_COMUNS = [
  'Algoritmos', 'Banco de Dados', 'Cálculo I', 'Cálculo II', 'Circuitos Elétricos',
  'DevOps', 'Empreendedorismo', 'Engenharia de Software', 'Estrutura de Dados',
  'Física I', 'Física II', 'Inteligência Artificial', 'Java', 'JavaScript',
  'Lógica de Programação', 'Machine Learning', 'Matemática Discreta',
  'MongoDB / NoSQL', 'Orientação a Objetos', 'Programação em C',
  'Programação Web', 'Python', 'Redes de Computadores', 'Scrum / Ágil',
  'Segurança da Informação', 'Sistemas Operacionais', 'Transformadores',
  'UML / Modelagem', 'Álgebra Linear', 'Estatística', 'Gestão de Projetos',
  'Motores Elétricos', 'Filosofia', 'Sociologia', 'Português Instrumental',
];

// Paletas de cores
const CORES_CURSO = [
  '#003E7E', '#C8102E', '#0055A8', '#007A4D', '#F5A800',
  '#6A1FA2', '#00829B', '#C15A00', '#1A6E3A', '#8B3A00',
  '#004E89', '#7C0024',
];
const CORES_PLANO = [
  '#003E7E', '#C8102E', '#007A4D', '#6A1FA2', '#C15A00',
  '#00829B', '#1A6E3A', '#8B3A00', '#004E89', '#7C0024',
  '#0055A8', '#F5A800',
];

const TIPO_ICONE = {
  'Sala de Aula': '🏫', 'Laboratório': '💻', 'Oficina': '🔧',
  'Auditório': '🎭', 'Sala Maker': '⚡', 'Sala de Reunião': '🤝',
  'Quadra / Ginásio': '⚽', 'Biblioteca': '📖', 'Outro': '🏢',
};

const DIAS_FULL = {
  SEG: 'Segunda-feira', TER: 'Terça-feira', QUA: 'Quarta-feira',
  QUI: 'Quinta-feira', SEX: 'Sexta-feira', SAB: 'Sábado',
};
const DIAS_SHORT = {
  SEG: 'Seg', TER: 'Ter', QUA: 'Qua', QUI: 'Qui', SEX: 'Sex', SAB: 'Sáb',
};

// Horários padrão de cada turno ({ini, fim} por aula)
const TURNO_DEFAULTS = {
  manha: [
    { ini: '07:00', fim: '07:50' }, { ini: '07:50', fim: '08:40' },
    { ini: '08:40', fim: '09:30' }, { ini: '09:40', fim: '10:30' },
    { ini: '10:30', fim: '11:20' }, { ini: '11:20', fim: '12:10' },
  ],
  tarde: [
    { ini: '13:00', fim: '13:50' }, { ini: '13:50', fim: '14:40' },
    { ini: '14:40', fim: '15:30' }, { ini: '15:40', fim: '16:30' },
    { ini: '16:30', fim: '17:20' }, { ini: '17:20', fim: '18:10' },
  ],
  noite: [
    { ini: '19:10', fim: '20:00' }, { ini: '20:10', fim: '21:00' },
    { ini: '21:10', fim: '22:00' }, { ini: '22:10', fim: '23:00' },
  ],
};
const DURACAO_AULA_MIN = 50;

// Opções reutilizadas nos <select data-options="...">
const ANO_PADRAO = '2026';
const SELECT_OPTIONS = {
  semestres: ['1º Semestre', '2º Semestre'],
  anos: ['2024', '2025', '2026', '2027', '2028'],
  periodos: ['Matutino', 'Vespertino', 'Noturno', 'Integral', 'EaD'],
  periodosLetivos: ['1º e 2º', '3º e 4º', '5º e 6º', '7º e 8º', '9º e 10º'],
  tiposSala: Object.keys(TIPO_ICONE),
};
