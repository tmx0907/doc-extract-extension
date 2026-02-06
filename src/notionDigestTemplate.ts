import type { SavedPost } from "./format/notionTemplate";

function toLocalDateStamp(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function getDigestId(date = new Date()) {
  return `digest-${toLocalDateStamp(date)}`;
}

export function toWeeklyDigest(posts: SavedPost[]) {
  const now = new Date();
  const date = toLocalDateStamp(now);
  const digestId = getDigestId(now);

  const list = posts
    .map((p, i) => `${i + 1}. **${p.title || "Untitled"}**  \n${p.url}`)
    .join("\n\n");

  return `# 🗞 Weekly Digest — ${date}
Digest ID: ${digestId}

## Theme of the Week
(Write one sentence about what these posts have in common)

## Key Takeaways
- 
- 
- 

## Newbie Landmines
- What sounds smart but is misleading?

## Source Posts
${list}
`;
}
