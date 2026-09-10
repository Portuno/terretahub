export interface TrendTag {
  tag: string;
  count: number;
}

export const rankTrends = (
  tagLists: Array<string[] | null | undefined>,
  options?: { minCount?: number; limit?: number }
): TrendTag[] => {
  const minCount = options?.minCount ?? 2;
  const limit = options?.limit ?? 5;
  const counts = new Map<string, number>();

  for (const list of tagLists) {
    if (!list) {
      continue;
    }
    for (const raw of list) {
      const tag = typeof raw === 'string' ? raw.trim().toLowerCase() : '';
      if (!tag) {
        continue;
      }
      counts.set(tag, (counts.get(tag) || 0) + 1);
    }
  }

  return [...counts.entries()]
    .filter(([, count]) => count >= minCount)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'es'))
    .slice(0, limit)
    .map(([tag, count]) => ({ tag, count }));
};
