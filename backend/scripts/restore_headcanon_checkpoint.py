#!/usr/bin/env python3
"""
Restore Headcanon Checkpoint & Synchronize Save Editor Metadata
==============================================================
Restores base ROM to clean state with all user headcanon changes applied:
  1. Snorunt (#346): Dual Typing Ice (15) / Ghost (7)
  2. Bone Rush (#198) -> Bone Crush (Name: 'Bone Crush', Accuracy: 100%, Power: 25 BP)
  3. Gible (#496): Base Speed: 60, HA: Rough Skin (24)
  4. Full metadata synchronization across frontend, backend, switch-homebrew, and 3ds-homebrew.
"""

from __future__ import annotations

import json
import struct
from pathlib import Path

WORKSPACE_ROOT = Path(__file__).resolve().parents[2]
ROM_DIR = Path(r"D:\Louis\Emulators\mGBA (GBA)\Pokemon Unbound Official Patch 2.1.1+")
GBA_PATH = ROM_DIR / "Pokemon Unbound.gba"

TARGET_REVERSION_PATH = Path(
    r"D:\Louis\Emulators\mGBA (GBA)\Pokemon Unbound Official Patch 2.1.1+\backups\others\Pokemon Unbound_with-Snorunt-Bone-Crush.gba"
)

BACKEND_DATA = WORKSPACE_ROOT / "backend" / "data"
FRONTEND_CORE = WORKSPACE_ROOT / "frontend" / "src" / "core"
FRONTEND_PUBLIC = WORKSPACE_ROOT / "frontend" / "public" / "data"
SWITCH_DATA = WORKSPACE_ROOT / "switch-homebrew" / "romfs" / "data"
THREE_DS_DATA = WORKSPACE_ROOT / "3ds-homebrew" / "romfs" / "data"

CHAR_TO_GBA = {
    " ": 0x00, "!": 0xAB, "?": 0xAC, ".": 0xAD, "-": 0xAE, "/": 0xBA,
    ",": 0xB8, "'": 0xB4, "\n": 0xFE, "(": 0xB2, ")": 0xB3,
}
for _i in range(26):
    CHAR_TO_GBA[chr(ord("A") + _i)] = 0xBB + _i
    CHAR_TO_GBA[chr(ord("a") + _i)] = 0xD5 + _i
for _i in range(10):
    CHAR_TO_GBA[str(_i)] = 0xA1 + _i


def encode_gba_name(text: str, max_len: int) -> bytes:
    encoded = bytearray()
    for ch in text[:max_len]:
        encoded.append(CHAR_TO_GBA.get(ch, 0x00))
    encoded.append(0xFF)
    while len(encoded) < (max_len + 1):
        encoded.append(0xFF)
    return bytes(encoded[: max_len + 1])


def apply_rom_patches():
    if not TARGET_REVERSION_PATH.exists():
        raise FileNotFoundError(f"Target reversion file not found: {TARGET_REVERSION_PATH}")
    
    print(f"[ROM] Reading target reversion file from:\n      {TARGET_REVERSION_PATH}")
    data = bytearray(TARGET_REVERSION_PATH.read_bytes())

    # Write directly to active ROM path
    GBA_PATH.write_bytes(data)
    print(f"\n[SUCCESS] Restored active ROM successfully from {TARGET_REVERSION_PATH.name} ({len(data)} bytes)!")


