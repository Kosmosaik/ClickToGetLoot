I have uploaded a ZIP. Extract it, then recursively open the full contents of every .js, .md, and .css file in all folders and subfolders, 
and load all lines into your working memory before doing any analysis. 
One of the .md files is written to guide your understanding of the project (0.0.70c-qol-exploration-summary.md) — read that file first and treat it as the authoritative overview for the entire project.

---

Perfect! What do you think of the projects code structure? Is it good? Anything to improve? Are the scripts too heavy in code so we need to modularize or refactor, or are we good to go with 0.0.70c?

---

Rules: 

NEVER guess file contents,
Never duplicate state access,
Make sure to check all relevant scripts,
Never refactor structure without approval,
Always provide full replacement blocks,
Summarize changes before continuing.

New systems (resource nodes/entities/POIs) must:
store their persistent data under PC.state.* (or the appropriate state subtree),
expose read/write via STATE()/EXP()/MOV() (or a new PC.api.* accessor if needed),
expose actions via PC.api.<domain>.*,
never create a new global function STATE() or new direct PC.state alias.
This prevents the “must refactor again” loop.
