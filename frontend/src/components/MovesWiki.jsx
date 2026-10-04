import React, { useState, useMemo, useDeferredValue } from 'react';
import {
    Search,
    Swords,
    Sparkles,
    Shield,
    Filter,
    LayoutGrid,
    List,
    RotateCcw,
    ChevronLeft,
    ChevronRight,
    Star,
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
} from 'lucide-react';
import movesMeta from '../core/movesMeta.json' with { type: 'json' };

const TYPE_STYLES = {
    Normal: { bg: 'bg-stone-500/20', text: 'text-stone-300', border: 'border-stone-500/40', badge: 'bg-stone-600' },
    Fire: { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/40', badge: 'bg-orange-600' },
    Water: { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/40', badge: 'bg-blue-600' },
    Grass: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/40', badge: 'bg-emerald-600' },
    Electric: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/40', badge: 'bg-yellow-600' },
    Ice: { bg: 'bg-cyan-400/20', text: 'text-cyan-300', border: 'border-cyan-400/40', badge: 'bg-cyan-600' },
    Fighting: { bg: 'bg-red-700/20', text: 'text-red-400', border: 'border-red-700/40', badge: 'bg-red-700' },
    Poison: { bg: 'bg-purple-500/20', text: 'text-purple-300', border: 'border-purple-500/40', badge: 'bg-purple-600' },
    Ground: { bg: 'bg-amber-600/20', text: 'text-amber-300', border: 'border-amber-600/40', badge: 'bg-amber-700' },
    Flying: { bg: 'bg-indigo-400/20', text: 'text-indigo-300', border: 'border-indigo-400/40', badge: 'bg-indigo-600' },
    Psychic: { bg: 'bg-pink-500/20', text: 'text-pink-400', border: 'border-pink-500/40', badge: 'bg-pink-600' },
    Bug: { bg: 'bg-lime-500/20', text: 'text-lime-400', border: 'border-lime-500/40', badge: 'bg-lime-600' },
    Rock: { bg: 'bg-yellow-700/20', text: 'text-yellow-300', border: 'border-yellow-700/40', badge: 'bg-yellow-800' },
    Ghost: { bg: 'bg-violet-700/20', text: 'text-violet-300', border: 'border-violet-700/40', badge: 'bg-violet-700' },
    Dragon: { bg: 'bg-indigo-600/20', text: 'text-indigo-400', border: 'border-indigo-600/40', badge: 'bg-indigo-700' },
    Steel: { bg: 'bg-slate-400/20', text: 'text-slate-300', border: 'border-slate-400/40', badge: 'bg-slate-600' },
    Dark: { bg: 'bg-zinc-800/80', text: 'text-zinc-300', border: 'border-zinc-600/50', badge: 'bg-zinc-700' },
    Fairy: { bg: 'bg-rose-400/20', text: 'text-rose-300', border: 'border-rose-400/40', badge: 'bg-rose-600' },
};

const SPLIT_STYLES = {
    Physical: {
        bg: 'bg-red-500/15 text-red-300 border-red-500/30',
        icon: Swords,
        label: 'Physical',
        bar: 'bg-red-500',
    },
    Special: {
        bg: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
        icon: Sparkles,
        label: 'Special',
        bar: 'bg-blue-500',
    },
    Status: {
        bg: 'bg-slate-500/15 text-slate-300 border-slate-500/30',
        icon: Shield,
        label: 'Status',
        bar: 'bg-slate-500',
    },
};

const ALL_TYPES = [
    'All',
    'Normal', 'Fire', 'Water', 'Grass', 'Electric', 'Ice',
    'Fighting', 'Poison', 'Ground', 'Flying', 'Psychic', 'Bug',
    'Rock', 'Ghost', 'Dragon', 'Steel', 'Dark', 'Fairy',
];

const ALL_SPLITS = ['All', 'Physical', 'Special', 'Status'];

const PAGE_SIZE_OPTIONS = [24, 48, 96, 192];

export default function MovesWiki() {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedType, setSelectedType] = useState('All');
    const [selectedSplit, setSelectedSplit] = useState('All');
    const [sortBy, setSortBy] = useState('id_asc');
    const [gen8Only, setGen8Only] = useState(false);
    const [viewMode, setViewMode] = useState('table'); // Default to Table / List view
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(48);

    const deferredSearch = useDeferredValue(searchQuery);

    // Convert raw JSON dictionary into an array of battle-standard moves (IDs 1 to 766)
    const rawMovesList = useMemo(() => {
        return Object.values(movesMeta)
            .filter((m) => m && Number(m.id) >= 1 && Number(m.id) <= 766)
            .map((m) => {
                const id = Number(m.id);
                const power = Number(m.power || 0);
                const accuracy = Number(m.accuracy || 0);
                const basePp = Number(m.base_pp || 0);
                const maxPp = Math.floor(basePp * 1.6);
                const isGen8 = id >= 678 && id <= 766;
                return {
                    ...m,
                    id,
                    power,
                    accuracy,
                    basePp,
                    maxPp,
                    isGen8,
                };
            });
    }, []);

    // Global Statistics
    const stats = useMemo(() => {
        let physical = 0;
        let special = 0;
        let status = 0;
        let gen8 = 0;
        rawMovesList.forEach((m) => {
            if (m.split === 'Physical') physical += 1;
            else if (m.split === 'Special') special += 1;
            else if (m.split === 'Status') status += 1;
            if (m.isGen8) gen8 += 1;
        });
        return { total: rawMovesList.length, physical, special, status, gen8 };
    }, [rawMovesList]);

    // Filtering & Sorting Pipeline
    const filteredMoves = useMemo(() => {
        const query = deferredSearch.trim().toLowerCase();
        let result = rawMovesList.filter((m) => {
            // Gen 8 filter
            if (gen8Only && !m.isGen8) return false;

            // Type filter
            if (selectedType !== 'All' && m.type !== selectedType) return false;

            // Split filter
            if (selectedSplit !== 'All' && m.split !== selectedSplit) return false;

            // Text search (by name, ID, or type)
            if (query) {
                const idStr = String(m.id);
                const nameStr = (m.name || '').toLowerCase();
                const typeStr = (m.type || '').toLowerCase();
                if (!nameStr.includes(query) && !idStr.includes(query) && !typeStr.includes(query)) {
                    return false;
                }
            }

            return true;
        });

        // Sorting
        result.sort((a, b) => {
            switch (sortBy) {
                case 'id_desc':
                    return b.id - a.id;
                case 'name_asc':
                    return a.name.localeCompare(b.name);
                case 'name_desc':
                    return b.name.localeCompare(a.name);
                case 'type_asc':
                    return a.type.localeCompare(b.type) || a.id - b.id;
                case 'type_desc':
                    return b.type.localeCompare(a.type) || a.id - b.id;
                case 'split_asc':
                    return a.split.localeCompare(b.split) || a.id - b.id;
                case 'split_desc':
                    return b.split.localeCompare(a.split) || a.id - b.id;
                case 'power_desc':
                    return b.power - a.power || b.id - a.id;
                case 'power_asc':
                    return a.power - b.power || a.id - b.id;
                case 'accuracy_desc':
                    return b.accuracy - a.accuracy || b.id - a.id;
                case 'accuracy_asc':
                    return a.accuracy - b.accuracy || a.id - b.id;
                case 'pp_desc':
                    return b.basePp - a.basePp || b.id - a.id;
                case 'pp_asc':
                    return a.basePp - b.basePp || a.id - b.id;
                case 'id_asc':
                default:
                    return a.id - b.id;
            }
        });

        return result;
    }, [rawMovesList, deferredSearch, selectedType, selectedSplit, gen8Only, sortBy]);

    // Pagination Calculation
    const totalPages = Math.ceil(filteredMoves.length / pageSize) || 1;
    const paginatedMoves = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filteredMoves.slice(start, start + pageSize);
    }, [filteredMoves, currentPage, pageSize]);

    const handleResetFilters = () => {
        setSearchQuery('');
        setSelectedType('All');
        setSelectedSplit('All');
        setGen8Only(false);
        setSortBy('id_asc');
        setCurrentPage(1);
    };

    // Header Sort Toggle Handler (asc -> desc -> off/id_asc)
    const handleHeaderSort = (colKey) => {
        setCurrentPage(1);
        switch (colKey) {
            case 'id':
                setSortBy((prev) => (prev === 'id_asc' ? 'id_desc' : 'id_asc'));
                break;
            case 'name':
                setSortBy((prev) => (prev === 'name_asc' ? 'name_desc' : prev === 'name_desc' ? 'id_asc' : 'name_asc'));
                break;
            case 'type':
                setSortBy((prev) => (prev === 'type_asc' ? 'type_desc' : prev === 'type_desc' ? 'id_asc' : 'type_asc'));
                break;
            case 'split':
                setSortBy((prev) => (prev === 'split_asc' ? 'split_desc' : prev === 'split_desc' ? 'id_asc' : 'split_asc'));
                break;
            case 'power':
                setSortBy((prev) => (prev === 'power_desc' ? 'power_asc' : prev === 'power_asc' ? 'id_asc' : 'power_desc'));
                break;
            case 'accuracy':
                setSortBy((prev) => (prev === 'accuracy_desc' ? 'accuracy_asc' : prev === 'accuracy_asc' ? 'id_asc' : 'accuracy_desc'));
                break;
            case 'pp':
                setSortBy((prev) => (prev === 'pp_desc' ? 'pp_asc' : prev === 'pp_asc' ? 'id_asc' : 'pp_desc'));
                break;
            default:
                setSortBy('id_asc');
        }
    };

    // Render Sort Indicator Icon
    const renderSortIcon = (colKey) => {
        let activeDirection = null; // 'asc' | 'desc' | null
        if (colKey === 'id') {
            activeDirection = sortBy === 'id_asc' ? 'asc' : sortBy === 'id_desc' ? 'desc' : null;
        } else if (colKey === 'name') {
            activeDirection = sortBy === 'name_asc' ? 'asc' : sortBy === 'name_desc' ? 'desc' : null;
        } else if (colKey === 'type') {
            activeDirection = sortBy === 'type_asc' ? 'asc' : sortBy === 'type_desc' ? 'desc' : null;
        } else if (colKey === 'split') {
            activeDirection = sortBy === 'split_asc' ? 'asc' : sortBy === 'split_desc' ? 'desc' : null;
        } else if (colKey === 'power') {
            activeDirection = sortBy === 'power_asc' ? 'asc' : sortBy === 'power_desc' ? 'desc' : null;
        } else if (colKey === 'accuracy') {
            activeDirection = sortBy === 'accuracy_asc' ? 'asc' : sortBy === 'accuracy_desc' ? 'desc' : null;
        } else if (colKey === 'pp') {
            activeDirection = sortBy === 'pp_asc' ? 'asc' : sortBy === 'pp_desc' ? 'desc' : null;
        }

        if (activeDirection === 'asc') {
            return <ArrowUp size={12} className="text-blue-400 shrink-0" />;
        }
        if (activeDirection === 'desc') {
            return <ArrowDown size={12} className="text-blue-400 shrink-0" />;
        }
        return <ArrowUpDown size={11} className="text-slate-600 group-hover/th:text-slate-400 shrink-0 transition-colors" />;
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-300 pb-12">
            {/* Header Hero Banner */}
            <div className="rounded-3xl border border-white/10 bg-gradient-to-r from-slate-900/90 via-indigo-950/40 to-slate-900/90 p-6 md:p-8 backdrop-blur-md shadow-2xl relative overflow-hidden">
                <div className="absolute -right-12 -top-12 w-64 h-64 rounded-full bg-blue-600/10 blur-3xl pointer-events-none" />
                <div className="absolute -left-12 -bottom-12 w-64 h-64 rounded-full bg-indigo-600/10 blur-3xl pointer-events-none" />

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                    <div className="space-y-2">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-400/20 text-blue-400 text-xs font-bold uppercase tracking-wider">
                            <Swords size={13} />
                            <span>Battle Moves Encyclopedia</span>
                        </div>
                        <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                            Pokémon Unbound Moves Wiki
                        </h1>
                        <p className="text-xs md:text-sm text-slate-400 max-w-2xl leading-relaxed">
                            Complete catalog of all 766 standard and Gen 8 / Hisui CFRU moves available in Pokémon Unbound. Inspect base power, accuracy, PP, damage categories, and type interactions.
                        </p>
                    </div>

                    {/* Stat Badges Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 shrink-0">
                        <div className="p-3 rounded-2xl bg-slate-900/80 border border-white/10 shadow-inner flex flex-col items-center justify-center min-w-[85px]">
                            <span className="text-[10px] uppercase font-bold text-slate-400">Total Moves</span>
                            <span className="text-lg font-black text-white">{stats.total}</span>
                        </div>
                        <div className="p-3 rounded-2xl bg-red-950/40 border border-red-500/20 shadow-inner flex flex-col items-center justify-center min-w-[85px]">
                            <span className="text-[10px] uppercase font-bold text-red-400 flex items-center gap-1">
                                <Swords size={11} /> Physical
                            </span>
                            <span className="text-lg font-black text-red-200">{stats.physical}</span>
                        </div>
                        <div className="p-3 rounded-2xl bg-blue-950/40 border border-blue-500/20 shadow-inner flex flex-col items-center justify-center min-w-[85px]">
                            <span className="text-[10px] uppercase font-bold text-blue-400 flex items-center gap-1">
                                <Sparkles size={11} /> Special
                            </span>
                            <span className="text-lg font-black text-blue-200">{stats.special}</span>
                        </div>
                        <div className="p-3 rounded-2xl bg-emerald-950/40 border border-emerald-500/20 shadow-inner flex flex-col items-center justify-center min-w-[85px]">
                            <span className="text-[10px] uppercase font-bold text-emerald-400 flex items-center gap-1">
                                <Star size={11} /> Gen 8 / CFRU
                            </span>
                            <span className="text-lg font-black text-emerald-200">{stats.gen8}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filter and Control Panel */}
            <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4 md:p-5 backdrop-blur-md shadow-lg space-y-4">
                {/* Search Bar + Quick Toggles */}
                <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
                    {/* Search Input */}
                    <div className="relative flex-1 min-w-[240px]">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setCurrentPage(1);
                            }}
                            placeholder="Search by move name, ID (#758), or type (e.g. Fighting)..."
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-800/90 border border-white/10 text-white placeholder-slate-500 text-xs md:text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => setSearchQuery('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs font-bold px-1.5 py-0.5 rounded cursor-pointer"
                            >
                                ✕
                            </button>
                        )}
                    </div>

                    {/* Gen 8 Only Toggle + Sort + View Mode */}
                    <div className="flex flex-wrap items-center gap-2">
                        {/* Gen 8 Toggle */}
                        <button
                            type="button"
                            onClick={() => {
                                setGen8Only((prev) => !prev);
                                setCurrentPage(1);
                            }}
                            className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
                                gen8Only
                                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-600/20'
                                    : 'bg-slate-800/80 text-slate-300 border-white/10 hover:bg-slate-700 hover:text-white'
                            }`}
                        >
                            <Star size={13} className={gen8Only ? 'text-yellow-300 fill-yellow-300' : ''} />
                            <span>Gen 8+ / CFRU Only</span>
                        </button>

                        {/* Sort Dropdown */}
                        <div className="relative">
                            <select
                                value={sortBy}
                                onChange={(e) => {
                                    setSortBy(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="appearance-none pl-8 pr-8 py-2 rounded-xl bg-slate-800/90 border border-white/10 text-slate-200 text-xs font-bold focus:outline-none focus:border-blue-500 cursor-pointer"
                            >
                                <option value="id_asc">Sort: ID (1 → 766)</option>
                                <option value="id_desc">Sort: ID (766 → 1)</option>
                                <option value="name_asc">Sort: Name (A → Z)</option>
                                <option value="name_desc">Sort: Name (Z → A)</option>
                                <option value="type_asc">Sort: Type (A → Z)</option>
                                <option value="type_desc">Sort: Type (Z → A)</option>
                                <option value="split_asc">Sort: Category (A → Z)</option>
                                <option value="split_desc">Sort: Category (Z → A)</option>
                                <option value="power_desc">Sort: Power (High → Low)</option>
                                <option value="power_asc">Sort: Power (Low → High)</option>
                                <option value="accuracy_desc">Sort: Accuracy (High → Low)</option>
                                <option value="accuracy_asc">Sort: Accuracy (Low → High)</option>
                                <option value="pp_desc">Sort: PP (High → Low)</option>
                                <option value="pp_asc">Sort: PP (Low → High)</option>
                            </select>
                            <ArrowUpDown size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        </div>

                        {/* View Mode Toggle */}
                        <div className="flex rounded-xl bg-slate-800/90 border border-white/10 p-0.5">
                            <button
                                type="button"
                                onClick={() => setViewMode('table')}
                                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                    viewMode === 'table' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                                }`}
                                title="List / Table View"
                            >
                                <List size={15} />
                            </button>
                            <button
                                type="button"
                                onClick={() => setViewMode('grid')}
                                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                    viewMode === 'grid' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                                }`}
                                title="Grid Cards View"
                            >
                                <LayoutGrid size={15} />
                            </button>
                        </div>

                        {/* Reset Filters */}
                        {(searchQuery || selectedType !== 'All' || selectedSplit !== 'All' || gen8Only || sortBy !== 'id_asc') && (
                            <button
                                type="button"
                                onClick={handleResetFilters}
                                className="p-2 rounded-xl bg-slate-800 border border-white/10 text-slate-400 hover:text-rose-400 hover:border-rose-500/30 transition-colors cursor-pointer"
                                title="Reset all filters"
                            >
                                <RotateCcw size={14} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Category & Type Filter Chips */}
                <div className="space-y-2.5 pt-2 border-t border-white/5">
                    {/* Category Filter Pills */}
                    <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[11px] font-bold text-slate-400 mr-1.5 uppercase tracking-wider">
                            Category:
                        </span>
                        {ALL_SPLITS.map((split) => {
                            const isSelected = selectedSplit === split;
                            const splitStyle = SPLIT_STYLES[split];
                            const Icon = splitStyle?.icon;
                            return (
                                <button
                                    key={split}
                                    type="button"
                                    onClick={() => {
                                        setSelectedSplit(split);
                                        setCurrentPage(1);
                                    }}
                                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all border flex items-center gap-1 cursor-pointer ${
                                        isSelected
                                            ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                                            : 'bg-slate-800/60 text-slate-400 border-white/5 hover:bg-slate-800 hover:text-slate-200'
                                    }`}
                                >
                                    {Icon && <Icon size={12} />}
                                    <span>{split}</span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Type Filter Chips */}
                    <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[11px] font-bold text-slate-400 mr-1.5 uppercase tracking-wider">
                            Type:
                        </span>
                        {ALL_TYPES.map((type) => {
                            const isSelected = selectedType === type;
                            const typeStyle = TYPE_STYLES[type];
                            return (
                                <button
                                    key={type}
                                    type="button"
                                    onClick={() => {
                                        setSelectedType(type);
                                        setCurrentPage(1);
                                    }}
                                    className={`px-2.5 py-0.5 rounded-lg text-[11px] font-bold transition-all border cursor-pointer ${
                                        isSelected
                                            ? type === 'All'
                                                ? 'bg-blue-600 text-white border-blue-500'
                                                : `${typeStyle?.bg} ${typeStyle?.text} ${typeStyle?.border} ring-1 ring-white/30 font-black`
                                            : 'bg-slate-800/40 text-slate-400 border-white/5 hover:bg-slate-800 hover:text-slate-200'
                                    }`}
                                >
                                    {type}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Results Counter & Pagination Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-400 px-1">
                <div>
                    Showing <span className="font-bold text-white">{filteredMoves.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}</span>–
                    <span className="font-bold text-white">{Math.min(currentPage * pageSize, filteredMoves.length)}</span> of{' '}
                    <span className="font-bold text-white">{filteredMoves.length}</span> moves
                    {filteredMoves.length !== rawMovesList.length && (
                        <span className="text-slate-500 ml-1">(filtered from {rawMovesList.length})</span>
                    )}
                </div>

                <div className="flex items-center gap-3">
                    {/* Page Size Selector */}
                    <div className="flex items-center gap-1.5">
                        <span className="text-[11px] text-slate-500">Per page:</span>
                        <select
                            value={pageSize}
                            onChange={(e) => {
                                setPageSize(Number(e.target.value));
                                setCurrentPage(1);
                            }}
                            className="bg-slate-800 border border-white/10 text-slate-300 text-xs rounded-lg px-2 py-1 focus:outline-none cursor-pointer"
                        >
                            {PAGE_SIZE_OPTIONS.map((size) => (
                                <option key={size} value={size}>
                                    {size}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Pagination Buttons */}
                    {totalPages > 1 && (
                        <div className="flex items-center gap-1">
                            <button
                                type="button"
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                className="p-1.5 rounded-lg bg-slate-800 border border-white/10 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-700 cursor-pointer"
                            >
                                <ChevronLeft size={14} />
                            </button>
                            <span className="px-2 font-mono font-bold text-slate-200">
                                {currentPage} / {totalPages}
                            </span>
                            <button
                                type="button"
                                disabled={currentPage === totalPages}
                                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                className="p-1.5 rounded-lg bg-slate-800 border border-white/10 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-700 cursor-pointer"
                            >
                                <ChevronRight size={14} />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Main Content Area */}
            {filteredMoves.length === 0 ? (
                /* Empty Results State */
                <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-12 text-center backdrop-blur-md space-y-4">
                    <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-white/10 flex items-center justify-center mx-auto text-slate-400">
                        <Filter size={24} />
                    </div>
                    <div className="space-y-1">
                        <h3 className="text-base font-bold text-white">No moves match your search criteria</h3>
                        <p className="text-xs text-slate-400 max-w-sm mx-auto">
                            Try adjusting your filters, clearing the search query, or resetting to default settings.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={handleResetFilters}
                        className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-500/20 cursor-pointer"
                    >
                        Reset All Filters
                    </button>
                </div>
            ) : viewMode === 'table' ? (
                /* Compact Table View (Default) */
                <div className="rounded-2xl border border-white/10 bg-slate-900/80 backdrop-blur-md overflow-hidden shadow-xl">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                            <thead>
                                <tr className="border-b border-white/10 bg-slate-950/80 text-slate-400 uppercase text-[10px] font-black tracking-wider select-none">
                                    {/* Sortable ID Column */}
                                    <th
                                        onClick={() => handleHeaderSort('id')}
                                        className="py-3.5 px-4 w-20 cursor-pointer hover:bg-white/5 hover:text-white transition-colors group/th"
                                        title="Click to sort by ID"
                                    >
                                        <div className="flex items-center gap-1.5">
                                            <span>#</span>
                                            {renderSortIcon('id')}
                                        </div>
                                    </th>

                                    {/* Sortable Move Name Column */}
                                    <th
                                        onClick={() => handleHeaderSort('name')}
                                        className="py-3.5 px-4 cursor-pointer hover:bg-white/5 hover:text-white transition-colors group/th"
                                        title="Click to sort by Move Name"
                                    >
                                        <div className="flex items-center gap-1.5">
                                            <span>Move Name</span>
                                            {renderSortIcon('name')}
                                        </div>
                                    </th>

                                    {/* Sortable Type Column */}
                                    <th
                                        onClick={() => handleHeaderSort('type')}
                                        className="py-3.5 px-4 w-28 cursor-pointer hover:bg-white/5 hover:text-white transition-colors group/th"
                                        title="Click to sort by Type"
                                    >
                                        <div className="flex items-center gap-1.5">
                                            <span>Type</span>
                                            {renderSortIcon('type')}
                                        </div>
                                    </th>

                                    {/* Sortable Category Split Column */}
                                    <th
                                        onClick={() => handleHeaderSort('split')}
                                        className="py-3.5 px-4 w-32 cursor-pointer hover:bg-white/5 hover:text-white transition-colors group/th"
                                        title="Click to sort by Category"
                                    >
                                        <div className="flex items-center gap-1.5">
                                            <span>Category</span>
                                            {renderSortIcon('split')}
                                        </div>
                                    </th>

                                    {/* Sortable Power Column */}
                                    <th
                                        onClick={() => handleHeaderSort('power')}
                                        className="py-3.5 px-4 w-28 text-right cursor-pointer hover:bg-white/5 hover:text-white transition-colors group/th"
                                        title="Click to sort by Power"
                                    >
                                        <div className="flex items-center justify-end gap-1.5">
                                            <span>Power</span>
                                            {renderSortIcon('power')}
                                        </div>
                                    </th>

                                    {/* Sortable Accuracy Column */}
                                    <th
                                        onClick={() => handleHeaderSort('accuracy')}
                                        className="py-3.5 px-4 w-28 text-right cursor-pointer hover:bg-white/5 hover:text-white transition-colors group/th"
                                        title="Click to sort by Accuracy"
                                    >
                                        <div className="flex items-center justify-end gap-1.5">
                                            <span>Accuracy</span>
                                            {renderSortIcon('accuracy')}
                                        </div>
                                    </th>

                                    {/* Sortable PP Column */}
                                    <th
                                        onClick={() => handleHeaderSort('pp')}
                                        className="py-3.5 px-4 w-32 text-right cursor-pointer hover:bg-white/5 hover:text-white transition-colors group/th"
                                        title="Click to sort by PP"
                                    >
                                        <div className="flex items-center justify-end gap-1.5">
                                            <span>Base / Max PP</span>
                                            {renderSortIcon('pp')}
                                        </div>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 font-medium">
                                {paginatedMoves.map((move) => {
                                    const typeStyle = TYPE_STYLES[move.type] || TYPE_STYLES.Normal;
                                    const splitStyle = SPLIT_STYLES[move.split] || SPLIT_STYLES.Status;
                                    const SplitIcon = splitStyle.icon;

                                    return (
                                        <tr
                                            key={move.id}
                                            className="hover:bg-slate-800/60 transition-colors group"
                                        >
                                            <td className="py-3 px-4 font-mono font-bold text-slate-500">
                                                #{String(move.id).padStart(3, '0')}
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-white group-hover:text-blue-300 transition-colors text-[13px]">
                                                        {move.name}
                                                    </span>
                                                    {move.isGen8 && (
                                                        <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                                            Gen 8
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="py-3 px-4">
                                                <span
                                                    className={`inline-block text-[10px] font-extrabold uppercase px-2 py-0.5 rounded border ${typeStyle.bg} ${typeStyle.text} ${typeStyle.border}`}
                                                >
                                                    {move.type}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4">
                                                <span
                                                    className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded border ${splitStyle.bg}`}
                                                >
                                                    <SplitIcon size={11} />
                                                    <span>{move.split}</span>
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-right font-mono font-black text-white text-[13px]">
                                                {move.power > 0 ? move.power : <span className="text-slate-500 font-normal">—</span>}
                                            </td>
                                            <td className="py-3 px-4 text-right font-mono text-slate-300">
                                                {move.accuracy > 0 ? (
                                                    `${move.accuracy}%`
                                                ) : (
                                                    <span className="text-emerald-400 text-[10px] font-bold">Can't Miss</span>
                                                )}
                                            </td>
                                            <td className="py-3 px-4 text-right font-mono text-slate-300">
                                                <span className="text-white font-bold">{move.basePp}</span>
                                                <span className="text-slate-500 mx-1">/</span>
                                                <span className="text-amber-400 font-bold">{move.maxPp} PP</span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                /* Grid Card View */
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
                    {paginatedMoves.map((move) => {
                        const typeStyle = TYPE_STYLES[move.type] || TYPE_STYLES.Normal;
                        const splitStyle = SPLIT_STYLES[move.split] || SPLIT_STYLES.Status;
                        const SplitIcon = splitStyle.icon;
                        const powerPercent = Math.min(100, Math.round(((move.power || 0) / 150) * 100));

                        return (
                            <div
                                key={move.id}
                                className="group rounded-2xl border border-white/10 bg-slate-900/80 hover:bg-slate-800/90 hover:border-blue-500/40 p-4 transition-all duration-200 shadow-md hover:shadow-xl hover:shadow-blue-500/5 flex flex-col justify-between space-y-3 relative overflow-hidden"
                            >
                                {/* Top Badges */}
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex items-center gap-1.5">
                                        <span className="font-mono text-[11px] font-bold text-slate-500 bg-slate-950/60 px-1.5 py-0.5 rounded border border-white/5">
                                            #{String(move.id).padStart(3, '0')}
                                        </span>
                                        {move.isGen8 && (
                                            <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                                Gen 8
                                            </span>
                                        )}
                                    </div>

                                    {/* Type Badge */}
                                    <span
                                        className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md border ${typeStyle.bg} ${typeStyle.text} ${typeStyle.border}`}
                                    >
                                        {move.type}
                                    </span>
                                </div>

                                {/* Move Name & Split */}
                                <div>
                                    <h3 className="text-sm font-black text-white group-hover:text-blue-300 transition-colors tracking-tight truncate">
                                        {move.name}
                                    </h3>
                                    <div className="flex items-center gap-1.5 mt-1.5">
                                        <span
                                            className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md border ${splitStyle.bg}`}
                                        >
                                            <SplitIcon size={11} />
                                            <span>{move.split}</span>
                                        </span>
                                    </div>
                                </div>

                                {/* Stats Matrix */}
                                <div className="pt-2 border-t border-white/5 space-y-2 text-xs">
                                    {/* Power Bar */}
                                    <div className="flex items-center justify-between">
                                        <span className="text-[11px] text-slate-400 font-medium">Power</span>
                                        <div className="flex items-center gap-2">
                                            {move.power > 0 ? (
                                                <>
                                                    <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden border border-white/5">
                                                        <div
                                                            className={`h-full ${splitStyle.bar}`}
                                                            style={{ width: `${powerPercent}%` }}
                                                        />
                                                    </div>
                                                    <span className="font-mono font-black text-white w-7 text-right">
                                                        {move.power}
                                                    </span>
                                                </>
                                            ) : (
                                                <span className="font-mono text-slate-500 font-bold">—</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Accuracy */}
                                    <div className="flex items-center justify-between">
                                        <span className="text-[11px] text-slate-400 font-medium">Accuracy</span>
                                        <span className="font-mono font-bold text-slate-200">
                                            {move.accuracy > 0 ? `${move.accuracy}%` : <span className="text-emerald-400 text-[10px] font-bold">Can't Miss</span>}
                                        </span>
                                    </div>

                                    {/* PP */}
                                    <div className="flex items-center justify-between">
                                        <span className="text-[11px] text-slate-400 font-medium">PP (Base / Max)</span>
                                        <span className="font-mono font-bold text-slate-300 text-[11px]">
                                            <span className="text-white font-bold">{move.basePp}</span>
                                            <span className="text-slate-500 mx-1">/</span>
                                            <span className="text-amber-400">{move.maxPp} PP</span>
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Bottom Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-4">
                    <button
                        type="button"
                        disabled={currentPage === 1}
                        onClick={() => {
                            setCurrentPage((p) => Math.max(1, p - 1));
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 border border-white/10 text-slate-300 text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-700 cursor-pointer"
                    >
                        Previous
                    </button>
                    <span className="px-3 text-xs font-mono font-bold text-slate-400">
                        Page {currentPage} of {totalPages}
                    </span>
                    <button
                        type="button"
                        disabled={currentPage === totalPages}
                        onClick={() => {
                            setCurrentPage((p) => Math.min(totalPages, p + 1));
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 border border-white/10 text-slate-300 text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-700 cursor-pointer"
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
}
