export type FilterStage = "통과" | "보류" | "지뢰";
export type Topic = "프로그래밍 언어" | "자동화" | "AI" | "마인드셋";

export type SavedPost = {
  title: string;
  author: string;
  url: string;
  savedAtISO: string; // e.g. 2026-02-07T...
  rawText: string;    // the copied post text
  filterStage?: FilterStage;
  topic?: Topic;
};

export function toNotionPaste(post: SavedPost) {
  // Notion likes simple text + clear headings.
  // Keep it very plain so paste always works.
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
