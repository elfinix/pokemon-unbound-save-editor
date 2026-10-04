import React from 'react';
import {
    Menu,
    ChevronDown,
    CircleHelp,
} from 'lucide-react';
import { RUNTIME_MODES } from '../services/apiClient.js';
import UnboundLogo from './UnboundLogo.jsx';

const TAB_TITLES = {
    party: { title: 'Party Team', subtitle: 'Active battle roster and stats' },
    pc: { title: 'PC Box Storage', subtitle: 'Stored Pokémon management & slot insertion' },
    bag: { title: 'Bag Inventory', subtitle: 'Pockets, items, balls & berries' },
    dex: { title: 'Living Dex', subtitle: 'National Pokédex collection tracker' },
    coverage: { title: 'Coverage Matrix', subtitle: 'Type matchups, weaknesses & resistances' },
    moves_wiki: { title: 'Moves Wiki', subtitle: 'Move database, categories, power & PP' },
    all: { title: 'All Pokémon', subtitle: 'Master searchable list of party & PC' },
};

export default function TopHeader({
    isLoaded,
    activeTab,
    runtimeMode,
    onRuntimeModeChange,
    legitMode,
    onToggleLegit,
    hackedMode,
    onToggleHacked,
    showLegitHelp,
    onToggleLegitHelp,
    onOpenMobileSidebar,
}) {
    const currentTabInfo = TAB_TITLES[activeTab] || { title: 'Save Editor', subtitle: 'Pokémon Unbound v2.1.1+' };

    return (
        <header className="w-full bg-[#131b2e]/80 backdrop-blur-md border-b border-white/5 sticky top-0 z-30">
            <div className={`w-full ${isLoaded ? 'max-w-7xl px-4 md:px-6 lg:px-8' : 'max-w-7xl px-4 md:px-8'} mx-auto py-3 md:py-3.5 flex items-center justify-between gap-3`}>
                {/* Left Side: Mobile Menu Button + Title/Breadcrumb */}
                <div className="flex items-center gap-3 min-w-0">
                    {isLoaded && (
                        <button
                            type="button"
                            onClick={onOpenMobileSidebar}
                            className="p-2 rounded-xl bg-slate-900 border border-white/10 text-slate-300 hover:text-white md:hidden cursor-pointer"
                            aria-label="Open sidebar menu"
                        >
                            <Menu size={18} />
                        </button>
                    )}

                    {!isLoaded ? (
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-600/30 flex items-center justify-center border border-white/15 overflow-hidden shrink-0 shadow-inner">
                                <UnboundLogo size={22} />
                            </div>
                            <h1 className="text-base md:text-lg font-black text-white tracking-tight uppercase">
                                Pokémon Unbound <span className="text-blue-400">Save Editor</span>
                            </h1>
                        </div>
                    ) : (
                        <div className="min-w-0">
                            <h2 className="text-sm md:text-base font-black text-white tracking-tight leading-none uppercase truncate">
                                {currentTabInfo.title}
                            </h2>
                            <p className="text-[11px] text-slate-400 mt-1 hidden sm:block truncate">
                                {currentTabInfo.subtitle}
                            </p>
                        </div>
                    )}
                </div>

                {/* Right Side: Runtime Controls & Mode Toggles */}
                <div className="flex items-center gap-2 md:gap-2.5 flex-wrap justify-end shrink-0">
                    {/* Runtime mode dropdown */}
                    <div className="relative">
                        <select
                            value={runtimeMode}
                            onChange={(e) => onRuntimeModeChange(e.target.value)}
                            className="appearance-none bg-slate-900 border border-white/10 rounded-xl pl-2.5 pr-6 py-1.5 text-[10px] uppercase font-bold tracking-widest text-slate-300 min-w-[115px] whitespace-nowrap cursor-pointer outline-none focus:border-blue-500/50 transition-colors"
                        >
                            <option value={RUNTIME_MODES.local}>Local mode</option>
                            <option value={RUNTIME_MODES.backend}>Backend mode</option>
                        </select>
                        <ChevronDown size={11} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-400" />
                    </div>

                    {/* Legit Mode toggle */}
                    <button
                        type="button"
                        onClick={onToggleLegit}
                        className={`px-2.5 py-1.5 rounded-xl text-[10px] uppercase tracking-wider font-bold border whitespace-nowrap transition-colors cursor-pointer ${
                            legitMode
                                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                                : 'bg-slate-900 border-white/10 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                        }`}
                        title="Legit Mode verifies valid abilities, items, and levels"
                    >
                        Legit: {legitMode ? 'ON' : 'OFF'}
                    </button>

                    {/* Hacked Mode toggle */}
                    <button
                        type="button"
                        onClick={onToggleHacked}
                        className={`px-2.5 py-1.5 rounded-xl text-[10px] uppercase tracking-wider font-bold border whitespace-nowrap transition-colors cursor-pointer ${
                            hackedMode
                                ? 'bg-purple-500/20 border-purple-500/50 text-purple-300 shadow-[0_0_12px_rgba(168,85,247,0.2)]'
                                : 'bg-slate-900 border-white/10 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                        }`}
                        title="Hacked Mode disables EV 510 total cap (all stats up to 252)"
                    >
                        Hacked: {hackedMode ? 'ON' : 'OFF'}
                    </button>

                    {/* Help toggle button */}
                    <button
                        type="button"
                        onClick={onToggleLegitHelp}
                        className="p-1.5 rounded-xl bg-slate-900 border border-white/10 text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
                        aria-expanded={showLegitHelp}
                        aria-label="Show legit mode help"
                    >
                        <CircleHelp size={14} />
                    </button>
                </div>
            </div>

            {/* Legit / Hacked Mode info drawer */}
            {showLegitHelp && (
                <div className={`w-full ${isLoaded ? 'max-w-7xl px-4 md:px-6 lg:px-8' : 'max-w-7xl px-4 md:px-8'} mx-auto pb-3`}>
                    <p className="text-[11px] text-slate-300 bg-slate-900/90 border border-white/10 rounded-xl px-3.5 py-2.5 shadow-lg">
                        <strong className="text-emerald-300">Legit Mode:</strong> Restricts level editing (1-100) and verifies valid abilities/items. <strong className="text-purple-300 ml-2">Hacked Mode:</strong> OFF = 510 total EV cap enforced, ON = uncapped EVs (all stats up to 252).
                    </p>
                </div>
            )}
        </header>
    );
}

