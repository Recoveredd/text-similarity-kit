export type {
  BestMatchResult,
  CompareOptions,
  Matcher,
  MatchResult,
  RankOptions,
  SimilarityAlgorithm,
  TextNormalizationOptions,
  JaroWinklerOptions
} from "./types.js";

export { getBigrams, diceCoefficient } from "./bigrams.js";
export { jaroSimilarity, jaroWinklerSimilarity } from "./jaro.js";
export { levenshteinDistance, levenshteinSimilarity } from "./levenshtein.js";
export { normalizeText } from "./normalize.js";

import { diceCoefficient } from "./bigrams.js";
import { jaroSimilarity, jaroWinklerSimilarity } from "./jaro.js";
import { levenshteinSimilarity } from "./levenshtein.js";
import { normalizeText } from "./normalize.js";
import type { BestMatchResult, CompareOptions, Matcher, MatchResult, RankOptions } from "./types.js";

export function compareStrings(left: string, right: string, options: CompareOptions = {}): number {
  const { algorithm = "dice", ...normalizationOptions } = options;

  switch (algorithm) {
    case "dice":
      return diceCoefficient(left, right, normalizationOptions);
    case "levenshtein":
      return levenshteinSimilarity(left, right, normalizationOptions);
    case "jaro":
      return jaroSimilarity(left, right, normalizationOptions);
    case "jaro-winkler":
      return jaroWinklerSimilarity(left, right, normalizationOptions);
    default:
      return exhaustiveAlgorithmCheck(algorithm);
  }
}

export function rankMatches<TCandidate extends string>(
  query: string,
  candidates: readonly TCandidate[],
  options: RankOptions = {}
): MatchResult<TCandidate>[] {
  const { threshold = 0, limit, ...compareOptions } = options;
  const safeThreshold = clamp(threshold, 0, 1);
  const safeLimit = typeof limit === "number" && Number.isFinite(limit) ? Math.max(0, Math.floor(limit)) : undefined;

  const matches = candidates
    .map((candidate, index): MatchResult<TCandidate> => ({
      candidate,
      rating: compareStrings(query, candidate, compareOptions),
      index
    }))
    .filter((match) => match.rating >= safeThreshold)
    .sort((left, right) => {
      if (right.rating !== left.rating) {
        return right.rating - left.rating;
      }

      return left.index - right.index;
    });

  return typeof safeLimit === "number" ? matches.slice(0, safeLimit) : matches;
}

export function findBestMatch<TCandidate extends string>(
  query: string,
  candidates: readonly TCandidate[],
  options: RankOptions = {}
): BestMatchResult<TCandidate> {
  const matches = rankMatches(query, candidates, options);

  return {
    query,
    bestMatch: matches[0] ?? null,
    matches
  };
}

export function createMatcher<TCandidate extends string>(
  candidates: readonly TCandidate[],
  defaultOptions: RankOptions = {}
): Matcher<TCandidate> {
  const frozenCandidates = Object.freeze([...candidates]);

  return {
    candidates: frozenCandidates,
    rank(query, options) {
      return rankMatches(query, frozenCandidates, { ...defaultOptions, ...options });
    },
    findBest(query, options) {
      return findBestMatch(query, frozenCandidates, { ...defaultOptions, ...options });
    }
  };
}

function exhaustiveAlgorithmCheck(value: never): never {
  throw new TypeError(`Unsupported similarity algorithm: ${String(value)}`);
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
