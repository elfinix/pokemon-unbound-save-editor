# Pokémon Unbound Save Editor — Development Changes Log

This document serves as the central audit trail and development journal for all architectural upgrades, component modularization, ROM patching utilities, backend API enhancements, and UI overhauls in the **Pokémon Unbound Save Editor (PUSE)** workspace.

---

## 1. Quick Change Index

| Commit / Step | Scope | Key Changes & Milestones | Date |
| :--- | :--- | :--- | :--- |
| **`69556df`** | Frontend / UI | `PokemonCard` and initial `PokemonEditorModal` component integration | 2026-10-03 |
| **`e921b73`** | Project Docs | Centralized repo documentation under `/docs`; updated `.gitignore` rules | 2026-10-03 |
| **`9398494`** | Frontend / Core | Full move metadata sync (`moves_meta.json`), PP up config, Toast system | 2026-10-04 |
| **`ad4005f`** | Features / UI | Type chart definitions (`typeChart.js`) and team `CoverageView.jsx` | 2026-10-04 |
| **`d9b8761`** | Design System | Dark glassmorphic shell, `Sidebar`, `TopHeader`, `LandingView`, resources modal | 2026-10-04 |
| **`7f908c8`** | UX / Modals | Replaced browser alerts with `ConfirmModal.jsx`; bag zero-quantity guard | 2026-10-04 |
| **`93da9b8`** | ROM Patchers | Python ROM patcher scripts (`type`, `ability`, `stat`) with FIFO backup system | 2026-10-04 |
| **`5cf7bb2`** | Core / Save Engine | Full party save pipeline, `editPartyMonFull`, and regression test suite | 2026-10-04 |
| **Refactor** | Modularization & Logs | Split `PokemonEditorModal` into sub-tabs & implemented structured `logger.js` | 2026-10-04 |
| **Latest** | UI / Moves Wiki | Added Moves Wiki tab, sidebar group hierarchy, and Gen 8 move metadata fixes | 2026-10-04 |

---

## 2. Detailed Change Chronology

