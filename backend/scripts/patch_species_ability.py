#!/usr/bin/env python3
"""
Pokemon Unbound ROM Species Ability Patcher & Backup Manager
============================================================
Safely modifies species abilities (Ability 1, Ability 2, or Hidden Ability)
directly in the Pokemon Unbound GBA ROM, with automated FIFO backup management
and synchronization with PUSE save editor metadata.
"""

from __future__ import annotations

import argparse
import datetime
import json
import os
import re
import shutil
import struct
import sys
from pathlib import Path

# Paths within workspace
WORKSPACE_ROOT = Path(__file__).resolve().parents[2]
BACKEND_DATA_DIR = WORKSPACE_ROOT / "backend" / "data"
FRONTEND_CORE_DIR = WORKSPACE_ROOT / "frontend" / "src" / "core"
SWITCH_DATA_DIR = WORKSPACE_ROOT / "switch-homebrew" / "romfs" / "data"
THREE_DS_DATA_DIR = WORKSPACE_ROOT / "3ds-homebrew" / "romfs" / "data"

def resolve_default_rom_dir() -> Path:
    """Auto-detect ROM folder in workspace or emulator paths."""
    candidates = [
        WORKSPACE_ROOT / "rom",
        WORKSPACE_ROOT / "Pokemon Unbound Official Patch 2.1.1+",
        Path(r"D:\Louis\Emulators\mGBA (GBA)\Pokemon Unbound Official Patch 2.1.1+"),
    ]
    for c in candidates:
        if (c / "Pokemon Unbound.gba").exists() or (c.exists() and any(c.glob("*.gba"))):
            return c
    return candidates[0]

DEFAULT_ROM_DIR = resolve_default_rom_dir()
GBA_FILENAME = "Pokemon Unbound.gba"
SAV_FILENAME = "Pokemon Unbound.sav"

# ROM Table Layout (CFRU / Unbound 2.1.1.1)
SPECIES_STRUCT_SIZE = 0x1C  # 28 bytes per species
OFF_ABILITY_1 = 0x16        # 1 byte
OFF_ABILITY_2 = 0x17        # 1 byte
OFF_HIDDEN_ABILITY = 0x1A   # 2 bytes (uint16 little-endian)

# Anchor pattern for finding Bulbasaur (Species ID 1) in ROM
BULBA_STATS = bytes([45, 49, 49, 45, 65, 65])
IVYSAUR_STATS = bytes([60, 62, 63, 60, 80, 80])
VENUSAUR_STATS = bytes([80, 82, 83, 80, 100, 100])
CHARMANDER_STATS = bytes([39, 52, 43, 65, 60, 50])

MAX_BACKUPS = 5


def load_species_database() -> dict[int, str]:
    """Returns mapping of species_id -> species_name."""
    mapping: dict[int, str] = {}
    
    # Try pokemon.txt
    poke_txt = BACKEND_DATA_DIR / "pokemon.txt"
    if poke_txt.exists():
        for line in poke_txt.read_text(encoding="utf-8", errors="ignore").splitlines():
            line = line.strip()
            if not line or ":" not in line:
                continue
            parts = line.split(":", 1)
            if parts[0].strip().isdigit():
                mapping[int(parts[0].strip())] = parts[1].strip()
    
    # Try speciesConstants.json for fallback / additions
    const_json = FRONTEND_CORE_DIR / "speciesConstants.json"
    if const_json.exists():
        try:
            data = json.loads(const_json.read_text(encoding="utf-8"))
            for k, v in data.items():
                if k.isdigit():
                    sid = int(k)
                    if sid not in mapping:
                        name = re.sub(r"^SPECIES_", "", v).replace("_", " ").title()
                        mapping[sid] = name
        except Exception:
            pass
            
    return mapping


def load_ability_database() -> dict[int, str]:
    """Returns mapping of ability_id -> ability_name."""
    mapping: dict[int, str] = {}
    
    # Try abilities.txt
    ab_txt = BACKEND_DATA_DIR / "abilities.txt"
    if ab_txt.exists():
        for line in ab_txt.read_text(encoding="utf-8", errors="ignore").splitlines():
            line = line.strip()
            if not line or ":" not in line:
                continue
            parts = line.split(":", 1)
            if parts[0].strip().isdigit():
                mapping[int(parts[0].strip())] = parts[1].strip()
                
    # Try abilitiesCatalog.json
    cat_json = FRONTEND_CORE_DIR / "abilitiesCatalog.json"
    if cat_json.exists():
        try:
            data = json.loads(cat_json.read_text(encoding="utf-8"))
            for k, v in data.items():
                if k.isdigit():
                    mapping[int(k)] = v.strip()
        except Exception:
            pass
            
    return mapping


