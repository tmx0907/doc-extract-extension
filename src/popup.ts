import { toNotionPaste, type SavedPost } from "./format/notionTemplate";
import { toWeeklyDigest } from "./notionDigestTemplate";

const key = "saved_posts_v1";

async function getHistory(): Promise<SavedPost[]> {
  const res = await chrome.storage.local.get(key);
  return Array.isArray(res[key]) ? res[key] : [];
}

async function copy(text: string) {
  await navigator.clipboard.writeText(text);
}

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className?: string) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  return node;
}

async function toggleExtractMode() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) {
    alert("No active tab");
    return;
  }

  try {
    await chrome.tabs.sendMessage(tab.id, { type: "TOGGLE_EXTRACT_MODE" });
    console.log("TOGGLE_EXTRACT_MODE sent", tab.id);
  } catch (err) {
    console.error("TOGGLE_EXTRACT_MODE failed", err);
    alert("Open a normal webpage tab and try again.");
  }
}

async function render(root: HTMLElement) {
  const list = await getHistory();
  const top = list.slice(0, 20);

  root.innerHTML = "";

  const modeBtn = document.createElement("button");
  modeBtn.textContent = "🟥 Toggle Extract Mode";
  modeBtn.onclick = async () => {
    await toggleExtractMode();
  };
  root.appendChild(modeBtn);

  const templateBtn = document.createElement("button");
  templateBtn.textContent = "📄 Paste as Notion Template";

  templateBtn.onclick = async () => {
    const list = await getHistory();
    if (list.length === 0) {
      alert("No saved posts yet");
      return;
    }

    const latest = list[0]; // 가장 최근 저장한 글
    const text = toNotionPaste(latest);
    await navigator.clipboard.writeText(text);

    templateBtn.textContent = "Copied template ✅";
    setTimeout(() => {
      templateBtn.textContent = "📄 Paste as Notion Template";
    }, 1000);
  };

  root.appendChild(templateBtn);

  const digestBtn = document.createElement("button");
  digestBtn.textContent = "🗞 Copy Weekly Digest";
  digestBtn.onclick = async () => {
    const posts = await getHistory();
    if (posts.length === 0) {
      alert("No saved posts yet");
      return;
    }

    const digest = toWeeklyDigest(posts.slice(0, 7));
    await navigator.clipboard.writeText(digest);
    digestBtn.textContent = "Copied Digest ✅";
    setTimeout(() => {
      digestBtn.textContent = "🗞 Copy Weekly Digest";
    }, 1200);
  };
  root.appendChild(digestBtn);

  const h = el("h3");
  h.textContent = "Saved (last 20)";
  root.appendChild(h);

  if (top.length === 0) {
    const hint = el("p");
    hint.textContent = "No saved posts yet. Toggle extract mode, then click a post.";
    root.appendChild(hint);
  }

  top.forEach((item) => {
    const row = el("div", "row");
    const btn = el("button");
    btn.textContent = item.title || "(untitled)";
    btn.onclick = async () => {
      await copy(toNotionPaste(item));
      btn.textContent = "Copied ✅";
      setTimeout(() => (btn.textContent = item.title || "(untitled)"), 800);
    };
    row.appendChild(btn);
    root.appendChild(row);
  });
}

async function main() {
  const root = document.getElementById("app");
  if (!root) return;

  await render(root);

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== "local" || !(key in changes)) return;
    void render(root);
  });

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState !== "visible") return;
    void render(root);
  });
}

void main();
