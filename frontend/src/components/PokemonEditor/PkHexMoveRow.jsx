import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Search, ChevronDown } from 'lucide-react';
import { TYPE_STYLES, TYPE_ABBR } from './constants.js';

export const PkHexMoveRow = ({
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
                title={meta ? `${meta.type} | Power: ${meta.power || '-'} | Acc: ${meta.accuracy || '-'}%` : 'No move'}
            >
                {moveId > 0 ? typeAbbr : '---'}
            </div>

            {/* Move Selector Dropdown */}
            <div className="relative flex-1 min-w-0">
                <button
                    type="button"
                    onClick={() => setIsOpen((prev) => !prev)}
                    className="w-full flex items-center justify-between bg-slate-900 border border-white/10 hover:border-blue-500/40 rounded-xl px-3 py-2 text-left transition-colors cursor-pointer"
                >
                    <div className="flex items-center gap-2 truncate">
                        {moveId > 0 ? (
                            <>
                                <span className="text-[10px] font-mono text-blue-400 font-bold shrink-0">#{moveId}</span>
                                <span className="font-bold text-xs text-slate-100 truncate">{currentMove?.name || `Move #${moveId}`}</span>
                            </>
                        ) : (
                            <span className="text-xs text-slate-500 italic">-- Empty Move Slot --</span>
                        )}
                    </div>
                    <ChevronDown size={14} className={`text-slate-500 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>

                {isOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1.5 z-50 bg-slate-900 border border-blue-500/30 rounded-xl shadow-2xl overflow-hidden max-h-56 flex flex-col animate-in fade-in zoom-in-95 duration-150">
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
                                className="w-full text-left px-3 py-2 text-xs text-slate-400 hover:bg-white/5 hover:text-white transition-colors"
                            >
                                --- Empty Move Slot (0) ---
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
                                        className="w-full text-left px-3 py-2 text-xs hover:bg-blue-600/30 flex items-center justify-between gap-2 transition-colors cursor-pointer"
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
                className="px-2.5 py-1.5 bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 border border-blue-500/30 rounded-lg text-[9px] font-bold uppercase tracking-wider disabled:opacity-30 disabled:cursor-not-allowed transition-colors shrink-0 cursor-pointer"
                title="Max PP (3 PP Ups + Full PP)"
            >
                Max
            </button>
        </div>
    );
};
