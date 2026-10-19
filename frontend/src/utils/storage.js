/**
 * LocalStorage helpers for DebtTrap Shield.
 * Only numeric summaries are saved — never images or API keys.
 */

const STORAGE_KEY = 'debttrap_shield_saved';

export function getSaved() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveAnalysis(summary) {
  try {
    const existing = getSaved();
    const entry = {
      id: Date.now(),
      savedAt: new Date().toISOString(),
      received: summary.received,
      repay: summary.repay,
      days: summary.days,
      totalCost: summary.totalCost,
      costPercent: summary.costPercent,
      avoided: summary.avoided,
      lang: summary.lang,
    };
    existing.unshift(entry);
    // Keep max 10
    const trimmed = existing.slice(0, 10);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    return trimmed;
  } catch {
    return [];
  }
}

export function deleteAnalysis(id) {
  try {
    const existing = getSaved().filter(e => e.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
    return existing;
  } catch {
    return [];
  }
}

export function deleteAllAnalyses() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
}
