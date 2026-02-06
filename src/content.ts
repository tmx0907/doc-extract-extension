// 아주 단순 버전: 클릭한 요소의 텍스트를 복사 (Markdown은 2단계에서)
import { toNotionPaste, type SavedPost } from "./format/notionTemplate";

let enabled = false;

let overlayEl: HTMLDivElement | null = null;
let toastEl: HTMLDivElement | null = null;
const key = "saved_posts_v1";
let lastHandledAt = 0;

function ensureUI() {
  if (!overlayEl) {
    overlayEl = document.createElement("div");
    overlayEl.id = "docx-overlay";
    document.documentElement.appendChild(overlayEl);
  }
  if (!toastEl) {
    toastEl = document.createElement("div");
    toastEl.id = "docx-toast";
    document.documentElement.appendChild(toastEl);
  }
}

function toast(msg: string) {
  ensureUI();
  if (!toastEl) return;
  toastEl.textContent = msg;
  toastEl.classList.add("show");
  setTimeout(() => toastEl?.classList.remove("show"), 900);
}

function setOverlay(rect: DOMRect | null) {
  ensureUI();
  if (!overlayEl) return;

  if (!rect) {
    overlayEl.style.display = "none";
    return;
  }

  overlayEl.style.display = "block";
  overlayEl.style.left = `${rect.left + window.scrollX}px`;
  overlayEl.style.top = `${rect.top + window.scrollY}px`;
  overlayEl.style.width = `${rect.width}px`;
  overlayEl.style.height = `${rect.height}px`;
}

function isOurUI(el: Element) {
  const id = (el as HTMLElement).id;
  return id === "docx-overlay" || id === "docx-toast";
}

function onMove(e: MouseEvent) {
  if (!enabled) return;
  const el = e.target as Element | null;
  if (!el || isOurUI(el)) return setOverlay(null);
  const rect = (el as HTMLElement).getBoundingClientRect();
  setOverlay(rect);
}

async function onPick(e: PointerEvent) {
  if (!enabled) return;
  if (e.button !== 0) return; // left click only
  const el = e.target as Element | null;
  if (!el || isOurUI(el)) return;

  const now = Date.now();
  if (now - lastHandledAt < 250) return;
  lastHandledAt = now;

  e.preventDefault();
  e.stopPropagation();
  console.log("DocExtract pick", el);

  const text = (el as HTMLElement).innerText?.trim() || "";
  const saved: SavedPost = {
    title: text?.split("\n")[0]?.slice(0, 80) ?? "",
    author: "",
    url: location.href ?? "",
    savedAtISO: new Date().toISOString(),
    rawText: text ?? "",
  };

  let savedOk = false;
  try {
    const res = await chrome.runtime.sendMessage({ type: "SAVE_POST", saved });
    savedOk = res?.ok === true;
    if (!savedOk) console.warn("SAVE_POST message not ok", res);
  } catch (err) {
    console.error("SAVE_POST message failed", err);
  }

  if (!savedOk) {
    try {
      const existing = await chrome.storage.local.get(key);
      const list: SavedPost[] = Array.isArray(existing[key]) ? existing[key] : [];
      list.unshift(saved);
      await chrome.storage.local.set({ [key]: list.slice(0, 200) });
      savedOk = true;
      console.log("Saved via content-script fallback");
    } catch (err) {
      console.error("Fallback save failed", err);
    }
  }

  if (!savedOk) {
    toast("저장 실패");
    return;
  }

  const notionText = toNotionPaste(saved);
  try {
    await navigator.clipboard.writeText(notionText);
  } catch (err) {
    console.error("Clipboard write failed", err);
  }

  toast("Copied ✅");
}

function enable() {
  enabled = true;
  ensureUI();
  document.addEventListener("mousemove", onMove, { passive: true });
  document.addEventListener("pointerdown", onPick, true);
  toast("Extract Mode ON");
}
function disable() {
  enabled = false;
  document.removeEventListener("mousemove", onMove);
  document.removeEventListener("pointerdown", onPick, true);
  setOverlay(null);
  toast("Extract Mode OFF");
}

chrome.runtime.onMessage.addListener((msg) => {
  if (msg?.type === "TOGGLE_EXTRACT_MODE") enabled ? disable() : enable();
});
