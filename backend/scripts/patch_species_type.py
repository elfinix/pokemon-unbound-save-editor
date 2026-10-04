#!/usr/bin/env python3
"""
Pokemon Unbound ROM Species Type Patcher & Backup Manager
=========================================================
Safely modifies species primary and/or secondary types directly in the
Pokemon Unbound GBA ROM, with automated FIFO backup management and
synchronization across PUSE metadata files.
"""

from __future__ import annotations

import argparse
import datetime
import json
import os
import re
import shutil
import sys
from pathlib import Path

# Paths within workspace
WORKSPACE_ROOT = Path(__file__).resolve().parents[2]
BACKEND_DATA_DIR = WORKSPACE_ROOT / "backend" / "data"
FRONTEND_CORE_DIR = WORKSPACE_ROOT / "frontend" / "src" / "core"
SWITCH_DATA_DIR = WORKSPACE_ROOT / "switch-homebrew" / "romfs" / "data"
N3DS_DATA_DIR = WORKSPACE_ROOT / "3ds-homebrew" / "romfs" / "data"


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
OFF_TYPE1 = 0x06            # 1 byte
OFF_TYPE2 = 0x07            # 1 byte

TYPE_IDS: dict[str, int] = {
    "normal": 0x00,
    "fighting": 0x01,
    "flying": 0x02,
    "poison": 0x03,
    "ground": 0x04,
    "rock": 0x05,
    "bug": 0x06,
    "ghost": 0x07,
    "steel": 0x08,
    "mystery": 0x09,
    "fire": 0x0A,
    "water": 0x0B,
    "grass": 0x0C,
    "electric": 0x0D,
    "psychic": 0x0E,
    "ice": 0x0F,
    "dragon": 0x10,
    "dark": 0x11,
    "fairy": 0x17,
}

TYPE_NAMES: dict[int, str] = {
    0x00: "Normal",
    0x01: "Fighting",
    0x02: "Flying",
    0x03: "Poison",
    0x04: "Ground",
    0x05: "Rock",
    0x06: "Bug",
    0x07: "Ghost",
    0x08: "Steel",
    0x09: "Mystery",
    0x0A: "Fire",
    0x0B: "Water",
    0x0C: "Grass",
    0x0D: "Electric",
    0x0E: "Psychic",
    0x0F: "Ice",
    0x10: "Dragon",
    0x11: "Dark",
    0x17: "Fairy",
}

# Anchor pattern for finding Bulbasaur (Species ID 1) in ROM
BULBA_STATS = bytes([45, 49, 49, 45, 65, 65])
IVYSAUR_STATS = bytes([60, 62, 63, 60, 80, 80])
VENUSAUR_STATS = bytes([80, 82, 83, 80, 100, 100])
CHARMANDER_STATS = bytes([39, 52, 43, 65, 60, 50])

MAX_BACKUPS = 5


