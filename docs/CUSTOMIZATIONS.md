# Pokémon Unbound — Ability Customization Menu & Headcanon Reference

This document serves as your complete **customization menu** for ability modding in Pokémon Unbound. Every ability listed below is backed by **functional battle engine code** compiled in the ROM. 

You can pick any archetype from this menu, rebrand it with your custom name/description, tweak its parameters (elements, multipliers, thresholds), and bind it to your Pokémon.

---

## 📋 Table of Contents
1. [Type Manipulation & Absorption (The Elemental Archetypes)](#1-type-manipulation--absorption-the-elemental-archetypes)
2. [Contact Triggers & Retaliation (The Punisher Archetypes)](#2-contact-triggers--retaliation-the-punisher-archetypes)
3. [Stat Multipliers, Crits & Offensive Powerhouses](#3-stat-multipliers-crits--offensive-powerhouses)
4. [Weather, Terrain & Field Surges](#4-weather-terrain--field-surges)
5. [Defensive Shields, Priority & Tactical Utility](#5-defensive-shields-priority--tactical-utility)
6. [Type Converters ("-ate" Abilities)](#6-type-converters--ate-abilities)
7. [Unbound's 22 Built-In Custom Abilities (Slots #271–292)](#7-unbounds-22-built-in-custom-abilities-slots-271292)
8. [Headcanon Rebranding & Blueprint Recipe](#8-headcanon-rebranding--blueprint-recipe)

---

## 1. Type Manipulation & Absorption (The Elemental Archetypes)

These abilities intercept incoming attacks of a specific type and convert them into healing or stat boosts. The target element can be re-pointed to **any of the 18 Pokémon types** (Ice, Dragon, Fairy, Ghost, etc.).

### 🛡️ Type Absorption (Heals 25% Max HP)
| Ability | ID | Default Type | Modifiable Parameter | Battle Effect |
| :--- | :---: | :---: | :--- | :--- |
| **Volt Absorb** | `#10` | Electric (`13`) | Target Element ID | Negates damage; heals **25% Max HP** on hit. |
| **Water Absorb** | `#11` | Water (`11`) | Target Element ID | Negates damage; heals **25% Max HP** on hit. |
| **Dry Skin** | `#98` | Water (`11`) | Target Element ID | Heals 25% from Water + heals in Rain (Fire weakness). |

### ⚔️ Type Immunity & Offensive Boost
| Ability | ID | Default Type | Modifiable Parameter | Battle Effect |
| :--- | :---: | :---: | :--- | :--- |
| **Flash Fire** | `#18` | Fire (`10`) | Target Element ID | Negates damage; grants **1.5x damage boost** to that type. |
| **Sap Sipper** | `#113` | Grass (`12`) | Target Element ID | Negates damage; boosts **Attack by +1 stage**. |
| **Motor Drive** | `#80` | Electric (`13`) | Target Element ID | Negates damage; boosts **Speed by +1 stage**. |
| **Lightning Rod** | `#31` | Electric (`13`) | Target Element ID | Redirects single-target moves; boosts **Sp. Atk by +1**. |
| **Storm Drain** | `#131` | Water (`11`) | Target Element ID | Redirects single-target moves; boosts **Sp. Atk by +1**. |

### 🪽 Ground & Hazard Immunity
| Ability | ID | Default Type | Modifiable Parameter | Battle Effect |
| :--- | :---: | :---: | :--- | :--- |
| **Levitate** | `#26` | Ground (`4`) | Target Element ID | Complete immunity to Ground moves, Spikes, Toxic Spikes, and Arena Trap. |

---

## 2. Contact Triggers & Retaliation (The Punisher Archetypes)

Abilities that trigger automatically whenever an opponent hits the Pokémon with a physical/contact move.

### 🩸 Chip Damage on Contact
| Ability | ID | Default Damage | Modifiable Parameter | Battle Effect |
| :--- | :---: | :---: | :--- | :--- |
| **Rough Skin** | `#24` | `1/8 (12.5%)` | Damage fraction (`1/8`, `1/6`, `1/4`) | Attacker loses 1/8 Max HP upon physical contact. |
| **Iron Barbs** | `#260` | `1/8 (12.5%)` | Damage fraction (`1/8`, `1/6`, `1/4`) | Attacker loses 1/8 Max HP upon physical contact. |

### ⚡ Status Conditions on Contact
| Ability | ID | Status | Default Chance | Modifiable Parameter | Battle Effect |
| :--- | :---: | :---: | :---: | :--- | :--- |
| **Static** | `#9` | Paralysis | `30%` | Proc Chance (`30%` $\to$ `50%` $\to$ `100%`) | Paralyzes physical attackers on contact. |
| **Flame Body** | `#49` | Burn | `30%` | Proc Chance (`30%` $\to$ `50%` $\to$ `100%`) | Burns physical attackers on contact. |
| **Poison Point** | `#38` | Poison | `30%` | Proc Chance (`30%` $\to$ `50%` $\to$ `100%`) | Poisons physical attackers on contact. |
| **Poison Touch** | `#209` | Poison | `30%` | Proc Chance (`30%` $\to$ `50%` $\to$ `100%`) | Poisons the target when *this Pokémon* makes contact. |
| **Cute Charm** | `#56` | Infatuation | `30%` | Proc Chance (`30%` $\to$ `50%` $\to$ `100%`) | Infatuates opposite-gender attackers on contact. |
| **Effect Spore** | `#27` | Sleep/Psn/Para | `30%` | Proc Chance & Distribution | Inflicts random status on contact. |

### 🐌 Stat Debuffs & Disruption on Contact
| Ability | ID | Target Stat | Battle Effect |
| :--- | :---: | :---: | :--- |
| **Gooey** | `#121` | Speed (`-1`) | Lowers attacker's Speed by 1 stage on contact. |
| **Tangling Hair** | `#266` | Speed (`-1`) | Lowers attacker's Speed by 1 stage on contact. |
| **Cotton Down** | `#241` | Speed (`-1 All`) | Lowers all other Pokémon's Speed by 1 stage when hit. |
| **Mummy** | `#122` | Ability Overwrite | Overwrites attacker's ability with Mummy on contact. |
| **Wandering Soul** | `#164` | Ability Swap | Swaps abilities with the attacker on contact. |
| **Pickpocket** | `#207` | Item Steal | Steals the attacker's held item upon contact. |
| **Perish Body** | `#163` | Perish Song | Both Pokémon faint in 3 turns after contact. |

---

## 3. Stat Multipliers, Crits & Offensive Powerhouses

Abilities that multiply offensive/defensive stats, enhance move categories, or provide massive damage spikes.

### 💥 Raw Multipliers & Threshold Boosts
| Ability | ID | Default Value | Modifiable Parameter | Battle Effect |
| :--- | :---: | :---: | :--- | :--- |
| **Huge Power / Pure Power** | `#37` / `#259` | `2.0x` Attack | Multiplier (`1.5x` $\to$ `2.5x`) | **Doubles the Pokémon's raw Attack stat**. |
| **Fur Coat** | `#148` | `2.0x` Defense | Multiplier (`1.5x` $\to$ `2.0x`) | **Doubles the Pokémon's raw Defense stat**. |
| **Overgrow / Blaze / Torrent / Swarm** | `#65`–`#68` | $\le 33\%$ HP | Activation Threshold | Boosts Grass/Fire/Water/Bug moves by **1.5x** (can be made always active). |

### 🎯 Move Enhancers & Critical Hits
| Ability | ID | Multiplier / Focus | Battle Effect |
| :--- | :---: | :---: | :--- |
| **Adaptability** | `#88` | `2.0x` (up from 1.5x) | Increases Same-Type Attack Bonus (STAB) from **1.5x $\to$ 2.0x**. |
| **Technician** | `#82` | `1.5x` ($\le 60$ BP) | Boosts all moves with $\le 60$ Base Power by **1.5x**. |
| **Tough Claws** | `#128` | `1.3x` Contact | Boosts all contact moves by **1.3x**. |
| **Strong Jaw** | `#129` | `1.5x` Biting | Boosts Bite, Crunch, Psychic Fangs, etc. by **1.5x**. |
| **Mega Launcher** | `#127` | `1.5x` Pulse/Aura | Boosts Dragon Pulse, Dark Pulse, Water Pulse, Aura Sphere by **1.5x**. |
| **Iron Fist** | `#93` | `1.2x` Punching | Boosts all punching moves by **1.2x**. |
| **Punk Rock** | `#246` | `1.3x` Sound | Boosts sound moves by 1.3x; halves incoming sound damage. |
| **Sheer Force** | `#92` | `1.3x` (Secondary) | Removes move secondary effects to boost damage by **1.3x**. |
| **Sniper** | `#85` | `2.25x` Crits | Increases Critical Hit damage from **1.5x $\to$ 2.25x** (or 3.0x). |
| **Super Luck** | `#84` | `+1` Crit Stage | Increases critical hit ratio by +1 stage. |

### 🧪 Status-Activated Powerhouses
| Ability | ID | Boosted Stat | Battle Effect |
| :--- | :---: | :---: | :--- |
| **Guts** | `#62` | Attack (`1.5x`) | Increases Attack by **1.5x** when statused (ignores burn Attack drop). |
| **Marvel Scale** | `#63` | Defense (`1.5x`) | Increases Defense by **1.5x** when statused. |
| **Quick Feet** | `#112` | Speed (`1.5x`) | Increases Speed by **1.5x** when statused (ignores paralysis Speed drop). |
| **Toxic Boost** | `#146` | Attack (`1.5x`) | Increases Physical Attack by **1.5x** when Poisoned. |
| **Flare Boost** | `#147` | Sp. Atk (`1.5x`) | Increases Special Attack by **1.5x** when Burned. |

---

## 4. Weather, Terrain & Field Surges

### 🌦️ Auto-Weather & Terrain Summoners (Enter Battle)
| Ability | ID | Weather / Terrain | Duration | Effect |
| :--- | :---: | :---: | :---: | :--- |
| **Drizzle** | `#2` | Rain | 5 Turns | Boosts Water (1.5x), weakens Fire (0.5x), 100% Thunder/Hurricane. |
| **Drought** | `#70` | Sun | 5 Turns | Boosts Fire (1.5x), weakens Water (0.5x), 1-turn Solar Beam. |
| **Sand Stream** | `#45` | Sandstorm | 5 Turns | Chips non-Rock/Ground/Steel; **+50% Sp. Def for Rock types**. |
| **Snow Warning** | `#111` | Snow / Hail | 5 Turns | 100% Blizzard; **+50% Defense for Ice types**. |
| **Electric Surge** | `#181` | Electric Terrain | 5 Turns | Boosts Electric (1.3x); prevents Sleep. |
| **Grassy Surge** | `#182` | Grassy Terrain | 5 Turns | Boosts Grass (1.3x); heals 1/16 HP per turn; halves Bulldoze/EQ. |
| **Misty Surge** | `#183` | Misty Terrain | 5 Turns | Halves Dragon damage; prevents all status conditions. |
| **Psychic Surge** | `#184` | Psychic Terrain | 5 Turns | Boosts Psychic (1.3x); blocks priority moves. |

### ⚡ Field Condition Synergies
| Ability | ID | Required Field | Battle Effect |
| :--- | :---: | :---: | :--- |
| **Swift Swim** | `#33` | Rain | **Doubles Speed** in Rain. |
| **Chlorophyll** | `#34` | Sun | **Doubles Speed** in Sun. |
| **Sand Rush** | `#124` | Sandstorm | **Doubles Speed** in Sandstorm; immune to sand chip. |
| **Slush Rush** | `#171` | Snow / Hail | **Doubles Speed** in Snow/Hail; immune to hail chip. |
| **Surge Surfer** | `#185` | Electric Terrain | **Doubles Speed** on Electric Terrain. |
| **Sand Force** | `#95` | Sandstorm | Boosts Ground, Rock, and Steel attacks by **1.3x** in Sand. |
| **Solar Power** | `#96` | Sun | Boosts Special Attack by **1.5x** in Sun (costs 1/8 HP/turn). |

---

## 5. Defensive Shields, Priority & Tactical Utility

### 🛡️ Shields, Hazard Control & Survival
| Ability | ID | Category | Battle Effect |
| :--- | :---: | :---: | :--- |
| **Magic Bounce** | `#90` | Reflection | **Reflects all status moves, hazards (Stealth Rock/Spikes), Taunt, and debuffs**. |
| **Magic Guard** | `#115` | Immunity | **Immune to all indirect/passive damage** (Poison, Burn, Hazards, Weather, Life Orb recoil). |
| **Sturdy** | `#5` | Survival | Survives lethal hits with 1 HP from full health; immune to 1-hit KO moves. |
| **Disguise** | `#159` | Free Shield | Takes 0 damage from the first attack received. |
| **Multiscale / Shadow Shield** | `#81` / `#169` | Damage Halving | **Halves all incoming damage** when at full HP. |
| **Ice Scales** | `#248` | Special Halving | **Halves all incoming Special damage**. |
| **Filter / Solid Rock / Prism Armor** | `#101` / `#261` / `#166` | Weakness Guard | Reduces Super Effective damage by **25%**. |
| **Fluffy** | `#161` | Physical Halving | Halves damage from contact moves (takes 2x from Fire). |

### ⏩ Priority & Turn Manipulation
| Ability | ID | Boosted Class | Battle Effect |
| :--- | :---: | :---: | :--- |
| **Prankster** | `#87` | Status Moves | Grants **+1 Priority** to all non-damaging/status moves. |
| **Gale Wings** | `#117` | Flying Moves | Grants **+1 Priority** to Flying-type attacks. |
| **Triage** | `#176` | Healing Moves | Grants **+3 Priority** to all HP recovery moves (Roost, Drain Punch, etc.). |
| **Quick Draw** | `#219` | All Moves | 30% chance to attack first in priority bracket. |

### 🔄 Stat Protection & Inversion
| Ability | ID | Behavior | Battle Effect |
| :--- | :---: | :---: | :--- |
| **Contrary** | `#191` | Inversion | **Inverts all stat changes** (Draco Meteor / Superpower / Overheat give **+2 buffs**!). |
| **Simple** | `#140` | Doubling | **Doubles all stat stage modifications** (Swords Dance gives +4 Attack!). |
| **Defiant** | `#142` | Retaliation | Boosts **Attack by +2** whenever a stat is lowered by the enemy. |
| **Competitive** | `#143` | Retaliation | Boosts **Sp. Atk by +2** whenever a stat is lowered by the enemy. |
| **Clear Body / Full Metal Body** | `#29` / `#175` | Prevention | Prevents opponents from lowering any of this Pokémon's stats. |

### 🩹 Regeneration & Healing
| Ability | ID | Recovery Trigger | Battle Effect |
| :--- | :---: | :---: | :--- |
| **Regenerator** | `#86` | Switch-Out | Restores **33% (1/3) Max HP** upon switching out. |
| **Natural Cure** | `#30` | Switch-Out | Cures all status conditions (Burn, Toxic, Sleep, Para) upon switching out. |
| **Poison Heal** | `#104` | Poisoned | Restores **1/8 Max HP per turn** when Poisoned instead of taking damage. |

---

## 6. Type Converters ("-ate" Abilities)

Converts all Normal-type attacks into another element and boosts their power by 1.2x:

| Ability | ID | Conversion Type | Modifiable Parameter | Battle Effect |
| :--- | :---: | :---: | :--- | :--- |
| **Pixilate** | `#136` | **Fairy** | Destination Type & Multiplier | Normal moves become **Fairy** (boosted by 1.2x). |
| **Refrigerate** | `#135` | **Ice** | Destination Type & Multiplier | Normal moves become **Ice** (boosted by 1.2x). |
| **Aerilate** | `#137` | **Flying** | Destination Type & Multiplier | Normal moves become **Flying** (boosted by 1.2x). |
| **Galvanize** | `#237` | **Electric** | Destination Type & Multiplier | Normal moves become **Electric** (boosted by 1.2x). |
| **Liquid Voice** | `#218` | **Water** | Sound Moves | Sound moves become **Water** type. |
| **Normalize** | `#138` | **Normal** | All Moves | All moves become **Normal** (boosted by 1.2x). |

---

## 7. Unbound's 22 Built-In Custom Abilities (Slots #271–292)

In Pokémon Unbound, Skeli built 22 exclusive custom abilities into the CFRU engine. Rather than inventing unstable new scripting subsystems, these abilities are **natively compiled species-specific clones of powerful engine mechanics** (with custom names and summary descriptions).

They can be assigned to **any Pokémon** using the Save Editor or ROM base stats patcher:

| Ability Name | ID | Underlying Engine Parent | Exact Functional In-Battle Behavior |
| :--- | :---: | :--- | :--- |
| **Nine Lives** | `#271` | **Sturdy** (`#5`) | **Survives any lethal hit with 1 HP** when at full health; grants full immunity to 1-hit KO moves. |
| **Focus Belt** | `#272` | **Sturdy** (`#5`) | **Built-in Focus Sash**. Survives any lethal hit with 1 HP when at full health; immune to OHKO moves. |
| **Evaporate** | `#273` | **Storm Drain** (`#114`) | **Draws in all Water-type moves**, nullifies their damage completely, and **boosts Sp. Atk by +1 stage**. |
| **Fiery Neigh** | `#274` | **Moxie** (`#153`) | **Boosts Attack by +1 stage** every time the Pokémon knocks out an opponent with an attack. |
| **Shocking Neigh** | `#275` | **Moxie** (`#153`) | **Boosts Attack by +1 stage** every time the Pokémon knocks out an opponent with an attack. |
| **Pride** | `#276` | **Moxie** (`#153`) | **Boosts Attack by +1 stage** every time the Pokémon knocks out an opponent with an attack. |
| **Multieye** | `#277` | **Multiscale** (`#81`) | **Halves all incoming direct damage (takes 0.5x)** when the Pokémon is at 100% full HP. |
| **Subterfuge** | `#278` | **Protean / Libero** (`#168`) | **Changes the Pokémon's primary type** to the type of the move it is about to use right before attacking. |
| **Honey Armor** | `#279` | **Dauntless Shield** (`#239`) | **Boosts Defense by +1 stage** immediately upon switching into battle. |
| **Tangling Wool** | `#280` | **Gooey / Tangling Hair** (`#121`) | **Lowers the attacker's Speed by 1 stage** whenever this Pokémon is hit by a physical contact move. |
| **Brain Bond** | `#281` | **Parental Bond** (`#125`) | **All single-target attacks hit twice**; the second strike deals **25% damage** and can trigger secondary effects. |
| **Grass Dash** | `#282` | **Gale Wings** (`#117`) | Grants **+1 Priority to all Grass-type moves** when the Pokémon is at full HP. |
| **Slippery Tail** | `#283` | **Gale Wings (Tail)** (`#117`) | Grants **+1 Priority to all tail-based moves** (e.g. Iron Tail, Aqua Tail, Poison Tail, Dragon Tail) at full HP. |
| **Drill Beak** | `#284` | **Merciless** (`#196`) | **Guarantees 100% Critical Hits** against targets afflicted by status conditions (or drill attacks). |
| **Cotton Cloud** | `#285` | **Cotton Down** (`#246`) | **Lowers the Speed of all other active Pokémon by 1 stage** whenever this Pokémon is damaged by an attack. |
| **Bellow** | `#286` | **Punk Rock** (`#251`) | **Boosts the power of sound-based moves by 1.3x** (30%) and **halves all incoming sound move damage** (takes 0.5x). |
| **Sound Waves** | `#287` | **Punk Rock** (`#251`) | **Boosts the power of sound-based moves by 1.3x** (30%) and **halves all incoming sound move damage** (takes 0.5x). |
| **Icy Skin** | `#288` | **Ice Scales** (`#248`) | **Halves all incoming Special attack damage (takes 0.5x)** regardless of HP percentage. |
| **Dusty Scales** | `#289` | **Ice Scales** (`#248`) | **Halves all incoming Special attack damage (takes 0.5x)** regardless of HP percentage. |
| **Crabby Tactics** | `#290` | **Gorilla Tactics** (`#255`) | **Boosts physical Attack by 1.5x (50%)**, but locks the Pokémon into the first move used until switched out (built-in Choice Band). |
| **Face Shield** | `#291` | **Dauntless Shield** (`#239`) | **Boosts Defense by +1 stage** immediately upon switching into battle. |
| **Royal Roar** | `#292` | **Grim Neigh** (`#240`) | **Boosts Sp. Atk by +1 stage** every time the Pokémon knocks out an opponent with an attack. |

---

## 8. Headcanon Rebranding & Blueprint Recipe

When you want to create a new headcanon ability:

### Step 1: Pick the Battle Engine Mechanic
Select the compiled mechanic from Menus 1–7 above that matches your desired flavor (e.g. *Volt Absorb* for absorption, *Rough Skin* for chip damage, *Magic Bounce* for reflection, *Contrary* for inverted buffs).

### Step 2: Choose Your Custom Name & Description
* **Name**: Max **16 characters** (e.g., `"Static Scales"`, `"Glacial Armor"`, `"Dragon Heart"`).
* **Description**: Max **35–45 characters** on a **single continuous line** without `\n`.

### Step 3: Run the CLI Patcher
```bash
# Example: Rebranding Slot #24 (Rough Skin) to Static Scales with working 1/8 contact damage
python backend/scripts/patch_ability.py --slot 24 --name "Static Scales" --description "Hurts on contact."

# Example: Assigning to Gible's Hidden Ability
python backend/scripts/patch_species_ability.py -s Gible -a "Static Scales" --slot ha
```

### Step 4: Verify in Game
1. The Pokémon summary screen and Save Editor will display your custom name and description.
2. In battle, the ability triggers with complete animations, damage calculations, and battle log messages.
