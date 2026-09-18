/** Geração de identificadores locais (sem dependência de backend). */
export function createId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 10);
  const extra = Math.random().toString(36).slice(2, 6);
  return `prd_${timestamp}${random}${extra}`;
}
