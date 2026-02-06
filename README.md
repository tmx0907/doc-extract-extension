Doc Extract
A lightweight Chrome extension for capturing, saving, and structuring technical posts
— designed for beginners who want clarity over hype.
What This Is
Doc Extract helps you:
Capture useful posts (e.g. Threads, docs, blog posts) directly from the web
Save them locally with one click
Paste them into Notion using a clean, opinionated template
Build a personal “learning log” without automation overload
This tool is intentionally minimal.
It prioritizes human judgment over full automation.
Core Features
1. Extract Mode (Hotkey)
Toggle extract mode with:
macOS: Command + Shift + E
Windows: Ctrl + Shift + E
Click the red extract box on a post to:
Copy the content to clipboard
Save it to local history (chrome.storage.local)
2. Local History (No Backend)
Saved posts are stored locally under:
saved_posts_v1
No server, no account, no tracking
Up to the most recent 200 posts are kept
3. Popup UI
Click the extension icon to open the popup.
You will see:
📄 Paste as Notion Template
Saved (last 20) posts
Paste as Notion Template
Copies the most recent saved post
Uses a structured Notion-friendly format:
# Title

Author:
URL:
Saved At:
Filter Stage:
Topic:

## Original

## Easy Explanation (LLM)

## Newbie Landmines

## Connected Thinkers
Paste directly into Notion.
Design Philosophy
❌ No auto-posting to Notion
❌ No background scraping
❌ No “save everything” automation
Instead:
✅ You decide what is worth saving
✅ One click = one conscious decision
✅ Friction is intentional
This keeps the judgment muscle alive.
Tech Stack
Chrome Extension (Manifest V3)
TypeScript
Vite
Local storage (chrome.storage.local)
No external APIs (yet)
Project Status
MVP complete
Extract mode ✔
Local save ✔
Popup UI ✔
Notion template copy ✔
Next planned steps:
Weekly Digest generation
Basic filtering (Pass / Hold / Landmine)
Graph-style author/topic exploration (optional)
Development
Install
pnpm install
Build
pnpm build
Load Extension
Open chrome://extensions
Enable Developer mode
Click Load unpacked
Select the dist/ folder
Notes
dist/ is intentionally gitignored
Build artifacts are generated locally
This project is optimized for learning and iteration, not scale (yet)
License
MIT (for now)
