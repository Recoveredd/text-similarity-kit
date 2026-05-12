import { normalizeText } from "./normalize.js";
import type { TextNormalizationOptions } from "./types.js";

export function getBigrams(input: string, options: TextNormalizationOptions = {}): string[] {
  const value = normalizeText(input, options);
  const chars = Array.from(value);

  if (chars.length === 0) {
    return [];
  }

  if (chars.length === 1) {
    return [value];
  }

  const bigrams: string[] = [];

  for (let index = 0; index < chars.length - 1; index += 1) {
    bigrams.push(`${chars[index] ?? ""}${chars[index + 1] ?? ""}`);
  }

  return bigrams;
}

export function diceCoefficient(left: string, right: string, options: TextNormalizationOptions = {}): number {
  const normalizedLeft = normalizeText(left, options);
  const normalizedRight = normalizeText(right, options);

  if (normalizedLeft === normalizedRight) {
    return 1;
  }

  if (normalizedLeft.length === 0 || normalizedRight.length === 0) {
    return 0;
  }

  const leftBigrams = getBigrams(normalizedLeft, {
    ...options,
    caseSensitive: true,
    trim: false,
    normalizeWhitespace: false,
    stripDiacritics: false
  });
  const rightBigrams = getBigrams(normalizedRight, {
    ...options,
    caseSensitive: true,
    trim: false,
    normalizeWhitespace: false,
    stripDiacritics: false
  });

  const rightCounts = new Map<string, number>();

  for (const bigram of rightBigrams) {
    rightCounts.set(bigram, (rightCounts.get(bigram) ?? 0) + 1);
  }

  let intersection = 0;

  for (const bigram of leftBigrams) {
    const count = rightCounts.get(bigram) ?? 0;

    if (count > 0) {
      intersection += 1;
      count === 1 ? rightCounts.delete(bigram) : rightCounts.set(bigram, count - 1);
    }
  }

  return (2 * intersection) / (leftBigrams.length + rightBigrams.length);
}
