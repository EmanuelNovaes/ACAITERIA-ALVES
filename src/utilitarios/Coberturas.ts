export interface SelectedCobertura { id: string; name: string }

/** Compatibilidade com carrinhos e pedidos anteriores à seleção múltipla. */
export function getSelectedCoberturas(item: { coberturas?: unknown; cobertura?: string; detalhes?: Record<string, unknown> }): SelectedCobertura[] {
  const list = item.coberturas ?? item.detalhes?.coberturas;
  if (Array.isArray(list)) {
    const seen = new Set<string>();
    return list.filter((option): option is SelectedCobertura => {
      if (!option || typeof option.id !== 'string' || typeof option.name !== 'string' || !option.name.trim() || seen.has(option.id)) return false;
      seen.add(option.id);
      return true;
    });
  }
  return item.cobertura?.trim() ? [{ id: '', name: item.cobertura.trim() }] : [];
}
