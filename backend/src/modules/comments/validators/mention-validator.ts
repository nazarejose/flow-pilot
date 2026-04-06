export function extractMentions(text: string): string[] {
  const matches = text.match(/@([a-zA-Z0-9_]+)/g);
  if (!matches) return [];
  return [...new Set(matches.map(m => m.slice(1)))];
}
