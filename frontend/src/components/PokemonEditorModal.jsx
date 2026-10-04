import React, { useState, useEffect, useMemo, useRef } from 'react';
import { X, Zap, Save, Search, Download, CircleHelp, ChevronDown } from 'lucide-react';
import { calcCurrentLevel, GROWTH_OPTIONS } from '../core/growth.js';
import { ITEM_ICON_FALLBACK_URL, POKEMON_ICON_FALLBACK_URL } from '../core/iconResolver.js';
import { NATURES, NATURE_GROUPS, normalizeName, parseShowdownSet, resolveShowdownSet } from '../core/showdownImport.js';
import PokedexFlagsControls from './PokedexFlagsControls.jsx';
import { calculateBattleStats, calculateHiddenPowerType } from '../core/battlePreview.js';
import speciesBaseStats from '../core/speciesBaseStats.json' with { type: 'json' };
import movesMeta from '../core/movesMeta.json' with { type: 'json' };

const TYPE_STYLES = {
    Normal: { bg: 'bg-stone-500/20', text: 'text-stone-300', border: 'border-stone-500/30' },
    Fire: { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/30' },
    Water: { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30' },
    Grass: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/30' },
    Electric: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/30' },
    Ice: { bg: 'bg-cyan-400/20', text: 'text-cyan-300', border: 'border-cyan-400/30' },
    Fighting: { bg: 'bg-red-700/20', text: 'text-red-400', border: 'border-red-700/30' },
    Poison: { bg: 'bg-purple-500/20', text: 'text-purple-300', border: 'border-purple-500/30' },
    Ground: { bg: 'bg-amber-600/20', text: 'text-amber-300', border: 'border-amber-600/30' },
    Flying: { bg: 'bg-indigo-400/20', text: 'text-indigo-300', border: 'border-indigo-400/30' },
    Psychic: { bg: 'bg-pink-500/20', text: 'text-pink-400', border: 'border-pink-500/30' },
    Bug: { bg: 'bg-lime-500/20', text: 'text-lime-400', border: 'border-lime-500/30' },
    Rock: { bg: 'bg-yellow-700/20', text: 'text-yellow-300', border: 'border-yellow-700/30' },
    Ghost: { bg: 'bg-violet-700/20', text: 'text-violet-300', border: 'border-violet-700/30' },
    Dragon: { bg: 'bg-indigo-600/20', text: 'text-indigo-400', border: 'border-indigo-600/30' },
    Steel: { bg: 'bg-slate-400/20', text: 'text-slate-300', border: 'border-slate-400/30' },
    Dark: { bg: 'bg-zinc-800/80', text: 'text-zinc-300', border: 'border-zinc-600/40' },
    Fairy: { bg: 'bg-rose-400/20', text: 'text-rose-300', border: 'border-rose-400/30' },
};

const TYPE_ABBR = {
    Normal: 'NOR',
    Fire: 'FIR',
    Water: 'WAT',
    Grass: 'GRA',
    Electric: 'ELE',
    Ice: 'ICE',
    Fighting: 'FIG',
    Poison: 'POI',
    Ground: 'GRO',
    Flying: 'FLY',
    Psychic: 'PSY',
    Bug: 'BUG',
    Rock: 'ROC',
    Ghost: 'GHO',
    Dragon: 'DRA',
    Steel: 'STE',
    Dark: 'DAR',
    Fairy: 'FAI',
};

const EV_STAT_MAX = 252;
const EV_TOTAL_MAX = 510;
const MIN_LEVEL = 1;
const MAX_LEVEL = 100;
const clampNumber = (value, min, max) => {
    const parsed = Number.parseInt(value, 10);
    if (!Number.isFinite(parsed)) return min;
    return Math.max(min, Math.min(max, parsed));
};

const getSpeedStatValue = (stats = {}) =>
    Number(stats.Spd ?? stats.Spe ?? 0);

const getTotalEvs = (evs = {}) =>
    Number(evs.HP ?? 0) +
    Number(evs.Atk ?? 0) +
    Number(evs.Def ?? 0) +
    Number(evs.SpA ?? 0) +
    Number(evs.SpD ?? 0) +
    getSpeedStatValue(evs);

export const PokemonEditorModal = ({ client, pokemon, legitMode = false, hackedMode = false, onClose, onSave, showToast }) => {
    const isPcMon = Boolean(pokemon?.isPC);
    const SAFE_IMPORT_NOTE = 'Existing Pokemon import applies item, moves, IVs, EVs, nature, and ability (if valid). Species, level, and identity metadata are preserved.';
    const initialGrowthMode = 'auto';
    const inferredSpeciesGrowth = Number.isInteger(Number(pokemon?.species_growth_rate))
        ? Number(pokemon?.species_growth_rate)
        : 0;
    const initialLevel = pokemon?.level ?? (isPcMon ? calcCurrentLevel(inferredSpeciesGrowth, Number(pokemon?.exp || 0)) : 1);

    const [activeTab, setActiveTab] = useState('stats');
    const [localPk, setLocalPk] = useState({
        ...pokemon,
        moves: Array.isArray(pokemon?.moves) ? [...pokemon.moves].slice(0, 4) : [0, 0, 0, 0],
        move_pp: Array.isArray(pokemon?.move_pp) ? [...pokemon.move_pp].slice(0, 4) : [0, 0, 0, 0],
        move_pp_ups: Array.isArray(pokemon?.move_pp_ups) ? [...pokemon.move_pp_ups].slice(0, 4) : [0, 0, 0, 0],
    });
    const [allMoves, setAllMoves] = useState([]);
    const [allAbilities, setAllAbilities] = useState([]);
    const [searchTerm, setSearchTerm] = useState(['', '', '', '']);
    const [allItems, setAllItems] = useState([]);
    const [allBalls, setAllBalls] = useState([]);
    const [allSpecies, setAllSpecies] = useState([]);
    const [itemSearch, setItemSearch] = useState('');
    const [speciesSearch, setSpeciesSearch] = useState('');
    const [renameOnSpeciesChange, setRenameOnSpeciesChange] = useState(() => {
        const nick = String(pokemon?.nickname || '').trim().toLowerCase();
        const speciesDisplay = String(pokemon?.species_display_name || pokemon?.species_name || '').trim().toLowerCase();
        return Boolean(nick && speciesDisplay && nick === speciesDisplay);
    });
    const [levelInput, setLevelInput] = useState(String(initialLevel));
    const [levelGrowthMode, setLevelGrowthMode] = useState(initialGrowthMode);
    const [levelDirty, setLevelDirty] = useState(false);
    const [showImport, setShowImport] = useState(false);
    const [setImportText, setSetImportText] = useState('');
    const [setImportErrors, setSetImportErrors] = useState([]);
    const [setImportWarnings, setSetImportWarnings] = useState([]);
    const [isSaving, setIsSaving] = useState(false);
    const [saveStage, setSaveStage] = useState('Applying changes...');
    const [showImportHelp, setShowImportHelp] = useState(false);
    const [itemDropdownOpen, setItemDropdownOpen] = useState(false);
    const [ballDropdownOpen, setBallDropdownOpen] = useState(false);
    const [ballSearch, setBallSearch] = useState('');
    const itemDropdownRef = useRef(null);
    const ballDropdownRef = useRef(null);

    const hasKnownItemName = (name) => {
        if (!name) return false;
        const low = name.toLowerCase();
        return !low.startsWith('item ') && !low.startsWith('id ') && name !== '--- EMPTY ---';
    };

    const currentItem = allItems.find(i => i.id === localPk.item_id);
    const currentItemName = localPk.item_id === 0 ? 'None' : (currentItem?.name || `ID ${localPk.item_id}`);
    const currentBall = allBalls.find((b) => Number(b.ball_id) === Number(localPk.ball_id));
    const currentBallName = currentBall?.name || localPk.ball_name || `Unknown Ball #${localPk.ball_id}`;
    const currentBallItemId = currentBall?.item_id || localPk.ball_item_id || null;
    const currentSpecies = allSpecies.find(s => s.id === localPk.species_id);
    const currentSpeciesName = currentSpecies?.label || currentSpecies?.name || `Species ${localPk.species_id}`;
    const canShowItemIcon =
        localPk.item_id > 0 &&
        !!currentItem &&
        hasKnownItemName(currentItem.name);

    useEffect(() => {
        client.getMoves()
            .then(data => setAllMoves(data));
    }, [client]);

    useEffect(() => {
        client.getAbilities()
            .then(data => setAllAbilities(data));
    }, [client]);

    const updateStat = (type, stat, val) => {
        setLocalPk((prev) => {
            const nextGroup = { ...(prev[type] || {}) };

            if (type === 'ivs') {
                nextGroup[stat] = clampNumber(val, 0, 31);
            } else if (type === 'evs') {
                let nextEv = clampNumber(val, 0, EV_STAT_MAX);
                if (!hackedMode) {
                    const currentTotal = getTotalEvs(prev.evs || {});
                    const currentStat = Number((prev.evs || {})[stat] ?? 0);
                    const totalWithoutCurrent = currentTotal - currentStat;
                    const remainingForCurrent = Math.max(0, EV_TOTAL_MAX - totalWithoutCurrent);
                    nextEv = Math.min(nextEv, remainingForCurrent);
                }
                nextGroup[stat] = nextEv;
            } else {
                nextGroup[stat] = clampNumber(val, 0, Number.MAX_SAFE_INTEGER);
            }

            return {
                ...prev,
                [type]: nextGroup,
            };
        });
    };

    const setAllIvs = (val) => {
        const clamped = clampNumber(val, 0, 31);
        setLocalPk((prev) => {
            const nextIvs = { ...(prev.ivs || {}) };
            ['HP', 'Atk', 'Def', 'SpA', 'SpD', 'Spe', 'Spd'].forEach((k) => {
                if (k in nextIvs || ['HP', 'Atk', 'Def', 'SpA', 'SpD'].includes(k)) {
                    nextIvs[k] = clamped;
                }
            });
            return { ...prev, ivs: nextIvs };
        });
    };

    const clearAllEvs = () => {
        setLocalPk((prev) => {
            const nextEvs = { ...(prev.evs || {}) };
            Object.keys(nextEvs).forEach((k) => {
                nextEvs[k] = 0;
            });
            return { ...prev, evs: nextEvs };
        });
    };

    const setMaxAllPp = () => {
        const nextUps = [3, 3, 3, 3];
        const nextPp = (localPk.moves || [0, 0, 0, 0]).map((moveId) => {
            const id = Number(moveId || 0);
            if (id <= 0) return 0;
            const moveEntry = allMoves.find((m) => Number(m.id) === id) || movesMeta[String(id)];
            const basePp = Number(moveEntry?.base_pp || 0);
            return basePp > 0 ? basePp + Math.floor((basePp * 3) / 5) : 0;
        });
        setLocalPk({ ...localPk, move_pp_ups: nextUps, move_pp: nextPp });
    };

    const updateMove = (slotIndex, moveId) => {
        const nextMoveId = Number.parseInt(moveId, 10) || 0;
        const newMoves = [...(localPk.moves || [0, 0, 0, 0])];
        const newMovePp = [...(localPk.move_pp || [0, 0, 0, 0])];
        const newMovePpUps = [...(localPk.move_pp_ups || [0, 0, 0, 0])];
        newMoves[slotIndex] = nextMoveId;

        if (nextMoveId <= 0) {
            newMovePpUps[slotIndex] = 0;
            newMovePp[slotIndex] = 0;
        } else {
            const moveEntry = allMoves.find((m) => Number(m.id) === nextMoveId) || movesMeta[String(nextMoveId)];
            const basePp = Number(moveEntry?.base_pp || 0);
            const ppUp = Math.max(0, Math.min(3, Number(newMovePpUps[slotIndex] || 0)));
            const maxPp = basePp > 0 ? basePp + Math.floor((basePp * ppUp) / 5) : 0;
            newMovePp[slotIndex] = maxPp;
        }

        setLocalPk({ ...localPk, moves: newMoves, move_pp: newMovePp, move_pp_ups: newMovePpUps });

        const newSearch = [...searchTerm];
        newSearch[slotIndex] = '';
        setSearchTerm(newSearch);
    };

    const getSlotMaxPp = (slotIndex) => {
        const moveId = Number(localPk.moves?.[slotIndex] || 0);
        if (moveId <= 0) return 0;
        const moveEntry = allMoves.find((m) => Number(m.id) === moveId) || movesMeta[String(moveId)];
        const basePp = Number(moveEntry?.base_pp || 0);
        const ppUp = Math.max(0, Math.min(3, Number(localPk.move_pp_ups?.[slotIndex] || 0)));
        if (!Number.isFinite(basePp) || basePp <= 0) return 0;
        return basePp + Math.floor((basePp * ppUp) / 5);
    };

    const updateMovePp = (slotIndex, value) => {
        const maxPp = getSlotMaxPp(slotIndex);
        const next = [...(localPk.move_pp || [0, 0, 0, 0])];
        next[slotIndex] = Math.max(0, Math.min(maxPp, clampNumber(value, 0, maxPp || 0)));
        setLocalPk({ ...localPk, move_pp: next });
    };

    const updateMovePpUps = (slotIndex, value) => {
        const moveId = Number(localPk.moves?.[slotIndex] || 0);
        const nextUps = [...(localPk.move_pp_ups || [0, 0, 0, 0])];
        if (moveId <= 0) {
            nextUps[slotIndex] = 0;
            const nextPp = [...(localPk.move_pp || [0, 0, 0, 0])];
            nextPp[slotIndex] = 0;
            setLocalPk({ ...localPk, move_pp_ups: nextUps, move_pp: nextPp });
            return;
        }

        nextUps[slotIndex] = Math.max(0, Math.min(3, clampNumber(value, 0, 3)));
        const moveEntry = allMoves.find((m) => Number(m.id) === moveId) || movesMeta[String(moveId)];
        const basePp = Number(moveEntry?.base_pp || 0);
        const nextMax = basePp > 0 ? basePp + Math.floor((basePp * nextUps[slotIndex]) / 5) : 0;
        const nextPp = [...(localPk.move_pp || [0, 0, 0, 0])];
        // Automatically top up current PP to match new max usable PP
        nextPp[slotIndex] = nextMax;
        setLocalPk({ ...localPk, move_pp_ups: nextUps, move_pp: nextPp });
    };

    const setMoveMaxPp = (slotIndex) => {
        const moveId = Number(localPk.moves?.[slotIndex] || 0);
        const nextUps = [...(localPk.move_pp_ups || [0, 0, 0, 0])];
        const nextPp = [...(localPk.move_pp || [0, 0, 0, 0])];
        if (moveId <= 0) {
            nextUps[slotIndex] = 0;
            nextPp[slotIndex] = 0;
        } else {
            nextUps[slotIndex] = 3;
            const moveEntry = allMoves.find((m) => Number(m.id) === moveId) || movesMeta[String(moveId)];
            const basePp = Number(moveEntry?.base_pp || 0);
            const maxPp = basePp > 0 ? basePp + Math.floor((basePp * 3) / 5) : 0;
            nextPp[slotIndex] = maxPp;
        }
        setLocalPk({ ...localPk, move_pp_ups: nextUps, move_pp: nextPp });
    };

    useEffect(() => {
        client.getItems()
            .then(data => setAllItems(data));
    }, [client]);

    useEffect(() => {
        client.getBalls()
            .then(data => setAllBalls(data || []));
    }, [client]);

    useEffect(() => {
        client.getSpecies()
            .then(data => setAllSpecies(data));
    }, [client]);

    useEffect(() => {
        const onKeyDown = (e) => {
            if (e.key === 'Escape' && !isSaving) {
                onClose();
            }
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [onClose, isSaving]);

    useEffect(() => {
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, []);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (itemDropdownRef.current && !itemDropdownRef.current.contains(e.target)) {
                setItemDropdownOpen(false);
            }
            if (ballDropdownRef.current && !ballDropdownRef.current.contains(e.target)) {
                setBallDropdownOpen(false);
            }
        };
        if (itemDropdownOpen || ballDropdownOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [itemDropdownOpen, ballDropdownOpen]);

    const applySpeciesSelection = (species) => {
        const previousSpecies = allSpecies.find(s => s.id === localPk.species_id);
        const previousDisplay = previousSpecies?.display_name || previousSpecies?.name || '';
        const nextDisplay = species?.display_name || species?.name || '';
        const currentNick = String(localPk.nickname || '').trim();
        const shouldAutoRename =
            renameOnSpeciesChange ||
            (currentNick && previousDisplay && currentNick.toLowerCase() === previousDisplay.toLowerCase());

        setLocalPk({
            ...localPk,
            species_id: species.id,
            nickname: shouldAutoRename && nextDisplay ? nextDisplay : localPk.nickname,
        });
        setSpeciesSearch('');
    };

    const applyShowdownImport = () => {
        if (!allSpecies.length || !allMoves.length || !allItems.length || !allAbilities.length) {
            setSetImportErrors(['Catalogs are still loading. Try again in a second.']);
            setSetImportWarnings([]);
            return;
        }

        const { parsed, errors } = parseShowdownSet(setImportText);
        const { errors: resolvedErrors, warnings, resolved } = resolveShowdownSet({
            parsed,
            catalogs: {
                species: allSpecies,
                items: allItems,
                moves: allMoves,
                abilities: allAbilities,
            },
            legitMode,
            hackedMode,
            levelFallback: Number(localPk.level || initialLevel || 1),
        });

        const blocking = [...errors, ...resolvedErrors];
        if (blocking.length > 0) {
            setSetImportErrors(blocking);
            setSetImportWarnings(warnings);
            return;
        }

        const mapImportedStats = (source, speedKey, fallback = 0) => ({
            HP: Number(source.HP ?? fallback),
            Atk: Number(source.Atk ?? fallback),
            Def: Number(source.Def ?? fallback),
            SpA: Number(source.SpA ?? fallback),
            SpD: Number(source.SpD ?? fallback),
            [speedKey]: Number(source.Spe ?? source.Spd ?? fallback),
        });

        const speedIvKey = Object.prototype.hasOwnProperty.call(localPk.ivs || {}, 'Spe') ? 'Spe' : 'Spd';
        const speedEvKey = Object.prototype.hasOwnProperty.call(localPk.evs || {}, 'Spe') ? 'Spe' : 'Spd';
        const nextState = { ...localPk };
        const ignoredWarnings = [];

        if (resolved.speciesRow && Number(resolved.speciesRow.id) !== Number(localPk.species_id)) {
            ignoredWarnings.push(`Ignored imported species ${resolved.speciesRow.label || resolved.speciesRow.name || resolved.speciesRow.id}; existing species is preserved.`);
        }
        if (resolved.itemRow) {
            nextState.item_id = Number(resolved.itemRow.id);
        }
        if (parsed.evs) {
            nextState.evs = mapImportedStats(parsed.evs, speedEvKey, 0);
        }
        if (parsed.ivs) {
            nextState.ivs = mapImportedStats(parsed.ivs, speedIvKey, 31);
        }
        if (resolved.moveRows.length > 0) {
            const moveIds = [0, 0, 0, 0];
            const movePp = [0, 0, 0, 0];
            const movePpUps = [0, 0, 0, 0];
            resolved.moveRows.forEach((m, idx) => {
                if (idx < 4) {
                    moveIds[idx] = Number(m.id);
                    const basePp = Number(m.base_pp || 0);
                    movePp[idx] = basePp > 0 ? basePp : 0;
                }
            });
            nextState.moves = moveIds;
            nextState.move_pp = movePp;
            nextState.move_pp_ups = movePpUps;
        }
        if (resolved.natureId !== null) {
            nextState.nature_id = resolved.natureId;
        } else if (parsed.natureName) {
            ignoredWarnings.push('Ignored imported nature because it could not be resolved.');
        }
        if (parsed.abilityName) {
            const wanted = normalizeName(parsed.abilityName);
            const abilityOptions = [
                { idx: 0, name: nextState.ability_1_name },
                { idx: 1, name: nextState.ability_2_name },
                { idx: 2, name: nextState.ability_hidden_name },
            ];
            const matched = abilityOptions.find((opt) => normalizeName(opt.name || '') === wanted);
            if (matched) {
                nextState.current_ability_index = matched.idx;
                if (matched.idx === 0) nextState.ability_label_current = nextState.ability_1_name || 'Slot 1 (Standard)';
                else if (matched.idx === 1) nextState.ability_label_current = nextState.ability_2_name || 'Slot 2 (Standard)';
                else nextState.ability_label_current = nextState.ability_hidden_name || 'Hidden Ability';
            } else {
                ignoredWarnings.push('Ignored imported ability because it is not available for the current species.');
            }
        }
        if (parsed.shiny !== null) {
            ignoredWarnings.push('Ignored imported shiny flag; current identity metadata is preserved.');
        }
        if (resolved.levelToApply !== null) {
            ignoredWarnings.push('Ignored imported level; level/exp are preserved for existing Pokemon.');
        }
        if (parsed.nickname) {
            ignoredWarnings.push('Ignored imported nickname; current nickname is preserved.');
        }

        setLocalPk(nextState);
        setSetImportErrors([]);
        setSetImportWarnings([
            ...warnings,
            ...ignoredWarnings,
            SAFE_IMPORT_NOTE,
            'Set imported into editor. Review and click SAVE CHANGES to commit.',
        ]);
    };


    const handleSaveClick = async () => {
        setIsSaving(true);
        setSaveStage('Applying changes...');
        const payload = { ...localPk };
        if (levelDirty) {
            const parsedLevel = clampNumber(levelInput, MIN_LEVEL, MAX_LEVEL);
            payload.level = parsedLevel;
            payload.level_edit = {
                target_level: parsedLevel,
                growth_rate: levelGrowthMode === 'auto' ? null : parseInt(levelGrowthMode, 10),
            };
        }
        try {
            setSaveStage('Saving file...');
            await Promise.resolve(onSave(payload));
        } finally {
            setIsSaving(false);
        }
    };

    const levelClampFallback = Number(localPk.level || initialLevel || MIN_LEVEL);
    const totalEvs = getTotalEvs(localPk.evs || {});
    const remainingEvs = Math.max(0, EV_TOTAL_MAX - totalEvs);
    const previewLevel = clampNumber(levelInput, MIN_LEVEL, MAX_LEVEL) || levelClampFallback;
    const battleStats = useMemo(() => calculateBattleStats({
        speciesId: localPk.species_id,
        level: previewLevel,
        natureId: localPk.nature_id,
        ivs: localPk.ivs,
        evs: localPk.evs,
    }), [localPk.species_id, localPk.nature_id, localPk.ivs, localPk.evs, previewLevel]);
    const hiddenPowerType = useMemo(
        () => calculateHiddenPowerType(localPk.ivs || {}),
        [localPk.ivs],
    );

    const baseStats = speciesBaseStats?.[String(localPk.species_id)] || null;

    const natureIncDec = [
        [null, null], ['Atk', 'Def'], ['Atk', 'Spe'], ['Atk', 'SpA'], ['Atk', 'SpD'],
        ['Def', 'Atk'], [null, null], ['Def', 'Spe'], ['Def', 'SpA'], ['Def', 'SpD'],
        ['Spe', 'Atk'], ['Spe', 'Def'], [null, null], ['Spe', 'SpA'], ['Spe', 'SpD'],
        ['SpA', 'Atk'], ['SpA', 'Def'], ['SpA', 'Spe'], [null, null], ['SpA', 'SpD'],
        ['SpD', 'Atk'], ['SpD', 'Def'], ['SpD', 'Spe'], ['SpD', 'SpA'], [null, null],
    ];
    const [natureBoosted, natureDecreased] = natureIncDec[((Number(localPk.nature_id) % 25) + 25) % 25] || [null, null];

    const statRows = useMemo(() => [
        {
            key: 'HP',
            label: 'HP',
            base: Number(baseStats?.hp ?? 0),
            iv: Number(localPk.ivs?.HP ?? 0),
            ev: Number(localPk.evs?.HP ?? 0),
            stat: battleStats?.HP ?? 0,
            natureMod: null,
        },
        {
            key: 'Atk',
            label: 'Atk',
            base: Number(baseStats?.atk ?? 0),
            iv: Number(localPk.ivs?.Atk ?? 0),
            ev: Number(localPk.evs?.Atk ?? 0),
            stat: battleStats?.Atk ?? 0,
            natureMod: natureBoosted === 'Atk' ? 1.1 : (natureDecreased === 'Atk' ? 0.9 : 1.0),
        },
        {
            key: 'Def',
            label: 'Def',
            base: Number(baseStats?.def ?? 0),
            iv: Number(localPk.ivs?.Def ?? 0),
            ev: Number(localPk.evs?.Def ?? 0),
            stat: battleStats?.Def ?? 0,
            natureMod: natureBoosted === 'Def' ? 1.1 : (natureDecreased === 'Def' ? 0.9 : 1.0),
        },
        {
            key: 'SpA',
            label: 'SpA',
            base: Number(baseStats?.spa ?? 0),
            iv: Number(localPk.ivs?.SpA ?? 0),
            ev: Number(localPk.evs?.SpA ?? 0),
            stat: battleStats?.SpA ?? 0,
            natureMod: natureBoosted === 'SpA' ? 1.1 : (natureDecreased === 'SpA' ? 0.9 : 1.0),
        },
        {
            key: 'SpD',
            label: 'SpD',
            base: Number(baseStats?.spd ?? 0),
            iv: Number(localPk.ivs?.SpD ?? 0),
            ev: Number(localPk.evs?.SpD ?? 0),
            stat: battleStats?.SpD ?? 0,
            natureMod: natureBoosted === 'SpD' ? 1.1 : (natureDecreased === 'SpD' ? 0.9 : 1.0),
        },
        {
            key: 'Spe',
            label: 'Spe',
            base: Number(baseStats?.spe ?? 0),
            iv: Number(localPk.ivs?.Spe ?? localPk.ivs?.Spd ?? 0),
            ev: Number(localPk.evs?.Spe ?? localPk.evs?.Spd ?? 0),
            stat: battleStats?.Spe ?? 0,
            natureMod: natureBoosted === 'Spe' ? 1.1 : (natureDecreased === 'Spe' ? 0.9 : 1.0),
        },
    ], [baseStats, localPk.ivs, localPk.evs, battleStats, natureBoosted, natureDecreased]);

    const totalBase = useMemo(() => statRows.reduce((sum, r) => sum + r.base, 0), [statRows]);
    const totalIv = useMemo(() => statRows.reduce((sum, r) => sum + r.iv, 0), [statRows]);
    const totalEv = useMemo(() => statRows.reduce((sum, r) => sum + r.ev, 0), [statRows]);
    const totalBattleStat = useMemo(() => statRows.reduce((sum, r) => sum + (r.stat || 0), 0), [statRows]);

    return (
        <div
            className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300 overflow-hidden"
            onClick={isSaving ? undefined : onClose}
        >
            <div
                className="relative bg-[#0f172a] border border-white/10 w-full max-w-2xl rounded-none sm:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col h-[100dvh] sm:h-auto max-h-[100dvh] sm:max-h-[90dvh]"
                onClick={(e) => e.stopPropagation()}
            >

                <div className="p-4 sm:p-6 bg-[#1e293b] flex justify-between items-center border-b border-white/5 gap-3">
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                        <div className="w-12 h-12 bg-slate-900/80 rounded-xl flex items-center justify-center border border-white/10 overflow-hidden ring-1 ring-white/5 shrink-0">
                            <img
                                src={client.getPokemonIconUrl(localPk.species_id)}
                                className="w-10 h-10 object-contain pixelated"
                                alt="icon"
                                onError={(e) => {
                                    if (e.currentTarget.src !== POKEMON_ICON_FALLBACK_URL) {
                                        e.currentTarget.src = POKEMON_ICON_FALLBACK_URL;
                                    }
                                }}
                            />
                        </div>
                        <div className="min-w-0">
                            <h2 className="text-lg sm:text-xl font-bold truncate">{localPk.nickname}</h2>
                            <p className="text-xs text-slate-500 uppercase font-black">Pokemon Editor</p>
                        </div>
                        <div
                            className="w-10 h-10 bg-slate-900 rounded-xl border border-white/10 flex items-center justify-center overflow-hidden shrink-0"
                            title={localPk.item_id > 0 ? `Held Item: ${currentItemName}` : 'No Held Item'}
                        >
                            {canShowItemIcon ? (
                                <img
                                    src={client.getItemIconUrl(localPk.item_id)}
                                    alt={currentItemName}
                                    className="w-7 h-7 object-contain"
                                    onError={(e) => {
                                        if (e.currentTarget.src !== ITEM_ICON_FALLBACK_URL) {
                                            e.currentTarget.src = ITEM_ICON_FALLBACK_URL;
                                        }
                                    }}
                                />
                            ) : localPk.item_id > 0 ? (
                                <span className="text-[9px] font-mono text-slate-500">#{localPk.item_id}</span>
                            ) : (
                                <span className="text-sm font-mono text-slate-600 select-none font-bold" title="No Held Item">—</span>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                            type="button"
                            onClick={() => setShowImport((prev) => !prev)}
                            disabled={isSaving}
                            className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
                        >
                            <Download size={12} /> FROM SMOGON
                        </button>
                        <button
                            type="button"
                            onClick={() => setShowImportHelp((prev) => !prev)}
                            disabled={isSaving}
                            className="p-1.5 rounded-lg bg-slate-900 border border-white/10 text-slate-400 hover:text-slate-200 hover:bg-slate-800 disabled:opacity-40"
                            aria-expanded={showImportHelp}
                            aria-label="Show import help"
                        >
                            <CircleHelp size={13} />
                        </button>
                        <button onClick={onClose} disabled={isSaving} className="p-2 hover:bg-white/5 rounded-full disabled:opacity-40 disabled:cursor-not-allowed"><X /></button>
                    </div>
                </div>

                <div className="flex bg-[#1e293b]/50 p-2 gap-2 border-b border-white/5">
                    <EditorTab active={activeTab === 'stats'} label="Stats" onClick={() => setActiveTab('stats')} />
                    <EditorTab active={activeTab === 'items'} label="Items" onClick={() => setActiveTab('items')} />
                    <EditorTab active={activeTab === 'moves'} label="Moves" onClick={() => setActiveTab('moves')} />
                    <EditorTab active={activeTab === 'info'} label="Info" onClick={() => setActiveTab('info')} />
                </div>

                {showImportHelp && (
                    <div className="mx-4 sm:mx-6 mt-3 rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-[11px] text-slate-300">
                        {SAFE_IMPORT_NOTE}
                    </div>
                )}

                <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-8">
                    {showImport && (
                        <div className="mb-6 bg-slate-800/40 p-4 rounded-2xl border border-white/5 space-y-3">
                            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Smogon/Showdown Import</h4>
                            <textarea
                                value={setImportText}
                                onChange={(e) => setSetImportText(e.target.value)}
                                placeholder="Terrakion @ Choice Band\nAbility: Justified\nEVs: 252 Atk / 4 SpD / 252 Spe\nJolly Nature\n- Stone Edge\n- Close Combat\n- Earthquake\n- Quick Attack"
                                className="w-full h-36 bg-slate-900 border border-white/10 rounded-xl p-3 text-xs font-mono outline-none focus:border-blue-500/50"
                            />
                            <div className="flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    onClick={applyShowdownImport}
                                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold"
                                >
                                    Parse & Apply to Editor
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSetImportText('');
                                        setSetImportErrors([]);
                                        setSetImportWarnings([]);
                                    }}
                                    className="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-xs font-bold"
                                >
                                    Clear
                                </button>
                            </div>
                            {setImportErrors.length > 0 && (
                                <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-[11px] text-rose-200 space-y-1">
                                    {setImportErrors.map((msg, idx) => (
                                        <p key={`${msg}-${idx}`}>- {msg}</p>
                                    ))}
                                </div>
                            )}
                            {setImportWarnings.length > 0 && (
                                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[11px] text-amber-200 space-y-1">
                                    {setImportWarnings.map((msg, idx) => (
                                        <p key={`${msg}-${idx}`}>- {msg}</p>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'stats' && (
                        <div className="space-y-6">
                            {/* PKHeX-Style Comprehensive Stat Matrix & Battle Preview */}
                            <section className="bg-slate-800/40 p-4 sm:p-5 rounded-2xl border border-blue-400/20 space-y-4" aria-label="Battle preview">
                                <div className="flex items-center justify-between gap-3 flex-wrap">
                                    <div className="flex items-center gap-2">
                                        <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Stat Matrix & Battle Preview</h4>
                                        <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-md font-mono font-bold border border-blue-500/20">
                                            Lv. {previewLevel}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="flex items-center gap-1">
                                            <button
                                                type="button"
                                                onClick={() => setAllIvs(31)}
                                                className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25 transition-colors"
                                                title="Set all IVs to 31"
                                            >
                                                31 ALL IV
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setAllIvs(0)}
                                                className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-white/10 hover:bg-slate-700 transition-colors"
                                                title="Set all IVs to 0"
                                            >
                                                0 IV
                                            </button>
                                            <button
                                                type="button"
                                                onClick={clearAllEvs}
                                                className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-white/10 hover:bg-slate-700 transition-colors"
                                                title="Clear all EVs to 0"
                                            >
                                                0 EV
                                            </button>
                                        </div>
                                        <div className="flex items-center gap-1.5 ml-1">
                                            <span className="text-[10px] text-slate-400">Nature:</span>
                                            <span className="text-[10px] font-bold text-slate-200 bg-slate-900/60 px-2 py-0.5 rounded border border-white/5">
                                                {localPk.nature || 'Neutral'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {baseStats ? (
                                    <div className="overflow-x-auto rounded-xl border border-white/10 bg-slate-900/90 shadow-inner">
                                        <table className="w-full text-left border-collapse text-xs">
                                            <thead>
                                                <tr className="border-b border-white/10 bg-slate-800/60 text-[10px] font-black uppercase tracking-wider text-slate-400">
                                                    <th className="py-2.5 px-3">Stat</th>
                                                    <th className="py-2.5 px-3 text-center">Base</th>
                                                    <th className="py-2.5 px-3 text-center">IVs (0-31)</th>
                                                    <th className="py-2.5 px-3 text-center">EVs (0-252)</th>
                                                    <th className="py-2.5 px-3 text-right">Battle Stat</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/5 font-mono">
                                                {statRows.map((row) => {
                                                    const isBoosted = row.natureMod === 1.1;
                                                    const isDecreased = row.natureMod === 0.9;
                                                    return (
                                                        <tr
                                                            key={row.key}
                                                            className={`hover:bg-white/[0.02] transition-colors ${
                                                                isBoosted ? 'bg-rose-500/5' : isDecreased ? 'bg-sky-500/5' : ''
                                                            }`}
                                                        >
                                                            <td className="py-2 px-3 font-sans font-bold align-middle">
                                                                <div className="flex items-center gap-1.5 min-h-[2rem]">
                                                                    <span className={
                                                                        isBoosted ? 'text-rose-400 font-black' : (isDecreased ? 'text-sky-400 font-black' : 'text-slate-300')
                                                                    }>
                                                                        {row.label}
                                                                    </span>
                                                                    {isBoosted && (
                                                                        <span className="text-[9px] bg-rose-500/20 text-rose-300 px-1 py-0.5 rounded font-mono font-bold tracking-tighter leading-none" title="Nature +10%">
                                                                            ▲
                                                                        </span>
                                                                    )}
                                                                    {isDecreased && (
                                                                        <span className="text-[9px] bg-sky-500/20 text-sky-300 px-1 py-0.5 rounded font-mono font-bold tracking-tighter leading-none" title="Nature -10%">
                                                                            ▼
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td className="py-2 px-3 text-center text-slate-400 font-bold align-middle">
                                                                <span className="bg-slate-800/60 px-2 py-0.5 rounded border border-white/5 inline-block min-w-[2.5rem]">
                                                                    {row.base}
                                                                </span>
                                                            </td>
                                                            <td className="py-2 px-3 text-center align-middle">
                                                                <input
                                                                    type="number"
                                                                    min="0"
                                                                    max="31"
                                                                    value={row.iv}
                                                                    onChange={(e) => updateStat('ivs', row.key, e.target.value)}
                                                                    className={`w-14 bg-slate-950/80 border rounded-lg text-center font-mono font-bold text-xs py-1 transition-colors outline-none focus:ring-1 focus:ring-blue-400 ${
                                                                        row.iv === 31 ? 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10' : 'text-slate-200 border-white/10'
                                                                    }`}
                                                                />
                                                            </td>
                                                            <td className="py-2 px-3 text-center align-middle">
                                                                <input
                                                                    type="number"
                                                                    min="0"
                                                                    max="252"
                                                                    value={row.ev}
                                                                    onChange={(e) => updateStat('evs', row.key, e.target.value)}
                                                                    className={`w-16 bg-slate-950/80 border rounded-lg text-center font-mono font-bold text-xs py-1 transition-colors outline-none focus:ring-1 focus:ring-blue-400 ${
                                                                        row.ev === 252 ? 'text-blue-400 border-blue-500/40 bg-blue-500/10' : row.ev > 0 ? 'text-slate-200 border-white/20' : 'text-slate-500 border-white/10'
                                                                    }`}
                                                                />
                                                            </td>
                                                            <td className="py-2 px-3 text-right align-middle">
                                                                <span className="text-sm font-black text-blue-300 tabular-nums">
                                                                    {row.stat}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                            <tfoot>
                                                <tr className="border-t border-white/10 bg-slate-800/40 text-[11px] font-bold text-slate-300">
                                                    <td className="py-2.5 px-3 uppercase text-[10px] font-black tracking-wider text-slate-400 align-middle">Total</td>
                                                    <td className="py-2.5 px-3 text-center font-mono text-amber-300 align-middle">
                                                        {totalBase}
                                                    </td>
                                                    <td className="py-2.5 px-3 text-center font-mono align-middle">
                                                        <span className={totalIv === 186 ? 'text-emerald-400 font-bold' : 'text-slate-300'}>
                                                            {totalIv}/186
                                                        </span>
                                                    </td>
                                                    <td className="py-2.5 px-3 text-center font-mono align-middle">
                                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                                            !hackedMode && totalEv >= EV_TOTAL_MAX
                                                                ? 'bg-emerald-500/20 text-emerald-300'
                                                                : hackedMode
                                                                ? 'bg-purple-500/20 text-purple-300'
                                                                : 'text-blue-300 bg-blue-500/10'
                                                        }`}>
                                                            {!hackedMode ? `${totalEv} / ${EV_TOTAL_MAX}` : `${totalEv} (Uncapped)`}
                                                        </span>
                                                        {!hackedMode && (
                                                            <span className="block text-[9px] font-normal text-slate-400 mt-0.5">
                                                                Remaining: <strong className="text-emerald-400">{remainingEvs}</strong>
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="py-2.5 px-3 text-right font-mono font-black text-blue-400 align-middle">
                                                        {totalBattleStat}
                                                    </td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                                ) : (
                                    <p className="text-[11px] text-slate-500">ROM base stats are unavailable for this species.</p>
                                )}

                                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-slate-400">Hidden Power:</span>
                                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-violet-500/15 border border-violet-500/30 text-xs font-bold text-violet-300">
                                            {hiddenPowerType || 'Unknown'}
                                        </span>
                                    </div>
                                    <p className="text-[10px] text-slate-500 italic">
                                        Preview based on ROM base stats at Lv. {previewLevel} with {localPk.nature || 'Neutral'} nature.
                                    </p>
                                </div>
                            </section>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-slate-800/40 p-6 rounded-2xl border border-white/5 space-y-4">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block text-center">
                                        Level Editor
                                    </label>
                                    <div className="space-y-3">
                                        <div className="bg-slate-900/70 border border-white/10 rounded-xl p-3">
                                            <p className="text-[10px] uppercase font-black text-slate-500 mb-2">Target Level</p>
                                            <input
                                                type="number"
                                                min="1"
                                                max="100"
                                                value={levelInput}
                                                onChange={(e) => {
                                                    setLevelInput(e.target.value);
                                                    setLevelDirty(true);
                                                }}
                                                onBlur={() => {
                                                    const normalized = clampNumber(levelInput, MIN_LEVEL, MAX_LEVEL);
                                                    setLevelInput(String(normalized || levelClampFallback));
                                                }}
                                                className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-blue-400 font-bold outline-none focus:border-blue-500/50"
                                            />
                                            <p className="mt-2 text-[10px] text-slate-500">Level is capped to 1-100.</p>
                                        </div>
                                        <div className="bg-slate-900/70 border border-white/10 rounded-xl p-3">
                                            <p className="text-[10px] uppercase font-black text-slate-500 mb-2">Growth Curve</p>
                                            <div className="relative">
                                                <select
                                                    value={levelGrowthMode}
                                                    onChange={(e) => {
                                                        setLevelGrowthMode(e.target.value);
                                                        setLevelDirty(true);
                                                    }}
                                                    className="w-full appearance-none bg-slate-900 border border-white/10 rounded-lg px-3 py-2 pr-8 text-xs text-slate-300 outline-none focus:border-blue-500/50 cursor-pointer"
                                                >
                                                    <option value="auto">Default from species (recommended)</option>
                                                    {GROWTH_OPTIONS.map((opt) => (
                                                        <option key={opt.id} value={String(opt.id)}>{opt.id} - {opt.label}</option>
                                                    ))}
                                                </select>
                                                <ChevronDown size={14} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                            </div>
                                        </div>
                                    </div>
                                    {isPcMon ? (
                                        <div className="rounded-xl border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-[10px] text-amber-200">
                                            PC boxes do not store a visual level byte like party Pokemon. Default mode uses ROM-truth species growth; choose manual only if needed.
                                        </div>
                                    ) : (
                                        <p className="text-[10px] text-slate-500 italic text-center">
                                            Default mode uses ROM-truth species growth and falls back to inference only when metadata is unavailable.
                                        </p>
                                    )}
                                </div>

                                <div className="bg-slate-800/40 p-6 rounded-2xl border border-white/5 space-y-4">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block text-center">
                                        Pokemon Nature
                                    </label>
                                    <div className="relative">
                                        <select
                                            value={localPk.nature_id}
                                            onChange={(e) => setLocalPk({...localPk, nature_id: parseInt(e.target.value)})}
                                            className="w-full appearance-none bg-slate-900 border border-white/10 rounded-xl px-4 py-3 pr-10 text-sm text-blue-400 font-bold outline-none focus:ring-2 focus:ring-blue-500/50 cursor-pointer"
                                        >
                                            {NATURE_GROUPS.map((g) => (
                                                <optgroup key={g.group} label={g.group} className="bg-slate-950 text-slate-400 font-bold">
                                                    {g.items.map((n) => (
                                                        <option key={n.id} value={n.id} className="bg-slate-900 text-slate-100 font-medium">
                                                            {n.label}
                                                        </option>
                                                    ))}
                                                </optgroup>
                                            ))}
                                        </select>
                                        <ChevronDown size={18} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-blue-400" />
                                    </div>
                                    <p className="text-[9px] text-center text-slate-500 italic">Changing nature will modify the Pokemon PID in the save file.</p>
                                </div>
                            </div>

                            <div className="bg-slate-800/40 p-6 rounded-2xl border border-white/5 space-y-4">
                                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Ability Setup</h4>

                                <div className="flex bg-slate-900 p-1 rounded-xl gap-1">
                                    {[
                                        {id: 0, label: localPk.ability_1_name || 'Slot 1 (Standard)', disabled: !localPk.ability_1_id},
                                        {id: 1, label: localPk.ability_2_name || 'Slot 2 (Standard)', disabled: !localPk.ability_2_id},
                                        {
                                            id: 2,
                                            label: localPk.ability_hidden_name ? `${localPk.ability_hidden_name} (HA)` : 'Hidden Ability (HA)',
                                            disabled: !localPk.ability_hidden_id,
                                        }
                                    ].map((opt) => (
                                        <button
                                            key={opt.id}
                                            onClick={() => {
                                                if (opt.disabled) return;
                                                setLocalPk({...localPk, current_ability_index: opt.id});
                                            }}
                                            disabled={opt.disabled}
                                            className={`flex-1 py-2 rounded-lg text-[10px] font-bold transition-all ${
                                                localPk.current_ability_index === opt.id
                                                    ? 'bg-blue-600 text-white shadow-lg'
                                                    : 'text-slate-500 hover:text-slate-300'
                                            } ${opt.disabled ? 'opacity-50 cursor-not-allowed hover:text-slate-500' : ''}`}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                                <p className="text-[10px] text-center text-slate-400">
                                    Current: <span className="font-bold text-blue-300">{localPk.ability_label_current || 'Unknown Ability'}</span>
                                </p>
                                <p className="text-[9px] text-center text-slate-500 italic">
                                    {localPk.current_ability_index === 2
                                        ? "Hidden ability ignores the Pokemon PID."
                                        : "The system will change PID while keeping the same Nature."}
                                </p>
                            </div>
                        </div>
                    )}

                    {activeTab === 'items' && (
                        <div className="space-y-4 animate-in slide-in-from-right-4 duration-200">
                            {/* Row 1: Held Item Card */}
                            <div className="bg-slate-800/40 p-4 sm:p-5 rounded-2xl border border-white/5 space-y-3">
                                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        Held Item
                                    </label>
                                    {localPk.item_id > 0 && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setLocalPk({ ...localPk, item_id: 0 });
                                                setItemSearch('');
                                            }}
                                            className="text-[10px] font-bold text-rose-400 hover:text-rose-300 hover:underline transition-colors cursor-pointer"
                                        >
                                            Remove Item
                                        </button>
                                    )}
                                </div>

                                {/* Search & Select Combobox */}
                                <div ref={itemDropdownRef} className="relative">
                                    <div className="flex items-center gap-2">
                                        <div className="relative flex-1">
                                            <Search className="absolute left-3 top-2.5 text-slate-500" size={14} />
                                            <input
                                                type="text"
                                                placeholder="Search item by name or ID (e.g. 'Choice', 'Leftovers')..."
                                                value={itemSearch}
                                                onFocus={() => setItemDropdownOpen(true)}
                                                onChange={(e) => {
                                                    setItemSearch(e.target.value);
                                                    setItemDropdownOpen(true);
                                                }}
                                                className="w-full bg-slate-900 border border-white/10 rounded-xl py-2 pl-9 pr-3 text-xs outline-none focus:border-blue-500/50 text-slate-200"
                                            />
                                        </div>
                                        {itemSearch && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setItemSearch('');
                                                    setItemDropdownOpen(false);
                                                }}
                                                className="px-2.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs font-bold transition-colors cursor-pointer"
                                            >
                                                Clear
                                            </button>
                                        )}
                                    </div>

                                    {/* Dropdown Results List */}
                                    {itemDropdownOpen && (
                                        <div className="absolute top-full left-0 right-0 mt-1.5 z-50 max-h-48 overflow-y-auto bg-slate-900 border border-blue-500/30 rounded-xl shadow-2xl divide-y divide-white/5">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setLocalPk({ ...localPk, item_id: 0 });
                                                    setItemSearch('');
                                                    setItemDropdownOpen(false);
                                                }}
                                                className="w-full text-left px-3 py-2 text-xs text-slate-400 hover:bg-white/5 hover:text-white transition-colors flex items-center justify-between cursor-pointer"
                                            >
                                                <span>--- No Item (None) ---</span>
                                                <span className="text-[9px] font-mono text-slate-500">ID 0</span>
                                            </button>
                                            {allItems
                                                .filter(item => {
                                                    const q = itemSearch.toLowerCase().trim();
                                                    if (!q) return true;
                                                    return item.name.toLowerCase().includes(q) || item.id.toString() === q;
                                                })
                                                .slice(0, 30)
                                                .map(item => (
                                                    <button
                                                        key={item.id}
                                                        type="button"
                                                        onClick={() => {
                                                            setLocalPk({ ...localPk, item_id: item.id });
                                                            setItemSearch('');
                                                            setItemDropdownOpen(false);
                                                        }}
                                                        className={`w-full text-left px-3 py-2 text-xs transition-colors flex justify-between items-center group cursor-pointer ${
                                                            Number(localPk.item_id) === Number(item.id)
                                                                ? 'bg-blue-600/30 text-white font-bold'
                                                                : 'hover:bg-blue-600/20 text-slate-200'
                                                        }`}
                                                    >
                                                        <div className="flex items-center gap-2.5 truncate">
                                                            <img
                                                                src={client.getItemIconUrl(item.id)}
                                                                alt={item.name}
                                                                className="w-4 h-4 object-contain shrink-0"
                                                                onError={(e) => {
                                                                    if (e.currentTarget.src !== ITEM_ICON_FALLBACK_URL) {
                                                                        e.currentTarget.src = ITEM_ICON_FALLBACK_URL;
                                                                    }
                                                                }}
                                                            />
                                                            <span className="truncate font-medium">{item.name}</span>
                                                        </div>
                                                        <span className="text-blue-400 font-mono text-[9px] bg-blue-500/10 px-1.5 py-0.5 rounded shrink-0">
                                                            ID {item.id}
                                                        </span>
                                                    </button>
                                                ))
                                            }
                                        </div>
                                    )}
                                </div>

                                {/* Current Item Display Pill */}
                                <div className="flex items-center justify-between bg-slate-900/80 p-2.5 rounded-xl border border-emerald-500/20">
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center text-emerald-400 shrink-0 border border-emerald-500/20">
                                            {canShowItemIcon ? (
                                                <img
                                                    src={client.getItemIconUrl(localPk.item_id)}
                                                    alt={currentItemName}
                                                    className="w-5 h-5 object-contain"
                                                    onError={(e) => {
                                                        if (e.currentTarget.src !== ITEM_ICON_FALLBACK_URL) {
                                                            e.currentTarget.src = ITEM_ICON_FALLBACK_URL;
                                                        }
                                                    }}
                                                />
                                            ) : localPk.item_id > 0 ? (
                                                <span className="text-[9px] font-mono text-slate-400">#{localPk.item_id}</span>
                                            ) : (
                                                <span className="text-sm font-mono text-slate-600 select-none font-bold">—</span>
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-[9px] text-slate-500 uppercase font-black leading-none">Current Held Item</p>
                                            <p className="text-emerald-400 font-bold text-xs sm:text-sm truncate mt-0.5">
                                                {currentItemName}
                                            </p>
                                        </div>
                                    </div>
                                    {localPk.item_id > 0 && (
                                        <span className="text-[9px] font-mono text-emerald-400/80 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 shrink-0">
                                            ID {localPk.item_id}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Row 2: Caught Ball Card */}
                            <div className="bg-slate-800/40 p-4 sm:p-5 rounded-2xl border border-white/5 space-y-3">
                                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        Caught Ball
                                    </label>
                                    <span className="text-[10px] text-slate-500 font-mono">
                                        Ball ID: {localPk.ball_id}
                                    </span>
                                </div>

                                {/* Custom Ball Dropdown with Sprites */}
                                <div ref={ballDropdownRef} className="relative">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setBallDropdownOpen((prev) => !prev);
                                            setBallSearch('');
                                        }}
                                        className="w-full flex items-center justify-between bg-slate-900 hover:bg-slate-800/80 border border-white/10 hover:border-sky-400/40 rounded-xl p-2.5 text-xs text-left transition-colors cursor-pointer"
                                    >
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            <div className="w-8 h-8 bg-sky-500/10 rounded-lg flex items-center justify-center text-sky-400 shrink-0 border border-sky-500/20">
                                                {currentBallItemId ? (
                                                    <img
                                                        src={client.getItemIconUrl(currentBallItemId)}
                                                        alt={currentBallName}
                                                        className="w-5 h-5 object-contain"
                                                        onError={(e) => {
                                                            if (e.currentTarget.src !== ITEM_ICON_FALLBACK_URL) {
                                                                e.currentTarget.src = ITEM_ICON_FALLBACK_URL;
                                                            }
                                                        }}
                                                    />
                                                ) : (
                                                    <span className="text-[9px] font-mono text-slate-400">#{localPk.ball_id}</span>
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-[9px] text-slate-500 uppercase font-black leading-none">Selected Ball</p>
                                                <p className="text-sky-300 font-bold text-xs sm:text-sm truncate mt-0.5">{currentBallName}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <span className="text-[9px] font-mono text-sky-400/80 bg-sky-500/10 px-1.5 py-0.5 rounded border border-sky-500/20">
                                                {currentBall?.name || 'Custom'}
                                            </span>
                                            <ChevronDown size={15} className={`text-slate-400 transition-transform ${ballDropdownOpen ? 'rotate-180' : ''}`} />
                                        </div>
                                    </button>

                                    {/* Dropdown Menu */}
                                    {ballDropdownOpen && (
                                        <div className="absolute top-full left-0 right-0 mt-1.5 z-50 bg-slate-900 border border-sky-500/30 rounded-xl shadow-2xl overflow-hidden max-h-56 flex flex-col animate-in fade-in zoom-in-95 duration-150">
                                            <div className="p-2 border-b border-white/10 bg-slate-950">
                                                <div className="relative">
                                                    <Search size={12} className="absolute left-2.5 top-2.5 text-slate-500" />
                                                    <input
                                                        type="text"
                                                        autoFocus
                                                        placeholder="Search ball (e.g. 'Dusk', 'Ultra', 'Moon')..."
                                                        value={ballSearch}
                                                        onChange={(e) => setBallSearch(e.target.value)}
                                                        className="w-full bg-slate-900 border border-white/10 rounded-lg pl-7 pr-2 py-1 text-xs text-slate-200 outline-none focus:border-sky-500"
                                                    />
                                                </div>
                                            </div>

                                            <div className="overflow-y-auto flex-1 divide-y divide-white/5">
                                                {allBalls
                                                    .filter((ball) => {
                                                        const q = ballSearch.toLowerCase().trim();
                                                        if (!q) return true;
                                                        return ball.name.toLowerCase().includes(q) || String(ball.ball_id) === q;
                                                    })
                                                    .map((ball) => {
                                                        const isSelected = Number(localPk.ball_id) === Number(ball.ball_id);
                                                        return (
                                                            <button
                                                                key={ball.ball_id}
                                                                type="button"
                                                                onClick={() => {
                                                                    setLocalPk({
                                                                        ...localPk,
                                                                        ball_id: Number(ball.ball_id),
                                                                        ball_item_id: Number(ball.item_id),
                                                                        ball_name: ball.name,
                                                                    });
                                                                    setBallDropdownOpen(false);
                                                                }}
                                                                className={`w-full text-left px-3 py-2 text-xs transition-colors flex items-center justify-between gap-2 cursor-pointer ${
                                                                    isSelected
                                                                        ? 'bg-sky-600/30 text-sky-100 font-bold'
                                                                        : 'hover:bg-sky-600/20 text-slate-200'
                                                                }`}
                                                            >
                                                                <div className="flex items-center gap-2.5 min-w-0">
                                                                    <img
                                                                        src={client.getItemIconUrl(ball.item_id)}
                                                                        alt={ball.name}
                                                                        className="w-5 h-5 object-contain shrink-0"
                                                                        onError={(e) => {
                                                                            if (e.currentTarget.src !== ITEM_ICON_FALLBACK_URL) {
                                                                                e.currentTarget.src = ITEM_ICON_FALLBACK_URL;
                                                                            }
                                                                        }}
                                                                    />
                                                                    <span className="truncate">{ball.name}</span>
                                                                </div>
                                                                <span className="text-[9px] font-mono text-slate-400 shrink-0">
                                                                    ID {ball.ball_id}
                                                                </span>
                                                            </button>
                                                        );
                                                    })
                                                }
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'moves' && (
                        <div className="space-y-4">
                            <section className="bg-slate-800/40 p-4 sm:p-5 rounded-2xl border border-white/5 space-y-4">
                                <div className="flex items-center justify-between border-b border-white/5 pb-3">
                                    <div>
                                        <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Current Moves</h4>
                                        <p className="text-[10px] text-slate-400 mt-0.5">Select up to 4 moves, edit PP, and assign PP Ups (0-3).</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={setMaxAllPp}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold uppercase tracking-wider shadow-sm transition-all active:scale-95"
                                    >
                                        <Zap size={12} /> Max All PP
                                    </button>
                                </div>

                                <div className="space-y-3">
                                    {[0, 1, 2, 3].map((slotIdx) => (
                                        <PkHexMoveRow
                                            key={slotIdx}
                                            slotIndex={slotIdx}
                                            moveId={Number(localPk.moves?.[slotIdx] || 0)}
                                            movePp={Number(localPk.move_pp?.[slotIdx] || 0)}
                                            movePpUp={Number(localPk.move_pp_ups?.[slotIdx] || 0)}
                                            allMoves={allMoves}
                                            movesMeta={movesMeta}
                                            onMoveChange={updateMove}
                                            onPpChange={updateMovePp}
                                            onPpUpChange={updateMovePpUps}
                                            onMaxPp={setMoveMaxPp}
                                            isPcMon={isPcMon}
                                        />
                                    ))}
                                </div>

                                {isPcMon && (
                                    <p className="text-[10px] text-slate-400 italic pt-1">
                                        PC boxes preserve PP Ups (maximum usable PP). Current PP is automatically restored when withdrawn into your party.
                                    </p>
                                )}
                            </section>
                        </div>
                    )}

                    {activeTab === 'info' && (
                        <div className="space-y-4 animate-in slide-in-from-right-4 duration-200">
                            <div className="bg-slate-800/40 p-4 sm:p-5 rounded-2xl border border-white/5 space-y-3">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block text-center">
                                    Nickname
                                </label>
                                <input
                                    type="text"
                                    maxLength={10}
                                    value={localPk.nickname || ''}
                                    onChange={(e) => setLocalPk({ ...localPk, nickname: e.target.value })}
                                    className="w-full bg-slate-900 border border-white/10 rounded-xl py-2.5 px-4 text-sm outline-none focus:border-blue-500/50"
                                    placeholder="Nickname (max 10 chars)"
                                />
                                <p className="text-[10px] text-slate-500 text-center">Clear this field to restore the species name (max 10 chars).</p>
                            </div>

                            <div className="bg-slate-800/40 p-4 sm:p-5 rounded-2xl border border-white/5 space-y-3">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block text-center">
                                    Species
                                </label>

                                <div className="relative">
                                    <Search className="absolute left-3 top-2.5 text-slate-500" size={14} />
                                    <input
                                        type="text"
                                        placeholder="Search species (e.g. 'Garchomp' or ID...)"
                                        value={speciesSearch}
                                        onChange={(e) => setSpeciesSearch(e.target.value)}
                                        className="w-full bg-slate-900 border border-white/10 rounded-xl py-2 pl-9 pr-4 text-sm outline-none focus:border-blue-500/50"
                                    />
                                </div>

                                {speciesSearch.length > 1 ? (
                                    <div className="max-h-48 overflow-y-auto bg-slate-900 rounded-xl border border-blue-500/30 divide-y divide-white/5">
                                        {allSpecies
                                            .filter(species => {
                                                const q = speciesSearch.toLowerCase();
                                                return (
                                                    (species.label || '').toLowerCase().includes(q) ||
                                                    (species.name || '').toLowerCase().includes(q) ||
                                                    species.id.toString() === speciesSearch
                                                );
                                            })
                                            .slice(0, 15)
                                            .map(species => (
                                                <button
                                                    key={species.id}
                                                    type="button"
                                                    onClick={() => applySpeciesSelection(species)}
                                                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-blue-600 transition-colors flex justify-between items-center group cursor-pointer"
                                                >
                                                    <span className="group-hover:text-white">{species.label || species.name}</span>
                                                    <span className="text-blue-400 font-mono text-[10px] bg-blue-500/10 px-2 py-0.5 rounded">ID {species.id}</span>
                                                </button>
                                            ))
                                        }
                                    </div>
                                ) : (
                                    <div className="flex justify-between items-center bg-slate-900/50 p-3 rounded-xl border border-blue-500/20">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] text-slate-500 uppercase font-black">Current Species</span>
                                            <span className="text-blue-400 font-bold text-sm">
                                                {currentSpeciesName}
                                            </span>
                                        </div>
                                        <div className="w-9 h-9 bg-slate-800/80 rounded-lg flex items-center justify-center border border-white/10 overflow-hidden shrink-0">
                                            <img
                                                src={client.getPokemonIconUrl(localPk.species_id)}
                                                alt={currentSpeciesName}
                                                className="w-7 h-7 object-contain pixelated"
                                                onError={(e) => {
                                                    if (e.currentTarget.src !== POKEMON_ICON_FALLBACK_URL) {
                                                        e.currentTarget.src = POKEMON_ICON_FALLBACK_URL;
                                                    }
                                                }}
                                            />
                                        </div>
                                    </div>
                                )}

                                <label className="flex items-center gap-2 text-[11px] text-slate-400 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={renameOnSpeciesChange}
                                        onChange={(e) => setRenameOnSpeciesChange(e.target.checked)}
                                        className="accent-blue-500 cursor-pointer"
                                    />
                                    Rename nickname to selected species when changing species
                                </label>
                            </div>

                            <div className="bg-slate-800/40 p-4 sm:p-5 rounded-2xl border border-white/5 space-y-3">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block text-center">
                                    Pokédex Flags
                                </label>
                                <PokedexFlagsControls
                                    client={client}
                                    speciesId={localPk.species_id}
                                    speciesLabel={currentSpeciesName}
                                    showToast={showToast}
                                />
                            </div>

                            <div className="bg-slate-800/40 p-4 sm:p-5 rounded-2xl border border-white/5 space-y-3">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block text-center">
                                    Identity (Shiny & Gender)
                                </label>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div className="bg-slate-900/70 border border-white/10 rounded-xl p-3 space-y-2">
                                        <p className="text-[10px] uppercase font-black text-slate-500">Shiny</p>
                                        <button
                                            type="button"
                                            onClick={() => setLocalPk({ ...localPk, is_shiny: !localPk.is_shiny })}
                                            className={`w-full py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${localPk.is_shiny ? 'bg-amber-500/80 text-slate-950' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
                                        >
                                            {localPk.is_shiny ? 'Shiny Enabled' : 'Standard Palette'}
                                        </button>
                                    </div>

                                    <div className="bg-slate-900/70 border border-white/10 rounded-xl p-3 space-y-2">
                                        <p className="text-[10px] uppercase font-black text-slate-500">Gender</p>
                                        <div className="flex gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setLocalPk({ ...localPk, gender: 'male' })}
                                                disabled={localPk.gender_mode !== 'dynamic'}
                                                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${localPk.gender === 'male' ? 'bg-sky-500 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'} disabled:opacity-50 disabled:cursor-not-allowed`}
                                            >
                                                Male
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setLocalPk({ ...localPk, gender: 'female' })}
                                                disabled={localPk.gender_mode !== 'dynamic'}
                                                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${localPk.gender === 'female' ? 'bg-rose-500 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'} disabled:opacity-50 disabled:cursor-not-allowed`}
                                            >
                                                Female
                                            </button>
                                        </div>
                                        {localPk.gender_mode !== 'dynamic' && (
                                            <p className="text-[10px] text-slate-500">
                                                {localPk.gender_mode === 'genderless'
                                                    ? 'This species is genderless.'
                                                    : localPk.gender_mode === 'fixed_male'
                                                        ? 'This species is male-only.'
                                                        : localPk.gender_mode === 'fixed_female'
                                                            ? 'This species is female-only.'
                                                            : 'Gender metadata unavailable for this species.'}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="rounded-xl border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-[10px] text-amber-200">
                                    Identity edits rewrite PID. Nature and standard ability slot are preserved where possible.
                                </div>
                            </div>

                            <div className="bg-slate-800/40 p-4 sm:p-5 rounded-2xl border border-white/5 space-y-2.5">
                                <label htmlFor="pokemon-happiness" className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">
                                    Happiness (0–255)
                                </label>
                                <input
                                    id="pokemon-happiness"
                                    type="number"
                                    min="0"
                                    max="255"
                                    step="1"
                                    value={localPk.happiness ?? 70}
                                    onChange={(event) => setLocalPk((prev) => ({
                                        ...prev,
                                        happiness: clampNumber(event.target.value, 0, 255),
                                    }))}
                                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500/50"
                                />
                                <p className="text-[10px] text-slate-400">Friendship evolutions use this value.</p>
                            </div>
                        </div>
                    )}


                </div>

                <div className="p-4 sm:p-6 bg-[#1e293b]/80 border-t border-white/5 flex justify-end">
                    <button onClick={handleSaveClick}
                            disabled={isSaving}
                            className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-8 py-3 rounded-2xl flex items-center gap-2 shadow-lg active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed">
                        <Save size={18}/> SAVE CHANGES
                    </button>
                </div>

                {isSaving && (
                    <div className="absolute inset-0 z-20 bg-black/70 backdrop-blur-sm flex items-center justify-center">
                        <div className="bg-slate-900 border border-white/10 rounded-2xl px-6 py-5 text-center space-y-2 min-w-[260px]">
                            <div className="w-7 h-7 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto" />
                            <p className="text-sm font-bold text-blue-300">Applying edits</p>
                            <p className="text-xs text-slate-400">{saveStage}</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};


const PkHexMoveRow = ({
    slotIndex,
    moveId,
    movePp,
    movePpUp,
    allMoves,
    movesMeta,
    onMoveChange,
    onPpChange,
    onPpUpChange,
    onMaxPp,
    isPcMon,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchFilter, setSearchFilter] = useState('');
    const containerRef = useRef(null);

    const currentMove = useMemo(() => {
        if (!moveId || moveId <= 0) return null;
        return allMoves.find((m) => Number(m.id) === Number(moveId)) || { id: moveId, name: `Move #${moveId}` };
    }, [moveId, allMoves]);

    const meta = movesMeta[String(moveId)] || null;
    const typeName = meta?.type || 'Normal';
    const typeStyle = TYPE_STYLES[typeName] || TYPE_STYLES.Normal;
    const typeAbbr = TYPE_ABBR[typeName] || (typeName ? typeName.slice(0, 3).toUpperCase() : '---');

    const basePp = Number(meta?.base_pp || currentMove?.base_pp || 0);
    const ppUp = Math.max(0, Math.min(3, Number(movePpUp || 0)));
    const maxUsablePp = basePp > 0 ? basePp + Math.floor((basePp * ppUp) / 5) : 0;

    const filteredMoves = useMemo(() => {
        if (!isOpen) return [];
        const q = searchFilter.trim().toLowerCase();
        if (!q) {
            return allMoves.slice(0, 30);
        }
        return allMoves
            .filter((m) => {
                const name = String(m.name || '').toLowerCase();
                return name.includes(q) || String(m.id) === q;
            })
            .slice(0, 30);
    }, [allMoves, searchFilter, isOpen]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    return (
        <div ref={containerRef} className="relative flex items-center gap-2 sm:gap-3 p-2 bg-slate-900/50 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
            {/* Type badge on left */}
            <div
                className={`w-12 h-9 rounded-lg flex items-center justify-center text-[10px] font-black uppercase tracking-wider shrink-0 border ${
                    moveId > 0 && meta
                        ? `${typeStyle.bg} ${typeStyle.text} ${typeStyle.border}`
                        : 'bg-slate-900 border-white/10 text-slate-500'
                }`}
                title={meta?.type ? `Type: ${meta.type}` : 'No Move'}
            >
                {moveId > 0 && meta ? typeAbbr : '---'}
            </div>

            {/* Move Search / Combobox */}
            <div className="relative flex-1 min-w-0">
                <button
                    type="button"
                    onClick={() => {
                        setIsOpen((prev) => !prev);
                        setSearchFilter('');
                    }}
                    className="w-full flex items-center justify-between bg-slate-900 hover:bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-xs text-left transition-colors"
                >
                    <span className={`truncate font-bold ${moveId > 0 ? 'text-slate-100' : 'text-slate-500'}`}>
                        {currentMove ? currentMove.name : '--- Empty ---'}
                    </span>
                    <ChevronDown size={14} className="text-slate-400 shrink-0 ml-1.5" />
                </button>

                {isOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1.5 z-50 bg-slate-900 border border-blue-500/40 rounded-xl shadow-2xl overflow-hidden max-h-56 flex flex-col">
                        <div className="p-2 border-b border-white/10 bg-slate-950">
                            <div className="relative">
                                <Search size={12} className="absolute left-2.5 top-2.5 text-slate-500" />
                                <input
                                    type="text"
                                    autoFocus
                                    placeholder="Search move by name or ID..."
                                    value={searchFilter}
                                    onChange={(e) => setSearchFilter(e.target.value)}
                                    className="w-full bg-slate-900 border border-white/10 rounded-lg pl-7 pr-2 py-1 text-xs text-slate-200 outline-none focus:border-blue-500"
                                />
                            </div>
                        </div>
                        <div className="overflow-y-auto flex-1 divide-y divide-white/5">
                            <button
                                type="button"
                                onClick={() => {
                                    onMoveChange(slotIndex, 0);
                                    setIsOpen(false);
                                }}
                                className="w-full text-left px-3 py-2 text-xs text-slate-500 hover:bg-white/5 hover:text-slate-300 font-semibold"
                            >
                                --- Empty ---
                            </button>
                            {filteredMoves.map((m) => {
                                const mMeta = movesMeta[String(m.id)];
                                const mStyle = TYPE_STYLES[mMeta?.type] || TYPE_STYLES.Normal;
                                const mAbbr = TYPE_ABBR[mMeta?.type] || (mMeta?.type ? mMeta.type.slice(0, 3).toUpperCase() : '');
                                return (
                                    <button
                                        key={m.id}
                                        type="button"
                                        onClick={() => {
                                            onMoveChange(slotIndex, m.id);
                                            setIsOpen(false);
                                        }}
                                        className="w-full text-left px-3 py-2 text-xs hover:bg-blue-600/30 flex items-center justify-between gap-2 transition-colors"
                                    >
                                        <div className="flex items-center gap-2 min-w-0">
                                            <span className="text-[10px] font-mono text-blue-400 w-7 shrink-0">{m.id}</span>
                                            <span className="font-bold text-slate-200 truncate">{m.name}</span>
                                        </div>
                                        {mMeta && (
                                            <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded border ${mStyle.bg} ${mStyle.text} ${mStyle.border} shrink-0`}>
                                                {mAbbr}
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* PP Input */}
            <div className="flex items-center gap-1 shrink-0">
                <input
                    type="number"
                    min="0"
                    max={maxUsablePp}
                    value={movePp}
                    disabled={moveId <= 0 || isPcMon}
                    onChange={(e) => onPpChange(slotIndex, e.target.value)}
                    className="w-12 bg-slate-900 border border-white/10 rounded-lg text-center font-mono font-bold text-xs py-1.5 outline-none focus:border-blue-400 disabled:opacity-40"
                    title={`Current PP (max ${maxUsablePp})`}
                />
                <span className="text-[10px] font-mono text-slate-500">/{maxUsablePp}</span>
            </div>

            {/* Ups Select */}
            <div className="shrink-0 relative">
                <select
                    value={movePpUp}
                    disabled={moveId <= 0}
                    onChange={(e) => onPpUpChange(slotIndex, e.target.value)}
                    className="w-13 appearance-none bg-slate-900 border border-white/10 rounded-lg text-center font-mono font-bold text-xs py-1.5 pl-2 pr-4 outline-none focus:border-blue-400 disabled:opacity-40 cursor-pointer"
                    title="PP Ups (0-3)"
                >
                    <option value={0}>0</option>
                    <option value={1}>1</option>
                    <option value={2}>2</option>
                    <option value={3}>3</option>
                </select>
                <ChevronDown size={11} className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-500" />
            </div>

            {/* Quick Max Button */}
            <button
                type="button"
                onClick={() => onMaxPp(slotIndex)}
                disabled={moveId <= 0}
                className="px-2.5 py-1.5 bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 border border-blue-500/30 rounded-lg text-[9px] font-bold uppercase tracking-wider disabled:opacity-30 disabled:cursor-not-allowed transition-colors shrink-0"
                title="Max PP (3 PP Ups + Full PP)"
            >
                Max
            </button>
        </div>
    );
};

const EditorTab = ({ active, label, onClick }) => (
    <button
        onClick={onClick}
        className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold transition-all ${active ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:bg-white/5'}`}
    >
        {label}
    </button>
);
