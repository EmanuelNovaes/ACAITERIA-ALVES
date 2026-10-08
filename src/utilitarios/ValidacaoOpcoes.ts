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
