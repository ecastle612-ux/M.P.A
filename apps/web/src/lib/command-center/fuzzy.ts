export function fuzzyScore(query: string, target: string): number {
  const normalizedQuery = query.trim().toLowerCase();
  const normalizedTarget = target.trim().toLowerCase();

  if (!normalizedQuery) {
    return 1;
  }

  if (normalizedTarget === normalizedQuery) {
    return 100;
  }

  if (normalizedTarget.startsWith(normalizedQuery)) {
    return 90 + Math.min(9, normalizedQuery.length);
  }

  if (normalizedTarget.includes(normalizedQuery)) {
    return 70 + Math.min(19, normalizedQuery.length);
  }

  let queryIndex = 0;
  let score = 0;
  let consecutive = 0;
  let previousMatchIndex = -1;

  for (let index = 0; index < normalizedTarget.length && queryIndex < normalizedQuery.length; index += 1) {
    if (normalizedTarget[index] === normalizedQuery[queryIndex]) {
      score += 8;
      consecutive += 1;
      if (consecutive > 1) {
        score += 4;
      }
      if (index === 0 || normalizedTarget[index - 1] === " " || normalizedTarget[index - 1] === "-") {
        score += 6;
      }
      if (previousMatchIndex >= 0 && index - previousMatchIndex === 1) {
        score += 3;
      }
      previousMatchIndex = index;
      queryIndex += 1;
    } else {
      consecutive = 0;
    }
  }

  if (queryIndex < normalizedQuery.length) {
    return 0;
  }

  return Math.min(69, score);
}

export function fuzzyFilter<T>(
  query: string,
  items: T[],
  getSearchableText: (item: T) => string[],
  limit = 8
): Array<{ item: T; score: number }> {
  if (!query.trim()) {
    return items.slice(0, limit).map((item) => ({ item, score: 1 }));
  }

  return items
    .flatMap((item) => {
      const fields = getSearchableText(item);
      const score = Math.max(...fields.map((field) => fuzzyScore(query, field)), 0);
      return score > 0 ? [{ item, score }] : [];
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
