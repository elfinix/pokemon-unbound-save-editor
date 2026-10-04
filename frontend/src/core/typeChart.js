export const POKEMON_TYPES = [
    'Normal',
    'Fire',
    'Water',
    'Electric',
    'Grass',
    'Ice',
    'Fighting',
    'Poison',
    'Ground',
    'Flying',
    'Psychic',
    'Bug',
    'Rock',
    'Ghost',
    'Dragon',
    'Dark',
    'Steel',
    'Fairy',
];

export const TYPE_CHART = {
    Normal: { Rock: 0.5, Ghost: 0, Steel: 0.5 },
    Fire: { Fire: 0.5, Water: 0.5, Grass: 2, Ice: 2, Bug: 2, Rock: 0.5, Dragon: 0.5, Steel: 2 },
    Water: { Fire: 2, Water: 0.5, Grass: 0.5, Ground: 2, Rock: 2, Dragon: 0.5 },
    Electric: { Water: 2, Electric: 0.5, Grass: 0.5, Ground: 0, Flying: 2, Dragon: 0.5 },
    Grass: { Fire: 0.5, Water: 2, Grass: 0.5, Poison: 0.5, Ground: 2, Flying: 0.5, Bug: 0.5, Rock: 2, Dragon: 0.5, Steel: 0.5 },
    Ice: { Fire: 0.5, Water: 0.5, Grass: 2, Ice: 0.5, Ground: 2, Flying: 2, Dragon: 2, Steel: 0.5 },
    Fighting: { Normal: 2, Ice: 2, Poison: 0.5, Flying: 0.5, Psychic: 0.5, Bug: 0.5, Rock: 2, Ghost: 0, Dark: 2, Steel: 2, Fairy: 0.5 },
    Poison: { Grass: 2, Poison: 0.5, Ground: 0.5, Rock: 0.5, Ghost: 0.5, Steel: 0, Fairy: 2 },
    Ground: { Fire: 2, Electric: 2, Grass: 0.5, Poison: 2, Flying: 0, Bug: 0.5, Rock: 2, Steel: 2 },
    Flying: { Electric: 0.5, Grass: 2, Fighting: 2, Bug: 2, Rock: 0.5, Steel: 0.5 },
    Psychic: { Fighting: 2, Poison: 2, Psychic: 0.5, Dark: 0, Steel: 0.5 },
    Bug: { Fire: 0.5, Grass: 2, Fighting: 0.5, Poison: 0.5, Flying: 0.5, Psychic: 2, Ghost: 0.5, Dark: 2, Steel: 0.5, Fairy: 0.5 },
    Rock: { Fire: 2, Ice: 2, Fighting: 0.5, Ground: 0.5, Flying: 2, Bug: 2, Steel: 0.5 },
    Ghost: { Normal: 0, Psychic: 2, Ghost: 2, Dark: 0.5 },
    Dragon: { Dragon: 2, Steel: 0.5, Fairy: 0 },
    Dark: { Fighting: 0.5, Psychic: 2, Ghost: 2, Dark: 0.5, Fairy: 0.5 },
    Steel: { Fire: 0.5, Water: 0.5, Electric: 0.5, Ice: 2, Rock: 2, Steel: 0.5, Fairy: 2 },
    Fairy: { Fire: 0.5, Fighting: 2, Poison: 0.5, Dragon: 2, Dark: 2, Steel: 0.5 },
};

export function getSingleTypeMultiplier(attackerType, defenderType) {
    if (!attackerType || !defenderType) return 1;
    return TYPE_CHART[attackerType]?.[defenderType] ?? 1;
}

export function getDefensiveMultiplier(attackerType, defenderTypes = []) {
    if (!defenderTypes || defenderTypes.length === 0) return 1;
    let mult = 1;
    for (const dType of defenderTypes) {
        mult *= getSingleTypeMultiplier(attackerType, dType);
    }
    return mult;
}

export const TYPE_BADGE_STYLES = {
    Normal: { bg: 'bg-[#6b7280]', text: 'text-white', border: 'border-[#858b97]' },
    Fire: { bg: 'bg-[#dc2626]', text: 'text-white', border: 'border-[#ef4444]' },
    Water: { bg: 'bg-[#2563eb]', text: 'text-white', border: 'border-[#3b82f6]' },
    Electric: { bg: 'bg-[#c88200]', text: 'text-white', border: 'border-[#d97706]' },
    Grass: { bg: 'bg-[#16a34a]', text: 'text-white', border: 'border-[#22c55e]' },
    Ice: { bg: 'bg-[#0284c7]', text: 'text-white', border: 'border-[#0ea5e9]' },
    Fighting: { bg: 'bg-[#c2410c]', text: 'text-white', border: 'border-[#ea580c]' },
    Poison: { bg: 'bg-[#9333ea]', text: 'text-white', border: 'border-[#a855f7]' },
    Ground: { bg: 'bg-[#9a602a]', text: 'text-white', border: 'border-[#b47133]' },
    Flying: { bg: 'bg-[#4f78bd]', text: 'text-white', border: 'border-[#6891d4]' },
    Psychic: { bg: 'bg-[#db2777]', text: 'text-white', border: 'border-[#ec4899]' },
    Bug: { bg: 'bg-[#65a30d]', text: 'text-white', border: 'border-[#84cc16]' },
    Rock: { bg: 'bg-[#786b4f]', text: 'text-white', border: 'border-[#918362]' },
    Ghost: { bg: 'bg-[#6b467e]', text: 'text-white', border: 'border-[#875b9f]' },
    Dragon: { bg: 'bg-[#4f46e5]', text: 'text-white', border: 'border-[#6366f1]' },
    Dark: { bg: 'bg-[#4b3f3d]', text: 'text-white', border: 'border-[#665754]' },
    Steel: { bg: 'bg-[#4a6b7c]', text: 'text-white', border: 'border-[#5f8497]' },
    Fairy: { bg: 'bg-[#c026d3]', text: 'text-white', border: 'border-[#d946ef]' },
};

