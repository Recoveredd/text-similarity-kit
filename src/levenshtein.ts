import { normalizeText } from "./normalize.js";
import type { TextNormalizationOptions } from "./types.js";

export function levenshteinDistance(left: string, right: string, options: TextNormalizationOptions = {}): number {
  const leftChars = Array.from(normalizeText(left, options));
  const rightChars = Array.from(normalizeText(right, options));

  if (leftChars.length === 0) {
    return rightChars.length;
  }

  if (rightChars.length === 0) {
    return leftChars.length;
  }

  let previousRow = Array.from({ length: rightChars.length + 1 }, (_, index) => index);

  for (let leftIndex = 0; leftIndex < leftChars.length; leftIndex += 1) {
    const currentRow = [leftIndex + 1];

    for (let rightIndex = 0; rightIndex < rightChars.length; rightIndex += 1) {
      const cost = leftChars[leftIndex] === rightChars[rightIndex] ? 0 : 1;
      const insertion = (currentRow[rightIndex] ?? 0) + 1;
      const deletion = (previousRow[rightIndex + 1] ?? 0) + 1;
      const substitution = (previousRow[rightIndex] ?? 0) + cost;

      currentRow.push(Math.min(insertion, deletion, substitution));
    }

    previousRow = currentRow;
  }

  return previousRow[rightChars.length] ?? 0;
}

export function levenshteinSimilarity(left: string, right: string, options: TextNormalizationOptions = {}): number {
  const normalizedLeft = normalizeText(left, options);
  const normalizedRight = normalizeText(right, options);
  const longestLength = Math.max(Array.from(normalizedLeft).length, Array.from(normalizedRight).length);

  if (longestLength === 0) {
    return 1;
  }

  return 1 - levenshteinDistance(normalizedLeft, normalizedRight, {
    ...options,
    caseSensitive: true,
    trim: false,
    normalizeWhitespace: false,
    stripDiacritics: false
  }) / longestLength;
}
