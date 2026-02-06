import type { SavedPost } from "../format/notionTemplate";

export async function saveToHistory(item: SavedPost) {
  console.log("SAVE_TO_HISTORY fired", item);
  const key = "saved_posts_v1";

  const existing = await chrome.storage.local.get(key);
  const list: SavedPost[] = Array.isArray(existing[key]) ? existing[key] : [];

  // newest first
  list.unshift(item);

  // keep only latest 200 (so it doesn't grow forever)
  const trimmed = list.slice(0, 200);

  await chrome.storage.local.set({ [key]: trimmed });
}
