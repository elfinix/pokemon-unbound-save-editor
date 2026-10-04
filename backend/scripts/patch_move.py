#!/usr/bin/env python3
"""
Pokemon Unbound ROM Move Patcher & Backup Manager
=================================================
Safely modifies move properties (Name, Base Power, Accuracy, Type, PP, Category, Effects)
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
FRONTEND_PUBLIC_DIR = WORKSPACE_ROOT / "frontend" / "public" / "data"
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
MOVE_STRUCT_SIZE = 0x0C      # 12 bytes per move
MOVE_TABLE_BASE = 0xA769BC   # Base offset for gBattleMoves
MOVE_NAME_BASE = 0xA40A1D    # Base offset for gMoveNames
MOVE_NAME_MAX_LEN = 12       # 12 characters max (13-byte fixed entry with 0xFF)

# Offsets within Move Struct (12 bytes)
OFF_POWER = 0x00
OFF_TYPE = 0x01
OFF_ACCURACY = 0x02
OFF_PP = 0x03
OFF_SEC_CHANCE = 0x04
OFF_TARGET = 0x05
OFF_PRIORITY = 0x06
OFF_FLAGS = 0x07
OFF_Z_POWER = 0x08
OFF_SPLIT = 0x09
OFF_SEC_ARG = 0x0A
OFF_EFFECT = 0x0B

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
    "fairy": 0x12,
}

TYPE_NAMES: dict[int, str] = {v: k.title() for k, v in TYPE_IDS.items()}

SPLIT_IDS: dict[str, int] = {
    "physical": 0,
    "special": 1,
    "status": 2,
}

SPLIT_NAMES: dict[int, str] = {0: "Physical", 1: "Special", 2: "Status"}

MAX_BACKUPS = 5

# GBA Character Map
CHAR_TO_GBA: dict[str, int] = {
    " ": 0x00, "!": 0xAB, "?": 0xAC, ".": 0xAD, "-": 0xAE, "/": 0xBA,
    ",": 0xB8, "'": 0xB4, "\n": 0xFE,
}
for _i in range(26):
    CHAR_TO_GBA[chr(ord("A") + _i)] = 0xBB + _i
    CHAR_TO_GBA[chr(ord("a") + _i)] = 0xD5 + _i
for _i in range(10):
    CHAR_TO_GBA[str(_i)] = 0xA1 + _i

GBA_TO_CHAR: dict[int, str] = {v: k for k, v in CHAR_TO_GBA.items()}
GBA_TO_CHAR[0xFF] = ""


def encode_gba_name(text: str, max_len: int = MOVE_NAME_MAX_LEN) -> bytes:
    """Encodes a string into GBA character byte format (padded to max_len + 1)."""
    clean_text = text[:max_len]
    encoded = bytearray()
    for ch in clean_text:
        encoded.append(CHAR_TO_GBA.get(ch, 0x00))
    encoded.append(0xFF)  # Terminator
    while len(encoded) < (max_len + 1):
        encoded.append(0xFF)
    return bytes(encoded[: max_len + 1])


def decode_gba_name(raw_bytes: bytes) -> str:
    """Decodes GBA character bytes into a readable string."""
    res = []
    for b in raw_bytes:
        if b == 0xFF:
            break
        res.append(GBA_TO_CHAR.get(b, "?"))
    return "".join(res)


def load_moves_database() -> dict[int, str]:
    """Returns mapping of move_id -> move_name."""
    mapping: dict[int, str] = {}
    moves_txt = BACKEND_DATA_DIR / "moves.txt"
    if moves_txt.exists():
        for line in moves_txt.read_text(encoding="utf-8", errors="ignore").splitlines():
            line = line.strip()
            if not line or ":" not in line:
                continue
            parts = line.split(":", 1)
            if parts[0].strip().isdigit():
                mapping[int(parts[0].strip())] = parts[1].strip()

    meta_json = FRONTEND_CORE_DIR / "movesMeta.json"
    if meta_json.exists():
        try:
            data = json.loads(meta_json.read_text(encoding="utf-8"))
            for k, v in data.items():
                if k.isdigit() and isinstance(v, dict):
                    mid = int(k)
                    if mid not in mapping and "name" in v:
                        mapping[mid] = v["name"]
        except Exception:
            pass

    return mapping


def manage_backups(rom_dir: Path) -> tuple[Path, Path | None]:
    """
    Creates timestamped backups of .gba (and .sav if present) in rom_dir/backups.
    Enforces a strict FIFO rotation of max 5 backup pairs.
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

    # Enforce FIFO rotation
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


