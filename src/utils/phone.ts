export const normalizePhone = (value: string) => {
  let digits = value.replace(/\D/g, '');
  if ((digits.length === 12 || digits.length === 13) && digits.startsWith('55')) digits = digits.slice(2);
  return digits.slice(0, 11);
};

export const formatBrazilPhone = (value: string) => {
  const digits = normalizePhone(value);
  if (!digits) return '';
  if (digits.length <= 2) return `(${digits}`;
  const ddd = digits.slice(0, 2);
  const rest = digits.slice(2);
  if (rest.length <= 4) return `(${ddd}) ${rest}`;
  if (rest.length <= 8) return `(${ddd}) ${rest.slice(0, 4)}-${rest.slice(4)}`;
  return `(${ddd}) ${rest.slice(0, 5)}-${rest.slice(5, 9)}`;
};

export const isValidBrazilPhone = (value: string) => {
  const digits = normalizePhone(value);
  return digits.length === 10 || digits.length === 11;
};
