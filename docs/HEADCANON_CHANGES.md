# Pokémon Unbound — Headcanon & Customization Log

This document tracks all custom balance tweaks, ROM modifications, ability reassignments, and headcanon changes made to the Pokémon Unbound playthrough.

---

## 1. Quick Change Matrix

| Species | ID | Category / Slot | Original Value | Headcanon Value | Status | Date |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Gible** | `#496` | Hidden Ability (`HA`) | Rough Skin (`24`) | **Magic Bounce** (`90`) | 🔄 Reverted (Tested) | 2026-10-03 |
| **Gible** | `#496` | Base Stat / Speed | `42` | **`60`** | ✅ Active | 2026-10-04 |
| **Snorunt** | `#346` | Typing (Dual Type) | Ice (`15`) / Ice (`15`) | **Ice** (`15`) / **Ghost** (`7`) | ✅ Active | 2026-10-04 |

---

## 2. Detailed Change Entries

### [001] Gible (`#496`) — Hidden Ability Overhaul
* **Category:** Species Ability
* **Slot:** Hidden Ability (`HA`) / `Substruct C Bit 31`
* **Original:** `Rough Skin` (ID: `24`)
* **Headcanon:** `Magic Bounce` (ID: `90`)
* **Technical Offsets & References:**
  * **ROM Base Offset:** `0x19E42DC` (`0x19E0CB8 + 495 * 0x1C`)
  * **ROM HA Byte Offset:** `0x19E42F6` (uint16: `0x005A`)
  * **Metadata Synced:** `backend/data/species_abilities_meta.json`, `frontend/src/core/speciesAbilitiesMeta.json`
* **Rationale & Headcanon:**
  * Enhances Gible's utility and thematic dragon-sense by reflecting status moves, hazards, and debuffs back at opponents.
* **Verification Checklist:**
  * [x] ROM patched with automated backup created.
  * [x] PUSE Save Editor metadata synced (displays Magic Bounce for HA slot).
  * [x] In-game HA flag toggled on target save Pokémon.

### [002] Gible (`#496`) — Base Speed Rebalance
* **Category:** Base Stats
* **Slot / Field:** Base Speed (`OFF_SPE: 0x03`)
* **Original:** `42`
* **Headcanon:** `60`
* **Technical Offsets & References:**
  * **ROM Base Offset:** `0x19E42DC` (`0x19E0CB8 + 495 * 0x1C`)
  * **ROM Speed Byte Offset:** `0x19E42DF` (`uint8: 0x3C`)
  * **Metadata Synced:**
    * `backend/data/species_base_stats.json`
    * `frontend/src/core/speciesBaseStats.json`
    * `switch-homebrew/romfs/data/species_base_stats.json`
* **Rationale & Headcanon:**
  * Boosts Gible's early-game agility from a sluggish 42 to a competitive 60 base Speed, making its early evolutionary stage much smoother to train before evolving into Gabite (82 Speed) and Garchomp (102 Speed).
* **Verification Checklist:**
  * [x] ROM patched with automated FIFO backup created.
  * [x] PUSE Save Editor metadata synced (battle previews and stat calculations use 60).
  * [x] In-ROM byte at `0x19E42DF` verified (`42` &rarr; `60`).

### [003] Snorunt (`#346`) — Dual Typing (Ice / Ghost)
* **Category:** Species Typing
* **Slot / Field:** Primary Type (`OFF_TYPE1: 0x06`) / Secondary Type (`OFF_TYPE2: 0x07`)
* **Original:** `Ice` (`15` / `0x0F`) / `Ice` (`15` / `0x0F`) (Mono Ice)
* **Headcanon:** `Ice` (`15` / `0x0F`) / **`Ghost`** (`7` / `0x07`)
* **Technical Offsets & References:**
  * **ROM Base Offset:** `0x19E3274` (`0x19E0CB8 + 345 * 0x1C`)
  * **ROM Type 1 Byte Offset:** `0x19E327A` (`uint8: 0x0F` = Ice)
  * **ROM Type 2 Byte Offset:** `0x19E327B` (`uint8: 0x07` = Ghost)
  * **Metadata Synced:**
    * `backend/data/species_types.json`
    * `frontend/src/core/speciesTypes.json`
    * `switch-homebrew/romfs/data/species_types.json`
    * `3ds-homebrew/romfs/data/species_types.json`
* **Rationale & Headcanon:**
  * Snorunt is based on the *Yukinko* (snow child spirit in Japanese folklore) and directly branches into Froslass (Ice/Ghost). Giving Snorunt the dual Ice/Ghost typing upfront grants it Ghost immunities (Normal/Fighting) and early STAB ghost utility while building natural thematic continuity with Froslass.
* **Verification Checklist:**
  * [x] ROM patched with automated FIFO backup created.
  * [x] In-ROM bytes verified (`0x19E327A: 15`, `0x19E327B: 7`).
  * [x] PUSE Save Editor metadata synced (displays Ice/Ghost badges and updates party coverage calculations).