def find_species_table_base(rom: bytes) -> int:
    """Scans ROM binary for the species base stats table anchor."""
    start = 0
    while True:
        pos = rom.find(BULBA_STATS, start)
        if pos < 0:
            break
        
        # Verify subsequent entries
        is_match = True
        checks = [IVYSAUR_STATS, VENUSAUR_STATS, CHARMANDER_STATS]
        for idx, expected in enumerate(checks, start=1):
            probe = pos + (idx * SPECIES_STRUCT_SIZE)
            if probe + len(expected) > len(rom) or rom[probe : probe + len(expected)] != expected:
                is_match = False
                break
                
        if is_match:
            return pos
        start = pos + 1
        
    raise RuntimeError("Could not locate Pokemon species base stats table in ROM.")


def manage_backups(rom_dir: Path) -> tuple[Path, Path | None]:
    """
    Creates timestamped backups of .gba (and .sav if present) in rom_dir/backups.
    Enforces a strict FIFO rotation of max 5 backup pairs.
    Preserves rom_dir/backups/original indefinitely.
    """
    backups_dir = rom_dir / "backups"
    backups_dir.mkdir(parents=True, exist_ok=True)
    
    gba_file = rom_dir / GBA_FILENAME
    sav_file = rom_dir / SAV_FILENAME
    
    if not gba_file.exists():
        raise FileNotFoundError(f"GBA ROM not found at: {gba_file}")

    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_gba = backups_dir / f"Pokemon Unbound_{timestamp}.gba"
    backup_sav = backups_dir / f"Pokemon Unbound_{timestamp}.sav" if sav_file.exists() else None

    # Copy current active files to new timestamped backup
    shutil.copy2(gba_file, backup_gba)
    print(f"\033[32m[BACKUP]\033[0m Created ROM backup: {backup_gba.name}")
    
    if sav_file.exists() and backup_sav:
        shutil.copy2(sav_file, backup_sav)
        print(f"\033[32m[BACKUP]\033[0m Created Save backup: {backup_sav.name}")

    # Enforce FIFO rotation: scan backups folder excluding 'original'
    all_gba_backups: list[Path] = []
    for item in backups_dir.glob("Pokemon Unbound_*.gba"):
        if item.is_file() and not item.name.startswith("Pokemon Unbound_backup_original"):
            all_gba_backups.append(item)

    # Sort backups chronologically by modification time or name
    all_gba_backups.sort(key=lambda p: p.stat().st_mtime)

    # If exceeding max backups, delete oldest pairs
    while len(all_gba_backups) > MAX_BACKUPS:
        oldest_gba = all_gba_backups.pop(0)
        oldest_sav = oldest_gba.with_suffix(".sav")
        
        try:
            oldest_gba.unlink(missing_ok=True)
            print(f"\033[33m[FIFO ROTATION]\033[0m Removed oldest backup: {oldest_gba.name}")
        except Exception as e:
            print(f"\033[31m[WARN]\033[0m Could not remove {oldest_gba.name}: {e}")

        if oldest_sav.exists():
            try:
                oldest_sav.unlink(missing_ok=True)
                print(f"\033[33m[FIFO ROTATION]\033[0m Removed matching save: {oldest_sav.name}")
            except Exception as e:
                pass

    return backup_gba, backup_sav


def patch_rom_ability(
    rom_dir: Path,
    species_id: int,
    slot: str,
    target_ability_id: int,
    species_name: str = "",
    ability_name: str = ""
) -> None:
    """Patches the ROM and synchronizes metadata."""
    gba_file = rom_dir / GBA_FILENAME
    rom_bytes = bytearray(gba_file.read_bytes())
    
    table_base = find_species_table_base(rom_bytes)
    species_off = table_base + (species_id - 1) * SPECIES_STRUCT_SIZE
    
    if species_off + SPECIES_STRUCT_SIZE > len(rom_bytes):
        raise ValueError(f"Species ID {species_id} offset is beyond ROM bounds.")

    slot_normalized = slot.lower().strip()
    if slot_normalized in ["1", "a1", "ability1", "ability_1"]:
        field_name = "Ability 1"
        patch_off = species_off + OFF_ABILITY_1
        orig_val = rom_bytes[patch_off]
        rom_bytes[patch_off] = target_ability_id & 0xFF
        diff_len = 1
    elif slot_normalized in ["2", "a2", "ability2", "ability_2"]:
        field_name = "Ability 2"
        patch_off = species_off + OFF_ABILITY_2
        orig_val = rom_bytes[patch_off]
        rom_bytes[patch_off] = target_ability_id & 0xFF
        diff_len = 1
    elif slot_normalized in ["ha", "hidden", "hidden_ability", "3"]:
        field_name = "Hidden Ability"
        patch_off = species_off + OFF_HIDDEN_ABILITY
        orig_val = int.from_bytes(rom_bytes[patch_off : patch_off + 2], "little")
        rom_bytes[patch_off : patch_off + 2] = struct.pack("<H", target_ability_id)
        diff_len = 2
    else:
        raise ValueError(f"Unknown ability slot '{slot}'. Use 'a1', 'a2', or 'ha'.")

    # Perform Backup before writing
    manage_backups(rom_dir)

    # Write patched ROM
    gba_file.write_bytes(rom_bytes)
    print(f"\n\033[1;32m[SUCCESS]\033[0m Patched {species_name or f'Species #{species_id}'} {field_name}:")
    print(f"  Old ID: {orig_val}")
    print(f"  New ID: {target_ability_id} ({ability_name or 'Custom Ability'})")
    print(f"  ROM Offset: {hex(patch_off)}\n")

    # Synchronize PUSE metadata catalogs
    sync_puse_metadata(species_id, slot_normalized, target_ability_id)


