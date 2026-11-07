# Planejador de Horários — UniAnchieta

Ferramenta web para coordenadores montarem a grade horária semanal de cursos,
com detecção automática de conflitos de **docente** e **sala** entre turmas.

> Versão Beta · Autor: Prof. Tedd Tadeu · Sugestões: tedd.ribeiro@anchieta.br

## Funcionalidades

- **Login** com e-mail institucional **@anchieta.br** (e-mail confirmado) e **níveis de acesso**:
  - **Gestão** — cadastra, edita e aprova usuários
  - **Professor** — apenas visualiza (não vê as abas Salas e Usuários)
  - Autocadastro fica **pendente** até a Gestão aprovar; a Gestão também pode bloquear
- Dados em **banco na nuvem** (Firebase Firestore): todos veem a mesma grade, em tempo real
- Cadastro de **salas/espaços**, **docentes** (com disciplinas em tags) e **cursos**
- **Turnos** (manhã, tarde, noite) com horário editável de cada aula
- **Planos de horário**: um por turma, exibidos em abas
- Alocação de aulas em vários horários de uma vez, com bloqueio de horários em conflito
- **Resumo** de todos os planos ou da grade completa de um professor, com impressão/PDF
- Exportação (backup) e importação dos dados em **JSON**
- Salvamento automático no banco

## Modo local de teste

Enquanto `js/firebase-config.js` não for preenchido, o sistema roda em **modo local**: basta abrir o
`index.html` no navegador. Contas e dados ficam salvos **apenas neste navegador** (`localStorage`),
não é preciso confirmar o e-mail e cada aba pode ter um usuário diferente (ex.: Gestão e Professor
lado a lado). O link **Apagar banco local**, na tela de login, zera tudo.

> Serve para testar e validar. Para uso real (professores em outros computadores e regras de
> segurança no servidor), configure o Firebase abaixo.

## Configuração do Firebase (uma vez só)

O login e o banco usam o [Firebase](https://console.firebase.google.com) (plano gratuito *Spark*).

1. **Criar o projeto:** console.firebase.google.com → *Adicionar projeto* (o Google Analytics pode ficar desativado).
2. **Ativar o login:** *Criação → Authentication → Vamos começar → Método de login* → ative **E-mail/senha**.
3. **Idioma dos e-mails:** *Authentication → Modelos* → mude o idioma para **Português (Brasil)**.
4. **Domínios autorizados:** *Authentication → Configurações → Domínios autorizados* → adicione
   `teddtadeu2023.github.io` (o `localhost` já vem incluído).
5. **Criar o banco:** *Criação → Firestore Database → Criar banco de dados* → modo **produção**,
   local **southamerica-east1 (São Paulo)**.
6. **Regras de segurança:** *Firestore → Regras* → apague o conteúdo, cole o arquivo
   [`firestore.rules`](firestore.rules) e clique em **Publicar**.
7. **Ligar o site ao projeto:** *⚙ Configurações do projeto → Geral → Seus apps* → ícone **`</>`** (Web) →
   registre o app → copie os valores de `firebaseConfig` para [`js/firebase-config.js`](js/firebase-config.js).
8. **Primeiro acesso:** crie a conta com **tedd.ribeiro@anchieta.br**: ela já nasce como **Gestão**
   (lista em `ADMINS_INICIAIS` no `js/config.js` e em `firestore.rules` — se mudar uma, mude a outra).

## Como usar

O site precisa ser aberto por **http(s)** (não funciona clicando duas vezes no `index.html`):

- **Publicado:** GitHub Pages (veja abaixo) — é o endereço que os professores vão usar.
- **No seu computador:** VS Code → extensão **Live Server** → botão *Go Live*.

Ordem recomendada: **Salas → Docentes → Cursos → Turno → Novo Plano → Alocar Aulas → Revisar**.
O passo a passo completo está na aba **✦ Guia** dentro do sistema.

> **Migração:** se este navegador tiver dados da versão antiga (sem login), ao entrar como Gestão
> com o banco ainda vazio o sistema oferece enviá-los para o banco.

## Estrutura do projeto

```
horario-academico/
├── index.html              # Estrutura da página (login, header, sidebar, páginas, modais)
├── firestore.rules         # Regras de segurança do banco (colar no Console do Firebase)
├── css/
│   └── styles.css          # Estilos e identidade visual
├── assets/
│   └── img/
│       └── logo-unianchieta.jpg
└── js/                     # Carregados nesta ordem pelo index.html
    ├── firebase-config.js  # Chaves do projeto Firebase (preencher)
    ├── config.js           # Constantes: domínio, admins, cores, dias, turnos padrão
    ├── utils.js            # Helpers: uid, esc, toast, modais, seletor de cor
    ├── state.js            # Estado global
    ├── banco-local.js      # Banco local de teste (usado se o Firebase não estiver configurado)
    ├── db.js               # Leitura/gravação no Firestore (tempo real)
    ├── auth.js             # Login, cadastro, verificação de e-mail, níveis de acesso
    ├── usuarios.js         # Aba Usuários: aprovar / alterar nível / bloquear
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