---

## 3. Technical Specifications & Delimitations Reference

Quick reference for text length limits, ROM struct sizes, and memory table base offsets in Pokémon Unbound (CFRU engine):

### 🔤 String & UI Character Limits

| Field | Hard ROM Limit | UI / Screen Limit | Best Practice Format & Constraints |
| :--- | :---: | :---: | :--- |
| **Move Name** | **12 chars** | 12 chars | Fixed 13-byte array (`0xFF` terminator). Fits 4-slot battle menu without clipping. |
| **Ability Name** | **16 chars** | 16 chars | Fixed 17-byte array in CFRU (`0xFF` terminator). Fits summary box & battle pop-up banner. |
| **Move Description** | Dynamic (Pointer) | **~50–65 chars** | 2 lines max (~25–28 chars/line) separated by `\n` (`0xFE`). Fits battle summary window. |
| **Ability Description** | Dynamic (Pointer) | **~50–60 chars** | 2 lines max (~25–28 chars/line) separated by `\n` (`0xFE`). Fits summary screen box. |
| **Pokémon Nickname** | **10 chars** | 10 chars | 10 GBA characters + `0xFF` terminator in 80-byte save substruct. |
| **OT / Trainer Name** | **7 chars** | 7 chars | 7 GBA characters + `0xFF` terminator in save file Trainer header. |

---

### 🗺️ ROM Table Layouts & Offsets (Unbound 2.1.1.1)

#### 1. Species Data Table (`gSpeciesTable`)
* **Base Offset:** `0x19E0CB8`
* **Entry Size:** `28 bytes (0x1C)` $\to$ `Offset = 0x19E0CB8 + (species_id - 1) * 0x1C`
* **Field Map:**
  * `0x00`: Base HP · `0x01`: Base Attack · `0x02`: Base Defense
  * `0x03`: Base Speed · `0x04`: Base Sp. Atk · `0x05`: Base Sp. Def
  * `0x06`: Primary Type (`OFF_TYPE1`) · `0x07`: Secondary Type (`OFF_TYPE2`)
  * `0x08`: Catch Rate · `0x09`: Base Exp Yield
  * `0x16`: Ability 1 (uint16) · `0x18`: Ability 2 (uint16) · `0x1A`: Hidden Ability (uint16)

#### 2. Battle Moves Table (`gBattleMoves`)
* **Base Offset:** `0xA769BC`
* **Entry Size:** `12 bytes (0x0C)` $\to$ `Offset = 0xA769BC + (move_id - 1) * 0x0C`
* **Field Map:**
  * `0x00`: Base Power (`0–255`)
  * `0x01`: Type ID (`0 = Normal`, `1 = Fighting`, ..., `10 = Fire`, `11 = Water`, `15 = Ice`, `17 = Dark`, `18 = Fairy`)
  * `0x02`: Accuracy (`1–100%`, `0` = Can't miss / Self)
  * `0x03`: Base PP (`1–40`)
  * `0x04`: Secondary Effect Chance (`0–100%`)
  * `0x05`: Target (`0 = Selected Foe`, `4 = All Foes`, `16 = User`, `64 = Entire Field`)
  * `0x06`: Priority (`-7` to `+5`)
  * `0x07`: Flags (`Bit 0: Contact`, `Bit 1: Protect`, `Bit 2: Magic Coat`, `Bit 6: Sound`, `Bit 7: Punch`)
  * `0x08`: Z-Move Power (`100–200`)
  * `0x09`: Category / Split (`0 = Physical`, `1 = Special`, `2 = Status`)
  * `0x0B`: Battle Effect Script ID (Burn, Freeze, Paralyze, Stat Drop, Drain, Recoil, Flinch, etc.)

#### 3. String Name Tables
* **Move Names (`gMoveNames`):** Base `0xA40A1D` (13 bytes / entry)
* **Ability Names (`gAbilityNames`):** Base `0xA363A9` (17 bytes / entry)

---

## 4. Standard Template for New Entries

When adding a new headcanon modification, follow this standard structure:

```markdown
### [XXX] Species/Item/Move Name (`#ID`) — Short Description
* **Category:** [Species Ability | Base Stats | Movepool | Move Properties | Item | Other]
* **Slot / Field:** [e.g. Ability 1 / Hidden Ability / Base Sp.Atk / Move Base Power / Move Split]
* **Original:** `Old Value` (ID: `XX`)
* **Headcanon:** `New Value` (ID: `YY`)
* **Technical Offsets & References:**
  * **ROM Offset:** `0xXXXXXX`
  * **Metadata Synced:** [Files updated]
* **Rationale & Headcanon:**
  * [Why this change was made and the tactical/thematic flavor]
* **Verification Checklist:**
  * [ ] ROM patched & backup verified.
  * [ ] PUSE metadata updated.
  * [ ] In-game behavior verified in battle.
```

