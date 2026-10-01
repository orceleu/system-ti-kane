// Local history management — keeps the last 100 actions in localStorage

export interface HistoryEntry {
  id: string;
  timestamp: string;
  type:
    | "creation"
    | "depot"
    | "retrait"
    | "suppression"
    | "destruction"
    | "pret"
    | "pret_paiement"
    | "autre";
  description: string;
  details?: string;
}

const HISTORY_KEY = "tikane_history";
const MAX_ENTRIES = 100;

export function getHistory(): HistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? (JSON.parse(raw) as HistoryEntry[]) : [];
  } catch {
    return [];
  }
}

export function addHistoryEntry(
  entry: Omit<HistoryEntry, "id" | "timestamp">
): void {
  if (typeof window === "undefined") return;
  try {
    const history = getHistory();
    const newEntry: HistoryEntry = {
      ...entry,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      timestamp: new Date().toISOString(),
    };

    // Prepend new entry and keep only the last MAX_ENTRIES
    const updated = [newEntry, ...history].slice(0, MAX_ENTRIES);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error("Failed to save history entry:", err);
  }
}

export function clearHistory(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(HISTORY_KEY);
}