def patch_rom_move(
    rom_dir: Path,
    move_id: int,
    new_name: str | None = None,
    power: int | None = None,
    accuracy: int | None = None,
    type_name: str | None = None,
    pp: int | None = None,
    split: str | None = None,
    effect_chance: int | None = None,
) -> None:
    """Patches move properties directly in ROM and synchronizes PUSE datasets."""
    gba_file = rom_dir / GBA_FILENAME
    rom_bytes = bytearray(gba_file.read_bytes())

    move_struct_off = MOVE_TABLE_BASE + (move_id - 1) * MOVE_STRUCT_SIZE
    move_name_off = MOVE_NAME_BASE + (move_id - 1) * 13

    if move_struct_off + MOVE_STRUCT_SIZE > len(rom_bytes):
        raise ValueError(f"Move ID {move_id} struct offset is beyond ROM bounds.")

    orig_name = decode_gba_name(rom_bytes[move_name_off : move_name_off + 13])
    orig_power = rom_bytes[move_struct_off + OFF_POWER]
    orig_type = rom_bytes[move_struct_off + OFF_TYPE]
    orig_acc = rom_bytes[move_struct_off + OFF_ACCURACY]
    orig_pp = rom_bytes[move_struct_off + OFF_PP]
    orig_split = rom_bytes[move_struct_off + OFF_SPLIT]
    orig_chance = rom_bytes[move_struct_off + OFF_SEC_CHANCE]

    changes: list[str] = []

    # 1. Update Name
    if new_name is not None:
        trimmed_name = new_name.strip()[:MOVE_NAME_MAX_LEN]
        encoded = encode_gba_name(trimmed_name)
        rom_bytes[move_name_off : move_name_off + 13] = encoded
        changes.append(f"Name: '{orig_name}' -> '{trimmed_name}'")

    # 2. Update Power
    if power is not None:
        val = max(0, min(255, power))
        rom_bytes[move_struct_off + OFF_POWER] = val
        changes.append(f"Power: {orig_power} -> {val}")

    # 3. Update Accuracy
    if accuracy is not None:
        val = max(0, min(100, accuracy))
        rom_bytes[move_struct_off + OFF_ACCURACY] = val
        changes.append(f"Accuracy: {orig_acc}% -> {val}%")

    # 4. Update Type
    if type_name is not None:
        t_key = type_name.lower().strip()
        if t_key not in TYPE_IDS:
            raise ValueError(f"Unknown type '{type_name}'. Valid: {list(TYPE_IDS.keys())}")
        t_id = TYPE_IDS[t_key]
        rom_bytes[move_struct_off + OFF_TYPE] = t_id
        changes.append(f"Type: {TYPE_NAMES.get(orig_type, str(orig_type))} -> {TYPE_NAMES.get(t_id, str(t_id))}")

    # 5. Update Base PP
    if pp is not None:
        val = max(1, min(40, pp))
        rom_bytes[move_struct_off + OFF_PP] = val
        changes.append(f"PP: {orig_pp} -> {val}")

    # 6. Update Category / Split
    if split is not None:
        s_key = split.lower().strip()
        if s_key not in SPLIT_IDS:
            raise ValueError(f"Unknown split '{split}'. Valid: physical, special, status.")
        s_id = SPLIT_IDS[s_key]
        rom_bytes[move_struct_off + OFF_SPLIT] = s_id
        changes.append(f"Split: {SPLIT_NAMES.get(orig_split, str(orig_split))} -> {SPLIT_NAMES.get(s_id, str(s_id))}")

    # 7. Update Secondary Effect Chance
    if effect_chance is not None:
        val = max(0, min(100, effect_chance))
        rom_bytes[move_struct_off + OFF_SEC_CHANCE] = val
        changes.append(f"Sec. Chance: {orig_chance}% -> {val}%")

    if not changes:
        print("\033[33m[INFO]\033[0m No changes requested.")
        return

    # Perform Backup
    manage_backups(rom_dir)

    # Write patched ROM
    gba_file.write_bytes(rom_bytes)

    print(f"\n\033[1;32m[SUCCESS]\033[0m Patched Move #{move_id} ({new_name or orig_name}):")
    for ch in changes:
        print(f"  • {ch}")
    print(f"  ROM Struct Offset: {hex(move_struct_off)}")
    print(f"  ROM Name Offset:   {hex(move_name_off)}\n")

    # Synchronize PUSE Metadata
    sync_puse_moves_meta(
        move_id=move_id,
        name=new_name,
        power=power,
        accuracy=accuracy,
        type_name=type_name,
        pp=pp,
        split=split,
    )


