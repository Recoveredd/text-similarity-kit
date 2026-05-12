import { describe, expect, it } from "vitest";
import {
  compareStrings,
  createMatcher,
  diceCoefficient,
  findBestMatch,
  getBigrams,
  isSimilar,
  jaroSimilarity,
  jaroWinklerSimilarity,
  levenshteinDistance,
  levenshteinSimilarity,
  normalizeText,
  rankMatches
} from "../src/index.js";

describe("normalizeText", () => {
  it("normalizes casing and whitespace by default", () => {
    expect(normalizeText("  Hello   WORLD  ")).toBe("hello world");
  });

  it("can strip diacritics", () => {
    expect(normalizeText("Électricité", { stripDiacritics: true })).toBe("electricite");
  });
});

describe("bigrams and dice coefficient", () => {
  it("returns bigrams for normalized text", () => {
    expect(getBigrams("Night")).toEqual(["ni", "ig", "gh", "ht"]);
  });

  it("keeps Unicode code points intact in bigrams", () => {
    expect(getBigrams("a🙂b")).toEqual(["a🙂", "🙂b"]);
  });

  it("scores exact matches as 1", () => {
    expect(diceCoefficient("night", "night")).toBe(1);
  });

  it("scores partial overlap between 0 and 1", () => {
    const score = diceCoefficient("night", "nacht");

    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThan(1);
  });
});

describe("levenshtein", () => {
  it("computes edit distance", () => {
    expect(levenshteinDistance("kitten", "sitting")).toBe(3);
  });

  it("converts distance to normalized similarity", () => {
    expect(levenshteinSimilarity("kitten", "sitting")).toBeCloseTo(4 / 7);
  });
});

describe("jaro algorithms", () => {
  it("computes jaro similarity", () => {
    expect(jaroSimilarity("martha", "marhta")).toBeCloseTo(0.944, 3);
  });

  it("boosts common prefixes with jaro-winkler", () => {
    expect(jaroWinklerSimilarity("martha", "marhta")).toBeGreaterThan(jaroSimilarity("martha", "marhta"));
  });
});

describe("compareStrings", () => {
  it("uses dice by default", () => {
    expect(compareStrings("abc", "abc")).toBe(1);
  });

  it("supports algorithm selection", () => {
    expect(compareStrings("kitten", "sitting", { algorithm: "levenshtein" })).toBeCloseTo(4 / 7);
  });

  it("passes jaro-winkler options through the high-level API", () => {
    const withoutBoost = compareStrings("martha", "marhta", {
      algorithm: "jaro-winkler",
      prefixScale: 0
    });
    const withBoost = compareStrings("martha", "marhta", {
      algorithm: "jaro-winkler",
      prefixScale: 0.2,
      maxPrefixLength: 3
    });

    expect(withBoost).toBeGreaterThan(withoutBoost);
  });
});

describe("isSimilar", () => {
  it("checks strings against a threshold", () => {
    expect(isSimilar("invoice export", "invoice exports", { algorithm: "jaro-winkler", threshold: 0.8 })).toBe(true);
    expect(isSimilar("invoice export", "support notes", { threshold: 0.9 })).toBe(false);
  });

  it("clamps unsafe thresholds", () => {
    expect(isSimilar("same", "same", { threshold: Number.POSITIVE_INFINITY })).toBe(true);
    expect(isSimilar("different", "other", { threshold: Number.NaN })).toBe(true);
  });
});

describe("rankMatches and findBestMatch", () => {
  const candidates = ["payment export", "search endpoint", "invoice import"] as const;

  it("ranks candidates by score", () => {
    const matches = rankMatches("pay export", candidates, { limit: 2 });

    expect(matches).toHaveLength(2);
    expect(matches[0]?.candidate).toBe("payment export");
    expect(matches[0]?.index).toBe(0);
  });

  it("applies threshold filtering", () => {
    const matches = rankMatches("unrelated", candidates, { threshold: 0.8 });

    expect(matches).toEqual([]);
  });

  it("normalizes unsafe rank options", () => {
    const matches = rankMatches("invoice", candidates, { limit: 1.8, threshold: Number.POSITIVE_INFINITY });

    expect(matches).toEqual([]);
  });

  it("returns the best match with all ranked matches", () => {
    const result = findBestMatch("invoice", candidates);

    expect(result.query).toBe("invoice");
    expect(result.bestMatch?.candidate).toBe("invoice import");
    expect(result.matches.length).toBe(candidates.length);
  });
});

describe("createMatcher", () => {
  it("creates a reusable immutable matcher", () => {
    const matcher = createMatcher(["Paris", "Lyon", "Marseille"], { algorithm: "jaro-winkler" });

    expect(matcher.findBest("Marselle").bestMatch?.candidate).toBe("Marseille");
    expect(() => {
      (matcher.candidates as string[]).push("Bordeaux");
    }).toThrow(TypeError);
  });
});
