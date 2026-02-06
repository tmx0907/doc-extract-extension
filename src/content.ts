// 아주 단순 버전: 클릭한 요소의 텍스트를 복사 (Markdown은 2단계에서)
import type { FilterStage, SavedPost, Topic } from "./format/notionTemplate";

let enabled = false;

let overlayEl: HTMLDivElement | null = null;
let toastEl: HTMLDivElement | null = null;
const key = "saved_posts_v1";
let lastHandledAt = 0;

function includesAny(text: string, words: string[]) {
  return words.some((w) => text.includes(w));
}

function classifyTopic(text: string): Topic {
  const t = text.toLowerCase();
  const scores: Record<Topic, number> = {
    "프로그래밍 언어": 0,
    자동화: 0,
    AI: 0,
    마인드셋: 0,
  };

  if (includesAny(t, ["python", "javascript", "typescript", "java", "go", "rust", "c++", "sql"])) {
    scores["프로그래밍 언어"] += 2;
  }
  if (includesAny(t, ["syntax", "compiler", "runtime", "debug", "refactor", "type"])) {
    scores["프로그래밍 언어"] += 1;
  }

  if (includesAny(t, ["automation", "automate", "workflow", "cron", "zapier", "n8n", "script"])) {
    scores["자동화"] += 2;
  }
  if (includesAny(t, ["pipeline", "task", "integration", "trigger"])) {
    scores["자동화"] += 1;
  }

  if (includesAny(t, ["ai", "llm", "gpt", "prompt", "rag", "agent", "model"])) {
    scores["AI"] += 2;
  }
  if (includesAny(t, ["inference", "hallucination", "embedding", "fine-tuning", "fine tuning"])) {
    scores["AI"] += 1;
  }

  if (includesAny(t, ["mindset", "habit", "focus", "discipline", "career", "learn", "learning"])) {
    scores["마인드셋"] += 1;
  }

  let best: Topic = "마인드셋";
  let bestScore = -1;
  (Object.keys(scores) as Topic[]).forEach((topic) => {
    if (scores[topic] > bestScore) {
      best = topic;
      bestScore = scores[topic];
    }
  });

  return best;
}

function classifyFilterStage(text: string): FilterStage {
  const t = text.toLowerCase();

  const riskSignals = [
    "guaranteed",
    "100x",
    "overnight",
    "get rich quick",
    "no effort",
    "secret trick",
    "must buy",
    "pump",
    "all you need",
    "zero risk",
  ];
  if (includesAny(t, riskSignals)) return "지뢰";

  const practicalSignals = [
    "step",
    "example",
    "tradeoff",
    "why",
    "because",
    "docs",
    "documentation",
    "benchmark",
    "test",
    "error",
    "fix",
  ];
  if (includesAny(t, practicalSignals)) return "통과";

  return "보류";
}

function classifyPost(title: string, rawText: string): { filterStage: FilterStage; topic: Topic } {
  const full = `${title}\n${rawText}`;
  return {
    filterStage: classifyFilterStage(full),
    topic: classifyTopic(full),
  };
}

function toNotionPaste(post: SavedPost) {
  return [
    `# ${post.title || "Untitled"}`,
    ``,
    `Author: ${post.author || "unknown"}`,
    `URL: ${post.url || "unknown"}`,
    `Saved At: ${post.savedAtISO}`,
    `Filter Stage: ${post.filterStage || "보류"}`,
    `Topic: ${post.topic || "마인드셋"}`,
    ``,
    `---`,
    ``,
    `## Original`,
    post.rawText || "",
    ``,
    `## Easy Explanation (LLM)`,
    `- (paste LLM output here)`,
    ``,
    `## Newbie Landmines`,
    `- (what will break beginners?)`,
    ``,
    `## Connected Thinkers`,
    `- @someone — why`,
    ``,
  ].join("\n");
}

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
  const title = text?.split("\n")[0]?.slice(0, 80) ?? "";
  const classified = classifyPost(title, text);
  const saved: SavedPost = {
    title,
    author: "",
    url: location.href ?? "",
    savedAtISO: new Date().toISOString(),
    rawText: text ?? "",
    filterStage: classified.filterStage,
    topic: classified.topic,
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