def load_species_database() -> dict[int, str]:
    """Returns mapping of species_id -> species_name."""
    mapping: dict[int, str] = {}
    poke_txt = BACKEND_DATA_DIR / "pokemon.txt"
    if poke_txt.exists():
        for line in poke_txt.read_text(encoding="utf-8", errors="ignore").splitlines():
            line = line.strip()
            if not line or ":" not in line:
                continue
            parts = line.split(":", 1)
            if parts[0].strip().isdigit():
                mapping[int(parts[0].strip())] = parts[1].strip()

    const_json = FRONTEND_CORE_DIR / "speciesConstants.json"
    if const_json.exists():
        try:
            data = json.loads(const_json.read_text(encoding="utf-8"))
            for k, v in data.items():
                if k.isdigit() and int(k) not in mapping:
                    clean_name = v.replace("SPECIES_", "").replace("_", " ").title()
                    mapping[int(k)] = clean_name
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

    original_dir = backups_dir / "original"
    original_dir.mkdir(parents=True, exist_ok=True)

    gba_source = rom_dir / GBA_FILENAME
    sav_source = rom_dir / SAV_FILENAME

    if not gba_source.exists():
        raise FileNotFoundError(f"Target ROM not found at: {gba_source}")

    orig_gba = original_dir / GBA_FILENAME
    if not orig_gba.exists():
        shutil.copy2(gba_source, orig_gba)
        print(f"\033[32m[BACKUP]\033[0m Preserved pristine original ROM at: {orig_gba}")

    if sav_source.exists():
        orig_sav = original_dir / SAV_FILENAME
        if not orig_sav.exists():
            shutil.copy2(sav_source, orig_sav)
            print(f"\033[32m[BACKUP]\033[0m Preserved pristine original SAVE at: {orig_sav}")

    now_str = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    timestamped_gba = backups_dir / f"Pokemon_Unbound_{now_str}.gba"
    shutil.copy2(gba_source, timestamped_gba)
    print(f"\033[32m[BACKUP]\033[0m Created ROM backup: {timestamped_gba.name}")

    timestamped_sav = None
    if sav_source.exists():
        timestamped_sav = backups_dir / f"Pokemon_Unbound_{now_str}.sav"
        shutil.copy2(sav_source, timestamped_sav)
        print(f"\033[32m[BACKUP]\033[0m Created SAVE backup: {timestamped_sav.name}")

    pattern = re.compile(r"^Pokemon_Unbound_(\d{8}_\d{6})\.gba$")
    gba_backups = []
    for p in backups_dir.glob("Pokemon_Unbound_*.gba"):
        m = pattern.match(p.name)
        if m:
            gba_backups.append((m.group(1), p))

    gba_backups.sort(key=lambda x: x[0])

    if len(gba_backups) > MAX_BACKUPS:
        excess = len(gba_backups) - MAX_BACKUPS
        for ts, gba_path in gba_backups[:excess]:
            try:
                gba_path.unlink()
                print(f"\033[33m[FIFO ROTATION]\033[0m Removed oldest ROM backup: {gba_path.name}")
                sav_path = backups_dir / f"Pokemon_Unbound_{ts}.sav"
                if sav_path.exists():
                    sav_path.unlink()
                    print(f"\033[33m[FIFO ROTATION]\033[0m Removed oldest SAVE backup: {sav_path.name}")
            except Exception as e:
                print(f"\033[31m[WARN]\033[0m Could not delete old backup: {e}")

    return timestamped_gba, timestamped_sav


def patch_rom_species_type(
    rom_dir: Path,
    species_id: int,
    type1_id: int,
    type2_id: int,
) -> tuple[int, int, int, int]:
    """
    Applies species primary and secondary types directly into ROM binary.
    Returns: (offset_t1, offset_t2, old_type1, old_type2)
    """
    gba_path = rom_dir / GBA_FILENAME
    with open(gba_path, "rb") as f:
        rom_data = bytearray(f.read())

    table_base = find_species_table_base(rom_data)
    species_offset = table_base + ((species_id - 1) * SPECIES_STRUCT_SIZE)

    offset_t1 = species_offset + OFF_TYPE1
    offset_t2 = species_offset + OFF_TYPE2

    if offset_t2 >= len(rom_data):
        raise ValueError(f"Calculated offset 0x{offset_t2:X} is outside ROM boundary.")

    old_type1 = rom_data[offset_t1]
    old_type2 = rom_data[offset_t2]

    rom_data[offset_t1] = type1_id
    rom_data[offset_t2] = type2_id

    with open(gba_path, "wb") as f:
        f.write(rom_data)

    return offset_t1, offset_t2, old_type1, old_type2


def sync_metadata(species_id: int, type1_id: int, type2_id: int) -> None:
    """Updates species_types.json across backend, frontend, switch-homebrew, and 3ds-homebrew."""
    type1_str = TYPE_NAMES.get(type1_id, "Normal")
    type2_str = TYPE_NAMES.get(type2_id, "Normal")

    types_list = [type1_str]
    if type2_id != type1_id and type2_str != "Mystery":
        types_list.append(type2_str)

    target_files = [
        BACKEND_DATA_DIR / "species_types.json",
        FRONTEND_CORE_DIR / "speciesTypes.json",
        SWITCH_DATA_DIR / "species_types.json",
        N3DS_DATA_DIR / "species_types.json",
    ]

    key = str(species_id)
    entry = {
        "type1": type1_str,
        "type2": type2_str,
        "types": types_list,
        "type1_id": type1_id,
        "type2_id": type2_id,
    }

    for path in target_files:
        if not path.exists():
            continue
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
            data[key] = entry
            path.write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")
            print(f"\033[34m[PUSE METADATA]\033[0m Synchronized: {path.relative_to(WORKSPACE_ROOT)}")
        except Exception as e:
            print(f"\033[31m[WARN]\033[0m Failed updating {path}: {e}")


