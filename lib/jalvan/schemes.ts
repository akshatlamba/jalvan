import { SCHEMES } from "./data";
import type { SchemeMatch } from "./types";

export function matchSchemes(state: string, tags: string[], top = 3): SchemeMatch[] {
  const wanted = new Set(tags.map((t) => t.toLowerCase()));
  return SCHEMES.map((scheme) => ({
    scheme,
    score: scheme.tags.reduce((sum, tag) => sum + (wanted.has(tag.toLowerCase()) ? 1 : 0), 0),
  }))
    .filter((m) => m.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, top);
}
