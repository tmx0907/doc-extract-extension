import { saveToHistory } from "./lib/saveHistory";
import type { SavedPost } from "./format/notionTemplate";

chrome.runtime.onMessage.addListener(
  (msg: { type: string; saved?: SavedPost }, _sender, sendResponse) => {
    if (msg?.type === "SAVE_POST" && msg.saved) {
      saveToHistory(msg.saved)
        .then(() => sendResponse({ ok: true }))
        .catch((err) => sendResponse({ ok: false, err }));
      return true; // async response
    }
  }
);

async function ensureContentReceiver(tabId: number): Promise<boolean> {
  try {
    await chrome.tabs.sendMessage(tabId, { type: "PING_DOCEX" });
    return true;
  } catch (err) {
    console.warn("No content receiver yet. Trying to inject content script...", err);
  }

  try {
    await chrome.scripting.insertCSS({
      target: { tabId },
      files: ["ui.css"],
    });
  } catch (err) {
    console.warn("insertCSS failed (continuing):", err);
  }

  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ["content.js"],
    });
    return true;
  } catch (err) {
    console.error("Failed to inject content script:", err);
    return false;
  }
}

chrome.commands.onCommand.addListener(async (command) => {
  if (command !== "toggle-extract-mode") return;

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return;

  const ready = await ensureContentReceiver(tab.id);
  if (!ready) return;

  try {
    await chrome.tabs.sendMessage(tab.id, { type: "TOGGLE_EXTRACT_MODE" });
  } catch (err) {
    console.error("TOGGLE_EXTRACT_MODE send failed:", err);
  }
});
