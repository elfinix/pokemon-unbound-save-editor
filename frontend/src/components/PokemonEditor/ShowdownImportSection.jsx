import React from 'react';

export const ShowdownImportSection = ({
    showImport,
    setImportText,
    setSetImportText,
    setImportErrors,
    setSetImportErrors,
    setImportWarnings,
    setSetImportWarnings,
    applyShowdownImport,
}) => {
    if (!showImport) return null;

    return (
        <div className="mb-6 bg-slate-800/40 p-4 rounded-2xl border border-white/5 space-y-3">
            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Smogon/Showdown Import</h4>
            <textarea
                value={setImportText}
                onChange={(e) => setSetImportText(e.target.value)}
                placeholder="Terrakion @ Choice Band\nAbility: Justified\nEVs: 252 Atk / 4 SpD / 252 Spe\nJolly Nature\n- Stone Edge\n- Close Combat\n- Earthquake\n- Quick Attack"
                className="w-full h-36 bg-slate-900 border border-white/10 rounded-xl p-3 text-xs font-mono outline-none focus:border-blue-500/50"
            />
            <div className="flex flex-wrap gap-2">
                <button
                    type="button"
                    onClick={applyShowdownImport}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors cursor-pointer"
                >
                    Parse & Apply to Editor
                </button>
                <button
                    type="button"
                    onClick={() => {
                        setSetImportText('');
                        setSetImportErrors([]);
                        setSetImportWarnings([]);
                    }}
                    className="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-xs font-bold transition-colors cursor-pointer"
                >
                    Clear
                </button>
            </div>
            {setImportErrors.length > 0 && (
                <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-[11px] text-rose-200 space-y-1">
                    {setImportErrors.map((msg, idx) => (
                        <p key={`${msg}-${idx}`}>- {msg}</p>
                    ))}
                </div>
            )}
            {setImportWarnings.length > 0 && (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[11px] text-amber-200 space-y-1">
                    {setImportWarnings.map((msg, idx) => (
                        <p key={`${msg}-${idx}`}>- {msg}</p>
                    ))}
                </div>
            )}
        </div>
    );
};
