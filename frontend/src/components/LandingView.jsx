import React, { useState } from 'react';
import {
    Upload,
    HardDrive,
    Sparkles,
    ShieldAlert,
    Save,
    CheckCircle2,
    LayoutGrid,
    Users,
    Briefcase,
    Edit3,
    Shield,
    Cpu,
    Github,
    Database,
} from 'lucide-react';
import UnboundLogo from './UnboundLogo.jsx';

const FeatureCard = ({ icon, title, description }) => (
    <article className="rounded-3xl border border-white/10 bg-[#1e293b]/50 p-4 md:p-5">
        <div className="h-9 w-9 rounded-xl border border-blue-400/30 bg-blue-500/10 flex items-center justify-center">
            {icon}
        </div>
        <h4 className="mt-3 text-base font-bold text-slate-100">{title}</h4>
        <p className="mt-1 text-xs md:text-sm text-slate-300 leading-relaxed">{description}</p>
    </article>
);

const StepCard = ({ index, title, description }) => (
    <article className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
        <p className="text-[10px] text-blue-300 font-black uppercase tracking-[0.18em]">Step {index}</p>
        <h4 className="mt-1 text-sm md:text-base font-bold text-slate-100">{title}</h4>
        <p className="mt-1 text-xs text-slate-400">{description}</p>
    </article>
);

const PartyPreviewPanel = () => (
    <article className="rounded-[1.75rem] border border-white/10 bg-[#1e293b]/50 p-4 md:p-5">
        <p className="text-[10px] uppercase tracking-[0.15em] text-slate-400 font-black">Party preview</p>
        <h4 className="mt-1 text-base font-bold">Team Cards + Fast Editing</h4>
        <div className="mt-3 rounded-2xl border border-white/10 bg-slate-900/50 p-3">
            <div className="flex items-center justify-between gap-2">
                <div>
                    <p className="font-semibold text-sm">Garchomp</p>
                    <p className="text-[11px] text-slate-400">Lv. 78 | Rough Skin</p>
                </div>
                <span className="text-[10px] px-2 py-1 rounded-md bg-blue-500/20 text-blue-300">Jolly</span>
            </div>
            <div className="grid grid-cols-3 gap-2 mt-3">
                {[
                    ['HP', 31],
                    ['ATK', 31],
                    ['DEF', 28],
                    ['SPA', 9],
                    ['SPD', 24],
                    ['SPE', 31],
                ].map(([stat, value]) => (
                    <div key={stat} className="rounded-lg border border-white/10 bg-slate-950/50 px-2 py-1.5">
                        <p className="text-[9px] text-slate-500 uppercase tracking-wider">{stat}</p>
                        <p className="text-xs font-bold text-slate-200">{value}</p>
                    </div>
                ))}
            </div>
        </div>
    </article>
);

const EditorPreviewPanel = () => (
    <article className="rounded-[1.75rem] border border-white/10 bg-[#1e293b]/50 p-4 md:p-5">
        <p className="text-[10px] uppercase tracking-[0.15em] text-slate-400 font-black">Editor preview</p>
        <h4 className="mt-1 text-base font-bold">Species, Moves, EV/IV, Identity</h4>
        <div className="mt-3 rounded-2xl border border-white/10 bg-slate-900/50 p-3 space-y-2">
            <div className="grid grid-cols-3 gap-2 text-[11px]">
                <div className="rounded-lg bg-slate-950/60 border border-white/10 px-2 py-1.5 text-slate-300">Species</div>
                <div className="rounded-lg bg-blue-500/15 border border-blue-400/30 px-2 py-1.5 text-blue-300">Stats</div>
                <div className="rounded-lg bg-slate-950/60 border border-white/10 px-2 py-1.5 text-slate-300">Moves</div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-lg bg-slate-950/60 border border-white/10 p-2 text-slate-300">EV Total: 508 / 510</div>
                <div className="rounded-lg bg-slate-950/60 border border-white/10 p-2 text-slate-300">Shiny: ON | Gender: M</div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="rounded-lg bg-slate-950/60 border border-white/10 p-2 text-slate-300">Earthquake (16/16)</div>
                <div className="rounded-lg bg-slate-950/60 border border-white/10 p-2 text-slate-300">Dragon Claw (24/24)</div>
            </div>
        </div>
    </article>
);

