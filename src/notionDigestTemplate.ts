import type { SavedPost } from "./format/notionTemplate";

export function toWeeklyDigest(posts: SavedPost[]) {
  const date = new Date().toISOString().slice(0, 10);

  const list = posts
    .map((p, i) => `${i + 1}. **${p.title || "Untitled"}**  \n${p.url}`)
    .join("\n\n");

  return `# 🗞 Weekly Digest — ${date}

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
