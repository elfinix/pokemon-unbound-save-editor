export const TYPE_STYLES = {
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

export const TYPE_ABBR = {
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

export const EV_STAT_MAX = 252;
export const EV_TOTAL_MAX = 510;
export const MIN_LEVEL = 1;
export const MAX_LEVEL = 100;

export const clampNumber = (value, min, max) => {
    const parsed = Number.parseInt(value, 10);
    if (!Number.isFinite(parsed)) return min;
    return Math.max(min, Math.min(max, parsed));
};

export const getSpeedStatValue = (stats = {}) =>
    Number(stats.Spd ?? stats.Spe ?? 0);

export const getTotalEvs = (evs = {}) =>
    Number(evs.HP ?? 0) +
    Number(evs.Atk ?? 0) +
    Number(evs.Def ?? 0) +
    Number(evs.SpA ?? 0) +
    Number(evs.SpD ?? 0) +
    getSpeedStatValue(evs);

export const hasKnownItemName = (name) => {
    if (!name) return false;
    const low = name.toLowerCase();
    return !low.startsWith('item ') && !low.startsWith('id ') && name !== '--- EMPTY ---';
};

export const SAFE_IMPORT_NOTE =
    'Existing Pokemon import applies item, moves, IVs, EVs, nature, and ability (if valid). Species, level, and identity metadata are preserved.';