const PcPreviewPanel = () => (
    <article className="rounded-[1.75rem] border border-white/10 bg-[#1e293b]/50 p-4 md:p-5">
        <p className="text-[10px] uppercase tracking-[0.15em] text-slate-400 font-black">PC preview</p>
        <h4 className="mt-1 text-base font-bold">Box Navigation + Insert Flow</h4>
        <div className="mt-3 rounded-2xl border border-white/10 bg-slate-900/50 p-3">
            <div className="flex items-center justify-between text-xs text-slate-300">
                <span className="font-bold text-blue-300">Box 12</span>
                <span>21 / 30 Pokemon</span>
            </div>
            <div className="mt-3 grid grid-cols-6 gap-1.5">
                {Array.from({ length: 18 }, (_, idx) => idx).map((slot) => (
                    <div
                        key={slot}
                        className={`aspect-square rounded-md border ${slot % 5 === 0 ? 'border-emerald-400/30 bg-emerald-500/10' : 'border-white/10 bg-slate-950/50'}`}
                    />
                ))}
            </div>
        </div>
    </article>
);

const BagPreviewPanel = () => (
    <article className="rounded-[1.75rem] border border-white/10 bg-[#1e293b]/50 p-4 md:p-5">
        <p className="text-[10px] uppercase tracking-[0.15em] text-slate-400 font-black">Bag preview</p>
        <h4 className="mt-1 text-base font-bold">Quick Pockets + Explicit Save</h4>
        <div className="mt-3 rounded-2xl border border-white/10 bg-slate-900/50 p-3 space-y-2">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                <div className="rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-2 py-1.5 text-emerald-300">Main ready</div>
                <div className="rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-2 py-1.5 text-emerald-300">Ball ready</div>
                <div className="rounded-lg border border-amber-400/30 bg-amber-500/10 px-2 py-1.5 text-amber-300">Berry locked</div>
                <div className="rounded-lg border border-white/10 bg-slate-950/50 px-2 py-1.5 text-slate-400">TM search</div>
            </div>
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[11px] text-amber-200">
                Unsaved edits pending: click SAVE BAG CHANGES.
            </div>
        </div>
    </article>
);

