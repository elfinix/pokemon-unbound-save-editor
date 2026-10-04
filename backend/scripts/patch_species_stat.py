#!/usr/bin/env python3
"""
Pokemon Unbound ROM Species Base Stats Patcher & Backup Manager
===============================================================
Safely modifies species base stats (HP, Attack, Defense, Speed, Sp.Atk, Sp.Def)
directly in the Pokemon Unbound GBA ROM, with automated FIFO backup management
and synchronization across PUSE metadata files.
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
STAT_OFFSETS = {
    "hp": 0x00,
    "atk": 0x01,
    "def": 0x02,
    "spe": 0x03,
    "speed": 0x03,
    "spa": 0x04,
    "spd": 0x05,
}

STAT_NAMES = {
    "hp": "HP",
    "atk": "Attack",
    "def": "Defense",
    "spe": "Speed",
    "speed": "Speed",
    "spa": "Sp. Attack",
    "spd": "Sp. Defense",
}

JSON_STAT_KEYS = {
    "hp": "hp",
    "atk": "atk",
    "def": "def",
    "spe": "spe",
    "speed": "spe",
    "spa": "spa",
    "spd": "spd",
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
                if k.isdigit():
                    sid = int(k)
                    if sid not in mapping:
                        name = re.sub(r"^SPECIES_", "", v).replace("_", " ").title()
                        mapping[sid] = name
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

    all_gba_backups.sort(key=lambda p: p.stat().st_mtime)

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
            except Exception:
                pass

    return backup_gba, backup_sav


def patch_rom_stat(
    rom_dir: Path,
    species_id: int,
    stat_key: str,
    target_value: int,
    species_name: str = ""
) -> None:
    """Patches the ROM base stat and synchronizes metadata across runtimes."""
    gba_file = rom_dir / GBA_FILENAME
    rom_bytes = bytearray(gba_file.read_bytes())

    table_base = find_species_table_base(rom_bytes)
    species_off = table_base + (species_id - 1) * SPECIES_STRUCT_SIZE

    if species_off + SPECIES_STRUCT_SIZE > len(rom_bytes):
        raise ValueError(f"Species ID {species_id} offset is beyond ROM bounds.")

    stat_norm = stat_key.lower().strip()
    if stat_norm not in STAT_OFFSETS:
        raise ValueError(f"Unknown stat '{stat_key}'. Valid options: hp, atk, def, spe/speed, spa, spd.")

    stat_off = species_off + STAT_OFFSETS[stat_norm]
    orig_val = rom_bytes[stat_off]

    if not (1 <= target_value <= 255):
        raise ValueError(f"Stat value must be between 1 and 255 (got {target_value}).")

    # Perform Backup before writing
    manage_backups(rom_dir)

    # Write patched ROM byte
    rom_bytes[stat_off] = target_value & 0xFF
    gba_file.write_bytes(rom_bytes)

    stat_display = STAT_NAMES[stat_norm]
    print(f"\n\033[1;32m[SUCCESS]\033[0m Patched {species_name or f'Species #{species_id}'} Base {stat_display}:")
    print(f"  Old Base {stat_display}: {orig_val}")
    print(f"  New Base {stat_display}: {target_value}")
    print(f"  ROM Offset: {hex(stat_off)}\n")

    # Synchronize metadata catalogs across backend, frontend, and switch
    sync_puse_base_stats(species_id, stat_norm, target_value)


def sync_puse_base_stats(species_id: int, stat_key: str, target_value: int) -> None:
    """Updates species_base_stats.json in backend, frontend, and switch-homebrew."""
    targets = [
        BACKEND_DATA_DIR / "species_base_stats.json",
        FRONTEND_CORE_DIR / "speciesBaseStats.json",
        SWITCH_DATA_DIR / "species_base_stats.json",
    ]

    key = str(species_id)
    json_stat = JSON_STAT_KEYS[stat_key.lower().strip()]

    for path in targets:
        if not path.exists():
            continue
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
            if key not in data:
                data[key] = {"hp": 45, "atk": 49, "def": 49, "spe": 45, "spa": 65, "spd": 65}
            data[key][json_stat] = target_value
            path.write_text(json.dumps(data, indent=2), encoding="utf-8")
            print(f"\033[34m[PUSE METADATA]\033[0m Synchronized: {path.name}")
        except Exception as e:
            print(f"\033[31m[WARN]\033[0m Failed updating {path}: {e}")


def main():
    parser = argparse.ArgumentParser(description="Pokemon Unbound ROM Base Stats Patcher & Backup Tool")
    parser.add_argument("--rom-dir", type=Path, default=DEFAULT_ROM_DIR, help="Directory containing Pokemon Unbound.gba")
    parser.add_argument("--species", "-s", type=str, help="Pokemon name or ID (e.g. Gible or 496)")
    parser.add_argument("--stat", choices=["hp", "atk", "def", "spe", "speed", "spa", "spd"], help="Stat to modify")
    parser.add_argument("--value", "-v", type=int, help="New base stat value (1-255)")

    args = parser.parse_args()

    species_db = load_species_database()
    species_by_name = {v.lower(): k for k, v in species_db.items()}

    species_input = args.species
    stat_input = args.stat
    value_input = args.value

    # Interactive mode if arguments not provided
    if not species_input or not stat_input or value_input is None:
        print("\033[1;36m====================================================\033[0m")
        print("\033[1;36m   Pokemon Unbound ROM Base Stats Patcher & Backup  \033[0m")
        print("\033[1;36m====================================================\033[0m")
        print(f"ROM Folder: {args.rom_dir}\n")

        if not species_input:
            species_input = input("Enter Pokemon Name or Species ID (e.g. Gible): ").strip()
        if not stat_input:
            stat_input = input("Enter Stat (hp, atk, def, spe, spa, spd): ").strip().lower()
        if value_input is None:
            value_input = int(input("Enter New Base Stat Value (1-255): ").strip())

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

    print(f"\nTarget Pokemon: \033[1m{species_name}\033[0m (ID: {species_id})")
    print(f"Target Stat:    \033[1m{STAT_NAMES.get(stat_input.lower(), stat_input).upper()}\033[0m")
    print(f"New Value:      \033[1m{value_input}\033[0m")

    try:
        patch_rom_stat(
            rom_dir=args.rom_dir,
            species_id=species_id,
            stat_key=stat_input,
            target_value=value_input,
            species_name=species_name
        )
    except Exception as e:
        print(f"\033[31m[ERROR]\033[0m Patching failed: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
