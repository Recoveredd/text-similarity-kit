import type { TextNormalizationOptions } from "./types.js";

const whitespacePattern = /\s+/g;
const combiningMarksPattern = /\p{M}/gu;

export function normalizeText(input: string, options: TextNormalizationOptions = {}): string {
  const {
    caseSensitive = false,
    trim = true,
    normalizeWhitespace = true,
    stripDiacritics = false,
    locale
  } = options;

  let value = String(input);

  if (stripDiacritics) {
    value = value.normalize("NFD").replace(combiningMarksPattern, "");
  }

  if (!caseSensitive) {
    value = locale ? value.toLocaleLowerCase(locale) : value.toLowerCase();
  }

  if (normalizeWhitespace) {
    value = value.replace(whitespacePattern, " ");
  }

  return trim ? value.trim() : value;
}
