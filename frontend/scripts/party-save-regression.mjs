import process from 'node:process';
import { wu16, wu32, ru16, ru32 } from '../src/core/binary.js';
import { gbaChecksum } from '../src/core/checksum.js';
import {
    OFF_CHECKSUM,
    OFF_ID,
    OFF_SAVE_IDX,
    OFF_VALID_LEN,
    SECTION_SIZE,
} from '../src/core/sections.js';
import { editPartyMonFull, getParty } from '../src/core/party.js';

let failures = 0;

function fail(label, message) {
    failures += 1;
    console.error(`FAIL ${label}: ${message}`);
}

function pass(label) {
    console.log(`PASS ${label}`);
}

// Create a valid synthetic Trainer section with 1 party Pokemon
function makeSaveWithParty() {
    const buffer = new Uint8Array(SECTION_SIZE * 2);
    // Section 1 (Trainer section) at offset 0
    wu32(buffer, OFF_VALID_LEN, 0xFF4);
    wu16(buffer, OFF_ID, 1);
    wu32(buffer, OFF_SAVE_IDX, 1);

    // Party count = 1 at 0x34
    wu32(buffer, 0x34, 1);

    // Party mon starts at 0x38 (size 100)
    const monOffset = 0x38;
    // PID at 0x00
    wu32(buffer, monOffset + 0x00, 0x12345678);
    // OTID at 0x04
    wu32(buffer, monOffset + 0x04, 0x98765432);
    // Visual level at 0x54
    buffer[monOffset + 0x54] = 10;
    // Current HP at 0x56, Max HP at 0x58
    wu16(buffer, monOffset + 0x56, 30);
    wu16(buffer, monOffset + 0x58, 30);

    // Substruct B at 0x20: Species (u16) = 443 (Gible), Item (u16) = 0, Exp (u32) = 1000, PP Ups = 0, Happiness = 70, Ball = 3
    wu16(buffer, monOffset + 0x20 + 0, 443); // Species: Gible
    wu16(buffer, monOffset + 0x20 + 2, 0);   // Item: None
    wu32(buffer, monOffset + 0x20 + 4, 1000); // Exp
    buffer[monOffset + 0x20 + 8] = 0;        // PP Ups
    buffer[monOffset + 0x20 + 9] = 70;       // Happiness
    buffer[monOffset + 0x20 + 10] = 3;       // Poke Ball

    // Substruct A at 0x2C: Moves (4 x u16) = [33, 0, 0, 0] (Tackle), PP = [35, 0, 0, 0]
    wu16(buffer, monOffset + 0x2C + 0, 33);
    wu16(buffer, monOffset + 0x2C + 2, 0);
    wu16(buffer, monOffset + 0x2C + 4, 0);
    wu16(buffer, monOffset + 0x2C + 6, 0);
    buffer[monOffset + 0x2C + 8] = 35;
    buffer[monOffset + 0x2C + 9] = 0;
    buffer[monOffset + 0x2C + 10] = 0;
    buffer[monOffset + 0x2C + 11] = 0;

    // Substruct D at 0x38: EVs = all 0
    // Substruct C at 0x44: IVs = all 0 (packed u32 at offset 4)

    wu16(buffer, OFF_CHECKSUM, gbaChecksum(buffer, 0, 0xFF4));
    return buffer;
}

const speciesMap = new Map([
    [443, 'Gible'],
    [444, 'Gabite'],
    [445, 'Garchomp'],
]);

const buffer = makeSaveWithParty();

// 1. Initial party read
const initialParty = getParty(buffer, speciesMap);
if (!initialParty || initialParty.length !== 1 || initialParty[0].species_id !== 443) {
    fail('initial party read', JSON.stringify(initialParty));
} else {
    pass('initial party read');
}

