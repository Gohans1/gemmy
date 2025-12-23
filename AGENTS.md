# GEMMY PROJECT - SOURCE OF TRUTH (AGENTS.MD)

> **WARNING FOR AI AGENTS:** READ THIS FILE BEFORE TOUCHING ANY CODE.
> This is the immutable core of the project. Do not refactor these architectural decisions unless explicitly instructed.

## 1. IDENTITY & PURPOSE
- **Project Name:** Gemmy
- **Type:** Obsidian Plugin (Desktop).
- **Core Concept:** A persistent, interactive desktop mascot that provides quotes, focus tools (Pomodoro), and companionship.
- **Vibe:** Friendly, slightly chaotic, persistent. Gemmy is not just a UI element; it's a character.

## 2. TECH STACK & ARCHITECTURE (NON-NEGOTIABLE)
- **Language:** TypeScript.
- **Framework:** Obsidian Plugin API (`obsidian` package).
- **UI Paradigm:** **DIRECT DOM MANIPULATION**.
    - ❌ **NO** React, Vue, Svelte, or Virtual DOM.
    - ✅ **YES** `createEl`, `createDiv`, `HTMLElement` manipulation.
    - **Reason:** Lightweight, native Obsidian integration, total control over animation states.
- **Styling:** Raw CSS (`styles.css`).
    - Use CSS Variables (`var(--background-primary)`) to match Obsidian themes.
- **Persistence:** `data.json` managed via `DataManager`.

## 3. FILE STRUCTURE & RESPONSIBILITIES (THE ORGANS)

### `src/main.ts` (THE BRAIN)
- **Role:** Entry point (`onload`, `onunload`).
- **Responsibilities:**
    - Initializes Managers (`DataManager`, `QuoteManager`, `FocusManager`).
    - Creates the **Root DOM Elements**: `.gemmy-container`, `img` (Mascot), `.gemmy-bubble` (Chat).
    - Handles Global Events: Dragging logic, Command registration.
    - **Crucial:** The `gemmyEl` (container) is appended directly to `document.body` to float above everything.

### `src/DataManager.ts` (THE MEMORY)
- **Role:** State management and Persistence.
- **Responsibilities:**
    - Loads/Saves `data.json`.
    - Manages `allQuotes` (Array<string>) and `favoriteQuotes` (Array<string>).
    - Manages `settings` (Avatar path, Focus tracks, Idle frequency).
    - **Rule:** NEVER write to file directly. Always use `this.dataManager.save()`.

### `src/modes/QuoteManager.ts` (THE VOICE)
- **Role:** Controls what Gemmy says.
- **Responsibilities:**
    - `saySomething()`: The core loop. Picks a random quote.
    - `renderQuote()`: Updates the Bubble UI.
    - **Navigation:** Manages `quoteHistory` stack (Prev/Next logic).
    - **Logic Change (2025):** Quotes **DO NOT** auto-hide. They persist until the next interaction.

### `src/modes/FocusManager.ts` (THE COACH)
- **Role:** Focus/Pomodoro Mode logic.
- **Responsibilities:**
    - Toggles "Focus Mode" state.
    - Hides distraction buttons (Next, Prev, Menu).
    - Plays background music (YouTube/Audio).
    - Renders the Focus UI (Timer, Controls).

### `src/modals.ts` (THE INTERFACE)
- **Role:** Pop-up windows for user interaction.
- **Components:**
    - `ViewAllQuotesModal`: List, Search, Delete, **Favorite**, Copy.
    - `ImportModal`: JSON/CSV parsing.
    - `FocusSettingsModal`: Playlist management.

## 4. CRITICAL INVARIANTS (THE LAWS OF PHYSICS)

1.  **The Bubble Logic:**
    - The Bubble (`.gemmy-bubble`) is controlled via CSS classes: `.hidden` and `.fade-out`.
    - To Show: `removeClass("hidden")`.
    - To Hide: `addClass("hidden")`.
    - **Never** destroy/recreate the bubble DOM; only toggle visibility.

2.  **Asset Handling:**
    - Default Avatar: Imported statically (`kapilgupta.png`).
    - Custom Avatar: Stored as a path string in Settings. Handled by `getAvatarSource()`.

3.  **Quote Data Structure:**
    - A Quote is a simple `string`.
    - No ID, no complex object.
    - Deduplication happens via string comparison.

4.  **Drag System:**
    - Uses native `mousedown`, `mousemove`, `mouseup` on `document`.
    - Coordinates are saved to `settings.position` on `mouseup`.

## 5. COMMON PATTERNS FOR AGENTS
- **Adding a Button:**
    - Go to `src/main.ts` -> `onload` -> `buttonContainer`.
    - Use `createDiv` with `clickable-icon`.
    - Add `onclick` handler.
- **Adding a Modal:**
    - Create class in `src/modals.ts` extending `BaseGemmyModal`.
    - Instantiate in `src/main.ts` or inside `Menu`.
- **Modifying Data:**
    - Add method to `DataManager`.
    - Call `await this.save()`.

---
*Last Updated: Dec 2025 (The "No-Auto-Hide" Era)*