### 🔹 Step 1: Editor Foundations & Project Organization
* **Commits:** `69556df`, `e921b73`
* **Changes:**
  * Consolidated disparate project documents into the [`docs/`](file:///d:/Elfinix/Shared/pokemon-unbound-save-editor/docs) directory (`CHANGELOG.md`, `CLAUDE.md`, `CONTRIBUTING.md`, `ROSTER_EXPORT.md`, `RULES.md`, `SAVE_REPORT.md`).
  * Updated `.gitignore` to protect ROM binaries (`.gba`), savestates, and local test artifacts.
  * Enhanced `PokemonCard.jsx` with slot indexes and visual stat badges.

---

### 🔹 Step 2: Move Metadata Expansion & Toast Notification System
* **Commit:** `9398494`
* **Changes:**
  * Added complete dataset `moves_meta.json` (containing 8,300+ lines covering move IDs, names, base power, accuracy, PP, split categories, and descriptions).
  * Synced metadata across `backend/data/`, `frontend/public/data/`, `frontend/src/core/`, and `switch-homebrew/romfs/data/`.
  * Implemented non-intrusive notification stack via [`ToastContainer.jsx`](file:///d:/Elfinix/Shared/pokemon-unbound-save-editor/frontend/src/components/ToastContainer.jsx).
  * Upgraded Showdown / Smogon set parser in [`showdownImport.js`](file:///d:/Elfinix/Shared/pokemon-unbound-save-editor/frontend/src/core/showdownImport.js).

---

### 🔹 Step 3: Type Synergy & Team Coverage Analyzer
* **Commit:** `ad4005f`
* **Changes:**
  * Implemented [`frontend/src/core/typeChart.js`](file:///d:/Elfinix/Shared/pokemon-unbound-save-editor/frontend/src/core/typeChart.js) covering all 18 Pokémon types, effectiveness multipliers (0x, 0.5x, 1x, 2x), and dual-type calculations.
  * Created [`frontend/src/components/CoverageView.jsx`](file:///d:/Elfinix/Shared/pokemon-unbound-save-editor/frontend/src/components/CoverageView.jsx) offering:
    * **Defensive Weakness Matrix:** Evaluates combined party resistances and vulnerabilities.
    * **Offensive STAB & Coverage Breakdown:** Highlights missing type coverages across active movesets.

---

### 🔹 Step 4: Glassmorphic UI Redesign & Application Shell
* **Commit:** `d9b8761`
* **Changes:**
  * Overhauled application layout to modern dark glassmorphism theme (`#0f172a` slate palette).
  * Built [`Sidebar.jsx`](file:///d:/Elfinix/Shared/pokemon-unbound-save-editor/frontend/src/components/Sidebar.jsx) with navigation pills, runtime switchers (Backend API vs In-Browser Engine), and session status.
  * Built [`TopHeader.jsx`](file:///d:/Elfinix/Shared/pokemon-unbound-save-editor/frontend/src/components/TopHeader.jsx) with quick Money/BP badges, Legit Mode toggle, and save/exit controls.
  * Built [`LandingView.jsx`](file:///d:/Elfinix/Shared/pokemon-unbound-save-editor/frontend/src/components/LandingView.jsx) for frictionless drag-and-drop save uploads, quick demo save loading, and format conversion.
  * Added [`ResourcesModal.jsx`](file:///d:/Elfinix/Shared/pokemon-unbound-save-editor/frontend/src/components/ResourcesModal.jsx) and [`SaveReportModal.jsx`](file:///d:/Elfinix/Shared/pokemon-unbound-save-editor/frontend/src/components/SaveReportModal.jsx).

---

### 🔹 Step 5: Modal Unification & Bag Zero-Quantity Guard
* **Commit:** `7f908c8`
* **Changes:**
  * Replaced native browser dialogs (`window.alert`, `window.confirm`) with [`ConfirmModal.jsx`](file:///d:/Elfinix/Shared/pokemon-unbound-save-editor/frontend/src/components/ConfirmModal.jsx) featuring glassmorphic backdrops, customizable action colors, and escape key handling.
  * Added unsaved changes guards when navigating away from the Bag tab.
  * Hardened [`BagView.jsx`](file:///d:/Elfinix/Shared/pokemon-unbound-save-editor/frontend/src/components/BagView.jsx) to safely handle zero-quantity items, preventing phantom item slots.
  * Integrated Pokédex flag controls (Seen/Caught toggles) directly into Pokémon inspection.

---

### 🔹 Step 6: ROM Patcher Scripts & Headcanon Tracking
* **Commit:** `93da9b8`
* **Changes:**
  * Created standalone Python CLI patchers in [`backend/scripts/`](file:///d:/Elfinix/Shared/pokemon-unbound-save-editor/backend/scripts):
    * [**`patch_species_type.py`**](file:///d:/Elfinix/Shared/pokemon-unbound-save-editor/backend/scripts/patch_species_type.py): Direct ROM table byte patcher for primary/secondary typing with table base calculation (`0x19E0CB8 + (id-1)*0x1C`).
    * [**`patch_species_ability.py`**](file:///d:/Elfinix/Shared/pokemon-unbound-save-editor/backend/scripts/patch_species_ability.py): ROM patcher for Ability 1, Ability 2, and Hidden Ability uint16 slots.
    * [**`patch_species_stat.py`**](file:///d:/Elfinix/Shared/pokemon-unbound-save-editor/backend/scripts/patch_species_stat.py): ROM patcher for Base Stats (HP, Attack, Defense, Speed, Sp. Atk, Sp. Def).
  * Implemented automated FIFO rotating backups before every ROM write (`.bak_1`, `.bak_2`, `.bak_3`).
  * Created [`docs/HEADCANON_CHANGES.md`](file:///d:/Elfinix/Shared/pokemon-unbound-save-editor/docs/HEADCANON_CHANGES.md) tracking Snorunt (Ice/Ghost dual typing) and Gible balance experiments.
  * Synced `species_types.json` across frontend core and homebrew ports.

---

### 🔹 Step 7: Core Party Save Engine & Parity Verification
* **Commit:** `5cf7bb2`
* **Changes:**
  * Implemented `editPartyMonFull` in [`frontend/src/core/party.js`](file:///d:/Elfinix/Shared/pokemon-unbound-save-editor/frontend/src/core/party.js) to write all Pokémon substruct fields in memory:
    * Nickname (with GBA character encoding).
    * Species ID, Level, and Exp recalculation.
    * Nature ID, Current Ability Index (Ability 1 / Ability 2 / HA bit 31).
    * Held Item ID and Caught Ball ID.
    * Happiness / Friendship byte.
    * Shiny PID recalculation and Gender bit flips.
    * 31 IV bitpack and EV bytes.
    * 4 Move slots, current PP, and PP Up bonus increments.
  * Created automated unit test runner [`frontend/scripts/party-save-regression.mjs`](file:///d:/Elfinix/Shared/pokemon-unbound-save-editor/frontend/scripts/party-save-regression.mjs) validating 100% field roundtrip correctness.
  * Implemented `/party/{slot}/edit-full` endpoint in [`backend/main.py`](file:///d:/Elfinix/Shared/pokemon-unbound-save-editor/backend/main.py).

---

### 🔹 Step 8: PokemonEditorModal Modularization & Scoped Logger
* **Commit / Working Tree:** Latest
* **Changes:**
  * Deconstructed monolithic ~1,700-line `PokemonEditorModal.jsx` into modular components under [`frontend/src/components/PokemonEditor/`](file:///d:/Elfinix/Shared/pokemon-unbound-save-editor/frontend/src/components/PokemonEditor):
    * [**`StatsTab.jsx`**](file:///d:/Elfinix/Shared/pokemon-unbound-save-editor/frontend/src/components/PokemonEditor/StatsTab.jsx): IVs/EVs matrix, stat bars, quick IV/EV presets, in-battle preview calculations, Level adjusters, Nature dropdown, and Ability selector.
    * [**`ItemsTab.jsx`**](file:///d:/Elfinix/Shared/pokemon-unbound-save-editor/frontend/src/components/PokemonEditor/ItemsTab.jsx): Searchable Held Item combobox with sprite previews and Custom Caught Poké Ball dropdown picker.
    * [**`MovesTab.jsx`**](file:///d:/Elfinix/Shared/pokemon-unbound-save-editor/frontend/src/components/PokemonEditor/MovesTab.jsx) & [**`PkHexMoveRow.jsx`**](file:///d:/Elfinix/Shared/pokemon-unbound-save-editor/frontend/src/components/PokemonEditor/PkHexMoveRow.jsx): 4-slot PKHeX-style move manager with type badges, searchable move pickers, PP inputs, PP Up increments, and "Max All PP".
    * [**`InfoTab.jsx`**](file:///d:/Elfinix/Shared/pokemon-unbound-save-editor/frontend/src/components/PokemonEditor/InfoTab.jsx): Nickname editor (with auto species name sync), searchable Species selector, Dex flag controls (Seen/Caught), Shiny toggle card, Gender selector pills, and Happiness slider.
    * [**`ShowdownImportSection.jsx`**](file:///d:/Elfinix/Shared/pokemon-unbound-save-editor/frontend/src/components/PokemonEditor/ShowdownImportSection.jsx): Smogon / Showdown set import area with resolution diagnostics and warning notices.
    * [**`constants.js`**](file:///d:/Elfinix/Shared/pokemon-unbound-save-editor/frontend/src/components/PokemonEditor/constants.js): Shared type styling tokens, abbreviations, bounds (`EV_STAT_MAX`, `EV_TOTAL_MAX`, `MIN_LEVEL`, `MAX_LEVEL`), and utility calculations.
    * [**`PokemonEditorModal.jsx`**](file:///d:/Elfinix/Shared/pokemon-unbound-save-editor/frontend/src/components/PokemonEditor/PokemonEditorModal.jsx): Clean container modal coordinating active tabs, Showdown import/export, and save confirmations.
    * [**`PokemonEditorModal.jsx`** (root re-export)](file:///d:/Elfinix/Shared/pokemon-unbound-save-editor/frontend/src/components/PokemonEditorModal.jsx): Re-export wrapper maintaining 100% backwards compatibility for imports.
  * Created color-coded DevTools logger at [`frontend/src/utils/logger.js`](file:///d:/Elfinix/Shared/pokemon-unbound-save-editor/frontend/src/utils/logger.js):
    * Scopes: `[PUSE:Editor]`, `[PUSE:Party]`, `[PUSE:PC]`, `[PUSE:Bag]`, `[PUSE:Save]`, `[PUSE:*:ERROR]`.
    * Integrated across `App.jsx`, `PokemonEditorModal.jsx`, and `apiClient.js`.

---

### 🔹 Step 9: Sidebar Reorganization, Moves Wiki & Gen 8 Move Metadata Parity
* **Working Tree:** Latest
* **Changes:**
  * Reorganized [`Sidebar.jsx`](file:///d:/Elfinix/Shared/pokemon-unbound-save-editor/frontend/src/components/Sidebar.jsx) into two dedicated categories:
    * **TEAM BUILDING**: Party, PC Box, Bag, Living Dex.
    * **TOOLS**: Coverage, Moves Wiki, All Pokémon.
  * Created comprehensive battle encyclopedia component [`frontend/src/components/MovesWiki.jsx`](file:///d:/Elfinix/Shared/pokemon-unbound-save-editor/frontend/src/components/MovesWiki.jsx):
    * Fast search by move name, ID, or typing.
    * Filter chips by 18 Pokémon types and Category (Physical, Special, Status).
    * Quick toggle for Gen 8+ / CFRU moves.
    * Dual view modes: **Grid Card view** (with power bars and accuracy pills) and **Compact Table view**.
    * Responsive pagination with customizable page sizing.
  * Fixed Gen 8 (CFRU) moves dataset across all locations (`moves_meta.json` in backend, frontend, and homebrew):
    * Corrected **Triple Arrows** (ID: 758) from placeholder Normal type &rarr; **Fighting** type (`Physical`, `90 Power`, `100 Acc`, `15 PP`).
    * Corrected all 89 Gen 8/Hisui moves (IDs 678–766: *Triple Axel*, *Wicked Blow*, *Surging Strikes*, *Scale Shot*, *Grassy Glide*, *Glacial Lance*, *Astral Barrage*, *Ceaseless Edge*, etc.) with authentic types, power, accuracy, and split categories.

---

### 🔹 Step 10: Moves Wiki QoL, Move Split Parity & Dual-File Safety Backup
* **Working Tree:** Latest
* **Changes:**
  * **Moves Wiki QoL & Interactive Sorting:**
    * Changed default view mode to **Table / List view** for high-density browsing.
    * Added 3-state interactive column header sorting (`asc` $\to$ `desc` $\to$ `off` / ID order) across `#`, `Move Name`, `Type`, `Category`, `Power`, `Accuracy`, and `Base / Max PP` with visual indicator icons.
  * **Global Move Split & Stat Parity:**
    * Fixed legacy bug where undefined split moves defaulted to Physical. Cross-referenced all **766 standard battle moves** against the official Showdown database.
    * Corrected status/special categories (e.g. *Instruct*, *Telekinesis*, *Trick Room*, *Psychic Terrain*, *Heal Block*, *Swords Dance*, *Whirlwind*) across `backend/data/moves_meta.json`, `frontend/src/core/movesMeta.json`, `frontend/public/data/moves_meta.json`, and `switch-homebrew/romfs/data/moves_meta.json`.
  * **Dual-File Safety Backup Download System:**
    * Enhanced `downloadSave()` in both standalone local engine ([`apiClient.js`](file:///d:/Elfinix/Shared/pokemon-unbound-save-editor/frontend/src/services/apiClient.js)) and FastAPI backend ([`main.py`](file:///d:/Elfinix/Shared/pokemon-unbound-save-editor/backend/main.py)).
    * When saving, the application automatically downloads **two** files simultaneously:
      1. `<name>.sav`: The modified save binary with recalculated section checksums.
      2. `<name>.sav.bak`: The original, untouched save binary loaded into memory as a safety backup.
    * Updated [`SaveReportModal.jsx`](file:///d:/Elfinix/Shared/pokemon-unbound-save-editor/frontend/src/components/SaveReportModal.jsx) and [`Sidebar.jsx`](file:///d:/Elfinix/Shared/pokemon-unbound-save-editor/frontend/src/components/Sidebar.jsx) to indicate dual-file export with `.bak` safety retention.

---

### 🔹 Step 11: IV Display Formatting & EV Input Selector Fix
* **Working Tree:** Latest
* **Changes:**
  * **IV Zero Formatting ("00"):**
    * Updated [`PokemonCard.jsx`](file:///d:/Elfinix/Shared/pokemon-unbound-save-editor/frontend/src/components/PokemonCard.jsx), [`StatsTab.jsx`](file:///d:/Elfinix/Shared/pokemon-unbound-save-editor/frontend/src/components/PokemonEditor/StatsTab.jsx), and [`AllPokemonTable.jsx`](file:///d:/Elfinix/Shared/pokemon-unbound-save-editor/frontend/src/components/AllPokemonTable.jsx) to display `0` IVs as `"00"`, creating uniform 2-digit alignment across all stat bars and matrices.
  * **EV Input Leading Zero Normalization:**
    * Fixed React controlled number input desynchronization in [`StatsTab.jsx`](file:///d:/Elfinix/Shared/pokemon-unbound-save-editor/frontend/src/components/PokemonEditor/StatsTab.jsx).
    * Implemented auto-select on focus (`onFocus={(e) => e.target.select()}`) so typing immediately replaces initial `0` without creating values like `023`.
    * Added numeric input normalization stripping leading zeros (`raw.replace(/^0+(?=\d)/, '')`) on change and blur.
    * Added keyboard arrow navigation (`ArrowUp` / `ArrowDown`) supporting standard +4 EV steps and Shift-modified +10 jumps.

---

## 3. Architecture & Directory Structure

```text
pokemon-unbound-save-editor/
├── backend/
│   ├── main.py                       # FastAPI backend server with save endpoints
│   ├── data/                         # ROM data tables (moves, species, items, abilities)
│   └── scripts/                      # Standalone ROM patcher CLI scripts
│       ├── patch_species_type.py     # Edits ROM species primary & secondary types
│       ├── patch_species_ability.py  # Edits ROM species abilities (1, 2, HA)
│       └── patch_species_stat.py     # Edits ROM species base stats
├── docs/                             # Centralized project documentation
│   ├── DEV_CHANGES.md                # Development changes and architecture log (this file)
│   ├── HEADCANON_CHANGES.md          # Gameplay balance and ROM modification audit trail
│   ├── CHANGELOG.md                  # Release version changelog
│   ├── RULES.md                      # Codebase development rules & guidelines
│   └── SAVE_REPORT.md                # Save checksum & section documentation
├── frontend/
│   ├── src/
│   │   ├── App.jsx                   # Main application container & state router
│   │   ├── utils/
│   │   │   └── logger.js             # Structured DevTools debug logger
│   │   ├── services/
│   │   │   ├── apiClient.js          # Unified local-engine & backend client bridge
│   │   │   └── allPokemon.js         # Unified roster indexer (Party + PC boxes)
│   │   ├── core/
│   │   │   ├── party.js              # In-memory save party parsing & byte writing
│   │   │   ├── pc.js                 # PC box parsing, moving, and release logic
│   │   │   ├── bag.js                # Bag pocket offsets & slot encoders
│   │   │   ├── battlePreview.js      # Stat formula calculations & nature modifiers
│   │   │   └── typeChart.js          # 18-type effectiveness matrix
│   │   └── components/
│   │       ├── PokemonEditor/        # Modular Pokémon Editor Tabs
│   │       │   ├── StatsTab.jsx      # IVs/EVs/Base/Battle stats & Natures
│   │       │   ├── ItemsTab.jsx      # Held Items & Poké Balls
│   │       │   ├── MovesTab.jsx      # Move manager & PP Up modifiers
│   │       │   ├── PkHexMoveRow.jsx  # Individual move row with combobox
│   │       │   ├── InfoTab.jsx       # Nicknames, Species, Dex, Shiny, Gender
│   │       │   ├── ShowdownImportSection.jsx # Smogon set parser UI
│   │       │   └── constants.js      # Type tokens & boundary limits
│   │       ├── CoverageView.jsx      # Team type synergy matrix
│   │       ├── MovesWiki.jsx         # Pokémon Moves encyclopedia & search table
│   │       ├── ConfirmModal.jsx      # Glassmorphic confirmation dialogs
│   │       ├── ToastContainer.jsx    # Toast notification queue
│   │       ├── Sidebar.jsx           # App navigation sidebar with grouped sections
│   │       └── TopHeader.jsx         # Status bar, money/BP, and mode switchers
│   └── scripts/                      # Automated Node.js regression test suite
```

---

## 4. Verification & Regression Checklist

All core systems are verified against the automated test suite before every release:

- [x] **ESLint Linting**: 0 errors, 0 warnings (`npm run lint`).
- [x] **Vite Production Build**: Verified bundle compilation (`npm run build`).
- [x] **Party Save Regression**: 100% pass across all substruct fields (`node scripts/party-save-regression.mjs`).
- [x] **Bag Zero Quantity**: Verified slot clearing & compacting removal (`node scripts/bag-zero-quantity-regression.mjs`).
- [x] **Battle Preview Calculation**: Stat calculation verified against Gen 3/8 standard formulas (`node scripts/battle-preview-regression.mjs`).
- [x] **PC Release & Mutation**: Box context verified (`node scripts/pc-release-regression.mjs`).
- [x] **Pokédex Flags**: Seen/Caught bitmask synchronization verified (`node scripts/pokedex-flags-regression.mjs`).
- [x] **RTC Parity & Time Fixer**: Checksum and footer preservation verified (`node scripts/rtc-time-fixer-regression.mjs`).
