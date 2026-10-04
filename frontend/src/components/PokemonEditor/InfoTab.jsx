import React from 'react';
import { Search } from 'lucide-react';
import PokedexFlagsControls from '../PokedexFlagsControls.jsx';
import { POKEMON_ICON_FALLBACK_URL } from '../../core/iconResolver.js';
import { clampNumber } from './constants.js';

export const InfoTab = ({
    client,
    localPk,
    setLocalPk,
    speciesSearch,
    setSpeciesSearch,
    allSpecies,
    currentSpeciesName,
    applySpeciesSelection,
    renameOnSpeciesChange,
    setRenameOnSpeciesChange,
    showToast,
}) => {
    return (
        <div className="space-y-4 animate-in slide-in-from-right-4 duration-200">
            {/* Nickname */}
            <div className="bg-slate-800/40 p-4 sm:p-5 rounded-2xl border border-white/5 space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block text-center">
                    Nickname
                </label>
                <input
                    type="text"
                    maxLength={10}
                    value={localPk.nickname || ''}
                    onChange={(e) => setLocalPk({ ...localPk, nickname: e.target.value })}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl py-2.5 px-4 text-sm outline-none focus:border-blue-500/50 text-slate-100"
                    placeholder="Nickname (max 10 chars)"
                />
                <p className="text-[10px] text-slate-500 text-center">Clear this field to restore the species name (max 10 chars).</p>
            </div>

            {/* Species */}
            <div className="bg-slate-800/40 p-4 sm:p-5 rounded-2xl border border-white/5 space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block text-center">
                    Species
                </label>

                <div className="relative">
                    <Search className="absolute left-3 top-2.5 text-slate-500" size={14} />
                    <input
                        type="text"
                        placeholder="Search species (e.g. 'Garchomp' or ID...)"
                        value={speciesSearch}
                        onChange={(e) => setSpeciesSearch(e.target.value)}
                        className="w-full bg-slate-900 border border-white/10 rounded-xl py-2 pl-9 pr-4 text-sm outline-none focus:border-blue-500/50 text-slate-100"
                    />
                </div>

                {speciesSearch.length > 1 ? (
                    <div className="max-h-48 overflow-y-auto bg-slate-900 rounded-xl border border-blue-500/30 divide-y divide-white/5">
                        {allSpecies
                            .filter(species => {
                                const q = speciesSearch.toLowerCase();
                                return (
                                    (species.label || '').toLowerCase().includes(q) ||
                                    (species.name || '').toLowerCase().includes(q) ||
                                    species.id.toString() === speciesSearch
                                );
                            })
                            .slice(0, 15)
                            .map(species => (
                                <button
                                    key={species.id}
                                    type="button"
                                    onClick={() => applySpeciesSelection(species)}
                                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-blue-600 transition-colors flex justify-between items-center group cursor-pointer"
                                >
                                    <span className="group-hover:text-white">{species.label || species.name}</span>
                                    <span className="text-blue-400 font-mono text-[10px] bg-blue-500/10 px-2 py-0.5 rounded">ID {species.id}</span>
                                </button>
                            ))
                        }
                    </div>
                ) : (
                    <div className="flex justify-between items-center bg-slate-900/50 p-3 rounded-xl border border-blue-500/20">
                        <div className="flex flex-col">
                            <span className="text-[10px] text-slate-500 uppercase font-black">Current Species</span>
                            <span className="text-blue-400 font-bold text-sm">
                                {currentSpeciesName}
                            </span>
                        </div>
                        <div className="w-9 h-9 bg-slate-800/80 rounded-lg flex items-center justify-center border border-white/10 overflow-hidden shrink-0">
                            <img
                                src={client.getPokemonIconUrl(localPk.species_id)}
                                alt={currentSpeciesName}
                                className="w-7 h-7 object-contain pixelated"
                                onError={(e) => {
                                    if (e.currentTarget.src !== POKEMON_ICON_FALLBACK_URL) {
                                        e.currentTarget.src = POKEMON_ICON_FALLBACK_URL;
                                    }
                                }}
                            />
                        </div>
                    </div>
                )}

                <label className="flex items-center gap-2 text-[11px] text-slate-400 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={renameOnSpeciesChange}
                        onChange={(e) => setRenameOnSpeciesChange(e.target.checked)}
                        className="accent-blue-500 cursor-pointer"
                    />
                    Rename nickname to selected species when changing species
                </label>
            </div>

            {/* Pokédex Flags */}
            <div className="bg-slate-800/40 p-4 sm:p-5 rounded-2xl border border-white/5 space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block text-center">
                    Pokédex Flags
                </label>
                <PokedexFlagsControls
                    client={client}
                    speciesId={localPk.species_id}
                    speciesLabel={currentSpeciesName}
                    showToast={showToast}
                />
            </div>

            {/* Identity (Shiny & Gender) */}
            <div className="bg-slate-800/40 p-4 sm:p-5 rounded-2xl border border-white/5 space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block text-center">
                    Identity (Shiny & Gender)
                </label>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-slate-900/70 border border-white/10 rounded-xl p-3 space-y-2">
                        <p className="text-[10px] uppercase font-black text-slate-500">Shiny</p>
                        <button
                            type="button"
                            onClick={() => setLocalPk({ ...localPk, is_shiny: !localPk.is_shiny })}
                            className={`w-full py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${localPk.is_shiny ? 'bg-amber-500/80 text-slate-950' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
                        >
                            {localPk.is_shiny ? 'Shiny Enabled' : 'Standard Palette'}
                        </button>
                    </div>

                    <div className="bg-slate-900/70 border border-white/10 rounded-xl p-3 space-y-2">
                        <p className="text-[10px] uppercase font-black text-slate-500">Gender</p>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => setLocalPk({ ...localPk, gender: 'male' })}
                                disabled={localPk.gender_mode !== 'dynamic'}
                                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${localPk.gender === 'male' ? 'bg-sky-500 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'} disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                                Male
                            </button>
                            <button
                                type="button"
                                onClick={() => setLocalPk({ ...localPk, gender: 'female' })}
                                disabled={localPk.gender_mode !== 'dynamic'}
                                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${localPk.gender === 'female' ? 'bg-rose-500 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'} disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                                Female
                            </button>
                        </div>
                        {localPk.gender_mode !== 'dynamic' && (
                            <p className="text-[10px] text-slate-500">
                                {localPk.gender_mode === 'genderless'
                                    ? 'This species is genderless.'
                                    : localPk.gender_mode === 'fixed_male'
                                        ? 'This species is male-only.'
                                        : localPk.gender_mode === 'fixed_female'
                                            ? 'This species is female-only.'
                                            : 'Gender metadata unavailable for this species.'}
                            </p>
                        )}
                    </div>
                </div>

                <div className="rounded-xl border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-[10px] text-amber-200">
                    Identity edits rewrite PID. Nature and standard ability slot are preserved where possible.
                </div>
            </div>

            {/* Happiness */}
            <div className="bg-slate-800/40 p-4 sm:p-5 rounded-2xl border border-white/5 space-y-2.5">
                <label htmlFor="pokemon-happiness" className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">
                    Happiness (0–255)
                </label>
                <input
                    id="pokemon-happiness"
                    type="number"
                    min="0"
                    max="255"
                    step="1"
                    value={localPk.happiness ?? 70}
                    onChange={(event) => setLocalPk((prev) => ({
                        ...prev,
                        happiness: clampNumber(event.target.value, 0, 255),
                    }))}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500/50 text-slate-100"
                />
                <p className="text-[10px] text-slate-400">Friendship evolutions use this value.</p>
            </div>
        </div>
    );
};
