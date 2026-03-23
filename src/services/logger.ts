export function logDebug(label: string, payload: unknown): void {
  console.debug(`[ai-recsys] ${label}`, payload);
}
