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

chrome.commands.onCommand.addListener(async (command) => {
  if (command !== "toggle-extract-mode") return;

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return;

  chrome.tabs.sendMessage(tab.id, { type: "TOGGLE_EXTRACT_MODE" });
});