def sync_puse_moves_meta(
    move_id: int,
    name: str | None = None,
    power: int | None = None,
    accuracy: int | None = None,
    type_name: str | None = None,
    pp: int | None = None,
    split: str | None = None,
) -> None:
    """Synchronizes movesMeta.json, moves.txt, and move_table_from_rom.json across all project runtimes."""
    # 1. Update moves_meta.json targets
    meta_targets = [
        BACKEND_DATA_DIR / "moves_meta.json",
        FRONTEND_CORE_DIR / "movesMeta.json",
        FRONTEND_PUBLIC_DIR / "moves_meta.json",
        SWITCH_DATA_DIR / "moves_meta.json",
        THREE_DS_DATA_DIR / "moves_meta.json",
    ]

    key = str(move_id)

    for path in meta_targets:
        if not path.exists():
            continue
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
            if key not in data:
                data[key] = {"id": move_id, "name": name or f"Move #{move_id}"}
            entry = data[key]
            if name is not None:
                entry["name"] = name
            if power is not None:
                entry["power"] = power
            if accuracy is not None:
                entry["accuracy"] = accuracy
            if type_name is not None:
                entry["type"] = type_name.title()
            if pp is not None:
                entry["base_pp"] = pp
            if split is not None:
                entry["split"] = split.title()

            path.write_text(json.dumps(data, indent=2), encoding="utf-8")
            print(f"\033[34m[PUSE METADATA]\033[0m Synchronized: {path.name} ({path.parent.parent.name if path.parent.name == 'data' else path.parent.name})")
        except Exception as e:
            print(f"\033[31m[WARN]\033[0m Failed updating {path}: {e}")

    # 2. Update moves.txt across backend, frontend public, switch, and 3ds
    if name is not None:
        txt_targets = [
            BACKEND_DATA_DIR / "moves.txt",
            FRONTEND_PUBLIC_DIR / "moves.txt",
            SWITCH_DATA_DIR / "moves.txt",
            THREE_DS_DATA_DIR / "moves.txt",
        ]
        for path in txt_targets:
            if not path.exists():
                continue
            try:
                lines = path.read_text(encoding="utf-8", errors="ignore").splitlines()
                new_lines = []
                found = False
                for line in lines:
                    if line.startswith(f"{move_id}:"):
                        new_lines.append(f"{move_id}:{name}")
                        found = True
                    else:
                        new_lines.append(line)
                if not found:
                    new_lines.append(f"{move_id}:{name}")
                path.write_text("\n".join(new_lines) + "\n", encoding="utf-8")
                print(f"\033[34m[PUSE METADATA]\033[0m Synchronized: {path.name} ({path.parent.parent.name if path.parent.name == 'data' else path.parent.name})")
            except Exception as e:
                print(f"\033[31m[WARN]\033[0m Failed updating {path.name}: {e}")

    # 3. Update move_table_from_rom.json across backend, frontend public, switch, and 3ds
    table_targets = [
        BACKEND_DATA_DIR / "move_table_from_rom.json",
        FRONTEND_PUBLIC_DIR / "move_table_from_rom.json",
        SWITCH_DATA_DIR / "move_table_from_rom.json",
        THREE_DS_DATA_DIR / "move_table_from_rom.json",
    ]
    for path in table_targets:
        if not path.exists():
            continue
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
            moves = data.get("moves", [])
            for entry in moves:
                if entry.get("move_id") == move_id:
                    if name is not None:
                        entry["name"] = name
                    if power is not None:
                        entry["base_power"] = power
                    if accuracy is not None:
                        entry["accuracy"] = accuracy
                    if pp is not None:
                        entry["base_pp"] = pp
                    if type_name is not None:
                        # find type id if possible
                        entry["type_name"] = type_name.title()
                    if split is not None:
                        entry["split"] = split.title()
                    break
            path.write_text(json.dumps(data, indent=2), encoding="utf-8")
            print(f"\033[34m[PUSE METADATA]\033[0m Synchronized: {path.name} ({path.parent.parent.name if path.parent.name == 'data' else path.parent.name})")
        except Exception as e:
            print(f"\033[31m[WARN]\033[0m Failed updating {path}: {e}")


