# ProgressCrawl — GPT Assistant Onboarding & Project Rules

This project uses GPT as a **development assistant**, not a speculative coder.  
Accuracy, verification, and architectural stability are more important than speed.

---

## Mandatory First Steps (Non-Negotiable)

1. **Extract the uploaded ZIP**
   - Recursively open and read **all `.js`, `.md`, and `.css` files** in all folders and subfolders.
   - Do **not** rely on memory from previous chats.

2. **Read the authoritative project summary first**
   - One `.md` file (`0.0.70c-qol-exploration-summary.md`) is the **authoritative overview** of the project.
   - Read it **before** doing any analysis.
   - Treat it as ground truth over assumptions or conventions.

3. **Identify and confirm entry points**
   Before proposing any change, explicitly identify:
   - Main HTML structure (screens / panels / sections)
   - Bootstrap / entry script
   - State initialization
   - Screen switching logic
   - Save / load logic

   List these back to the user before making changes.

---

## Core Development Rules

- **NEVER guess file contents**
- **NEVER assume DOM structure, IDs, or CSS selectors**
  - Always confirm from `index.html` or relevant files.
- **ALWAYS check all relevant scripts** before concluding how something works.
- **NEVER duplicate state access**
- **NEVER refactor structure without explicit approval**
- **NEVER introduce new global state helpers or aliases**
  - Do not create new `STATE()` functions without permission
  - Do not create new direct `PC.state` aliases without permission

---

## State & Architecture Rules (Critical)

All new systems (including but not limited to resource nodes, entities, POIs, zones, world map features) must:

- Store **persistent data only** under `PC.state.*` (or the appropriate existing subtree)
- Expose read/write access via:
  - `STATE()`
  - `EXP()`
  - `MOV()`
  - or an approved `PC.api.*` accessor
- Expose **actions** via `PC.api.*`
- Never bypass or shadow the central state system

This rule exists to prevent the **“must refactor again” loop**.

---

## Change Discipline

- **Always provide full replacement blocks**
  - A “full replacement block” means the **smallest complete unit** that can be safely pasted:
    - Entire function
    - Entire event handler
    - Entire CSS rule
    - Entire HTML section
  - Never say “add this line somewhere” without showing the surrounding context.

- **Always cite evidence**
  - When describing behavior or proposing a change:
    - Name the exact file path
    - Quote the exact existing snippet being replaced (short, ≤10 lines)
    - Then provide the full replacement block

- **One QoL item per response**
  - Touch the **minimum number of files** needed.
  - If more changes are required, stop and summarize next steps instead of continuing.

---

## Save / Persistence Safety

- Any change affecting:
  - IDs
  - Keys
  - Persistent state schemas
- Must be:
  - Backwards compatible, **or**
  - Include a clear one-time migration strategy

Never silently break saves.

---

## Communication Rules

- Summarize **what changed** before continuing.
- Be explicit about:
  - What was added
  - What was changed
  - What was fixed
  - What was intentionally left untouched
- If something is uncertain or missing, **ask before proceeding**.

---

## Purpose of These Rules

These constraints exist to ensure:
- No hallucinated code
- No architectural drift
- No accidental state duplication
- No “we need to refactor everything again” situations

Follow them strictly.

---

## Note on Project Summaries

The authoritative summary file (currently named something like `0.0.70c-qol-exploration-summary.md`) **will change name over time** as branches evolve.

Always ask which summary file is current if it’s not explicitly stated.
