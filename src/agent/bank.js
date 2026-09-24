import { useCallback, useEffect, useState } from "react";
import { api } from "../api.js";

// Loads the bank index (folders + hotel summaries) and keeps it fresh after changes.
export function useBank() {
  const [bank, setBank] = useState(null);
  const [error, setError] = useState("");
  const reload = useCallback(() => api("bank").then(setBank).catch((e) => setError(e.message)), []);
  useEffect(() => { reload(); }, [reload]);
  return { bank, setBank, reload, error };
}

// Folders grouped by country, countries and folders sorted alphabetically (Hebrew).
export function groupFolders(folders) {
  const groups = new Map();
  for (const f of [...folders].sort((a, b) => a.name.localeCompare(b.name, "he"))) {
    const key = f.country || "";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(f);
  }
  return [...groups.entries()].sort(([a], [b]) => (a === "" ? 1 : b === "" ? -1 : a.localeCompare(b, "he")));
}

export const folderLabel = (f) => (f ? (f.country ? `${f.country} · ${f.name}` : f.name) : "");

// Best folder for a trip stop: same name as the city, else the folder holding most hotels from that city.
export function suggestFolder(bank, city) {
  if (!bank || !city) return "";
  const c = city.trim();
  const byName = bank.folders.find((f) => f.name.trim() === c);
  if (byName) return byName.id;
  const counts = {};
  for (const h of bank.hotels) if ((h.city || "").trim() === c) counts[h.folderId] = (counts[h.folderId] || 0) + 1;
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || "";
}

export const byUse = (a, b) => (b.chosenCount - a.chosenCount) || (b.addedCount - a.addedCount) || a.name.localeCompare(b.name, "he");
