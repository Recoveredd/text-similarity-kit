export type SimilarityAlgorithm = "dice" | "levenshtein" | "jaro" | "jaro-winkler";

export interface TextNormalizationOptions {
  /**
   * Keep the original casing before comparison.
   *
   * @default false
   */
  caseSensitive?: boolean;

  /**
   * Trim leading and trailing whitespace.
   *
   * @default true
   */
  trim?: boolean;

  /**
   * Collapse repeated whitespace into a single space.
   *
   * @default true
   */
  normalizeWhitespace?: boolean;

  /**
   * Remove combining diacritic marks after Unicode normalization.
   *
   * @default false
   */
  stripDiacritics?: boolean;

  /**
   * Locale used for case normalization.
   */
  locale?: string;
}

export interface CompareOptions extends TextNormalizationOptions {
  /**
   * Similarity algorithm to use.
   *
   * @default "dice"
   */
  algorithm?: SimilarityAlgorithm;
}

export interface RankOptions extends CompareOptions {
  /**
   * Hide matches below this score.
   *
   * @default 0
   */
  threshold?: number;

  /**
   * Maximum number of matches returned.
   */
  limit?: number;
}

export interface MatchResult<TCandidate extends string = string> {
  candidate: TCandidate;
  rating: number;
  index: number;
}

export interface BestMatchResult<TCandidate extends string = string> {
  query: string;
  bestMatch: MatchResult<TCandidate> | null;
  matches: MatchResult<TCandidate>[];
}

export interface Matcher<TCandidate extends string = string> {
  readonly candidates: readonly TCandidate[];
  rank(query: string, options?: RankOptions): MatchResult<TCandidate>[];
  findBest(query: string, options?: RankOptions): BestMatchResult<TCandidate>;
}
