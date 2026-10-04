import React from 'react';
import {
    LayoutGrid,
    Target,
    Monitor,
    ListFilter,
    Briefcase,
    BookOpen,
    Save,
    LogOut,
    DollarSign,
    Award,
    Edit3,
    X,
    Swords,
} from 'lucide-react';
import UnboundLogo from './UnboundLogo.jsx';

const NAV_SECTIONS = [
    {
        title: 'TEAM BUILDING',
        items: [
            {
                id: 'party',
                label: 'Party',
                sublabel: 'Active Team Roster',
                icon: LayoutGrid,
            },
            {
                id: 'pc',
                label: 'PC Box',
                sublabel: 'Box Storage System',
                icon: Monitor,
            },
            {
                id: 'bag',
                label: 'Bag',
                sublabel: 'Items, Balls & Berries',
                icon: Briefcase,
            },
            {
                id: 'dex',
                label: 'Living Dex',
                sublabel: 'National Dex Progress',
                icon: BookOpen,
            },
        ],
    },
    {
        title: 'TOOLS',
        items: [
            {
                id: 'coverage',
                label: 'Coverage',
                sublabel: 'Type Matchups Matrix',
                icon: Target,
            },
            {
                id: 'moves_wiki',
                label: 'Moves Wiki',
                sublabel: 'Move Database & Stats',
                icon: Swords,
            },
            {
                id: 'all',
                label: 'All Pokémon',
                sublabel: 'Master Search Table',
                icon: ListFilter,
            },
        ],
    },
];

export default function Sidebar({
    activeTab,
    onTabChange,
    money = 0,
    bp = 0,
    saveExt = '.sav',
    onOpenResources,
    onExit,
    onRestart,
    onDownload,
    isMobileOpen = false,
    onCloseMobile,
}) {
    const handleExitClick = onExit || onRestart;
    const renderNavContent = () => (
        <div className="flex flex-col h-full justify-between select-none">
            {/* Top Brand Header */}
            <div className="space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-white/10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500/20 to-indigo-600/30 flex items-center justify-center border border-white/15 shrink-0 shadow-inner">
                            <UnboundLogo size={26} />
                        </div>
                        <div className="min-w-0">
                            <h1 className="text-sm font-black text-white tracking-tight leading-none uppercase truncate">
                                Pokémon Unbound
                            </h1>
                            <div className="flex items-center gap-1.5 mt-1">
                                <span className="text-[10px] font-bold tracking-widest text-blue-400 uppercase">
                                    Save Editor
                                </span>
                                <span className="px-1.5 py-0.2 text-[9px] font-black rounded bg-blue-500/20 text-blue-300 border border-blue-400/30 font-mono">
                                    {saveExt.toUpperCase()}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Mobile close button */}
                    {onCloseMobile && (
                        <button
                            type="button"
                            onClick={onCloseMobile}
                            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 md:hidden cursor-pointer"
                            aria-label="Close menu"
                        >
                            <X size={18} />
                        </button>
                    )}
                </div>

                {/* Navigation Menu */}
                <nav className="space-y-4" aria-label="Sidebar navigation">
                    {NAV_SECTIONS.map((section) => (
                        <div key={section.title} className="space-y-1.5">
                            <p className="px-3 text-[10px] uppercase font-black tracking-widest text-slate-500">
                                {section.title}
                            </p>
                            {section.items.map((item) => {
                                const Icon = item.icon;
                                const isActive = activeTab === item.id;
                                return (
                                    <button
                                        key={item.id}
                                        type="button"
                                        onClick={() => {
                                            onTabChange(item.id);
                                            if (onCloseMobile) onCloseMobile();
                                        }}
                                        aria-current={isActive ? 'page' : undefined}
                                        className={`w-full group relative flex items-center gap-3.5 px-3.5 py-2 rounded-2xl text-left transition-all duration-200 cursor-pointer ${
                                            isActive
                                                ? 'bg-blue-600/20 text-white border border-blue-500/40 shadow-lg shadow-blue-600/10 font-bold'
                                                : 'text-slate-400 hover:text-slate-100 hover:bg-white/5 border border-transparent'
                                        }`}
                                    >
                                        {/* Left Active Pill Bar */}
                                        {isActive && (
                                            <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-blue-500 rounded-r-full shadow-md shadow-blue-500/50" />
                                        )}

                                        <span
                                            className={`p-1.5 rounded-xl transition-colors shrink-0 ${
                                                isActive
                                                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                                                    : 'bg-slate-800/80 text-slate-400 group-hover:text-slate-200 group-hover:bg-slate-700'
                                            }`}
                                        >
                                            <Icon size={16} />
                                        </span>

                                        <div className="min-w-0 flex-1">
                                            <div className="text-xs font-bold leading-none tracking-tight flex items-center justify-between">
                                                <span className={isActive ? 'text-white' : 'text-slate-300 group-hover:text-white'}>
                                                    {item.label}
                                                </span>
                                            </div>
                                            <p className="text-[10px] text-slate-400/80 mt-0.5 truncate font-normal">
                                                {item.sublabel}
                                            </p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    ))}
                </nav>
            </div>

            {/* Bottom Section: Quick Resources Widget + Action Buttons */}
            <div className="space-y-3 pt-4 border-t border-white/10">
                {/* Resources Chip Card */}
                <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-3 shadow-inner">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                            Resources
                        </span>
                        <button
                            type="button"
                            onClick={onOpenResources}
                            className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-400 hover:text-blue-300 hover:underline cursor-pointer"
                        >
                            <Edit3 size={11} /> Edit
                        </button>
                    </div>

                    <div className="space-y-1.5 text-xs">
                        <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                                <DollarSign size={13} className="text-emerald-400" /> Money:
                            </span>
                            <span className="font-mono font-bold text-emerald-400 text-[11px]">
                                ¥{Number(money).toLocaleString()}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                                <Award size={13} className="text-amber-400" /> BP:
                            </span>
                            <span className="font-mono font-bold text-amber-300 text-[11px]">
                                {Number(bp).toLocaleString()} BP
                            </span>
                        </div>
                    </div>
                </div>

                {/* Main Action Buttons */}
                <div className="grid grid-cols-2 gap-2">
                    <button
                        type="button"
                        onClick={handleExitClick}
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border border-white/10 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
                        title="Exit save file and return to main menu"
                    >
                        <LogOut size={14} /> Exit
                    </button>
                    <button
                        type="button"
                        onClick={onDownload}
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/25 cursor-pointer"
                        title="Export modified save and original backup (.bak)"
                    >
                        <Save size={14} /> Save
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <>
            {/* Desktop Sticky Sidebar */}
            <aside className="hidden md:flex flex-col w-64 lg:w-72 bg-[#131b2e]/95 backdrop-blur-xl border-r border-white/10 shrink-0 h-screen sticky top-0 z-40 p-4">
                {renderNavContent()}
            </aside>

            {/* Mobile Slide-Over Drawer Overlay */}
            {isMobileOpen && (
                <div
                    className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm md:hidden flex"
                    onClick={onCloseMobile}
                >
                    <aside
                        className="w-72 bg-[#131b2e] border-r border-white/10 h-full p-4 flex flex-col justify-between shadow-2xl animate-in slide-in-from-left duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {renderNavContent()}
                    </aside>
                </div>
            )}
        </>
    );
}