// 2. Perform full party edit
const editPayload = {
    slot: 0,
    nickname: 'LandShark',
    species_id: 443,
    level_edit: {
        target_level: 50,
        growth_rate: 3,
    },
    nature_id: 3, // Adamant
    item_id: 219, // Leftovers
    ball_id: 1, // Ultra Ball
    happiness: 255,
    current_ability_index: 0,
    shiny: true,
    gender: 'male',
    ivs: { HP: 31, Atk: 31, Def: 31, Spe: 31, SpA: 31, SpD: 31 },
    evs: { HP: 6, Atk: 252, Def: 0, Spe: 252, SpA: 0, SpD: 0 },
    moves: [89, 242, 337, 200],
    move_pp: [10, 15, 15, 10],
    move_pp_ups: [3, 3, 3, 3],
};

try {
    editPartyMonFull(buffer, editPayload, speciesMap);
    pass('editPartyMonFull executed without error');
} catch (err) {
    fail('editPartyMonFull execution', err.message);
}

// 3. Read back modified party and assert all fields
const updatedParty = getParty(buffer, speciesMap);
const updatedMon = updatedParty[0];

if (updatedMon.nickname !== 'LandShark') {
    fail('nickname edit', `expected LandShark, got ${updatedMon.nickname}`);
} else {
    pass('nickname edit');
}

if (updatedMon.level !== 50) {
    fail('level edit', `expected 50, got ${updatedMon.level}`);
} else {
    pass('level edit');
}

if (updatedMon.nature_id !== 3 || updatedMon.nature !== 'Adamant') {
    fail('nature edit', `expected Adamant (3), got ${updatedMon.nature} (${updatedMon.nature_id})`);
} else {
    pass('nature edit');
}

if (updatedMon.item_id !== 219) {
    fail('held item edit', `expected 219, got ${updatedMon.item_id}`);
} else {
    pass('held item edit');
}

if (updatedMon.ball_id !== 1) {
    fail('ball edit', `expected 1, got ${updatedMon.ball_id}`);
} else {
    pass('ball edit');
}

if (updatedMon.happiness !== 255) {
    fail('happiness edit', `expected 255, got ${updatedMon.happiness}`);
} else {
    pass('happiness edit');
}

if (!updatedMon.is_shiny) {
    fail('shiny edit', 'expected is_shiny to be true');
} else {
    pass('shiny edit');
}

if (updatedMon.gender !== 'male') {
    fail('gender edit', `expected male, got ${updatedMon.gender}`);
} else {
    pass('gender edit');
}

if (
    updatedMon.ivs.HP !== 31 ||
    updatedMon.ivs.Atk !== 31 ||
    updatedMon.ivs.Def !== 31 ||
    updatedMon.ivs.Spd !== 31 ||
    updatedMon.ivs.SpA !== 31 ||
    updatedMon.ivs.SpD !== 31
) {
    fail('ivs edit', JSON.stringify(updatedMon.ivs));
} else {
    pass('ivs edit');
}

if (
    updatedMon.evs.HP !== 6 ||
    updatedMon.evs.Atk !== 252 ||
    updatedMon.evs.Def !== 0 ||
    updatedMon.evs.Spd !== 252 ||
    updatedMon.evs.SpA !== 0 ||
    updatedMon.evs.SpD !== 0
) {
    fail('evs edit', JSON.stringify(updatedMon.evs));
} else {
    pass('evs edit');
}

if (
    updatedMon.moves[0] !== 89 ||
    updatedMon.moves[1] !== 242 ||
    updatedMon.moves[2] !== 337 ||
    updatedMon.moves[3] !== 200
) {
    fail('moves edit', JSON.stringify(updatedMon.moves));
} else {
    pass('moves edit');
}

if (
    updatedMon.move_pp_ups[0] !== 3 ||
    updatedMon.move_pp_ups[1] !== 3 ||
    updatedMon.move_pp_ups[2] !== 3 ||
    updatedMon.move_pp_ups[3] !== 3
) {
    fail('move pp ups edit', JSON.stringify(updatedMon.move_pp_ups));
} else {
    pass('move pp ups edit');
}

if (failures > 0) {
    console.error(`Party save regression failed with ${failures} failure(s).`);
    process.exit(1);
} else {
    console.log('All party save regression tests PASSED.');
}
