// Flattens a nested translation JSON tree into dot-path keys, e.g.
// { game: { check: "Check" } } -> { "game.check": "Check" }
// Arrays of strings flatten to numeric-suffixed keys, e.g. "aboutShogi.uniqueRules.0".

export type Tree = { [key: string]: string | string[] | Tree };

export function flatten(tree: Tree, prefix = ""): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(tree)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "string") {
      out[path] = value;
    } else if (Array.isArray(value)) {
      value.forEach((item, i) => {
        out[`${path}.${i}`] = item;
      });
    } else {
      Object.assign(out, flatten(value, path));
    }
  }
  return out;
}