def parse_type_input(type_input: str) -> tuple[int, str]:
    """Resolves string or integer input to (type_id, type_name)."""
    type_str = type_input.strip().lower()
    if type_str.isdigit():
        t_id = int(type_str)
        if t_id not in TYPE_NAMES:
            raise ValueError(f"Unknown type ID {t_id}")
        return t_id, TYPE_NAMES[t_id]
    if type_str not in TYPE_IDS:
        raise ValueError(f"Unknown type name '{type_input}' (Valid: {', '.join(sorted(TYPE_IDS.keys()))})")
    return TYPE_IDS[type_str], TYPE_NAMES[TYPE_IDS[type_str]]


def main() -> None:
    parser = argparse.ArgumentParser(description="Pokemon Unbound ROM Species Type Patcher & Backup Tool")
    parser.add_argument("--rom-dir", type=Path, default=DEFAULT_ROM_DIR, help="Directory containing Pokemon Unbound.gba")
    parser.add_argument("--species", "-s", type=str, help="Pokemon name or ID (e.g. Snorunt or 346)")
    parser.add_argument("--type1", "-t1", type=str, help="Primary type (e.g. Ice)")
    parser.add_argument("--type2", "-t2", type=str, help="Secondary type (e.g. Ghost)")

    args = parser.parse_args()

    species_db = load_species_database()
    species_by_name = {v.lower(): k for k, v in species_db.items()}

    species_input = args.species
    type1_input = args.type1
    type2_input = args.type2

    if not species_input or not type1_input:
        print("\033[1;36m====================================================\033[0m")
        print("\033[1;36m     Pokemon Unbound ROM Species Type Patcher       \033[0m")
        print("\033[1;36m====================================================\033[0m")
        print(f"ROM Folder: {args.rom_dir}\n")

        if not species_input:
            species_input = input("Enter Pokemon Name or Species ID (e.g. Snorunt): ").strip()
        if not type1_input:
            type1_input = input("Enter Primary Type (e.g. Ice): ").strip()
        if not type2_input:
            type2_input = input("Enter Secondary Type (or leave empty for mono-type): ").strip()

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

    # Resolve Types
    try:
        t1_id, t1_name = parse_type_input(type1_input)
        if type2_input:
            t2_id, t2_name = parse_type_input(type2_input)
        else:
            t2_id, t2_name = t1_id, t1_name
    except ValueError as e:
        print(f"\033[31m[ERROR]\033[0m {e}")
        sys.exit(1)

    print(f"\nTarget: \033[1;37m{species_name}\033[0m (ID: #{species_id})")
    print(f"New Typing: \033[1;36m{t1_name}\033[0m (ID: {t1_id}) / \033[1;35m{t2_name}\033[0m (ID: {t2_id})")

    # Backup ROM & Save
    try:
        manage_backups(args.rom_dir)
    except Exception as e:
        print(f"\033[31m[ERROR]\033[0m Backup failed: {e}")
        sys.exit(1)

    # Patch ROM
    try:
        off_t1, off_t2, old_t1, old_t2 = patch_rom_species_type(args.rom_dir, species_id, t1_id, t2_id)
        old_t1_name = TYPE_NAMES.get(old_t1, f"0x{old_t1:02X}")
        old_t2_name = TYPE_NAMES.get(old_t2, f"0x{old_t2:02X}")
        print(f"\n\033[32m[SUCCESS]\033[0m Patched ROM binary successfully!")
        print(f"  Type 1 at 0x{off_t1:X}: {old_t1_name} ({old_t1}) -> \033[1;32m{t1_name} ({t1_id})\033[0m")
        print(f"  Type 2 at 0x{off_t2:X}: {old_t2_name} ({old_t2}) -> \033[1;32m{t2_name} ({t2_id})\033[0m")
    except Exception as e:
        print(f"\033[31m[ERROR]\033[0m ROM patching failed: {e}")
        sys.exit(1)

    # Sync Metadata
    sync_metadata(species_id, t1_id, t2_id)
    print(f"\n\033[1;32m[DONE]\033[0m All systems synchronized for {species_name} ({t1_name} / {t2_name})!\n")


if __name__ == "__main__":
    main()
