import React, { useState, useEffect, useMemo, useRef } from 'react';
import { X, Save, Download, CircleHelp } from 'lucide-react';
import { calcCurrentLevel } from '../../core/growth.js';
import { ITEM_ICON_FALLBACK_URL, POKEMON_ICON_FALLBACK_URL } from '../../core/iconResolver.js';
import { normalizeName, parseShowdownSet, resolveShowdownSet } from '../../core/showdownImport.js';
import { calculateBattleStats, calculateHiddenPowerType } from '../../core/battlePreview.js';
import speciesBaseStats from '../../core/speciesBaseStats.json' with { type: 'json' };
import movesMeta from '../../core/movesMeta.json' with { type: 'json' };
import { logger } from '../../utils/logger.js';

import {
    EV_STAT_MAX,
    EV_TOTAL_MAX,
    MIN_LEVEL,
    MAX_LEVEL,
    clampNumber,
    getTotalEvs,
    hasKnownItemName,
    SAFE_IMPORT_NOTE,
} from './constants.js';
import { ShowdownImportSection } from './ShowdownImportSection.jsx';
import { StatsTab } from './StatsTab.jsx';
import { ItemsTab } from './ItemsTab.jsx';
import { MovesTab } from './MovesTab.jsx';
import { InfoTab } from './InfoTab.jsx';

