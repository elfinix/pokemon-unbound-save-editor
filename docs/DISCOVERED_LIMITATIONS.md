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

### 1.2 CFRU Battle Engine Subsystem Complexity & Binary Hooking Limits
* **Finding**: Injecting custom Thumb assembly dispatchers to bind brand-new ability IDs into the closed-source CFRU engine faces profound architectural hurdles.
* **Architecture Details**:
  * CFRU completely deprecates and bypasses vanilla FireRed passive ability check routines (e.g. `CheckContactPassiveAbilities` at `0x08A2F278`).
  * In CFRU, abilities are dispatched via a centralized master function: `AbilityBattleEffects(u8 caseID, u8 bank, u8 ability, u8 special, u16 moveArg)` located at `0x089E59A0`.
  * Dispatching occurs across numbered cases:
    * `case 0`: `ABILITYEFFECT_ON_SWITCHIN` (Intimidate, Weather, Terrain)
    * `case 1`: `ABILITYEFFECT_ENDTURN` (Speed Boost, Bad Dreams, Harvest)
    * `case 2`: `ABILITYEFFECT_MOVES_BLOCK` (Soundproof, Bulletproof, Dazzling)
    * `case 3`: `ABILITYEFFECT_ABSORBING` (Volt Absorb, Water Absorb, Flash Fire, Sap Sipper)
    * `case 4`: `ABILITYEFFECT_CONTACT` / `MOVE_END` (Rough Skin, Effect Spore, Poison Point, Static, Cute Charm)
    * `case 5`: `ABILITYEFFECT_IMMUNITY`
* **Why Injecting New Slots Fails at Runtime**:
  * CFRU battle turns rely on intricate multi-stage state machines spread across dozens of modules (`cmd49.c`, `ability.c`, `battle_util.c`, `battle_anim.c`).
  * In addition to running battle scripts, CFRU expects abilities to update numerous internal engine structures (`gLastUsedAbility`, `gNewBS`, `BATTLE_HISTORY->abilities`, `gBattleExecBuffer`, `gBattleCommunication`, `gBattleScripting.bank`).
  * Hooking a single entry point (such as `AbilityBattleEffects`) cannot satisfy all cross-module preconditions, resulting in skipped battle triggers or engine state desyncs.

---

### 1.3 Compound Dual Mechanics Require C-Source Recompilation
* **Finding**: Creating brand-new compound abilities that merge two distinct mechanics into one slot (e.g., *Static Scales* = *Rough Skin* chip damage + *Static* paralysis on contact) cannot be achieved via ROM data table edits alone.
* **Reason**: Triggering multiple sequential battle scripts (damage calculation + status condition animation) requires writing compound handler functions in CFRU C source (`src/battle_abilities.c`) and recompiling with the devkitARM toolchain.
* **Limitation**: Because Pokémon Unbound is a closed-source ROM hack (private codebase by Skeli), recompiling the entire game from C source is not possible.

---

### 1.4 Ability Description Text Formatting
* **Finding**: Do **NOT** use explicit line breaks (`\n` / `0xFE`) in ability descriptions.
* **Reason**: In Pokémon Unbound's summary screen, the Ability Name header is rendered inside the top portion of the info card. Inserting a manual newline causes the second line of text to overflow and clip past the bottom boundary of the card.
* **Standard**: Keep all ability descriptions as **single continuous lines** between **30–45 characters**. The game engine handles text placement natively.

---

### 1.5 Type Absorption Parameter Edits (Validated & Feasible)
* **Finding**: Existing single-mechanism abilities can have their core target constants (such as absorbed move types) modified directly in compiled code with 100% battle stability.
* **Test Case (Ghost-type Volt Absorb)**:
  * Engine location: `AbilityBattleEffects(case 3 - ABILITYEFFECT_ABSORBING)` at `0x009A74FE`.
  * Changed: `cmp r6, #0x0D` (`TYPE_ELECTRIC`) &rarr; `cmp r6, #0x07` (`TYPE_GHOST`).
  * AI Usability location: `0x00A1BBA2` changed `cmp r3, #0x0D` &rarr; `cmp r3, #0x07`.
  * **Result**: When hit by Ghost-type moves, the ability triggers natively—displays the ability pop-up banner, restores 25% Max HP with green recovery animation, cancels damage, and AI avoids using Ghost moves against the user.
* **Global Scope Caveat**: Because ability routines are shared globally across the ROM, changing an existing ability's parameter alters the mechanic for all Pokémon possessing that ability ID (e.g., Jolteon, Lanturn).

---

### 1.6 Switch-In Multi-Target Script Hooks vs. Single-Instruction Engine Modifiers
* **Finding**: Direct instruction edits to existing absorption routines are vastly more reliable than injecting brand-new multi-target switch-in battle scripts.
* **Reason**: Switch-in abilities (like *Intimidate*) require complex bytecode state machines (`BattleScript_AbilityPopUp`, `trygetintimidatetarget`, `jumpifbehindsubstitute`, multi-battler loops, `intimidateBank`, `intimidateActive`). Single-instruction absorption modifications simply change a type filter byte in the already-compiled native C routine.

---

### 1.7 Proven Best Practices for Custom Playthroughs
To ensure 100% stable in-battle execution without engine crashes or silent no-ops:

1. **Rebrand & Tweak Existing Functional Abilities (Recommended)**:
   * Rename an existing compiled ability in `gAbilityNames` (e.g., rename `#24: Rough Skin`, `#18: Flash Fire`, or `#260: Iron Barbs` to your custom headcanon name).
   * Tweak underlying parameters (e.g. absorbed type ID, damage ratios) directly in ROM instructions.
   * Result: 100% native battle animation, pop-up banner, and flawless engine stability.
2. **Assign Established Functional Abilities to Species**:
   * Modify the species base stats table (`gSpeciesTable` at `0x19E0CB8`) to assign existing working abilities (e.g., `#90: Magic Bounce`, `#124: Sand Rush`, `#121: Gooey`, `#95: Sand Force`) to primary, secondary, or hidden ability slots.
3. **Utilize Unbound's 22 Native Custom Abilities (Slots #271–292)**:
   * Unbound includes 22 custom abilities compiled natively into the ROM engine (e.g., *Dusty Scales*, *Nine Lives*, *Royal Roar*, *Tangling Wool*, *Mega Launcher*).


