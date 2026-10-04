import React from 'react';
import { Zap } from 'lucide-react';
import { PkHexMoveRow } from './PkHexMoveRow.jsx';

export const MovesTab = ({
    localPk,
    allMoves,
    movesMeta,
    setMaxAllPp,
    updateMove,
    updateMovePp,
    updateMovePpUps,
    setMoveMaxPp,
    isPcMon,
}) => {
    return (
        <div className="space-y-4">
            <section className="bg-slate-800/40 p-4 sm:p-5 rounded-2xl border border-white/5 space-y-4">
                <div className="flex items-center justify-between border-b border-white/5 pb-3">
                    <div>
                        <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Current Moves</h4>
                        <p className="text-[10px] text-slate-400 mt-0.5">Select up to 4 moves, edit PP, and assign PP Ups (0-3).</p>
                    </div>
                    <button
                        type="button"
                        onClick={setMaxAllPp}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold uppercase tracking-wider shadow-sm transition-all active:scale-95 cursor-pointer"
                    >
                        <Zap size={12} /> Max All PP
                    </button>
                </div>

                <div className="space-y-3">
                    {[0, 1, 2, 3].map((slotIdx) => (
                        <PkHexMoveRow
                            key={slotIdx}
                            slotIndex={slotIdx}
                            moveId={Number(localPk.moves?.[slotIdx] || 0)}
                            movePp={Number(localPk.move_pp?.[slotIdx] || 0)}
                            movePpUp={Number(localPk.move_pp_ups?.[slotIdx] || 0)}
                            allMoves={allMoves}
                            movesMeta={movesMeta}
                            onMoveChange={updateMove}
                            onPpChange={updateMovePp}
                            onPpUpChange={updateMovePpUps}
                            onMaxPp={setMoveMaxPp}
                            isPcMon={isPcMon}
                        />
                    ))}
                </div>

                {isPcMon && (
                    <p className="text-[10px] text-slate-400 italic pt-1">
                        PC boxes preserve PP Ups (maximum usable PP). Current PP is automatically restored when withdrawn into your party.
                    </p>
                )}
            </section>
        </div>
    );
};
