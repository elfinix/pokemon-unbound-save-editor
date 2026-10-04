import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export const ToastContainer = ({ toasts = [], onDismiss }) => {
    if (!toasts.length) return null;

    return (
        <div className="fixed bottom-6 right-6 z-[250] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0">
            {toasts.map((t) => {
                const isSuccess = t.type === 'success' || !t.type;
                const isError = t.type === 'error';

                const borderClass = isSuccess
                    ? 'border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.15)]'
                    : isError
                    ? 'border-rose-500/30 shadow-[0_0_20px_rgba(244,63,94,0.15)]'
                    : 'border-blue-500/30 shadow-[0_0_20px_rgba(59,130,246,0.15)]';

                const icon = isSuccess ? (
                    <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
                ) : isError ? (
                    <AlertCircle size={18} className="text-rose-400 shrink-0" />
                ) : (
                    <Info size={18} className="text-blue-400 shrink-0" />
                );

                return (
                    <div
                        key={t.id}
                        className={`pointer-events-auto bg-[#0f172a]/95 backdrop-blur-md border ${borderClass} rounded-2xl p-4 flex items-center gap-3 text-slate-100 shadow-2xl animate-in slide-in-from-bottom-5 fade-in duration-300 ring-1 ring-white/10`}
                    >
                        {icon}
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold leading-relaxed">{t.message}</p>
                        </div>
                        {onDismiss && (
                            <button
                                onClick={() => onDismiss(t.id)}
                                className="text-slate-400 hover:text-slate-200 transition-colors p-1 rounded-lg hover:bg-white/5 shrink-0"
                                aria-label="Dismiss notification"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default ToastContainer;
