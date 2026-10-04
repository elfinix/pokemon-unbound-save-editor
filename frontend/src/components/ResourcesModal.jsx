import React, { useState, useEffect } from 'react';
import { X, DollarSign, Award } from 'lucide-react';

export default function ResourcesModal({ initialMoney, initialBp, onClose, onApply }) {
    const [moneyInput, setMoneyInput] = useState(String(initialMoney ?? 0));
    const [bpInput, setBpInput] = useState(String(initialBp ?? 0));

    useEffect(() => {
        const onKeyDown = (e) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [onClose]);

    const handleSubmit = (e) => {
        e.preventDefault();
        const amount = Math.max(0, Math.min(999999999, parseInt(moneyInput, 10) || 0));
        const bpAmount = Math.max(0, Math.min(65535, parseInt(bpInput, 10) || 0));
        onApply(amount, bpAmount);
    };

    return (
        <div
            className="fixed inset-0 z-[120] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={onClose}
        >
            <div
                className="w-full max-w-sm bg-[#0f172a] border border-white/10 rounded-[2rem] p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-blue-500/15 border border-blue-400/30 flex items-center justify-center text-blue-300">
                            <DollarSign size={16} />
                        </div>
                        <h3 className="text-lg font-bold text-white">Edit Resources</h3>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                    >
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-[11px] uppercase tracking-wider font-bold text-slate-400 mb-1.5">
                            Money (¥)
                        </label>
                        <div className="relative">
                            <input
                                type="number"
                                step="1"
                                min="0"
                                max="999999999"
                                value={moneyInput}
                                onChange={(event) => {
                                    const value = event.target.value;
                                    if (value.length <= 9) setMoneyInput(value);
                                }}
                                className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 font-mono text-emerald-400 text-sm outline-none focus:border-blue-500 transition-colors"
                            />
                        </div>
                        <span className="text-[10px] text-slate-500 mt-1 block">Max: ¥999,999,999</span>
                    </div>

                    <div>
                        <label className="block text-[11px] uppercase tracking-wider font-bold text-slate-400 mb-1.5">
                            Battle Points (BP)
                        </label>
                        <div className="relative">
                            <input
                                type="number"
                                step="1"
                                min="0"
                                max="65535"
                                value={bpInput}
                                onChange={(event) => {
                                    const value = event.target.value;
                                    if (value.length <= 5) setBpInput(value);
                                }}
                                className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 font-mono text-amber-300 text-sm outline-none focus:border-blue-500 transition-colors"
                            />
                        </div>
                        <span className="text-[10px] text-slate-500 mt-1 block">Max: 65,535 BP</span>
                    </div>

                    <div className="flex gap-2.5 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/20 cursor-pointer"
                        >
                            Apply Changes
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
