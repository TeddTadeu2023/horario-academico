// ─────────────────────────────────────────
// EXPORTAR / IMPORTAR / LIMPAR
// ─────────────────────────────────────────

function exportarJSON() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
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
  if (!f) return;
  const r = new FileReader();
  r.onload = (ev) => {
    try {
      const data = JSON.parse(ev.target.result);
      if (data.cursos === undefined) { toast('Arquivo inválido', 'error'); return; }
      state = normalizarEstado(data);
      save();
      renderTudo();
      toast('Dados importados!');
    } catch {
      toast('Erro ao importar JSON', 'error');
    }
  };
  r.readAsText(f);
  e.target.value = '';
}

function limparTudo() {
  if (!confirm('⚠️ Apagar TODOS os dados? Não é possível desfazer.')) return;
  state = estadoVazio();
  save();
  renderTudo();
  toast('Dados apagados.', 'warn');
}
