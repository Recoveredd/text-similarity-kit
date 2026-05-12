import { normalizeText } from "./normalize.js";
import type { TextNormalizationOptions } from "./types.js";

export function jaroSimilarity(left: string, right: string, options: TextNormalizationOptions = {}): number {
  const leftChars = Array.from(normalizeText(left, options));
  const rightChars = Array.from(normalizeText(right, options));

  if (leftChars.join("") === rightChars.join("")) {
    return 1;
  }

  if (leftChars.length === 0 || rightChars.length === 0) {
    return 0;
  }

  const matchDistance = Math.max(Math.floor(Math.max(leftChars.length, rightChars.length) / 2) - 1, 0);
  const leftMatches = new Array<boolean>(leftChars.length).fill(false);
  const rightMatches = new Array<boolean>(rightChars.length).fill(false);
  let matches = 0;

  for (let leftIndex = 0; leftIndex < leftChars.length; leftIndex += 1) {
    const start = Math.max(0, leftIndex - matchDistance);
    const end = Math.min(leftIndex + matchDistance + 1, rightChars.length);

    for (let rightIndex = start; rightIndex < end; rightIndex += 1) {
      if (rightMatches[rightIndex] || leftChars[leftIndex] !== rightChars[rightIndex]) {
        continue;
      }

      leftMatches[leftIndex] = true;
      rightMatches[rightIndex] = true;
      matches += 1;
      break;
    }
  }

  if (matches === 0) {
    return 0;
  }

  const matchedLeft = leftChars.filter((_, index) => leftMatches[index]);
  const matchedRight = rightChars.filter((_, index) => rightMatches[index]);
  let transpositions = 0;

  for (let index = 0; index < matchedLeft.length; index += 1) {
    if (matchedLeft[index] !== matchedRight[index]) {
      transpositions += 1;
    }
  }

  return (
    matches / leftChars.length +
    matches / rightChars.length +
    (matches - transpositions / 2) / matches
  ) / 3;
}

export interface JaroWinklerOptions extends TextNormalizationOptions {
  prefixScale?: number;
  maxPrefixLength?: number;
}

export function jaroWinklerSimilarity(left: string, right: string, options: JaroWinklerOptions = {}): number {
  const { prefixScale = 0.1, maxPrefixLength = 4, ...normalizationOptions } = options;
  const safePrefixScale = clamp(prefixScale, 0, 0.25);
  const safeMaxPrefixLength = Math.max(0, Math.floor(maxPrefixLength));
  const jaro = jaroSimilarity(left, right, normalizationOptions);
  const leftChars = Array.from(normalizeText(left, normalizationOptions));
  const rightChars = Array.from(normalizeText(right, normalizationOptions));
  const prefixLength = Math.min(safeMaxPrefixLength, leftChars.length, rightChars.length);
  let prefix = 0;

  while (prefix < prefixLength && leftChars[prefix] === rightChars[prefix]) {
    prefix += 1;
  }

  return jaro + prefix * safePrefixScale * (1 - jaro);
}

function clamp(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) {
    return min;
  }

  if (value === Number.POSITIVE_INFINITY) {
    return max;
  }

  if (value === Number.NEGATIVE_INFINITY) {
    return min;
  }

  return Math.min(Math.max(value, min), max);
}
