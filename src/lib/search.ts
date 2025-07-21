interface SearchableItem {
  [key: string]: string;
}

interface ScoredItem<T> {
  item: T;
  score: number;
}

export function searchWithScoring<T extends SearchableItem>(
  items: T[],
  query: string
): T[] {
  // Return all items if query is empty or just whitespace
  const trimmedQuery = query.trim().toLowerCase();
  if (!trimmedQuery) {
    return items;
  }

  const scoredItems: ScoredItem<T>[] = [];

  for (const item of items) {
    const score = calculateItemScore(item, trimmedQuery);
    if (score > 0) {
      scoredItems.push({ item, score });
    }
  }

  // Sort by score descending, then by ID ascending for ties
  scoredItems.sort((a, b) => {
    if (a.score !== b.score) {
      return b.score - a.score; // Higher scores first
    }
    // Tie breaker: sort by ID ascending
    const idA = parseInt(a.item.id) || 0;
    const idB = parseInt(b.item.id) || 0;
    return idA - idB;
  });

  return scoredItems.map(scored => scored.item);
}

function calculateItemScore<T extends SearchableItem>(
  item: T,
  query: string
): number {
  let score = 0;

  // Primary fields - high value matches
  const displayName = (item['Display Name'] || '').toLowerCase();
  const codeName = (item['code name'] || '').toLowerCase();
  
  // Exact matches (highest priority)
  if (displayName === query || codeName === query) {
    score += 1000;
  }
  // Starts with query (second highest)
  else if (displayName.startsWith(query) || codeName.startsWith(query)) {
    score += 500;
  }
  // Contains query in name fields (third highest)
  else if (displayName.includes(query) || codeName.includes(query)) {
    score += 100;
  }

  // Secondary fields - medium value matches
  const aliases = (item['Aliases'] || '').toLowerCase();
  const shortDescription = (item['Short Description'] || '').toLowerCase();
  
  if (aliases.includes(query)) {
    score += 50;
  }
  if (shortDescription.includes(query)) {
    score += 25;
  }

  // Tertiary fields - low value matches (fallback search)
  const searchableFields = [
    'Long Description',
    'Benefits',
    'Parent Skills',
    'Child Techniques',
    'Alternatives',
    'Sub-techniques',
    'Tools',
    'Written Guide - Intro',
    'Written Guide - Health Routine',
    'Written Guide - Target Audience',
    'Written Guide - Issues',
    'Written Guide - Setup',
    'Written Guide - Walkthrough',
    'Written Guide - Tips and Tricks'
  ];

  for (const field of searchableFields) {
    const fieldValue = (item[field] || '').toLowerCase();
    if (fieldValue.includes(query)) {
      score += 10;
    }
  }

  return score;
}