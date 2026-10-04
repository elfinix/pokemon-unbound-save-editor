import React, { useEffect } from 'react';
import { AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export const ConfirmModal = ({
    isOpen = true,
    title = 'Confirm Action',
    message = 'Are you sure you want to proceed?',
    subMessage = '',
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    variant = 'danger', // 'danger' | 'warning' | 'primary' | 'info'
    icon: CustomIcon,
    loading = false,
    onConfirm,
    onClose,
}) => {
    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && !loading) {
                onClose?.();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, loading, onClose]);

    if (!isOpen) return null;

    const isWarning = variant === 'warning';
    const isPrimary = variant === 'primary' || variant === 'info';

    // Badge styling and default icons
    let badgeBorderClass = 'border-rose-500/30 bg-rose-500/15 text-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.15)]';
    let confirmBtnClass =
        'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white shadow-[0_0_20px_rgba(244,63,94,0.35)]';
    let DefaultIcon = AlertCircle;

    if (isWarning) {
        badgeBorderClass = 'border-amber-500/30 bg-amber-500/15 text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.15)]';
        confirmBtnClass =
            'bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-white shadow-[0_0_20px_rgba(245,158,11,0.35)]';
        DefaultIcon = AlertTriangle;
    } else if (isPrimary) {
        badgeBorderClass = 'border-blue-500/30 bg-blue-500/15 text-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.15)]';
        confirmBtnClass =
            'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-[0_0_20px_rgba(59,130,246,0.35)]';
        DefaultIcon = Info;
    }

    const IconToRender = CustomIcon || DefaultIcon;

    return (
        <div
            className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300"
            onClick={() => {
                if (!loading) onClose?.();
            }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-modal-title"
        >
            <div
                className="w-full max-w-md bg-[#0f172a] border border-white/10 rounded-[2rem] sm:rounded-[2.5rem] p-6 space-y-5 shadow-2xl animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div
                            className={`w-11 h-11 rounded-2xl border flex items-center justify-center shrink-0 ${badgeBorderClass}`}
                        >
                            <IconToRender size={22} />
                        </div>
                        <div>
                            <h3 id="confirm-modal-title" className="text-lg font-bold text-white tracking-tight">
                                {title}
                            </h3>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer disabled:opacity-50"
                        aria-label="Close dialog"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Body Content */}
                <div className="space-y-2 text-sm text-slate-300 leading-relaxed pl-1">
                    <p className="font-medium text-slate-200">{message}</p>
                    {subMessage && <p className="text-xs text-slate-400 leading-normal">{subMessage}</p>}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        className="px-4 py-2.5 rounded-xl border border-white/10 bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50"
                    >
                        {cancelText}
                    </button>
                    <button
                        type="button"
                        onClick={() => onConfirm?.()}
                        disabled={loading}
                        className={`px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50 ${confirmBtnClass}`}
                    >
                        {loading ? 'Processing...' : confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;
