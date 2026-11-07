# Planejador de Horários — UniAnchieta

Ferramenta web para coordenadores montarem a grade horária semanal de cursos,
com detecção automática de conflitos de **docente** e **sala** entre turmas.

> Versão Beta · Autor: Prof. Tedd Tadeu · Sugestões: tedd.ribeiro@anchieta.br

## Funcionalidades

- Cadastro de **salas/espaços**, **docentes** (com disciplinas em tags) e **cursos**
- **Turnos** (manhã, tarde, noite) com horário editável de cada aula
- **Planos de horário**: um por turma, exibidos em abas
- Alocação de aulas em vários horários de uma vez, com bloqueio de horários em conflito
- **Resumo** de todos os planos ou da grade completa de um professor, com impressão/PDF
- Exportação e importação dos dados em **JSON**
- Salvamento automático no navegador (`localStorage`)

## Como usar

Não precisa de instalação nem de servidor: basta abrir o `index.html` no navegador.

Ordem recomendada: **Salas → Docentes → Cursos → Turno → Novo Plano → Alocar Aulas → Revisar**.
O passo a passo completo está na aba **✦ Guia** dentro do sistema.

> Os dados ficam salvos no navegador. Use **⬇ Exportar JSON** para fazer backup
> ou levar o planejamento para outro computador.

## Estrutura do projeto

```
horario-academico/
├── index.html              # Estrutura da página (header, sidebar, páginas, modais)
├── css/
│   └── styles.css          # Estilos e identidade visual
├── assets/
│   └── img/
│       └── logo-unianchieta.jpg
└── js/                     # Carregados nesta ordem pelo index.html
    ├── config.js           # Constantes: cores, dias, turnos padrão, opções de selects
    ├── utils.js            # Helpers: uid, esc, toast, modais, seletor de cor
    ├── state.js            # Estado global e persistência (localStorage)
    ├── turnos.js           # Editor de horários por turno
    ├── conflitos.js        # Detecção e listagem de conflitos
    ├── planos.js           # Planos de horário (abas)
    ├── cursos.js           # CRUD de cursos
    ├── docentes.js         # CRUD de docentes + campo de disciplinas
    ├── salas.js            # CRUD de salas
    ├── aulas.js            # Modal de alocação de aulas
    ├── grade.js            # Grade semanal, estatísticas e progresso
    ├── resumo.js           # Visão Resumo (macro e por professor)
    ├── dados.js            # Exportar / importar / limpar
    └── main.js             # Navegação, eventos e inicialização
```

## Publicar no GitHub Pages

1. No repositório, abra **Settings → Pages**
2. Em *Source*, escolha a branch `main` e a pasta `/ (root)`
3. O sistema ficará disponível em `https://<usuario>.github.io/<repositorio>/`
