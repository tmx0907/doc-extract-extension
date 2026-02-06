import { toNotionPaste, type SavedPost } from "./format/notionTemplate";

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

async function main() {
  const root = document.getElementById("app");
  if (!root) return;

  const list = await getHistory();
  const top = list.slice(0, 20);

  root.innerHTML = "";

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

  const h = el("h3");
  h.textContent = "Saved (last 20)";
  root.appendChild(h);

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

main();
