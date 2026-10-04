import React from 'react';
import { Zap, Shield, Heart, Target, Wind, Activity } from 'lucide-react';
import { POKEMON_ICON_FALLBACK_URL, ITEM_ICON_FALLBACK_URL, resolveItemIconUrl } from '../core/iconResolver.js';
import movesMeta from '../core/movesMeta.json' with { type: 'json' };
import speciesTypes from '../core/speciesTypes.json' with { type: 'json' };
import { calculateBattleStats } from '../core/battlePreview.js';

const TYPE_STYLES = {
    Normal: { bg: 'bg-stone-500/15', text: 'text-stone-300', border: 'border-stone-500/30' },
    Fire: { bg: 'bg-orange-500/15', text: 'text-orange-400', border: 'border-orange-500/30' },
    Water: { bg: 'bg-blue-500/15', text: 'text-blue-400', border: 'border-blue-500/30' },
    Grass: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/30' },
    Electric: { bg: 'bg-yellow-500/15', text: 'text-yellow-400', border: 'border-yellow-500/30' },
    Ice: { bg: 'bg-cyan-400/15', text: 'text-cyan-300', border: 'border-cyan-400/30' },
    Fighting: { bg: 'bg-red-700/15', text: 'text-red-400', border: 'border-red-700/30' },
    Poison: { bg: 'bg-purple-500/15', text: 'text-purple-300', border: 'border-purple-500/30' },
    Ground: { bg: 'bg-amber-600/15', text: 'text-amber-300', border: 'border-amber-600/30' },
    Flying: { bg: 'bg-indigo-400/15', text: 'text-indigo-300', border: 'border-indigo-400/30' },
    Psychic: { bg: 'bg-pink-500/15', text: 'text-pink-400', border: 'border-pink-500/30' },
    Bug: { bg: 'bg-lime-500/15', text: 'text-lime-400', border: 'border-lime-500/30' },
    Rock: { bg: 'bg-yellow-700/15', text: 'text-yellow-300', border: 'border-yellow-700/30' },
    Ghost: { bg: 'bg-violet-700/15', text: 'text-violet-300', border: 'border-violet-700/30' },
    Dragon: { bg: 'bg-indigo-600/15', text: 'text-indigo-400', border: 'border-indigo-600/30' },
    Steel: { bg: 'bg-slate-400/15', text: 'text-slate-300', border: 'border-slate-400/30' },
    Dark: { bg: 'bg-zinc-800/80', text: 'text-zinc-300', border: 'border-zinc-600/40' },
    Fairy: { bg: 'bg-rose-400/15', text: 'text-rose-300', border: 'border-rose-400/30' },
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

const PokemonCard = ({ pokemon, onEdit, getPokemonIconUrl, getItemIconUrl }) => {
    const heldItemId = Number(pokemon.item_id || 0);
    const itemIconSrc = heldItemId > 0
        ? (getItemIconUrl ? getItemIconUrl(heldItemId) : resolveItemIconUrl(heldItemId))
        : null;

    // PokemonDB Absolute Stat Brackets (<30 Red, 30-59 Orange, 60-89 Yellow, 90-119 Lime, 120-149 Green, 150+ Cyan)
    const getStatBracketColor = (val) => {
        const num = Number(val) || 0;
        if (num >= 150) return 'bg-cyan-400';
        if (num >= 120) return 'bg-emerald-500';
        if (num >= 90) return 'bg-lime-400';
        if (num >= 60) return 'bg-amber-400';
        if (num >= 30) return 'bg-orange-500';
        return 'bg-red-500';
    };

    // Resolve Battle Stats (falls back to calculating from level/nature/ivs/evs)
    const battleStats = pokemon.battle_stats || calculateBattleStats({
        speciesId: pokemon.species_id,
        level: pokemon.level,
        natureId: pokemon.nature_id,
        ivs: pokemon.ivs,
        evs: pokemon.evs,
    }) || {};

    const stats = [
        {
            label: 'HP',
            statVal: battleStats.HP,
            ivVal: pokemon.ivs?.HP ?? 0,
            evVal: pokemon.evs?.HP ?? 0,
            icon: <Heart size={11} className="text-rose-400 shrink-0" />,
        },
        {
            label: 'Attack',
            statVal: battleStats.Atk,
            ivVal: pokemon.ivs?.Atk ?? 0,
            evVal: pokemon.evs?.Atk ?? 0,
            icon: <Target size={11} className="text-amber-400 shrink-0" />,
        },
        {
            label: 'Defense',
            statVal: battleStats.Def,
            ivVal: pokemon.ivs?.Def ?? 0,
            evVal: pokemon.evs?.Def ?? 0,
            icon: <Shield size={11} className="text-yellow-400 shrink-0" />,
        },
        {
            label: 'Sp. Atk',
            statVal: battleStats.SpA,
            ivVal: pokemon.ivs?.SpA ?? 0,
            evVal: pokemon.evs?.SpA ?? 0,
            icon: <Zap size={11} className="text-cyan-400 shrink-0" />,
        },
        {
            label: 'Sp. Def',
            statVal: battleStats.SpD,
            ivVal: pokemon.ivs?.SpD ?? 0,
            evVal: pokemon.evs?.SpD ?? 0,
            icon: <Activity size={11} className="text-indigo-400 shrink-0" />,
        },
        {
            label: 'Speed',
            statVal: battleStats.Spe,
            ivVal: pokemon.ivs?.Spd ?? pokemon.ivs?.Spe ?? 0,
            evVal: pokemon.evs?.Spd ?? pokemon.evs?.Spe ?? 0,
            icon: <Wind size={11} className="text-sky-400 shrink-0" />,
        },
    ];

    const moves = Array.isArray(pokemon.moves) ? pokemon.moves.slice(0, 4) : [0, 0, 0, 0];
    const monTypes = speciesTypes?.[String(pokemon.species_id)]?.types || ['Normal'];

    return (
        <div
            onClick={() => onEdit(pokemon)}
            className="cursor-pointer bg-[#1e293b] border border-white/5 rounded-[2rem] p-5 hover:border-blue-500/50 transition-all group shadow-xl active:scale-[0.98]"
        >
            {/* Header: Sprite, Nickname, Level, Types, Nature, Ability */}
            <div className="flex items-center gap-4 mb-4">
                <div className="relative shrink-0">
                    <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full group-hover:bg-blue-500/40 transition-colors"></div>
                    <div
                        className="relative w-20 h-20 bg-slate-800/80 rounded-2xl flex items-center justify-center border border-white/10 overflow-hidden ring-1 ring-white/5 shadow-inner">
                        <img
                            src={getPokemonIconUrl(pokemon.species_id)}
                            alt={pokemon.species_name}
                            className="w-16 h-16 object-contain pixelated group-hover:scale-105 transition-transform duration-200"
                            onError={(e) => {
                                if (e.currentTarget.src !== POKEMON_ICON_FALLBACK_URL) {
                                    e.currentTarget.src = POKEMON_ICON_FALLBACK_URL;
                                }
                            }}
                        />
                    </div>
                    {heldItemId > 0 && (
                        <div
                            className="absolute -bottom-2 -right-2.5 w-7 h-7 bg-slate-900/90 rounded-xl flex items-center justify-center border border-white/20 shadow-lg ring-1 ring-black/40 z-10 p-0.5 group-hover:scale-110 transition-transform"
                            title="Held Item"
                        >
                            <img
                                src={itemIconSrc}
                                alt="Held Item"
                                className="w-5 h-5 object-contain pixelated"
                                onError={(e) => {
                                    if (e.currentTarget.src !== ITEM_ICON_FALLBACK_URL) {
                                        e.currentTarget.src = ITEM_ICON_FALLBACK_URL;
                                    }
                                }}
                            />
                        </div>
                    )}
                </div>

                <div className="flex-1 min-w-0">
                    {/* Name + Level */}
                    <div className="flex items-center justify-between gap-2">
                        <h3 className="text-lg font-bold truncate group-hover:text-blue-400 transition-colors">
                            {pokemon.nickname}
                        </h3>
                        <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2.5 py-0.5 rounded-lg font-black uppercase tracking-widest border border-blue-500/20 shrink-0">
                            Lv. {pokemon.level}
                        </span>
                    </div>

                    {/* Pokemon Species Types */}
                    <div className="flex items-center gap-1.5 mt-1">
                        {monTypes.map((tName, i) => {
                            const style = TYPE_STYLES[tName] || TYPE_STYLES.Normal;
                            return (
                                <span
                                    key={i}
                                    className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md border ${style.bg} ${style.text} ${style.border} tracking-wider shadow-sm`}
                                >
                                    {tName}
                                </span>
                            );
                        })}
                    </div>

                    {/* Nature & Ability */}
                    <div className="mt-2 space-y-0.5 text-xs">
                        <div className="text-[11px] truncate flex items-center gap-1.5">
                            <span className="text-slate-400 font-semibold">Nature:</span>
                            <span className="font-bold text-slate-200">{pokemon.nature || 'Unknown'}</span>
                        </div>
                        <div className="text-[11px] truncate flex items-center gap-1.5">
                            <span className="text-slate-400 font-semibold">Ability:</span>
                            <span className="font-bold text-blue-300">{pokemon.ability_label_current || 'Unknown'}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* 4 Moves Display (with 3-letter type abbreviations) */}
            <div className="grid grid-cols-2 gap-1.5 mb-4">
                {moves.map((moveId, idx) => {
                    const move = movesMeta[String(moveId)];
                    if (!move || moveId === 0) {
                        return (
                            <div
                                key={idx}
                                className="flex items-center justify-center py-1.5 px-2.5 rounded-xl bg-slate-900/40 border border-dashed border-white/5 text-[11px] font-mono text-slate-600 tracking-wider select-none"
                            >
                                —
                            </div>
                        );
                    }
                    const style = TYPE_STYLES[move.type] || TYPE_STYLES.Normal;
                    const abbr = TYPE_ABBR[move.type] || move.type.slice(0, 3).toUpperCase();
                    return (
                        <div
                            key={idx}
                            className={`flex items-center justify-between px-2.5 py-1.5 rounded-xl border ${style.bg} ${style.border} min-w-0 transition-all group-hover:brightness-110 shadow-sm`}
                        >
                            <span className={`text-[11px] font-bold truncate ${style.text}`}>
                                {move.name}
                            </span>
                            <span className={`text-[9px] font-black uppercase tracking-wider ml-1.5 shrink-0 opacity-75 font-mono ${style.text}`}>
                                {abbr}
                            </span>
                        </div>
                    );
                })}
            </div>

            {/* Battle Preview Stats - Single Column Stacked Bar Chart with Slash IV & Total */}
            {(() => {
                const totalStat = stats.reduce((acc, s) => acc + (Number(s.statVal) || 0), 0);

                return (
                    <div className="space-y-1.5 pt-2 border-t border-white/5">
                        {stats.map((s) => {
                            const barWidth = Math.max(6, Math.min(100, (Number(s.statVal || 0) / 255) * 100));
                            return (
                                <div key={s.label} className="flex items-center gap-2 text-xs">
                                    <span className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase w-20 shrink-0">
                                        {s.icon} {s.label}
                                    </span>
                                    <div className="h-2 flex-1 bg-slate-900/90 rounded-full overflow-hidden p-[0.5px]">
                                        <div
                                            className={`h-full rounded-full transition-all duration-500 ease-out ${getStatBracketColor(s.statVal)}`}
                                            style={{ width: `${barWidth}%` }}
                                        />
                                    </div>
                                    <div className="flex items-center justify-end shrink-0 font-mono text-right min-w-[3.5rem]">
                                        <span className="text-xs font-black text-slate-100 tabular-nums">
                                            {s.statVal ?? '-'}
                                        </span>
                                        <span className="text-[10px] text-slate-500 mx-1 font-sans">/</span>
                                        <span className={`text-[10px] tabular-nums font-semibold ${s.ivVal === 31 ? 'text-emerald-400 font-bold' : 'text-slate-400'}`}>
                                            {s.ivVal}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}

                        {/* Total Row */}
                        <div className="flex items-center gap-2 pt-1.5 mt-1 border-t border-white/10 font-bold text-xs">
                            <span className="text-[11px] font-black text-slate-300 uppercase w-20 shrink-0 tracking-wider">
                                TOTAL
                            </span>
                            <div className="h-2 flex-1 bg-slate-900/90 rounded-full overflow-hidden p-[0.5px]">
                                <div
                                    className="h-full rounded-full bg-blue-500/80 transition-all duration-500 ease-out"
                                    style={{ width: `${Math.max(6, Math.min(100, (totalStat / 800) * 100))}%` }}
                                />
                            </div>
                            <div className="flex items-center justify-end shrink-0 font-mono text-right min-w-[3.5rem]">
                                <span className="text-xs font-black text-blue-300 tabular-nums">
                                    {totalStat}
                                </span>
                            </div>
                        </div>
                    </div>
                );
            })()}
        </div>
    );
};

export default PokemonCard;