export default function LandingView({
    client,
    onUploadSave,
    onLoadDefaultSave,
    loadingDefault,
    showToast,
}) {
    const [rtcTab, setRtcTab] = useState('pair');
    const [rtcBrokenFile, setRtcBrokenFile] = useState(null);
    const [rtcFixedFile, setRtcFixedFile] = useState(null);
    const [rtcTimeFixerFile, setRtcTimeFixerFile] = useState(null);
    const [rtcBusy, setRtcBusy] = useState(false);
    const [convertFile, setConvertFile] = useState(null);
    const [convertTarget, setConvertTarget] = useState('.sav');
    const [convertBusy, setConvertBusy] = useState(false);

    const handleDropUpload = (e) => {
        e.preventDefault();
        const file = e.dataTransfer.files?.[0];
        if (file) onUploadSave(file);
    };

    const handleFileInput = (e) => {
        const file = e.target.files?.[0];
        if (file) onUploadSave(file);
    };

    const handleRtcFixPack = async () => {
        if (!rtcBrokenFile || !rtcFixedFile) {
            showToast('Please select both broken and fixed save files.', 'error');
            return;
        }
        try {
            setRtcBusy(true);
            await client.downloadRtcFixPack(rtcBrokenFile, rtcFixedFile);
            showToast('RTC repair pack generated and downloaded.', 'success');
        } catch (err) {
            console.error(err);
            showToast(err?.message || 'Failed to generate RTC repair pack.', 'error');
        } finally {
            setRtcBusy(false);
        }
    };

    const handleRtcTimeFixerReset = async () => {
        if (!rtcTimeFixerFile) {
            showToast('Please select a save file to re-enable Time Fixer.', 'error');
            return;
        }
        try {
            setRtcBusy(true);
            await client.downloadTimeFixerReset(rtcTimeFixerFile);
            showToast('Time Fixer re-enabled save downloaded.', 'success');
        } catch (err) {
            console.error(err);
            showToast(err?.message || 'Failed to re-enable Time Fixer.', 'error');
        } finally {
            setRtcBusy(false);
        }
    };

    const handleSaveConvert = async () => {
        if (!convertFile) {
            showToast('Please select a file to convert.', 'error');
            return;
        }
        try {
            setConvertBusy(true);
            await client.downloadConvertedSave(convertFile, convertTarget);
            showToast(`Save converted to ${convertTarget.toUpperCase()} successfully.`, 'success');
        } catch (err) {
            console.error(err);
            showToast(err?.message || 'Failed to convert save file.', 'error');
        } finally {
            setConvertBusy(false);
        }
    };

    return (
        <div className="space-y-6 md:space-y-8 pb-12">
            {/* Box 1: Hero & Upload Zone */}
            <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-[#1e293b]/95 via-[#16243c]/95 to-[#0f172a] p-5 md:p-8 shadow-2xl">
                <div className="pointer-events-none absolute -top-20 -right-20 h-64 w-64 rounded-full bg-blue-500/15 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-24 -left-16 h-56 w-56 rounded-full bg-cyan-500/10 blur-3xl" />
                <div className="relative grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-6 md:gap-8 items-center">
                    {/* Left Side */}
                    <div className="space-y-4 md:space-y-5">
                        <h2 className="text-xl sm:text-2xl md:text-3xl font-black leading-snug tracking-tight text-white">
                            Edit your team, PC, bag, and money in a clean web workflow.
                        </h2>
                        <p className="text-slate-300 text-xs sm:text-sm leading-relaxed max-w-xl">
                            PUSE is a checksum-safe save editor focused on real CFRU + DPE flows. Load a <span className="font-mono text-blue-300 font-semibold">.sav</span> or <span className="font-mono text-blue-300 font-semibold">.srm</span>, edit what you need, and export your updated file.
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                            <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-3">
                                <p className="text-slate-400 uppercase tracking-widest text-[9px] font-bold">Runtime</p>
                                <p className="mt-1 font-bold text-slate-100 text-xs leading-snug">Local or Backend API</p>
                            </div>
                            <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-3">
                                <p className="text-slate-400 uppercase tracking-widest text-[9px] font-bold">Safety</p>
                                <p className="mt-1 font-bold text-slate-100 text-xs leading-snug">Checksum recalculation</p>
                            </div>
                            <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-3">
                                <p className="text-slate-400 uppercase tracking-widest text-[9px] font-bold">Scope</p>
                                <p className="mt-1 font-bold text-slate-100 text-xs leading-snug">Party, PC, Bag, Dex</p>
                            </div>
                        </div>
                    </div>

                    {/* Right Side: Load Save Dropzone */}
                    <div className="space-y-3 md:space-y-4">
                        <div>
                            <p className="inline-flex items-center gap-1.5 rounded-full border border-blue-400/30 bg-blue-500/10 px-3 py-1 text-[10px] md:text-xs font-black uppercase tracking-[0.16em] text-blue-300">
                                <UnboundLogo size={14} className="inline" /> Save editor for Pokemon Unbound
                            </p>
                        </div>

                        <div
                            className="rounded-[1.75rem] border border-blue-500/30 bg-slate-950/50 p-5 md:p-6"
                            onDrop={handleDropUpload}
                            onDragOver={(e) => e.preventDefault()}
                        >
                            <div className="flex items-center gap-3">
                                <div className="h-12 w-12 rounded-xl bg-blue-600/20 border border-blue-400/40 flex items-center justify-center">
                                    <Upload className="text-blue-300" size={22} />
                                </div>
                                <div>
                                    <p className="text-xs uppercase tracking-widest text-blue-200 font-black">Start here</p>
                                    <h3 className="text-lg font-bold text-white">Load Save File</h3>
                                </div>
                            </div>

                            <div className="mt-4 rounded-2xl border border-dashed border-blue-400/40 bg-slate-900/60 px-4 py-6 text-center">
                                <p className="text-xs text-slate-300">Drag and drop your file here</p>
                                <p className="mt-1 text-[11px] text-slate-500">Accepted: <span className="font-mono">.sav</span> and <span className="font-mono">.srm</span></p>
                                <div className="mt-6 flex flex-col items-center gap-3">
                                    <button
                                        type="button"
                                        onClick={onLoadDefaultSave}
                                        disabled={loadingDefault}
                                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-xl cursor-pointer font-bold transition-all shadow-lg active:scale-95 text-xs md:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <HardDrive size={15} />
                                        {loadingDefault ? "LOADING..." : "LOAD DEFAULT SAVE"}
                                    </button>
                                    <label className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-transparent hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700/60 hover:border-slate-500 px-5 py-2 rounded-xl cursor-pointer font-semibold transition-all text-xs active:scale-95">
                                        <Upload size={13} />
                                        SELECT SAVE FILE
                                        <input type="file" className="hidden" onChange={handleFileInput} accept=".sav,.srm" />
                                    </label>
                                </div>
                            </div>

                            <p className="mt-4 text-[11px] text-slate-400 leading-relaxed">
                                Tip: Local mode runs entirely in your browser. Backend mode uses FastAPI endpoints.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Box 2: Recovery Tools & Utility */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <details className="group rounded-[2rem] border border-amber-500/30 bg-gradient-to-br from-amber-500/5 via-slate-900/60 to-slate-950 p-5 md:p-6 transition-all">
                    <summary className="list-none cursor-pointer flex items-start justify-between gap-3">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-amber-300">Recovery tools</p>
                            <h3 className="mt-1 text-lg font-bold text-slate-100">RTC Metadata Recovery</h3>
                            <p className="mt-1 text-xs text-slate-300">Prefer Unbound's own Time Fixer; use pair repair as an advanced fallback.</p>
                        </div>
                        <div className="text-[10px] text-amber-200 uppercase tracking-widest px-2.5 py-1 rounded-full border border-amber-500/30 bg-amber-500/10 font-bold group-open:hidden">Open</div>
                        <div className="text-[10px] text-amber-200 uppercase tracking-widest px-2.5 py-1 rounded-full border border-amber-500/30 bg-amber-500/10 font-bold hidden group-open:block">Close</div>
                    </summary>

                    <div className="mt-5 border-t border-amber-500/20 pt-5">
                        <div className="inline-flex rounded-xl border border-white/10 bg-slate-900/60 p-1 text-[10px] uppercase tracking-widest font-bold">
                            <button
                                type="button"
                                onClick={() => setRtcTab('pair')}
                                className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                                    rtcTab === 'pair' ? 'bg-amber-600 text-white' : 'text-slate-300 hover:bg-white/5'
                                }`}
                            >
                                Pair Repair (Advanced)
                            </button>
                            <button
                                type="button"
                                onClick={() => setRtcTab('quick')}
                                className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                                    rtcTab === 'quick' ? 'bg-amber-600 text-white' : 'text-slate-300 hover:bg-white/5'
                                }`}
                            >
                                Re-enable Time Fixer
                            </button>
                        </div>

                        {rtcTab === 'pair' ? (
                            <>
                                <p className="mt-3 text-sm text-slate-200">
                                    Build a repair pack using a tampered save and one NPC-fixed save.
                                </p>
                                <div className="mt-4 grid grid-cols-1 gap-3 text-xs text-slate-300">
                                    <label className="block">
                                        <span className="block mb-1 text-slate-400">Tampered save (.sav)</span>
                                        <input
                                            type="file"
                                            accept=".sav"
                                            onChange={(e) => setRtcBrokenFile(e.target.files?.[0] || null)}
                                            className="w-full text-xs cursor-pointer"
                                        />
                                    </label>
                                    <label className="block">
                                        <span className="block mb-1 text-slate-400">NPC-fixed save (.sav)</span>
                                        <input
                                            type="file"
                                            accept=".sav"
                                            onChange={(e) => setRtcFixedFile(e.target.files?.[0] || null)}
                                            className="w-full text-xs cursor-pointer"
                                        />
                                    </label>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleRtcFixPack}
                                    disabled={rtcBusy}
                                    className="mt-4 inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-500 disabled:bg-amber-900/60 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
                                >
                                    <ShieldAlert size={14} /> {rtcBusy ? 'GENERATING...' : 'GENERATE PAIR REPAIR PACK'}
                                </button>
                                <p className="mt-2 text-[11px] text-slate-400">
                                    Downloads manifest and fallback candidates in recommended order.
                                </p>
                            </>
                        ) : (
                            <>
                                <p className="mt-3 text-sm text-slate-200">
                                    Safely re-enable the one-use Frozen Heights Time Fixer by clearing only its used flag.
                                </p>
                                <p className="mt-2 text-[11px] text-amber-300">
                                    First correct the emulator or device RTC. This download does not repair RTC metadata by itself.
                                </p>
                                <div className="mt-3 text-xs text-slate-300">
                                    <label className="block">
                                        <span className="block mb-1 text-slate-400">Pokemon Unbound save (.sav or .srm)</span>
                                        <input
                                            type="file"
                                            accept=".sav,.srm"
                                            onChange={(e) => setRtcTimeFixerFile(e.target.files?.[0] || null)}
                                            className="w-full text-xs cursor-pointer"
                                        />
                                    </label>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleRtcTimeFixerReset}
                                    disabled={rtcBusy}
                                    className="mt-4 inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-500 disabled:bg-amber-900/60 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
                                >
                                    <ShieldAlert size={14} /> {rtcBusy ? 'VALIDATING...' : 'RE-ENABLE TIME FIXER'}
                                </button>
                                <p className="mt-2 text-[11px] text-slate-400">
                                    Validates the save, changes exactly one byte in the active generation, and preserves the older fallback copy and RTC trailer.
                                </p>
                            </>
                        )}
                    </div>
                </details>

                <details className="group rounded-[2rem] border border-cyan-500/30 bg-gradient-to-br from-cyan-500/5 via-slate-900/60 to-slate-950 p-5 md:p-6 transition-all">
                    <summary className="list-none cursor-pointer flex items-start justify-between gap-3">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-cyan-300">Utility</p>
                            <h3 className="mt-1 text-lg font-bold text-slate-100">SRM / SAV Converter</h3>
                            <p className="mt-1 text-xs text-slate-300">Convert emulator save container format without opening the main editor.</p>
                        </div>
                        <div className="text-[10px] text-cyan-200 uppercase tracking-widest px-2.5 py-1 rounded-full border border-cyan-500/30 bg-cyan-500/10 font-bold group-open:hidden">Open</div>
                        <div className="text-[10px] text-cyan-200 uppercase tracking-widest px-2.5 py-1 rounded-full border border-cyan-500/30 bg-cyan-500/10 font-bold hidden group-open:block">Close</div>
                    </summary>

                    <div className="mt-5 border-t border-cyan-500/20 pt-5">
                        <div className="text-xs text-slate-300">
                            <label className="block">
                                <span className="block mb-1 text-slate-400">Input file (.sav or .srm)</span>
                                <input
                                    type="file"
                                    accept=".sav,.srm"
                                    onChange={(e) => setConvertFile(e.target.files?.[0] || null)}
                                    className="w-full text-xs cursor-pointer"
                                />
                            </label>
                        </div>

                        <div className="mt-4 inline-flex rounded-xl border border-white/10 bg-slate-900/60 p-1 text-[10px] uppercase tracking-widest font-bold">
                            <button
                                type="button"
                                onClick={() => setConvertTarget('.sav')}
                                className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                                    convertTarget === '.sav' ? 'bg-cyan-600 text-white' : 'text-slate-300 hover:bg-white/5'
                                }`}
                            >
                                To .sav
                            </button>
                            <button
                                type="button"
                                onClick={() => setConvertTarget('.srm')}
                                className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                                    convertTarget === '.srm' ? 'bg-cyan-600 text-white' : 'text-slate-300 hover:bg-white/5'
                                }`}
                            >
                                To .srm
                            </button>
                        </div>

                        <div>
                            <button
                                type="button"
                                onClick={handleSaveConvert}
                                disabled={convertBusy}
                                className="mt-4 inline-flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 disabled:bg-cyan-900/60 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
                            >
                                <Save size={14} /> {convertBusy ? 'CONVERTING...' : `CONVERT TO ${convertTarget.toUpperCase()}`}
                            </button>
                        </div>
                        <p className="mt-2 text-[11px] text-slate-400">
                            Supports 128 KiB and 128 KiB + 16 byte layouts. The original file is never modified.
                        </p>
                    </div>
                </details>
            </div>

            {/* Feature Highlights */}
            <section className="space-y-4">
                <div className="flex items-center gap-2 text-slate-300">
                    <CheckCircle2 size={16} className="text-emerald-400" />
                    <h3 className="text-lg md:text-xl font-bold">What You Can Do</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    <FeatureCard
                        icon={<LayoutGrid size={18} className="text-blue-300" />}
                        title="Party & Coverage"
                        description="Edit species, nickname, IV/EVs, moves, and view real-time defensive and offensive type matrix."
                    />
                    <FeatureCard
                        icon={<Users size={18} className="text-blue-300" />}
                        title="PC Management"
                        description="Browse all 25 boxes, edit stored Pokémon, and add new Pokémon directly into empty slots."
                    />
                    <FeatureCard
                        icon={<Briefcase size={18} className="text-blue-300" />}
                        title="Bag Workflows"
                        description="Open pockets quickly, search items reliably, then apply edits with explicit checksum-safe save flow."
                    />
                    <FeatureCard
                        icon={<Edit3 size={18} className="text-blue-300" />}
                        title="Identity Safety"
                        description="Shiny and gender editing includes PID-aware validation to preserve legal game behavior when possible."
                    />
                    <FeatureCard
                        icon={<Save size={18} className="text-blue-300" />}
                        title="Checksum-Safe Export"
                        description="Download your updated save with automatic checksum recalculation handled across all sectors."
                    />
                    <FeatureCard
                        icon={<Shield size={18} className="text-blue-300" />}
                        title="Recovery Tools"
                        description="Re-enable Unbound's in-game Time Fixer with a validated one-byte edit, or use pair repair fallback."
                    />
                </div>
            </section>

            {/* How It Works Steps */}
            <section className="rounded-[2rem] border border-white/10 bg-[#1e293b]/50 p-5 md:p-6">
                <div className="flex items-center gap-2 mb-4 text-slate-200">
                    <Sparkles size={16} className="text-blue-300" />
                    <h3 className="text-lg md:text-xl font-bold">How It Works</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
                    <StepCard index="1" title="Load Save" description="Upload your .sav or .srm file and choose local or backend runtime mode." />
                    <StepCard index="2" title="Edit Data" description="Use Party, Coverage, PC, and Bag editors to update Pokémon, items, and resources." />
                    <StepCard index="3" title="Export" description="Download the edited save file after checksum-safe write operations complete." />
                </div>
            </section>

            {/* UI Preview Section */}
            <section className="space-y-4">
                <div className="flex items-center gap-2 text-slate-300">
                    <Cpu size={16} className="text-cyan-300" />
                    <h3 className="text-lg md:text-xl font-bold">UI Preview (Static)</h3>
                </div>
                <p className="text-xs md:text-sm text-slate-400">
                    These are non-interactive preview panels showing common workflows available after upload.
                </p>
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-5">
                    <PartyPreviewPanel />
                    <EditorPreviewPanel />
                    <PcPreviewPanel />
                    <BagPreviewPanel />
                </div>
            </section>

            {/* Footer */}
            <footer className="rounded-[2rem] border border-white/10 bg-[#1e293b]/40 px-5 py-5 md:px-6 md:py-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <p className="text-sm font-bold text-slate-100">Pokemon Unbound Save Editor</p>
                    <p className="text-[11px] text-slate-400 mt-1">
                        Unofficial fan utility. Always edit copies of your save files.
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                    <a
                        href="https://github.com/Zannael/PUSE"
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-slate-900/70 px-3 py-2 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
                    >
                        <Github size={14} /> GitHub
                    </a>
                    <a
                        href="https://github.com/Zannael/PUSE/blob/master/CHANGELOG.md"
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-slate-900/70 px-3 py-2 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
                    >
                        <Database size={14} /> Changelog
                    </a>
                </div>
            </footer>
        </div>
    );
}
