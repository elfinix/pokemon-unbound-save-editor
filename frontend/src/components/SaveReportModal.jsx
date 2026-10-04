import React, { useEffect } from 'react';
import { X, Save, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function SaveReportModal({
    saveReport,
    saveReportLoading,
    saveReportError,
    saveExt,
    onClose,
    onConfirmDownload,
}) {
    useEffect(() => {
        const onKeyDown = (event) => {
            if (event.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [onClose]);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300" role="presentation">
            <section
                role="dialog"
                aria-modal="true"
                aria-labelledby="save-report-title"
                className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-[2rem] border border-slate-700 bg-slate-900 p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200"
            >
                <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-4">
                    <div>
                        <h2 id="save-report-title" className="text-xl font-black text-white">Review Save Before Download</h2>
                        <p className="mt-1 text-xs text-slate-400">
                            Inspects your proposed changes. Saving will download your modified <span className="text-blue-300 font-bold">.{saveExt}</span> and an untouched safety backup (<span className="text-amber-300 font-bold">.{saveExt}.bak</span>).
                        </p>
                    </div>
                    <button
                        type="button"
                        autoFocus
                        onClick={onClose}
                        aria-label="Close save report"
                        className="rounded-xl p-2 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                        <X size={18} />
                    </button>
                </div>

                {saveReportLoading && (
                    <div className="py-12 text-center text-slate-300 space-y-2">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-2"></div>
                        <p className="text-sm font-semibold">Checking save layout and checksum integrity…</p>
                    </div>
                )}

                {saveReportError && (
                    <div className="mt-5 rounded-xl border border-rose-500/40 bg-rose-500/10 p-4 text-rose-200 text-xs flex items-center gap-3">
                        <AlertTriangle size={18} className="text-rose-400 shrink-0" />
                        <p>{saveReportError}</p>
                    </div>
                )}

                {saveReport && (
                    <div className="mt-5 space-y-5 text-sm">
                        <div className="grid gap-2.5 sm:grid-cols-3">
                            <div className="rounded-xl border border-white/5 bg-slate-800/80 p-3.5">
                                <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">Active Save Index</span>
                                <strong className="text-base text-slate-100 mt-0.5 block">{saveReport.layout.active_save_index ?? 'Unknown'}</strong>
                            </div>
                            <div className="rounded-xl border border-white/5 bg-slate-800/80 p-3.5">
                                <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">Checked Sections</span>
                                <strong className="text-base text-emerald-400 mt-0.5 block">{saveReport.checksums.filter((row) => row.status !== 'opaque').length}</strong>
                            </div>
                            <div className="rounded-xl border border-white/5 bg-slate-800/80 p-3.5">
                                <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">Changed Bytes</span>
                                <strong className="text-base text-blue-400 mt-0.5 block">{saveReport.changes.changed_bytes}</strong>
                            </div>
                        </div>

                        <div>
                            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-200">Loaded Save Verification</h3>
                            {saveReport.source_warnings.length ? (
                                <ul className="mt-2 space-y-1 text-amber-200 text-xs bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
                                    {saveReport.source_warnings.map((warning, index) => (
                                        <li key={`${warning.code}-${index}`}>• {warning.message}</li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="mt-1.5 text-xs text-emerald-400 flex items-center gap-1.5">
                                    <CheckCircle2 size={14} /> No layout or checksum warnings in the loaded save.
                                </p>
                            )}

                            <h3 className="mt-4 font-bold text-xs uppercase tracking-wider text-slate-200">Export Checksum Status</h3>
                            {saveReport.warnings.length ? (
                                <ul className="mt-2 space-y-1 text-amber-200 text-xs bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
                                    {saveReport.warnings.map((warning, index) => (
                                        <li key={`${warning.code}-${index}`}>• {warning.message}</li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="mt-1.5 text-xs text-emerald-400 flex items-center gap-1.5">
                                    <CheckCircle2 size={14} /> All active checksums recalculation verified for download.
                                </p>
                            )}
                        </div>

                        <div>
                            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-200">Changes Since Upload</h3>
                            {saveReport.changes.sectors.length ? (
                                <ul className="mt-2 max-h-48 space-y-2 overflow-y-auto pr-1">
                                    {saveReport.changes.sectors.map((sector) => (
                                        <li key={sector.index} className="rounded-xl bg-slate-800/60 border border-white/5 p-3 text-xs">
                                            <div className="flex items-center justify-between">
                                                <strong className="text-slate-100">Sector {sector.index} · ID {sector.id ?? 'unknown'}</strong>
                                                <span className="text-slate-400 text-[11px]">{sector.payload_bytes} data / {sector.footer_bytes} footer bytes</span>
                                            </div>
                                            {sector.fields.length > 0 && (
                                                <p className="mt-1.5 text-[11px] text-slate-300">
                                                    {sector.fields.map((field) => `${field.name} (${field.changed_bytes})`).join(' · ')}
                                                </p>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="mt-1.5 text-xs text-slate-400">No sector changes detected since upload.</p>
                            )}
                        </div>
                    </div>
                )}

                <div className="mt-6 pt-4 border-t border-white/10 flex justify-end gap-2.5">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-xl border border-slate-700 px-4 py-2 text-xs font-bold text-slate-300 hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={onConfirmDownload}
                        disabled={!saveReport || saveReportLoading}
                        className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 px-5 py-2 text-xs font-bold text-white shadow-lg shadow-blue-500/20 transition-all cursor-pointer"
                    >
                        <Save size={14} /> Download {saveExt.toUpperCase()} + Backup (.bak)
                    </button>
                </div>
            </section>
        </div>
    );
}