const EditorTab = ({ active, label, onClick }) => (
    <button
        type="button"
        onClick={onClick}
        className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            active ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:bg-white/5 hover:text-slate-300'
        }`}
    >
        {label}
    </button>
);

export const PokemonEditorModal = ({
    client,
    pokemon,
    legitMode = false,
    hackedMode = false,
    onClose,
    onSave,
    showToast,
}) => {
    const isPcMon = Boolean(pokemon?.isPC);
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

    // Initial debug log
    useEffect(() => {
        logger.editor('Opened Pokemon Editor Modal', {
            isPC: isPcMon,
            slot: pokemon?.slot ?? pokemon?.index,
            box: pokemon?.box,
            species_id: pokemon?.species_id,
            nickname: pokemon?.nickname,
            level: pokemon?.level,
            nature: pokemon?.nature,
            moves: pokemon?.moves,
            ivs: pokemon?.ivs,
            evs: pokemon?.evs,
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

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
        client.getMoves().then(data => setAllMoves(data || []));
    }, [client]);

    useEffect(() => {
        client.getAbilities().then(data => setAllAbilities(data || []));
    }, [client]);

    useEffect(() => {
        client.getItems().then(data => setAllItems(data || []));
    }, [client]);

    useEffect(() => {
        client.getBalls().then(data => setAllBalls(data || []));
    }, [client]);

    useEffect(() => {
        client.getSpecies().then(data => setAllSpecies(data || []));
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

    const handleTabChange = (tabId) => {
        logger.editor(`Switched tab to "${tabId}"`);
        setActiveTab(tabId);
    };

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
        logger.editor(`Set all IVs to ${clamped}`);
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
        logger.editor('Cleared all EVs to 0');
        setLocalPk((prev) => {
            const nextEvs = { ...(prev.evs || {}) };
            Object.keys(nextEvs).forEach((k) => {
                nextEvs[k] = 0;
            });
            return { ...prev, evs: nextEvs };
        });
    };

    const setMaxAllPp = () => {
        logger.editor('Maxed all move PPs (3 PP Ups + full PP)');
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
        logger.editor(`Move slot ${slotIndex + 1} changed to #${nextMoveId}`);
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

    const applySpeciesSelection = (species) => {
        const previousSpecies = allSpecies.find(s => s.id === localPk.species_id);
        const previousDisplay = previousSpecies?.display_name || previousSpecies?.name || '';
        const nextDisplay = species?.display_name || species?.name || '';
        const currentNick = String(localPk.nickname || '').trim();
        const shouldAutoRename =
            renameOnSpeciesChange ||
            (currentNick && previousDisplay && currentNick.toLowerCase() === previousDisplay.toLowerCase());

        logger.editor(`Species changed from #${localPk.species_id} to #${species.id} (${nextDisplay})`);
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
            logger.editor('Showdown import had blocking errors', blocking);
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

        logger.editor('Showdown import parsed and applied successfully', {
            moves: nextState.moves,
            item_id: nextState.item_id,
            nature_id: nextState.nature_id,
            ivs: nextState.ivs,
            evs: nextState.evs,
        });

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

        logger.editor('Saving Pokemon changes...', payload);

        try {
            setSaveStage('Saving file...');
            await Promise.resolve(onSave(payload));
        } catch (err) {
            logger.error('Editor', 'Error during save Pokemon', err);
            throw err;
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
                {/* Header */}
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
                            className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400 cursor-pointer"
                        >
                            <Download size={12} /> FROM SMOGON
                        </button>
                        <button
                            type="button"
                            onClick={() => setShowImportHelp((prev) => !prev)}
                            disabled={isSaving}
                            className="p-1.5 rounded-lg bg-slate-900 border border-white/10 text-slate-400 hover:text-slate-200 hover:bg-slate-800 disabled:opacity-40 cursor-pointer"
                            aria-expanded={showImportHelp}
                            aria-label="Show import help"
                        >
                            <CircleHelp size={13} />
                        </button>
                        <button
                            onClick={onClose}
                            disabled={isSaving}
                            className="p-2 hover:bg-white/5 rounded-full disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                        >
                            <X />
                        </button>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="flex bg-[#1e293b]/50 p-2 gap-2 border-b border-white/5">
                    <EditorTab active={activeTab === 'stats'} label="Stats" onClick={() => handleTabChange('stats')} />
                    <EditorTab active={activeTab === 'items'} label="Items" onClick={() => handleTabChange('items')} />
                    <EditorTab active={activeTab === 'moves'} label="Moves" onClick={() => handleTabChange('moves')} />
                    <EditorTab active={activeTab === 'info'} label="Info" onClick={() => handleTabChange('info')} />
                </div>

                {showImportHelp && (
                    <div className="mx-4 sm:mx-6 mt-3 rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-[11px] text-slate-300">
                        {SAFE_IMPORT_NOTE}
                    </div>
                )}

                {/* Scrollable Content Body */}
                <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-8">
                    <ShowdownImportSection
                        showImport={showImport}
                        setImportText={setImportText}
                        setSetImportText={setSetImportText}
                        setImportErrors={setImportErrors}
                        setSetImportErrors={setSetImportErrors}
                        setImportWarnings={setImportWarnings}
                        setSetImportWarnings={setSetImportWarnings}
                        applyShowdownImport={applyShowdownImport}
                    />

                    {activeTab === 'stats' && (
                        <StatsTab
                            localPk={localPk}
                            setLocalPk={setLocalPk}
                            updateStat={updateStat}
                            setAllIvs={setAllIvs}
                            clearAllEvs={clearAllEvs}
                            previewLevel={previewLevel}
                            baseStats={baseStats}
                            statRows={statRows}
                            totalBase={totalBase}
                            totalIv={totalIv}
                            totalEv={totalEv}
                            totalBattleStat={totalBattleStat}
                            hackedMode={hackedMode}
                            remainingEvs={remainingEvs}
                            hiddenPowerType={hiddenPowerType}
                            levelInput={levelInput}
                            setLevelInput={setLevelInput}
                            levelGrowthMode={levelGrowthMode}
                            setLevelGrowthMode={setLevelGrowthMode}
                            setLevelDirty={setLevelDirty}
                            levelClampFallback={levelClampFallback}
                            isPcMon={isPcMon}
                        />
                    )}

                    {activeTab === 'items' && (
                        <ItemsTab
                            client={client}
                            localPk={localPk}
                            setLocalPk={setLocalPk}
                            allItems={allItems}
                            allBalls={allBalls}
                            itemSearch={itemSearch}
                            setItemSearch={setItemSearch}
                            itemDropdownOpen={itemDropdownOpen}
                            setItemDropdownOpen={setItemDropdownOpen}
                            ballDropdownOpen={ballDropdownOpen}
                            setBallDropdownOpen={setBallDropdownOpen}
                            ballSearch={ballSearch}
                            setBallSearch={setBallSearch}
                            itemDropdownRef={itemDropdownRef}
                            ballDropdownRef={ballDropdownRef}
                            currentItemName={currentItemName}
                            currentBallName={currentBallName}
                            currentBallItemId={currentBallItemId}
                            currentBall={currentBall}
                            canShowItemIcon={canShowItemIcon}
                        />
                    )}

                    {activeTab === 'moves' && (
                        <MovesTab
                            localPk={localPk}
                            allMoves={allMoves}
                            movesMeta={movesMeta}
                            setMaxAllPp={setMaxAllPp}
                            updateMove={updateMove}
                            updateMovePp={updateMovePp}
                            updateMovePpUps={updateMovePpUps}
                            setMoveMaxPp={setMoveMaxPp}
                            isPcMon={isPcMon}
                        />
                    )}

                    {activeTab === 'info' && (
                        <InfoTab
                            client={client}
                            localPk={localPk}
                            setLocalPk={setLocalPk}
                            speciesSearch={speciesSearch}
                            setSpeciesSearch={setSpeciesSearch}
                            allSpecies={allSpecies}
                            currentSpeciesName={currentSpeciesName}
                            applySpeciesSelection={applySpeciesSelection}
                            renameOnSpeciesChange={renameOnSpeciesChange}
                            setRenameOnSpeciesChange={setRenameOnSpeciesChange}
                            showToast={showToast}
                        />
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 sm:p-6 bg-[#1e293b]/80 border-t border-white/5 flex justify-end">
                    <button
                        type="button"
                        onClick={handleSaveClick}
                        disabled={isSaving}
                        className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-8 py-3 rounded-2xl flex items-center gap-2 shadow-lg active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                    >
                        <Save size={18} /> SAVE CHANGES
                    </button>
                </div>

                {/* Loading State Overlay */}
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
