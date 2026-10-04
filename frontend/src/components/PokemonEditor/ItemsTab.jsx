import React from 'react';
import { Search, ChevronDown } from 'lucide-react';
import { ITEM_ICON_FALLBACK_URL } from '../../core/iconResolver.js';

export const ItemsTab = ({
    client,
    localPk,
    setLocalPk,
    allItems,
    allBalls,
    itemSearch,
    setItemSearch,
    itemDropdownOpen,
    setItemDropdownOpen,
    ballDropdownOpen,
    setBallDropdownOpen,
    ballSearch,
    setBallSearch,
    itemDropdownRef,
    ballDropdownRef,
    currentItemName,
    currentBallName,
    currentBallItemId,
    currentBall,
    canShowItemIcon,
}) => {
    return (
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
    );
};
