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

export function initializeCobertura(current: string, available: Cobertura[], hasGroup: boolean): string {
  if (!hasGroup) return '';
  const active = available.filter(option => option.active !== false && option.id && option.name.trim());
  return active.some(option => option.id === current) ? current : active[0]?.id || '';
}

export function countSelectedOptions(complements: readonly unknown[], cobertura: string): number {
  return complements.length + (cobertura ? 1 : 0);
}

export function remainingComplementSlots(limit: number, cobertura: string): number {
  return Math.max(0, limit - countSelectedOptions([], cobertura));
}

export function toggleComplementSelection<T extends { id: string }>(current: T[], option: T, limit: number, cobertura: string): T[] {
  if (current.some(item => item.id === option.id)) return current.filter(item => item.id !== option.id);
  return countSelectedOptions(current, cobertura) < limit ? [...current, option] : current;
}
