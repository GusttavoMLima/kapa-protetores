export function hojeBr(): string {
  const now = new Date();
  const dia = String(now.getDate()).padStart(2, '0');
  const mes = String(now.getMonth() + 1).padStart(2, '0');
  return `${dia}/${mes}/${now.getFullYear()}`;
}

export function formatarDataBr(data: string | Date): string {
  const date = typeof data === 'string' ? new Date(data) : data;
  if (isNaN(date.getTime())) return '';
  const dia = String(date.getDate()).padStart(2, '0');
  const mes = String(date.getMonth() + 1).padStart(2, '0');
  return `${dia}/${mes}/${date.getFullYear()}`;
}
