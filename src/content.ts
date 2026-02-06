// 아주 단순 버전: 클릭한 요소의 텍스트를 복사 (Markdown은 2단계에서)
import { toNotionPaste, type SavedPost } from "./format/notionTemplate";

let enabled = false;

let overlayEl: HTMLDivElement | null = null;
let toastEl: HTMLDivElement | null = null;

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

async function onClick(e: MouseEvent) {
  if (!enabled) return;
  const el = e.target as Element | null;
  if (!el || isOurUI(el)) return;

  e.preventDefault();
  e.stopPropagation();

  const text = (el as HTMLElement).innerText?.trim() || "";
  const saved: SavedPost = {
    title: text?.split("\n")[0]?.slice(0, 80) ?? "",
    author: "",
    url: location.href ?? "",
    savedAtISO: new Date().toISOString(),
    rawText: text ?? "",
  };
  const res = await chrome.runtime.sendMessage({ type: "SAVE_POST", saved });
  if (res?.ok !== true) {
    toast("저장 실패");
    return;
  }
  const notionText = toNotionPaste(saved);
  await navigator.clipboard.writeText(notionText);

  toast("Copied ✅");
}

function enable() {
  enabled = true;
  ensureUI();
  document.addEventListener("mousemove", onMove, { passive: true });
  document.addEventListener("click", onClick, true);
  toast("Extract Mode ON");
}
function disable() {
  enabled = false;
  document.removeEventListener("mousemove", onMove);
  document.removeEventListener("click", onClick, true);
  setOverlay(null);
  toast("Extract Mode OFF");
}

chrome.runtime.onMessage.addListener((msg) => {
  if (msg?.type === "TOGGLE_EXTRACT_MODE") enabled ? disable() : enable();
});
