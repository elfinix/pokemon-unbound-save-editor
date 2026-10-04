# Pokémon Unbound — Discovered Technical Limitations

This document records architectural, engine, and binary-level limitations discovered while modifying Pokémon Unbound (CFRU engine).

---

## 1. Ability System Limitations

### ⚠️ Presentation Layer vs. Battle Engine Layer Separation

In Pokémon Unbound (built upon the Complete FireRed Upgrade / CFRU engine), the ability system is strictly divided into two distinct components:

```
┌────────────────────────────────────────────────────────┐
│               PRESENTATION LAYER (ROM Data)            │
│  • gAbilityNames (0xA363A9)         → UI Names         │
│  • gAbilityDescriptions (0x96DE04) → Summary Text      │
│  • gSpeciesTable (0x19E0CB8)       → Species Ability   │
│  (Modifying this updates Save Editor & summary cards) │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│          BATTLE ENGINE LAYER (Compiled C Code)         │
│  • Contact handlers, stat modifiers, damage hooks      │
│  • Hardcoded enum checks:                              │
│      switch (ability) {                                │
│          case ABILITY_ROUGHSKIN: ...                   │
│          case ABILITY_STATIC: ...                      │
│          case ABILITY_UNUSED_77: [No Code - No-op]     │
│      }                                                 │
└────────────────────────────────────────────────────────┘
```

---

### 1.1 Unused / Dummy Slots Lack Battle Routines
* **Finding**: Patching `gAbilityNames` and `gAbilityDescriptions` on unassigned or placeholder ability slots (e.g., Slot `#77` or `#255`) updates the in-game summary card and Save Editor dropdowns, but **produces zero battle effect**.
* **Reason**: The battle engine is compiled ARM Thumb machine code. Unused slots have no battle routines or switch-case branches compiled into the binary, causing the engine to treat them as blank/inert passives.

---

### 1.2 Compound Dual Mechanics Require C-Source Recompilation
* **Finding**: Creating brand-new compound abilities that merge two distinct mechanics into one slot (e.g., *Static Scales* = *Rough Skin* chip damage + *Static* paralysis on contact) cannot be achieved via ROM data table edits alone.
* **Reason**: Triggering multiple sequential battle scripts (damage calculation + status condition animation) requires writing compound handler functions in CFRU C source (`src/battle_abilities.c`) and recompiling with the devkitARM toolchain.
* **Limitation**: Because Pokémon Unbound is a closed-source ROM hack (private codebase by Skeli), recompiling the entire game from C source is not possible.

---

### 1.3 Ability Description Text Formatting
* **Finding**: Do **NOT** use explicit line breaks (`\n` / `0xFE`) in ability descriptions.
* **Reason**: In Pokémon Unbound's summary screen, the Ability Name header is rendered inside the top portion of the info card. Inserting a manual newline causes the second line of text to overflow and clip past the bottom boundary of the card.
* **Standard**: Keep all ability descriptions as **single continuous lines** between **30–45 characters**. The game engine handles text placement natively.

---

### 1.4 Established Workarounds for Playthroughs
When custom flavor or abilities are desired:

1. **Rebrand Active Slots**: Rename an existing functional ability in `gAbilityNames` (e.g., rename `#24: Rough Skin` or `#260: Iron Barbs` to your desired name). It retains full 1/8 contact damage mechanics while displaying your custom name everywhere.
2. **Use Pre-Compiled Custom Slots**: Unbound already contains 22 custom abilities (Slots `#271–292`) with dedicated in-battle routines (e.g. *Dusty Scales*, *Nine Lives*, *Royal Roar*, *Tangling Wool*).
3. **Assign Established Functional Abilities**: Bind species to working abilities with full battle logic (e.g., `#90: Magic Bounce`, `#124: Sand Rush`, `#121: Gooey`, `#95: Sand Force`).
