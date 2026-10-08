import type { Cobertura } from '../tipos/Cardapio';

interface OptionGroup {
  name: string;
  count: number;
  min: number;
  max: number;
}

export function validateOptionGroups(groups: OptionGroup[]): string | undefined {
  for (const group of groups) {
    if (group.count < group.min) return `Selecione ${group.min} opção(ões) no grupo ${group.name} para continuar.`;
    if (group.count > group.max) return `O grupo ${group.name} permite no máximo ${group.max} opção(ões).`;
  }
  return undefined;
}

export const REGRAS_COBERTURA = Object.freeze({ min: 1, max: 3 });

export function initializeCoberturas(current: string[], available: Cobertura[], hasGroup: boolean): string[] {
  if (!hasGroup) return [];
  const active = available.filter(option => option.active !== false && option.id && option.name.trim());
  const valid = [...new Set(current)].filter(id => active.some(option => option.id === id)).slice(0, REGRAS_COBERTURA.max);
  return valid.length ? valid : active.slice(0, REGRAS_COBERTURA.min).map(option => option.id);
}

export function toggleGroupSelection(current: string[], id: string, rules: { min: number; max: number }): string[] {
  if (current.includes(id)) return current.length > rules.min ? current.filter(value => value !== id) : current;
  return current.length < rules.max ? [...current, id] : current;
}
