// A small, honest homage to 90s-web hit counters: counts real page loads of this
// browser via localStorage. Not a global counter (there is no backend yet).

const STORAGE_KEY = "shogi-dojo.visits";

export function bumpAndGetVisitCount(): number {
  if (typeof window === "undefined") return 0;
  const current = Number(window.localStorage.getItem(STORAGE_KEY) ?? "0");
  const next = current + 1;
  window.localStorage.setItem(STORAGE_KEY, String(next));
  return next;
}
