import React, { useState, useEffect, useMemo } from 'react';
import { Target, Shield, Swords, Check, RefreshCw, AlertTriangle } from 'lucide-react';
import { POKEMON_TYPES, getDefensiveMultiplier, getSingleTypeMultiplier, TYPE_BADGE_STYLES } from '../core/typeChart.js';
import speciesTypesData from '../core/speciesTypes.json' with { type: 'json' };
import movesMetaData from '../core/movesMeta.json' with { type: 'json' };
import { POKEMON_ICON_FALLBACK_URL } from '../core/iconResolver.js';

const TYPE_ABBREVIATIONS = {
    Normal: 'NOR',
    Fire: 'FIR',
    Water: 'WAT',
    Electric: 'ELE',
    Grass: 'GRA',
    Ice: 'ICE',
    Fighting: 'FIG',
    Poison: 'POI',
    Ground: 'GND',
    Flying: 'FLY',
    Psychic: 'PSY',
    Bug: 'BUG',
    Rock: 'RCK',
    Ghost: 'GHO',
    Dragon: 'DRG',
    Dark: 'DRK',
    Steel: 'STL',
    Fairy: 'FAI',
};

export default function CoverageView({ client }) {
    const [party, setParty] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [viewMode, setViewMode] = useState('both'); // 'both' | 'defensive' | 'offensive'
    const [density, setDensity] = useState('compact'); // 'compact' | 'cozy'
    const [refreshIndex, setRefreshIndex] = useState(0);

    const isCompact = density === 'compact';

    useEffect(() => {
        let mounted = true;
        setLoading(true);
        setError(null);

        client.getParty()
            .then((data) => {
                if (mounted) {
                    setParty(Array.isArray(data) ? data : []);
                    setLoading(false);
                }
            })
            .catch((err) => {
                if (mounted) {
                    setError(err?.message || 'Failed to load party data');
                    setLoading(false);
                }
            });

        return () => {
            mounted = false;
        };
    }, [client, refreshIndex]);

    // Enrich team members with species types and damaging move details
    const team = useMemo(() => {
        return party.map((pk) => {
            const sid = String(pk.species_id || 0);
            const typeInfo = speciesTypesData[sid] || { types: ['Normal'] };
            const types = Array.isArray(typeInfo.types) && typeInfo.types.length > 0
                ? typeInfo.types
                : [typeInfo.type1 || 'Normal'];

            // Get move objects
            const moves = (Array.isArray(pk.moves) ? pk.moves : [])
                .filter((mId) => Number(mId) > 0)
                .map((mId) => {
                    const meta = movesMetaData[String(mId)] || { id: Number(mId), name: `Move #${mId}`, type: 'Normal', power: 0, split: 'Status' };
                    return {
                        id: Number(mId),
                        name: meta.name || `Move #${mId}`,
                        type: meta.type || 'Normal',
                        power: Number(meta.power || 0),
                        split: meta.split || 'Status',
                        isDamaging: meta.split === 'Physical' || meta.split === 'Special' || (Number(meta.power) > 0 && meta.split !== 'Status'),
                    };
                });

            const damagingMoves = moves.filter((m) => m.isDamaging);

            return {
                ...pk,
                types,
                moves,
                damagingMoves,
            };
        });
    }, [party]);

    // Calculate Defensive Matrix Stats
    const defensiveMatrix = useMemo(() => {
        return POKEMON_TYPES.map((moveType) => {
            const row = {
                moveType,
                multipliers: [],
                weakCount: 0,
                resistCount: 0,
            };

            team.forEach((pk) => {
                const mult = getDefensiveMultiplier(moveType, pk.types);
                row.multipliers.push(mult);
                if (mult > 1) {
                    row.weakCount += 1;
                } else if (mult < 1) {
                    row.resistCount += 1;
                }
            });

            return row;
        });
    }, [team]);

    // Calculate Offensive Matrix Stats
    const offensiveMatrix = useMemo(() => {
        return POKEMON_TYPES.map((enemyType) => {
            const row = {
                enemyType,
                superEffectivePokemon: [],
                coveredCount: 0,
            };

            team.forEach((pk) => {
                const effectiveMoves = pk.damagingMoves.filter((m) => {
                    return getSingleTypeMultiplier(m.type, enemyType) > 1;
                });

                if (effectiveMoves.length > 0) {
                    row.superEffectivePokemon.push({
                        hasEffective: true,
                        moves: effectiveMoves,
                    });
                    row.coveredCount += 1;
                } else {
                    row.superEffectivePokemon.push({
                        hasEffective: false,
                        moves: [],
                    });
                }
            });

            return row;
        });
    }, [team]);

    // High-level overview stats
    const statsSummary = useMemo(() => {
        const unresistedTypes = defensiveMatrix.filter((r) => r.resistCount === 0);
        const uncoveredOffense = offensiveMatrix.filter((r) => r.coveredCount === 0);

        return {
            unresistedTypes,
            totalCoveredDefensive: defensiveMatrix.filter((r) => r.resistCount > 0).length,
            uncoveredOffense,
            totalCoveredOffense: offensiveMatrix.filter((r) => r.coveredCount > 0).length,
        };
    }, [defensiveMatrix, offensiveMatrix]);

    if (loading) {
        return (
            <div className="py-20 flex flex-col items-center justify-center space-y-3 text-slate-400">
                <RefreshCw size={28} className="animate-spin text-blue-400" />
                <p className="text-sm font-semibold tracking-wide">Calculating Team Coverage Matrix...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-6 text-center text-rose-300">
                <AlertTriangle size={24} className="mx-auto mb-2 text-rose-400" />
                <p className="font-bold">Failed to load party data</p>
                <p className="text-xs text-rose-400/80 mt-1">{error}</p>
                <button
                    type="button"
                    onClick={() => setRefreshIndex((prev) => prev + 1)}
                    className="mt-4 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                    Try Again
                </button>
            </div>
        );
    }

    if (team.length === 0) {
        return (
            <div className="rounded-[2rem] border border-white/10 bg-slate-900/60 p-10 text-center space-y-3">
                <Target size={36} className="mx-auto text-slate-500" />
                <h3 className="text-lg font-bold text-slate-200">No Active Party Pokémon Found</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                    Your current save has no active party members. Add Pokémon to your party in the Party or PC editor to view team type coverage.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4 md:space-y-6 pb-12 animate-in fade-in duration-300">
            {/* Top Bar Header & Controls */}
            <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/70 border border-white/10 rounded-2xl ${isCompact ? 'p-4' : 'p-5 md:p-6'} backdrop-blur-md shadow-xl`}>
                <div>
                    <div className="flex items-center gap-2.5">
                        <span className="p-2 rounded-xl bg-blue-500/15 border border-blue-400/30 text-blue-300 shrink-0">
                            <Target size={18} />
                        </span>
                        <div>
                            <h2 className="text-base md:text-lg font-black text-white tracking-tight uppercase">
                                Team Type Coverage
                            </h2>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                                Real-time defensive resistances & offensive move matchups across your active party.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                    {/* Density Toggle (Compact vs Cozy) */}
                    <div className="inline-flex rounded-xl border border-white/10 bg-slate-950/70 p-0.5 text-[11px] font-bold">
                        <button
                            type="button"
                            onClick={() => setDensity('compact')}
                            className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                                density === 'compact' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
                            }`}
                        >
                            Compact
                        </button>
                        <button
                            type="button"
                            onClick={() => setDensity('cozy')}
                            className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                                density === 'cozy' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
                            }`}
                        >
                            Cozy
                        </button>
                    </div>

                    {/* View Mode Toggle (Both, Defensive, Offensive) */}
                    <div className="inline-flex rounded-xl border border-white/10 bg-slate-950/70 p-0.5 text-[11px] font-bold">
                        <button
                            type="button"
                            onClick={() => setViewMode('both')}
                            className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                                viewMode === 'both' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
                            }`}
                        >
                            Both
                        </button>
                        <button
                            type="button"
                            onClick={() => setViewMode('defensive')}
                            className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                                viewMode === 'defensive' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
                            }`}
                        >
                            Defensive
                        </button>
                        <button
                            type="button"
                            onClick={() => setViewMode('offensive')}
                            className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                                viewMode === 'offensive' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
                            }`}
                        >
                            Offensive
                        </button>
                    </div>

                    <button
                        type="button"
                        onClick={() => setRefreshIndex((prev) => prev + 1)}
                        className="p-1.5 rounded-xl border border-white/10 bg-slate-950/70 hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                        title="Refresh coverage"
                    >
                        <RefreshCw size={14} />
                    </button>
                </div>
            </div>

            {/* Coverage Summary Insights */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 md:gap-3">
                <div className={`rounded-xl border border-white/10 bg-slate-900/60 ${isCompact ? 'p-3' : 'p-4'}`}>
                    <p className="text-[10px] uppercase font-black tracking-widest text-slate-400">Team Size</p>
                    <p className={`${isCompact ? 'text-lg' : 'text-xl'} font-black text-slate-100 mt-0.5`}>{team.length} / 6 Pokémon</p>
                    <p className="text-[10px] text-slate-400 mt-0.5 truncate" title={team.map((pk) => pk.nickname || pk.species_name).join(', ')}>
                        {team.map((pk) => pk.nickname || pk.species_name).join(', ')}
                    </p>
                </div>

                <div className={`rounded-xl border border-white/10 bg-slate-900/60 ${isCompact ? 'p-3' : 'p-4'}`}>
                    <p className="text-[10px] uppercase font-black tracking-widest text-blue-300">Defensive Breadth</p>
                    <p className={`${isCompact ? 'text-lg' : 'text-xl'} font-black text-blue-400 mt-0.5`}>
                        {statsSummary.totalCoveredDefensive} / 18 Types
                    </p>
                    {statsSummary.unresistedTypes.length > 0 ? (
                        <p className="text-[10px] text-amber-300/90 mt-0.5 truncate" title={`Unresisted: ${statsSummary.unresistedTypes.map((r) => r.moveType).join(', ')}`}>
                            Unresisted: {statsSummary.unresistedTypes.map((r) => r.moveType).join(', ')}
                        </p>
                    ) : (
                        <p className="text-[10px] text-blue-300/80 mt-0.5">
                            Full defensive resistance coverage!
                        </p>
                    )}
                </div>

                <div className={`rounded-xl border border-white/10 bg-slate-900/60 ${isCompact ? 'p-3' : 'p-4'}`}>
                    <p className="text-[10px] uppercase font-black tracking-widest text-emerald-300">Offensive Breadth</p>
                    <p className={`${isCompact ? 'text-lg' : 'text-xl'} font-black text-emerald-400 mt-0.5`}>
                        {statsSummary.totalCoveredOffense} / 18 Types
                    </p>
                    {statsSummary.uncoveredOffense.length > 0 ? (
                        <p className="text-[10px] text-amber-300/90 mt-0.5 truncate" title={`Uncovered: ${statsSummary.uncoveredOffense.map((o) => o.enemyType).join(', ')}`}>
                            Uncovered: {statsSummary.uncoveredOffense.map((o) => o.enemyType).join(', ')}
                        </p>
                    ) : (
                        <p className="text-[10px] text-emerald-300/80 mt-0.5">
                            Full super effective coverage!
                        </p>
                    )}
                </div>
            </div>

            {/* 1. Defensive Coverage Section */}
            {(viewMode === 'both' || viewMode === 'defensive') && (
                <section className="rounded-2xl border border-white/10 bg-slate-900/80 backdrop-blur-md overflow-hidden shadow-2xl">
                    <div className={`px-4 ${isCompact ? 'py-2.5' : 'py-3.5'} border-b border-white/10 bg-[#162032]/80 flex items-center justify-between`}>
                        <div className="flex items-center gap-2">
                            <Shield className="text-blue-400" size={16} />
                            <h3 className="text-sm md:text-base font-bold text-slate-100">Defensive Coverage</h3>
                        </div>
                        <span className="text-[10px] md:text-[11px] text-slate-400">Incoming Move Type vs. Pokémon Types</span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-center border-collapse text-xs">
                            <thead>
                                <tr className="border-b border-white/10 bg-slate-950/60">
                                    <th className={`${isCompact ? 'py-2 px-3 text-[10px] w-28' : 'py-3.5 px-4 text-[11px] w-36'} text-left font-black uppercase text-slate-400 tracking-wider`}>
                                        Move ↓
                                    </th>
                                    {team.map((pk, idx) => (
                                        <th key={`def-head-${idx}`} className={`${isCompact ? 'py-2 px-2 min-w-[76px]' : 'py-3 px-3 min-w-[100px]'} align-bottom`}>
                                            <div className="flex flex-col items-center gap-1">
                                                <div className={`${isCompact ? 'w-7 h-7 rounded-lg' : 'w-10 h-10 rounded-xl'} bg-slate-800/80 border border-white/10 flex items-center justify-center overflow-hidden shrink-0`}>
                                                    <img
                                                        src={client.getPokemonIconUrl(pk.species_id)}
                                                        alt={pk.species_name}
                                                        className={`${isCompact ? 'w-6 h-6' : 'w-8 h-8'} object-contain pixelated`}
                                                        onError={(e) => {
                                                            if (e.currentTarget.src !== POKEMON_ICON_FALLBACK_URL) {
                                                                e.currentTarget.src = POKEMON_ICON_FALLBACK_URL;
                                                            }
                                                        }}
                                                    />
                                                </div>
                                                <span className={`font-bold text-slate-200 ${isCompact ? 'text-[11px] max-w-[76px]' : 'text-xs max-w-[90px]'} truncate`} title={pk.nickname || pk.species_name}>
                                                    {pk.nickname || pk.species_name}
                                                </span>
                                                <div className="flex gap-0.5 flex-wrap justify-center">
                                                    {pk.types.map((t) => {
                                                        const style = TYPE_BADGE_STYLES[t] || { bg: 'bg-slate-700', text: 'text-white' };
                                                        return (
                                                            <span
                                                                key={t}
                                                                className={`${isCompact ? 'px-1 py-0.2 text-[8px]' : 'px-1.5 py-0.5 text-[9px]'} rounded font-black uppercase tracking-tighter ${style.bg} ${style.text}`}
                                                            >
                                                                {t}
                                                            </span>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </th>
                                    ))}
                                    <th className={`${isCompact ? 'py-2 px-2 text-[10px] w-20' : 'py-3.5 px-3 text-xs w-24'} font-black text-rose-300 bg-rose-950/20 border-l border-white/5`}>
                                        Total Weak
                                    </th>
                                    <th className={`${isCompact ? 'py-2 px-2 text-[10px] w-20' : 'py-3.5 px-3 text-xs w-24'} font-black text-emerald-300 bg-emerald-950/20 border-l border-white/5`}>
                                        Total Resist
                                    </th>
                                    <th className={`${isCompact ? 'py-2 px-2 text-[10px] w-14' : 'py-3.5 px-3 text-xs w-16'} font-black text-slate-400 bg-slate-950/40 border-l border-white/5`}>
                                        Type
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 font-medium">
                                {defensiveMatrix.map((row) => {
                                    const typeStyle = TYPE_BADGE_STYLES[row.moveType] || { bg: 'bg-slate-700', text: 'text-white' };
                                    const abbrev = TYPE_ABBREVIATIONS[row.moveType] || row.moveType.slice(0, 3).toUpperCase();
                                    return (
                                        <tr key={`def-row-${row.moveType}`} className="hover:bg-white/[0.03] transition-colors">
                                            {/* Type Badge Cell */}
                                            <td className={`${isCompact ? 'py-1 px-3' : 'py-2.5 px-4'} text-left`}>
                                                <span
                                                    className={`inline-flex items-center justify-center ${isCompact ? 'w-20 py-0.5 text-[10px] rounded' : 'w-24 py-1 text-[11px] rounded-md'} font-black uppercase tracking-wide shadow-sm ${typeStyle.bg} ${typeStyle.text}`}
                                                >
                                                    {row.moveType}
                                                </span>
                                            </td>

                                            {/* Pokemon Multiplier Cells */}
                                            {row.multipliers.map((mult, pkIdx) => {
                                                let content = null;

                                                if (mult === 0) {
                                                    content = (
                                                        <span className={`inline-block ${isCompact ? 'px-1.5 py-0.2 text-[9px]' : 'px-2 py-0.5 text-[10px]'} rounded-full bg-slate-800 text-slate-300 font-bold border border-white/10 shadow-sm`}>
                                                            immune
                                                        </span>
                                                    );
                                                } else if (mult === 0.25) {
                                                    content = (
                                                        <span className={`inline-flex items-center justify-center ${isCompact ? 'w-5 h-5 text-[10px]' : 'w-6 h-6 text-xs'} rounded-full bg-emerald-500 text-slate-950 font-black shadow-sm shadow-emerald-500/30`}>
                                                            ¼
                                                        </span>
                                                    );
                                                } else if (mult === 0.5) {
                                                    content = <span className={`font-black text-emerald-400 ${isCompact ? 'text-xs' : 'text-sm'}`}>½</span>;
                                                } else if (mult === 2) {
                                                    content = <span className={`font-black text-rose-400 ${isCompact ? 'text-xs' : 'text-sm'}`}>2×</span>;
                                                } else if (mult === 4) {
                                                    content = (
                                                        <span className={`inline-flex items-center justify-center ${isCompact ? 'px-1.5 py-0.2 text-[10px]' : 'px-2 py-0.5 text-xs'} rounded-full bg-red-600 text-white font-black shadow-md shadow-red-600/40`}>
                                                            4×
                                                        </span>
                                                    );
                                                }

                                                return (
                                                    <td key={`cell-${row.moveType}-${pkIdx}`} className={`${isCompact ? 'py-1 px-2' : 'py-2.5 px-3'}`}>
                                                        {content}
                                                    </td>
                                                );
                                            })}

                                            {/* Total Weak Column */}
                                            <td className={`${isCompact ? 'py-1 px-2' : 'py-2.5 px-3'} border-l border-white/5 ${row.weakCount >= 3 ? 'bg-red-950/30' : 'bg-rose-950/10'}`}>
                                                {row.weakCount > 0 ? (
                                                    row.weakCount >= 3 ? (
                                                        <span className={`inline-flex items-center justify-center ${isCompact ? 'w-5 h-5 rounded text-[10px]' : 'w-7 h-7 rounded-lg text-xs'} bg-red-600 text-white font-black shadow-md shadow-red-600/30`}>
                                                            {row.weakCount}
                                                        </span>
                                                    ) : (
                                                        <span className={`font-bold text-rose-300 ${isCompact ? 'text-[11px]' : 'text-xs'}`}>{row.weakCount}</span>
                                                    )
                                                ) : (
                                                    <span className="text-slate-600 font-normal">—</span>
                                                )}
                                            </td>

                                            {/* Total Resist Column */}
                                            <td className={`${isCompact ? 'py-1 px-2' : 'py-2.5 px-3'} border-l border-white/5 bg-emerald-950/15`}>
                                                {row.resistCount > 0 ? (
                                                    <span className={`inline-flex items-center justify-center ${isCompact ? 'w-5 h-5 rounded text-[10px]' : 'w-7 h-7 rounded-lg text-xs'} bg-emerald-600 text-white font-black shadow-sm`}>
                                                        {row.resistCount}
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-600 font-normal">—</span>
                                                )}
                                            </td>

                                            {/* 3-Letter Type Abbreviation Right Tracer Column */}
                                            <td className={`${isCompact ? 'py-1 px-2' : 'py-2.5 px-3'} border-l border-white/5 text-center`}>
                                                <span
                                                    className={`inline-flex items-center justify-center ${isCompact ? 'w-10 py-0.5 text-[10px] rounded' : 'w-12 py-1 text-[11px] rounded-md'} font-black uppercase tracking-wider shadow-sm ${typeStyle.bg} ${typeStyle.text}`}
                                                    title={row.moveType}
                                                >
                                                    {abbrev}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </section>
            )}

            {/* 2. Offensive Coverage Section */}
            {(viewMode === 'both' || viewMode === 'offensive') && (
                <section className="rounded-2xl border border-white/10 bg-slate-900/80 backdrop-blur-md overflow-hidden shadow-2xl">
                    <div className={`px-4 ${isCompact ? 'py-2.5' : 'py-3.5'} border-b border-white/10 bg-[#162032]/80 flex items-center justify-between`}>
                        <div className="flex items-center gap-2">
                            <Swords className="text-emerald-400" size={16} />
                            <h3 className="text-sm md:text-base font-bold text-slate-100">Offensive Coverage</h3>
                        </div>
                        <span className="text-[10px] md:text-[11px] text-slate-400">Pokémon Attacks vs. Enemy Defending Types</span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-center border-collapse text-xs">
                            <thead>
                                <tr className="border-b border-white/10 bg-slate-950/60">
                                    <th className={`${isCompact ? 'py-2 px-3 text-[10px] w-28' : 'py-3.5 px-4 text-[11px] w-36'} text-left font-black uppercase text-slate-400 tracking-wider`}>
                                        Enemy ↓
                                    </th>
                                    {team.map((pk, idx) => (
                                        <th key={`off-head-${idx}`} className={`${isCompact ? 'py-2 px-2 min-w-[76px]' : 'py-3 px-3 min-w-[100px]'} align-bottom`}>
                                            <div className="flex flex-col items-center gap-1">
                                                <div className={`${isCompact ? 'w-7 h-7 rounded-lg' : 'w-10 h-10 rounded-xl'} bg-slate-800/80 border border-white/10 flex items-center justify-center overflow-hidden shrink-0`}>
                                                    <img
                                                        src={client.getPokemonIconUrl(pk.species_id)}
                                                        alt={pk.species_name}
                                                        className={`${isCompact ? 'w-6 h-6' : 'w-8 h-8'} object-contain pixelated`}
                                                        onError={(e) => {
                                                            if (e.currentTarget.src !== POKEMON_ICON_FALLBACK_URL) {
                                                                e.currentTarget.src = POKEMON_ICON_FALLBACK_URL;
                                                            }
                                                        }}
                                                    />
                                                </div>
                                                <span className={`font-bold text-slate-200 ${isCompact ? 'text-[11px] max-w-[76px]' : 'text-xs max-w-[90px]'} truncate`} title={pk.nickname || pk.species_name}>
                                                    {pk.nickname || pk.species_name}
                                                </span>
                                                <span className={`${isCompact ? 'text-[9px]' : 'text-[10px]'} text-slate-400 font-semibold`}>
                                                    {pk.damagingMoves.length} atk{pk.damagingMoves.length !== 1 ? 's' : ''}
                                                </span>
                                            </div>
                                        </th>
                                    ))}
                                    <th className={`${isCompact ? 'py-2 px-2 text-[10px] w-24' : 'py-3.5 px-3 text-xs w-32'} font-black text-emerald-300 bg-emerald-950/20 border-l border-white/5`}>
                                        Super Effective
                                    </th>
                                    <th className={`${isCompact ? 'py-2 px-2 text-[10px] w-14' : 'py-3.5 px-3 text-xs w-16'} font-black text-slate-400 bg-slate-950/40 border-l border-white/5`}>
                                        Type
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 font-medium">
                                {offensiveMatrix.map((row) => {
                                    const typeStyle = TYPE_BADGE_STYLES[row.enemyType] || { bg: 'bg-slate-700', text: 'text-white' };
                                    const abbrev = TYPE_ABBREVIATIONS[row.enemyType] || row.enemyType.slice(0, 3).toUpperCase();
                                    return (
                                        <tr key={`off-row-${row.enemyType}`} className="hover:bg-white/[0.03] transition-colors">
                                            {/* Type Badge Cell */}
                                            <td className={`${isCompact ? 'py-1 px-3' : 'py-2.5 px-4'} text-left`}>
                                                <span
                                                    className={`inline-flex items-center justify-center ${isCompact ? 'w-20 py-0.5 text-[10px] rounded' : 'w-24 py-1 text-[11px] rounded-md'} font-black uppercase tracking-wide shadow-sm ${typeStyle.bg} ${typeStyle.text}`}
                                                >
                                                    {row.enemyType}
                                                </span>
                                            </td>

                                            {/* Pokemon Super Effective Checkmark Cells */}
                                            {row.superEffectivePokemon.map((entry, pkIdx) => {
                                                if (!entry.hasEffective) {
                                                    return (
                                                        <td key={`off-cell-${row.enemyType}-${pkIdx}`} className={`${isCompact ? 'py-1 px-2' : 'py-2.5 px-3'} text-slate-600`}>
                                                            —
                                                        </td>
                                                    );
                                                }

                                                const tooltip = `Super Effective: ${entry.moves.map((m) => `${m.name} (${m.type}, ${m.power} BP)`).join(', ')}`;

                                                return (
                                                    <td key={`off-cell-${row.enemyType}-${pkIdx}`} className={`${isCompact ? 'py-1 px-2' : 'py-2.5 px-3'}`} title={tooltip}>
                                                        <span className={`inline-flex items-center justify-center ${isCompact ? 'w-5 h-5' : 'w-6 h-6'} rounded-full bg-emerald-500 text-slate-950 shadow-sm shadow-emerald-500/30 cursor-help transition-transform hover:scale-110`}>
                                                            <Check size={isCompact ? 11 : 14} strokeWidth={3.5} />
                                                        </span>
                                                    </td>
                                                );
                                            })}

                                            {/* Total Super Effective Summary Column */}
                                            <td className={`${isCompact ? 'py-1 px-2' : 'py-2.5 px-3'} border-l border-white/5 ${row.coveredCount > 0 ? 'bg-emerald-950/25' : 'bg-rose-950/30'}`}>
                                                {row.coveredCount > 0 ? (
                                                    <span className={`inline-flex items-center justify-center ${isCompact ? 'w-5 h-5 rounded text-[10px]' : 'w-7 h-7 rounded-lg text-xs'} bg-emerald-600 text-white font-black shadow-sm`}>
                                                        {row.coveredCount}
                                                    </span>
                                                ) : (
                                                    <span className={`inline-flex items-center justify-center ${isCompact ? 'w-5 h-5 rounded text-[10px]' : 'w-7 h-7 rounded-lg text-xs'} bg-rose-950/80 text-rose-400 border border-rose-500/40 font-bold`}>
                                                        0
                                                    </span>
                                                )}
                                            </td>

                                            {/* 3-Letter Type Abbreviation Right Tracer Column */}
                                            <td className={`${isCompact ? 'py-1 px-2' : 'py-2.5 px-3'} border-l border-white/5 text-center`}>
                                                <span
                                                    className={`inline-flex items-center justify-center ${isCompact ? 'w-10 py-0.5 text-[10px] rounded' : 'w-12 py-1 text-[11px] rounded-md'} font-black uppercase tracking-wider shadow-sm ${typeStyle.bg} ${typeStyle.text}`}
                                                    title={row.enemyType}
                                                >
                                                    {abbrev}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </section>
            )}
        </div>
    );
}