def main():
    parser = argparse.ArgumentParser(description="Pokemon Unbound ROM Move Patcher & Backup Tool")
    parser.add_argument("--rom-dir", type=Path, default=DEFAULT_ROM_DIR, help="Directory containing Pokemon Unbound.gba")
    parser.add_argument("--move", "-m", type=str, required=True, help="Move name or ID (e.g. 'Bone Rush' or 198)")
    parser.add_argument("--name", "-n", type=str, help="New move name (max 12 characters)")
    parser.add_argument("--power", "-p", type=int, help="New base power (0-255)")
    parser.add_argument("--accuracy", "-a", type=int, help="New accuracy (0-100)")
    parser.add_argument("--type", "-t", type=str, help="New type (e.g. Ground, Fire, Fairy)")
    parser.add_argument("--pp", type=int, help="New base PP (1-40)")
    parser.add_argument("--split", choices=["physical", "special", "status"], help="Damage category split")
    parser.add_argument("--effect-chance", type=int, help="Secondary effect chance (0-100%)")

    args = parser.parse_args()

    moves_db = load_moves_database()
    moves_by_name = {v.lower(): k for k, v in moves_db.items()}

    move_input = args.move
    if move_input.isdigit():
        move_id = int(move_input)
        move_name = moves_db.get(move_id, f"Move #{move_id}")
    else:
        move_id = moves_by_name.get(move_input.lower())
        if not move_id:
            # Fallback search
            for m_name, m_id in moves_by_name.items():
                if move_input.lower() in m_name:
                    move_id = m_id
                    break
        if not move_id:
            print(f"\033[31m[ERROR]\033[0m Could not find move '{move_input}'.")
            sys.exit(1)
        move_name = moves_db[move_id]

    print(f"\nTarget Move: \033[1m{move_name}\033[0m (ID: {move_id})")
    print(f"ROM Folder:  {args.rom_dir}")

    try:
        patch_rom_move(
            rom_dir=args.rom_dir,
            move_id=move_id,
            new_name=args.name,
            power=args.power,
            accuracy=args.accuracy,
            type_name=args.type,
            pp=args.pp,
            split=args.split,
            effect_chance=args.effect_chance,
        )
    except Exception as e:
        print(f"\033[31m[ERROR]\033[0m Patching failed: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
