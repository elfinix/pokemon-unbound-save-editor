import React from 'react';
import { ChevronDown } from 'lucide-react';
import { GROWTH_OPTIONS } from '../../core/growth.js';
import { NATURE_GROUPS } from '../../core/showdownImport.js';
import { EV_TOTAL_MAX, MIN_LEVEL, MAX_LEVEL, clampNumber } from './constants.js';

export const StatsTab = ({
    localPk,
    setLocalPk,
    updateStat,
    setAllIvs,
    clearAllEvs,
    previewLevel,
    baseStats,
    statRows,
    totalBase,
    totalIv,
    totalEv,
    totalBattleStat,
    hackedMode,
    remainingEvs,
    hiddenPowerType,
    levelInput,
    setLevelInput,
    levelGrowthMode,
    setLevelGrowthMode,
    setLevelDirty,
    levelClampFallback,
    isPcMon,
}) => {
    return (
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
                                className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25 transition-colors cursor-pointer"
                                title="Set all IVs to 31"
                            >
                                31 ALL IV
                            </button>
                            <button
                                type="button"
                                onClick={() => setAllIvs(0)}
                                className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-white/10 hover:bg-slate-700 transition-colors cursor-pointer"
                                title="Set all IVs to 0"
                            >
                                0 IV
                            </button>
                            <button
                                type="button"
                                onClick={clearAllEvs}
                                className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-white/10 hover:bg-slate-700 transition-colors cursor-pointer"
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
                            onChange={(e) => setLocalPk({...localPk, nature_id: parseInt(e.target.value, 10)})}
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
                            className={`flex-1 py-2 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
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
    );
};
