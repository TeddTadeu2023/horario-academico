// ─────────────────────────────────────────
// EXPORTAR (backup) / IMPORTAR / LIMPAR — somente Gestão
// ─────────────────────────────────────────

function exportarJSON() {
  const blob = new Blob([JSON.stringify(dadosParaSalvar(), null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `anchieta-horario-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  toast('Arquivo exportado!');
}

function importarJSON(e) {
  const f = e.target.files[0];
  e.target.value = '';
  if (!f || !exigirGestao()) return;
  const r = new FileReader();
  r.onload = (ev) => {
    try {
      const data = JSON.parse(ev.target.result);
      if (data.cursos === undefined) { toast('Arquivo inválido', 'error'); return; }
      if (!confirm('Importar este arquivo vai SUBSTITUIR todo o planejamento no banco, para todos os usuários. Continuar?')) return;
      const turnosAtuais = state.turnos || clonarTurnos(TURNO_HORARIOS);
      state = normalizarEstado(data, state.planoAtivoId);
      if (!state.turnos) state.turnos = turnosAtuais;   // backups antigos não têm turnos
      aplicarTurnosDoEstado();
      renderTudo();
      gravarAgora();
      toast('Dados importados!');
    } catch {
      toast('Erro ao importar JSON', 'error');
    }
  };
  r.readAsText(f);
}

function limparTudo() {
  if (!exigirGestao()) return;
  if (!confirm('⚠️ Apagar TODO o planejamento do banco, para todos os usuários? Não é possível desfazer.\n\nDica: use "Exportar JSON" antes, como backup.')) return;
  const turnos = state.turnos;
  state = estadoVazio();
  state.turnos = turnos;
  renderTudo();
  gravarAgora();
  toast('Dados apagados.', 'warn');
}
