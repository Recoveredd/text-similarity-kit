# text-similarity-kit

Compare and rank short strings with a small TypeScript-first toolkit.

`text-similarity-kit` is a clean-room alternative for everyday fuzzy matching tasks: search suggestions, typo-tolerant labels, command palettes, duplicate detection and lightweight record matching. It ships as ESM, has no runtime dependencies and works in Node.js or modern browsers.

## Install

```bash
npm install text-similarity-kit
```

## Quick start

```ts
import { compareStrings, findBestMatch, rankMatches } from "text-similarity-kit";

compareStrings("invoice export", "invoices exports");
// 0.896...

const commands = ["Create invoice", "Export invoices", "Import contacts"];

findBestMatch("export invoice", commands);
// {
//   query: "export invoice",
//   bestMatch: { candidate: "Export invoices", rating: 0.785..., index: 1 },
//   matches: [...]
// }

rankMatches("import", commands, { threshold: 0.3, limit: 2 });
```

## API

### `compareStrings(left, right, options?)`

Returns a score from `0` to `1`, where `1` means the normalized strings are identical.

```ts
import { compareStrings } from "text-similarity-kit";

compareStrings("martha", "marhta", { algorithm: "jaro-winkler" });
```

Available algorithms:

| Algorithm | Good for |
| --- | --- |
| `dice` | Default. Short labels, fuzzy search, quick ranking. |
| `levenshtein` | Typo distance and predictable edit-based scoring. |
| `jaro` | Short names or identifiers with transposed characters. |
| `jaro-winkler` | Name-like strings where common prefixes matter. |

`jaro-winkler` also accepts `prefixScale` and `maxPrefixLength`:

```ts
compareStrings("martha", "marhta", {
  algorithm: "jaro-winkler",
  prefixScale: 0.12,
  maxPrefixLength: 4
});
```

### `rankMatches(query, candidates, options?)`

Ranks candidates from best to worst. Ties keep the original candidate order.

```ts
import { rankMatches } from "text-similarity-kit";

const matches = rankMatches("pay export", ["payment export", "search endpoint"], {
  threshold: 0.25,
  limit: 5
});
```

`threshold` keeps only matches with a rating at or above that score. `limit` caps the number of returned matches after sorting.

Each match has:

```ts
type MatchResult = {
  candidate: string;
  rating: number;
  index: number;
};
```

### `findBestMatch(query, candidates, options?)`

Returns the best candidate plus the full ranked list.

```ts
import { findBestMatch } from "text-similarity-kit";

const result = findBestMatch("marselle", ["Paris", "Lyon", "Marseille"], {
  algorithm: "jaro-winkler"
});

result.bestMatch?.candidate;
// "Marseille"
```

### `createMatcher(candidates, defaultOptions?)`

Creates a reusable matcher when you compare many queries against the same candidate list.

```ts
import { createMatcher } from "text-similarity-kit";

const matcher = createMatcher(["Open file", "Close file", "Save all"], {
  algorithm: "jaro-winkler",
  threshold: 0.2
});

matcher.rank("save");
matcher.findBest("close");
```

### Lower-level helpers

```ts
import {
  diceCoefficient,
  getBigrams,
  jaroSimilarity,
  jaroWinklerSimilarity,
  levenshteinDistance,
  levenshteinSimilarity,
  normalizeText
} from "text-similarity-kit";
```

These helpers are useful when you need explicit control over the scoring algorithm.

## Normalization options

All comparison APIs support the same normalization options:

```ts
compareStrings("Électricité", "electricite", {
  stripDiacritics: true,
  caseSensitive: false,
  trim: true,
  normalizeWhitespace: true,
  locale: "fr"
});
```

Defaults:

| Option | Default |
| --- | --- |
| `caseSensitive` | `false` |
| `trim` | `true` |
| `normalizeWhitespace` | `true` |
| `stripDiacritics` | `false` |

Ranking options:

| Option | Default |
| --- | --- |
| `threshold` | `0` |
| `limit` | no limit |

Jaro-Winkler options:

| Option | Default |
| --- | --- |
| `prefixScale` | `0.1` |
| `maxPrefixLength` | `4` |

## Choosing an algorithm

Use `dice` first for product labels, routes, titles and short records. It is fast, simple and usually good enough.

Use `levenshtein` when the number of edits is meaningful, for example typo checks.

Use `jaro-winkler` for names and identifiers where matching the beginning of the string should matter more.

## Notes

- This package is intended for short to medium strings, not semantic similarity or large document comparison.
- Scores from different algorithms are not directly equivalent. Pick one algorithm for a workflow and tune the threshold for that algorithm.
- The implementation is clean-room and does not copy code from the archived `string-similarity` package.

## License

MPL-2.0
