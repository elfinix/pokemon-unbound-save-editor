#!/usr/bin/env python3
"""
Pokemon Unbound ROM Ability Name & Definition Patcher
=====================================================
Safely modifies ability names and in-game summary descriptions directly
in the Pokemon Unbound GBA ROM (gAbilityNames at 0xA363A9 & gAbilityDescriptions at 0x96DE04),
with automated FIFO backup management and synchronization across all PUSE Save Editor metadata files.
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
ABILITY_NAME_BASE = 0xA363A9        # Base offset for gAbilityNames
ABILITY_NAME_ENTRY_SIZE = 17         # 17 bytes per ability (16 chars max + 0xFF terminator)
ABILITY_NAME_MAX_LEN = 16

ABILITY_DESC_TABLE_BASE = 0x96DE04  # Base offset for gAbilityDescriptions pointer table (0x96DE04 + id * 4)
FREESPACE_START_OFFSET = 0x1FE6C64  # Safe clean freespace block in ROM for custom text strings

MAX_BACKUPS = 5

# GBA Character Map
CHAR_TO_GBA: dict[str, int] = {
    " ": 0x00, "!": 0xAB, "?": 0xAC, ".": 0xAD, "-": 0xAE, "/": 0xBA,
    ",": 0xB8, "'": 0xB4, "\n": 0xFE, "(": 0xB2, ")": 0xB3,
}
for _i in range(26):
    CHAR_TO_GBA[chr(ord("A") + _i)] = 0xBB + _i
    CHAR_TO_GBA[chr(ord("a") + _i)] = 0xD5 + _i
for _i in range(10):
    CHAR_TO_GBA[str(_i)] = 0xA1 + _i

GBA_TO_CHAR: dict[int, str] = {v: k for k, v in CHAR_TO_GBA.items()}
GBA_TO_CHAR[0xFF] = ""


def encode_gba_name(text: str, max_len: int = ABILITY_NAME_MAX_LEN) -> bytes:
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


def encode_gba_desc(text: str) -> bytes:
    """Encodes a multiline description string into GBA character byte format with \\n (0xFE) and 0xFF."""
    normalized = text.replace("\\n", "\n")
    encoded = bytearray()
    for ch in normalized:
        encoded.append(CHAR_TO_GBA.get(ch, 0x00))
    encoded.append(0xFF)
    while len(encoded) % 4 != 0:
        encoded.append(0xFF)
    return bytes(encoded)


def load_abilities_database() -> dict[int, str]:
    """Returns mapping of ability_id -> ability_name."""
    mapping: dict[int, str] = {}
    abilities_txt = BACKEND_DATA_DIR / "abilities.txt"
    if abilities_txt.exists():
        for line in abilities_txt.read_text(encoding="utf-8", errors="ignore").splitlines():
            line = line.strip()
            if not line or ":" not in line:
                continue
            parts = line.split(":", 1)
            if parts[0].strip().isdigit():
                mapping[int(parts[0].strip())] = parts[1].strip()

    cat_json = FRONTEND_CORE_DIR / "abilitiesCatalog.json"
    if cat_json.exists():
        try:
            data = json.loads(cat_json.read_text(encoding="utf-8"))
            for k, v in data.items():
                if k.isdigit():
                    aid = int(k)
                    if aid not in mapping:
                        mapping[aid] = str(v)
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


def allocate_freespace_string(rom_bytes: bytearray, encoded_text: bytes) -> int:
    """Finds or allocates space in ROM freespace for custom text strings."""
    pos = FREESPACE_START_OFFSET
    block_len = len(encoded_text)
    pattern = b"\xFF" * block_len

    while pos + block_len <= len(rom_bytes):
        if rom_bytes[pos : pos + block_len] == pattern:
            return pos
        pos += 4

    raise RuntimeError("Could not find sufficient ROM freespace for text string.")


def patch_rom_ability(
    rom_dir: Path,
    ability_id: int,
    new_name: str,
    description: str | None = None,
) -> None:
    """Patches ability name and description in ROM and synchronizes PUSE datasets."""
    gba_file = rom_dir / GBA_FILENAME
    rom_bytes = bytearray(gba_file.read_bytes())

    name_offset = ABILITY_NAME_BASE + (ability_id - 1) * ABILITY_NAME_ENTRY_SIZE

    if name_offset + ABILITY_NAME_ENTRY_SIZE > len(rom_bytes):
        raise ValueError(f"Ability ID {ability_id} offset is beyond ROM bounds.")

    orig_name = decode_gba_name(rom_bytes[name_offset : name_offset + ABILITY_NAME_ENTRY_SIZE])
    trimmed_name = new_name.strip()[:ABILITY_NAME_MAX_LEN]

    # Perform Backup
    manage_backups(rom_dir)

    # 1. Write patched Ability Name bytes
    encoded_name = encode_gba_name(trimmed_name)
    rom_bytes[name_offset : name_offset + ABILITY_NAME_ENTRY_SIZE] = encoded_name

    # 2. Write Ability Description if provided
    desc_offset = None
    if description:
        encoded_desc = encode_gba_desc(description)
        desc_offset = allocate_freespace_string(rom_bytes, encoded_desc)
        rom_bytes[desc_offset : desc_offset + len(encoded_desc)] = encoded_desc

        # Update gAbilityDescriptions pointer table (at 0x96DE04 + ability_id * 4)
        ptr_offset = ABILITY_DESC_TABLE_BASE + ability_id * 4
        gba_ptr = 0x08000000 + desc_offset
        rom_bytes[ptr_offset : ptr_offset + 4] = struct.pack("<I", gba_ptr)

    gba_file.write_bytes(rom_bytes)

    print(f"\n\033[1;32m[SUCCESS]\033[0m Patched Ability #{ability_id}:")
    print(f"  • Name: '{orig_name}' -> '{trimmed_name}' (Offset: {hex(name_offset)})")
    if description and desc_offset is not None:
        print(f"  • Description: '{description.replace(chr(10), ' ')}'")
        print(f"    String Offset:  {hex(desc_offset)} (Pointer: {hex(0x08000000 + desc_offset)})")
        print(f"    Pointer Table:  {hex(ABILITY_DESC_TABLE_BASE + ability_id * 4)}\n")

    # Synchronize PUSE Metadata across all project locations
    sync_puse_ability_meta(ability_id, trimmed_name)


def sync_puse_ability_meta(ability_id: int, name: str) -> None:
    """Synchronizes abilities.txt, abilitiesCatalog.json, and ability_table_from_rom.json across all project runtimes."""
    key = str(ability_id)

    # 1. Update abilitiesCatalog.json in frontend core
    cat_targets = [
        FRONTEND_CORE_DIR / "abilitiesCatalog.json",
    ]
    for path in cat_targets:
        if not path.exists():
            continue
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
            data[key] = name
            path.write_text(json.dumps(data, indent=2), encoding="utf-8")
            print(f"\033[34m[PUSE METADATA]\033[0m Synchronized: {path.name} ({path.parent.name})")
        except Exception as e:
            print(f"\033[31m[WARN]\033[0m Failed updating {path}: {e}")

    # 2. Update abilities.txt across backend, frontend public, switch, and 3ds
    txt_targets = [
        BACKEND_DATA_DIR / "abilities.txt",
        FRONTEND_PUBLIC_DIR / "abilities.txt",
        SWITCH_DATA_DIR / "abilities.txt",
        THREE_DS_DATA_DIR / "abilities.txt",
    ]
    for path in txt_targets:
        if not path.exists():
            continue
        try:
            lines = path.read_text(encoding="utf-8", errors="ignore").splitlines()
            new_lines = []
            found = False
            for line in lines:
                if line.startswith(f"{ability_id}:"):
                    new_lines.append(f"{ability_id}:{name}")
                    found = True
                else:
                    new_lines.append(line)
            if not found:
                new_lines.append(f"{ability_id}:{name}")
            path.write_text("\n".join(new_lines) + "\n", encoding="utf-8")
            print(f"\033[34m[PUSE METADATA]\033[0m Synchronized: {path.name} ({path.parent.parent.name if path.parent.name == 'data' else path.parent.name})")
        except Exception as e:
            print(f"\033[31m[WARN]\033[0m Failed updating {path}: {e}")

    # 3. Update ability_table_from_rom.json across backend, switch, and 3ds
    table_targets = [
        BACKEND_DATA_DIR / "ability_table_from_rom.json",
        SWITCH_DATA_DIR / "ability_table_from_rom.json",
        THREE_DS_DATA_DIR / "ability_table_from_rom.json",
    ]
    encoded_hex = encode_gba_name(name).hex()
    for path in table_targets:
        if not path.exists():
            continue
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
            abilities = data.get("abilities", [])
            for entry in abilities:
                if entry.get("ability_id") == ability_id:
                    entry["name"] = name
                    entry["raw_hex"] = encoded_hex
                    break
            path.write_text(json.dumps(data, indent=2), encoding="utf-8")
            print(f"\033[34m[PUSE METADATA]\033[0m Synchronized: {path.name} ({path.parent.name})")
        except Exception as e:
            print(f"\033[31m[WARN]\033[0m Failed updating {path}: {e}")


def list_unused_ability_slots() -> None:
    """Lists available/unused ability slots and table capacity in CFRU."""
    abilities_db = load_abilities_database()
    total_slots = max(abilities_db.keys()) if abilities_db else 292

    candidates = []
    for aid, name in sorted(abilities_db.items()):
        name_clean = name.strip()
        if (
            "unused" in name_clean.lower()
            or name_clean == "-"
            or name_clean.lower().startswith("ability ")
            or name_clean.lower() == "none"
        ):
            candidates.append((aid, name, "Placeholder / Empty"))
        elif name_clean in ["As One"] and aid == 154:
            candidates.append((aid, name, "Duplicate Slot (CFRU As One duplicate)"))

    print("\n\033[1;36m=== Pokemon Unbound / CFRU Ability Capacity & Slots ===\033[0m")
    print(f"  • Total Registered Ability Slots in ROM: \033[1m{total_slots}\033[0m (Base: 0xA363A9)")
    print("  • Standard Gen 1–8 Coverage: Slots #1–254 + #256–270")
    print("  • Unbound Custom Abilities: Slots #271–292 (e.g. Nine Lives, Royal Roar)")
    print("\n\033[1;33mImmediately Available / Repurposable Slots (within current 292 table):\033[0m")
    if candidates:
        for aid, name, note in candidates:
            print(f"  • Slot #{aid:3d} (0x{aid:02X}): '{name}' — {note}")
    else:
        print("  • None currently flagged as placeholder.")

    print("\n\033[1;32mExpansion Beyond 292 (Unlimited Capacity):\033[0m")
    print("  • The GBA species struct stores Ability IDs as 16-bit integers (uint16, up to 65,535).")
    print("  • Repointing `gAbilityNames` pointer to ROM freespace (0x08E00000+) allows adding")
    print("    hundreds of brand new abilities without replacing any existing ability.")
    print()


def main():
    parser = argparse.ArgumentParser(description="Pokemon Unbound ROM Ability Name & Definition Patcher")
    parser.add_argument("--rom-dir", type=Path, default=DEFAULT_ROM_DIR, help="Directory containing Pokemon Unbound.gba")
    parser.add_argument("--slot", "--id", "-i", type=str, help="Ability ID or slot (e.g. 77 or 'Unused')")
    parser.add_argument("--name", "-n", type=str, help="New ability name (max 16 characters)")
    parser.add_argument("--description", "-d", type=str, help="New in-game summary description text (use \\n for 2nd line)")
    parser.add_argument("--list-unused", action="store_true", help="List all unused or placeholder ability slots")

    args = parser.parse_args()

    if args.list_unused:
        list_unused_ability_slots()
        return

    abilities_db = load_abilities_database()
    abilities_by_name = {v.lower(): k for k, v in abilities_db.items()}

    slot_input = args.slot
    name_input = args.name
    desc_input = args.description

    # Interactive mode if CLI arguments not provided
    if not slot_input or not name_input:
        print("\033[1;36m====================================================\033[0m")
        print("\033[1;36m   Pokemon Unbound ROM Ability Slot Patcher         \033[0m")
        print("\033[1;36m====================================================\033[0m")
        print(f"ROM Folder: {args.rom_dir}\n")

        if not slot_input:
            slot_input = input("Enter Ability Slot ID or Current Name (e.g. 77 or Unused): ").strip()
        if not name_input:
            name_input = input("Enter New Ability Name (max 16 characters): ").strip()
        if not desc_input:
            desc_input = input("Enter Summary Description (optional, use \\n for line break) [skip]: ").strip() or None

    if slot_input.isdigit():
        ability_id = int(slot_input)
    else:
        ability_id = abilities_by_name.get(slot_input.lower())
        if not ability_id:
            print(f"\033[31m[ERROR]\033[0m Could not find ability slot '{slot_input}'.")
            sys.exit(1)

    print(f"\nTarget Ability Slot: \033[1m#{ability_id}\033[0m (Current: {abilities_db.get(ability_id, 'Unregistered')})")
    print(f"New Name:            \033[1m{name_input}\033[0m")
    if desc_input:
        print(f"Description:         \033[1m{desc_input}\033[0m")
    print(f"ROM Folder:          {args.rom_dir}")

    try:
        patch_rom_ability(
            rom_dir=args.rom_dir,
            ability_id=ability_id,
            new_name=name_input,
            description=desc_input,
        )
    except Exception as e:
        print(f"\033[31m[ERROR]\033[0m Patching failed: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