def sync_metadata():
    print("\n--- Synchronizing Metadata Across All Platforms ---")

    # 1. abilitiesCatalog.json (Revert 77 to Unused, ensure 179 is Stall)
    cat_path = FRONTEND_CORE / "abilitiesCatalog.json"
    if cat_path.exists():
        data = json.loads(cat_path.read_text("utf-8"))
        data["77"] = "Unused"
        data["179"] = "Stall"
        cat_path.write_text(json.dumps(data, indent=2), encoding="utf-8")
        print(f"[SYNC] {cat_path.name} (Ability 77 = Unused, Ability 179 = Stall)")

    # 2. abilities.txt (Ensure 77 is Unused, 179 is Stall)
    for d in [BACKEND_DATA, FRONTEND_PUBLIC, SWITCH_DATA, THREE_DS_DATA]:
        p = d / "abilities.txt"
        if p.exists():
            lines = p.read_text("utf-8", errors="ignore").splitlines()
            new_lines = []
            for l in lines:
                if l.startswith("77:"):
                    new_lines.append("77:Unused")
                elif l.startswith("179:"):
                    new_lines.append("179:Stall")
                else:
                    new_lines.append(l)
            p.write_text("\n".join(new_lines) + "\n", encoding="utf-8")
            print(f"[SYNC] {p}")

    # 3. ability_table_from_rom.json
    for d in [BACKEND_DATA, SWITCH_DATA, THREE_DS_DATA]:
        p = d / "ability_table_from_rom.json"
        if p.exists():
            data = json.loads(p.read_text("utf-8"))
            for entry in data.get("abilities", []):
                if entry.get("ability_id") == 77:
                    entry["name"] = "Unused"
                    entry["raw_hex"] = encode_gba_name("Unused", 16).hex()
                elif entry.get("ability_id") == 179:
                    entry["name"] = "Stall"
                    entry["raw_hex"] = encode_gba_name("Stall", 16).hex()
            p.write_text(json.dumps(data, indent=2), encoding="utf-8")
            print(f"[SYNC] {p}")

    # 4. species_abilities_meta.json
    for p in [BACKEND_DATA / "species_abilities_meta.json", FRONTEND_CORE / "speciesAbilitiesMeta.json"]:
        if p.exists():
            data = json.loads(p.read_text("utf-8"))
            if "496" in data:
                data["496"]["hidden_ability_id"] = 24  # Rough Skin
            p.write_text(json.dumps(data, indent=2), encoding="utf-8")
            print(f"[SYNC] {p.name} (Gible HA = 24 / Rough Skin)")

    # 5. species_types.json (Snorunt #346 = Ice / Ghost)
    for p in [
        BACKEND_DATA / "species_types.json",
        FRONTEND_CORE / "speciesTypes.json",
        SWITCH_DATA / "species_types.json",
        THREE_DS_DATA / "species_types.json",
    ]:
        if p.exists():
            data = json.loads(p.read_text("utf-8"))
            data["346"] = {
                "type1": "Ice",
                "type2": "Ghost",
                "types": ["Ice", "Ghost"],
                "type1_id": 15,
                "type2_id": 7,
            }
            p.write_text(json.dumps(data, indent=2), encoding="utf-8")
            print(f"[SYNC] {p.name} (Snorunt Types = Ice / Ghost)")

    # 6. species_base_stats.json (Gible #496 Speed = 60)
    for p in [
        BACKEND_DATA / "species_base_stats.json",
        FRONTEND_CORE / "speciesBaseStats.json",
        SWITCH_DATA / "species_base_stats.json",
    ]:
        if p.exists():
            data = json.loads(p.read_text("utf-8"))
            if "496" in data:
                data["496"]["spe"] = 60
                data["496"].pop("3", None)
            p.write_text(json.dumps(data, indent=2), encoding="utf-8")
            print(f"[SYNC] {p.name} (Gible Base Speed = 60)")

    # 7. moves_meta.json & moves.txt (Bone Rush #198 -> Bone Crush, Acc: 100%)
    for p in [
        BACKEND_DATA / "moves_meta.json",
        FRONTEND_CORE / "movesMeta.json",
        FRONTEND_PUBLIC / "moves_meta.json",
        SWITCH_DATA / "moves_meta.json",
        THREE_DS_DATA / "moves_meta.json",
    ]:
        if p.exists():
            data = json.loads(p.read_text("utf-8"))
            if "198" in data:
                data["198"]["name"] = "Bone Crush"
                data["198"]["accuracy"] = 100
                data["198"]["power"] = 25
            p.write_text(json.dumps(data, indent=2), encoding="utf-8")
            print(f"[SYNC] {p.name} (Move 198: Bone Crush, 100% Acc)")

    for p in [
        BACKEND_DATA / "moves.txt",
        FRONTEND_PUBLIC / "moves.txt",
        SWITCH_DATA / "moves.txt",
        THREE_DS_DATA / "moves.txt",
    ]:
        if p.exists():
            lines = p.read_text("utf-8", errors="ignore").splitlines()
            new_lines = [l if not l.startswith("198:") else "198:Bone Crush" for l in lines]
            p.write_text("\n".join(new_lines) + "\n", encoding="utf-8")
            print(f"[SYNC] {p}")

    print("\n[SUCCESS] All metadata synchronized!")


if __name__ == "__main__":
    apply_rom_patches()
    sync_metadata()