def sync_puse_metadata(species_id: int, slot: str, ability_id: int) -> None:
    """Updates PUSE species abilities metadata files so save editor UI displays changes."""
    targets = [
        BACKEND_DATA_DIR / "species_abilities_meta.json",
        FRONTEND_CORE_DIR / "speciesAbilitiesMeta.json",
        SWITCH_DATA_DIR / "species_abilities_meta.json",
        THREE_DS_DATA_DIR / "species_abilities_meta.json",
    ]
    
    key = str(species_id)
    slot_key = "hidden_ability_id" if slot in ["ha", "hidden", "hidden_ability", "3"] else ("ability_1_id" if slot in ["1", "a1", "ability1"] else "ability_2_id")

    for path in targets:
        if not path.exists():
            continue
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
            if key not in data:
                data[key] = {"ability_1_id": 0, "ability_2_id": 0, "hidden_ability_id": 0}
            data[key][slot_key] = ability_id
            path.write_text(json.dumps(data, indent=2), encoding="utf-8")
            print(f"\033[34m[PUSE METADATA]\033[0m Synchronized: {path.name} ({path.parent.parent.name if path.parent.name == 'data' else path.parent.name})")
        except Exception as e:
            print(f"\033[31m[WARN]\033[0m Failed updating {path}: {e}")


def main():
    parser = argparse.ArgumentParser(description="Pokemon Unbound ROM Ability Patcher & Backup Tool")
    parser.add_argument("--rom-dir", type=Path, default=DEFAULT_ROM_DIR, help="Directory containing Pokemon Unbound.gba")
    parser.add_argument("--species", "-s", type=str, help="Pokemon name or ID (e.g. Gible or 496)")
    parser.add_argument("--ability", "-a", type=str, help="Ability name or ID (e.g. 'Magic Bounce' or 90)")
    parser.add_argument("--slot", choices=["a1", "a2", "ha", "1", "2", "3", "hidden"], default="ha", help="Ability slot (a1, a2, ha)")
    
    args = parser.parse_args()

    species_db = load_species_database()
    species_by_name = {v.lower(): k for k, v in species_db.items()}

    ability_db = load_ability_database()
    ability_by_name = {v.lower(): k for k, v in ability_db.items()}

    species_input = args.species
    ability_input = args.ability
    slot_input = args.slot

    # Interactive mode if arguments not provided
    if not species_input or not ability_input:
        print("\033[1;36m====================================================\033[0m")
        print("\033[1;36m   Pokemon Unbound ROM Ability Patcher & Backup     \033[0m")
        print("\033[1;36m====================================================\033[0m")
        print(f"ROM Folder: {args.rom_dir}\n")

        if not species_input:
            species_input = input("Enter Pokemon Name or Species ID (e.g. Gible): ").strip()
        if not ability_input:
            ability_input = input("Enter Ability Name or Ability ID (e.g. Magic Bounce): ").strip()
        if not args.species:
            slot_input = input("Enter Slot ('ha' for Hidden Ability, 'a1' for Ability 1, 'a2' for Ability 2) [ha]: ").strip() or "ha"

    # Resolve Species
    if species_input.isdigit():
        species_id = int(species_input)
        species_name = species_db.get(species_id, f"Species #{species_id}")
    else:
        species_id = species_by_name.get(species_input.lower())
        if not species_id:
            print(f"\033[31m[ERROR]\033[0m Could not find Pokemon '{species_input}'.")
            sys.exit(1)
        species_name = species_db[species_id]

    # Resolve Ability
    if ability_input.isdigit():
        ability_id = int(ability_input)
        ability_name = ability_db.get(ability_id, f"Ability #{ability_id}")
    else:
        ability_id = ability_by_name.get(ability_input.lower())
        if not ability_id:
            print(f"\033[31m[ERROR]\033[0m Could not find Ability '{ability_input}'.")
            sys.exit(1)
        ability_name = ability_db[ability_id]

    print(f"\nTarget Pokemon: \033[1m{species_name}\033[0m (ID: {species_id})")
    print(f"Target Ability: \033[1m{ability_name}\033[0m (ID: {ability_id})")
    print(f"Target Slot:    \033[1m{slot_input.upper()}\033[0m")

    try:
        patch_rom_ability(
            rom_dir=args.rom_dir,
            species_id=species_id,
            slot=slot_input,
            target_ability_id=ability_id,
            species_name=species_name,
            ability_name=ability_name
        )
    except Exception as e:
        print(f"\033[31m[ERROR]\033[0m Patching failed: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
