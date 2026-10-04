import React, { lazy, Suspense, useMemo, useState, useEffect, useCallback } from 'react';
import { LogOut, Trash2, AlertTriangle } from 'lucide-react';
import { createApiClient, getInitialRuntimeMode, persistRuntimeMode } from './services/apiClient.js';
import { getExpAtLevel, getSpeciesGrowthRate } from './core/growth.js';
import Sidebar from './components/Sidebar.jsx';
import TopHeader from './components/TopHeader.jsx';
import LandingView from './components/LandingView.jsx';
import ResourcesModal from './components/ResourcesModal.jsx';
import SaveReportModal from './components/SaveReportModal.jsx';
import ConfirmModal from './components/ConfirmModal.jsx';
import ToastContainer from './components/ToastContainer.jsx';

const PartyGrid = lazy(() => import('./components/PartyGrid'));
const PCGrid = lazy(() => import('./components/PCGrid'));
const AllPokemonTable = lazy(() => import('./components/AllPokemonTable.jsx'));
const BagView = lazy(() => import('./components/BagView.jsx'));
const LivingDexPanel = lazy(() => import('./components/LivingDexPanel.jsx'));
const CoverageView = lazy(() => import('./components/CoverageView.jsx'));
const PokemonEditorModal = lazy(() =>
    import('./components/PokemonEditorModal.jsx').then((mod) => ({ default: mod.PokemonEditorModal }))
);
const AddPcPokemonModal = lazy(() => import('./components/AddPcPokemonModal.jsx'));

const LEGIT_MODE_STORAGE_KEY = 'puse_legit_mode';
const HACKED_MODE_STORAGE_KEY = 'puse_hacked_mode';

const getInitialLegitMode = () => {
    try {
        return window.localStorage.getItem(LEGIT_MODE_STORAGE_KEY) === '1';
    } catch {
        return false;
    }
};

const getInitialHackedMode = () => {
    try {
        return window.localStorage.getItem(HACKED_MODE_STORAGE_KEY) === '1';
    } catch {
        return false;
    }
};

export default function App() {
    const [runtimeMode, setRuntimeMode] = useState(getInitialRuntimeMode);
    const [legitMode, setLegitMode] = useState(getInitialLegitMode);
    const [hackedMode, setHackedMode] = useState(getInitialHackedMode);
    const [showLegitHelp, setShowLegitHelp] = useState(false);
    const [activeTab, setActiveTab] = useState('party');
    const [isLoaded, setIsLoaded] = useState(false);
    const [saveExt, setSaveExt] = useState('.sav');
    const [money, setMoney] = useState(0);
    const [bp, setBp] = useState(0);
    const [showResourcesModal, setShowResourcesModal] = useState(false);
    const [saveReport, setSaveReport] = useState(null);
    const [saveReportLoading, setSaveReportLoading] = useState(false);
    const [saveReportError, setSaveReportError] = useState('');
    const [showSaveReport, setShowSaveReport] = useState(false);
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [loadingDefault, setLoadingDefault] = useState(false);
    const [selectedPokemon, setSelectedPokemon] = useState(null);
    const [pcInsertTarget, setPcInsertTarget] = useState(null);
    const [pcBoxId, setPcBoxId] = useState(1);
    const [refreshKey, setRefreshKey] = useState(0);
    const [bagHasUnsavedChanges, setBagHasUnsavedChanges] = useState(false);
    const [toasts, setToasts] = useState([]);
    const [confirmDialog, setConfirmDialog] = useState(null);

    const client = useMemo(() => createApiClient(runtimeMode), [runtimeMode]);

    const showToast = useCallback((message, type = 'success', duration = 3500) => {
        const id = `${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        setToasts((prev) => [...prev, { id, message, type }]);
        if (duration > 0) {
            setTimeout(() => {
                setToasts((prev) => prev.filter((t) => t.id !== id));
            }, duration);
        }
    }, []);

    const dismissToast = useCallback((id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const showConfirm = useCallback(({
        title = 'Confirm Action',
        message = 'Are you sure you want to proceed?',
        subMessage = '',
        confirmText = 'Confirm',
        cancelText = 'Cancel',
        variant = 'danger',
        icon,
        onConfirm,
    }) => {
        setConfirmDialog({
            title,
            message,
            subMessage,
            confirmText,
            cancelText,
            variant,
            icon,
            onConfirm: async () => {
                setConfirmDialog(null);
                if (onConfirm) await onConfirm();
            },
            onClose: () => {
                setConfirmDialog(null);
            },
        });
    }, []);

    useEffect(() => {
        persistRuntimeMode(runtimeMode);
    }, [runtimeMode]);

    useEffect(() => {
        try {
            window.localStorage.setItem(LEGIT_MODE_STORAGE_KEY, legitMode ? '1' : '0');
        } catch {
            // ignore storage failures
        }
    }, [legitMode]);

    useEffect(() => {
        try {
            window.localStorage.setItem(HACKED_MODE_STORAGE_KEY, hackedMode ? '1' : '0');
        } catch {
            // ignore storage failures
        }
    }, [hackedMode]);

    const uploadSaveFile = async (file) => {
        if (!file) return;

        try {
            await client.uploadSave(file);
            const [mData, bpData] = await Promise.all([client.getMoney(), client.getBp()]);
            setMoney(Number(mData.money ?? 0));
            setBp(Number(bpData.bp ?? 0));
            setSaveExt(file.name.toLowerCase().endsWith('.srm') ? '.srm' : '.sav');
            setIsLoaded(true);
            showToast(`Save file '${file.name}' loaded successfully!`, 'success');
        } catch {
            showToast('Upload failed for current runtime mode.', 'error');
        }
    };

    const handleLoadDefaultSave = async () => {
        try {
            setLoadingDefault(true);
            await client.loadDefaultSave();
            const [mData, bpData] = await Promise.all([client.getMoney(), client.getBp()]);
            setMoney(Number(mData.money ?? 0));
            setBp(Number(bpData.bp ?? 0));
            setSaveExt('.sav');
            setIsLoaded(true);
            showToast("Default save 'Pokemon Unbound.sav' loaded successfully!", 'success');
        } catch (err) {
            showToast(err?.message || 'Failed to load default save file.', 'error');
        } finally {
            setLoadingDefault(false);
        }
    };

    const handleTabChange = (tabId) => {
        if (activeTab === 'bag' && tabId !== 'bag' && bagHasUnsavedChanges) {
            showConfirm({
                title: 'Unsaved Bag Changes',
                message: 'You have unsaved changes in your Bag.',
                subMessage: 'Leaving this tab will discard unwritten bag changes in memory.',
                confirmText: 'Leave Tab',
                cancelText: 'Stay in Bag',
                variant: 'warning',
                icon: AlertTriangle,
                onConfirm: () => {
                    setBagHasUnsavedChanges(false);
                    setActiveTab(tabId);
                },
            });
            return;
        }
        setActiveTab(tabId);
    };

    const handleSavePokemon = async (updatedPk) => {
        try {
            const original = selectedPokemon || {};
            const payload = {
                slot: updatedPk.slot ?? updatedPk.index ?? original.slot ?? original.index ?? 0,
                nickname: updatedPk.nickname ?? original.nickname ?? '',
                species_id: updatedPk.species_id ?? original.species_id,
                level: updatedPk.level ?? original.level ?? 1,
                level_edit: updatedPk.level_edit,
                nature: updatedPk.nature ?? original.nature,
                nature_id: updatedPk.nature_id ?? original.nature_id,
                held_item_id: updatedPk.held_item_id ?? updatedPk.item_id ?? original.held_item_id ?? original.item_id ?? 0,
                item_id: updatedPk.item_id ?? updatedPk.held_item_id ?? original.item_id ?? original.held_item_id ?? 0,
                ball_id: updatedPk.ball_id ?? original.ball_id,
                happiness: updatedPk.happiness ?? original.happiness,
                current_ability_index: updatedPk.current_ability_index ?? original.current_ability_index ?? 0,
                ability_slot: updatedPk.ability_slot ?? original.ability_slot ?? 'Ability 1',
                shiny: Boolean(updatedPk.is_shiny ?? updatedPk.shiny),
                is_shiny: Boolean(updatedPk.is_shiny ?? updatedPk.shiny),
                ivs: updatedPk.ivs ?? original.ivs,
                evs: updatedPk.evs ?? original.evs,
                moves: updatedPk.moves ?? original.moves,
                move_pp: updatedPk.move_pp ?? updatedPk.pps ?? original.move_pp ?? original.pps,
                move_pp_ups: updatedPk.move_pp_ups ?? updatedPk.pp_ups ?? original.move_pp_ups ?? original.pp_ups,
                pps: updatedPk.pps ?? updatedPk.move_pp ?? original.pps ?? original.move_pp,
                pp_ups: updatedPk.pp_ups ?? updatedPk.move_pp_ups ?? original.pp_ups ?? original.move_pp_ups,
            };

            if (
                typeof updatedPk.gender === 'string' &&
                (updatedPk.gender === 'male' || updatedPk.gender === 'female' || updatedPk.gender === 'genderless')
            ) {
                payload.gender = updatedPk.gender;
            }

            await client.editParty(payload);
            await client.saveAll();
            setSelectedPokemon(null);
            setRefreshKey((prev) => prev + 1);
            showToast('Party Pokemon updated successfully!', 'success');
        } catch (err) {
            console.error('Failed to save party Pokemon changes:', err);
            showToast(err?.message ? `Failed to save party Pokemon: ${err.message}` : 'Failed to save party Pokemon changes.', 'error');
        }
    };

    const handleSavePC = async (updatedPk) => {
        try {
            const original = selectedPokemon || {};
            const payload = {
                box: updatedPk.box ?? original.box,
                slot: updatedPk.slot ?? original.slot,
                moves: updatedPk.moves ?? original.moves,
                move_pp: updatedPk.move_pp ?? updatedPk.pps ?? original.move_pp ?? original.pps,
                move_pp_ups: updatedPk.move_pp_ups ?? updatedPk.pp_ups ?? original.move_pp_ups ?? original.pp_ups,
                pps: updatedPk.pps ?? updatedPk.move_pp ?? original.pps ?? original.move_pp,
                pp_ups: updatedPk.pp_ups ?? updatedPk.move_pp_ups ?? original.pp_ups ?? original.move_pp_ups,
                ivs: updatedPk.ivs ?? original.ivs,
                evs: updatedPk.evs ?? original.evs,
                nature: updatedPk.nature ?? original.nature,
                nature_id: updatedPk.nature_id ?? original.nature_id,
                held_item_id: updatedPk.held_item_id ?? updatedPk.item_id ?? original.held_item_id ?? original.item_id,
                item_id: updatedPk.item_id ?? updatedPk.held_item_id ?? original.item_id ?? original.held_item_id,
                ball_id: updatedPk.ball_id ?? original.ball_id,
                happiness: updatedPk.happiness ?? original.happiness,
            };

            if (typeof updatedPk.nickname === 'string' && updatedPk.nickname !== original.nickname) {
                payload.nickname = updatedPk.nickname || '';
            }

            if (Number(updatedPk.current_ability_index) !== Number(original.current_ability_index)) {
                payload.current_ability_index = Number(updatedPk.current_ability_index);
            }

            if (updatedPk.species_id !== selectedPokemon?.species_id) {
                payload.species_id = updatedPk.species_id;
            }

            if (Boolean(updatedPk.is_shiny ?? updatedPk.shiny) !== Boolean(original.is_shiny ?? original.shiny)) {
                payload.shiny = Boolean(updatedPk.is_shiny ?? updatedPk.shiny);
            }

            if (
                typeof updatedPk.gender === 'string' &&
                updatedPk.gender !== original.gender &&
                (updatedPk.gender === 'male' || updatedPk.gender === 'female' || updatedPk.gender === 'genderless')
            ) {
                payload.gender = updatedPk.gender;
            }

            if (updatedPk.level_edit) {
                const targetLevel = Math.max(1, Math.min(100, Number(updatedPk.level_edit.target_level || 1)));
                let growthRate;
                if (updatedPk.level_edit.growth_rate === null || updatedPk.level_edit.growth_rate === undefined || updatedPk.level_edit.growth_rate === '') {
                    const speciesGrowth = getSpeciesGrowthRate(updatedPk.species_id);
                    growthRate = speciesGrowth === null ? 0 : speciesGrowth;
                } else {
                    growthRate = Math.max(0, Math.min(5, Number(updatedPk.level_edit.growth_rate)));
                }
                payload.exp = getExpAtLevel(growthRate, targetLevel);
            }

            await client.editPcFull(payload);
            await client.saveAll();
            setSelectedPokemon(null);
            setRefreshKey((prev) => prev + 1);
            showToast('PC Box updated successfully!', 'success');
        } catch (err) {
            console.error('Failed to save PC Pokemon changes:', err);
            showToast(err?.message ? `Failed to save PC Box: ${err.message}` : 'Failed to save PC Box.', 'error');
        }
    };

    const handleInsertPcPokemon = async (payload) => {
        try {
            await client.insertPc(payload);
            await client.saveAll();
            setPcInsertTarget(null);
            setRefreshKey((prev) => prev + 1);
            showToast('Pokemon inserted successfully!', 'success');
        } catch {
            showToast('Failed to add Pokemon to PC box.', 'error');
        }
    };

    const handleReleasePC = ({ box, slot, pokemon }) => {
        const label = pokemon?.nickname || pokemon?.species_name || 'this Pokémon';
        const boxLabel = Number(box) === 26 ? 'Preset' : `Box ${box}`;
        showConfirm({
            title: 'Release Pokémon',
            message: `Are you sure you want to release ${label} from ${boxLabel} (Slot ${slot})?`,
            subMessage: 'This Pokémon will be permanently released from your PC box in memory.',
            confirmText: 'Release',
            cancelText: 'Cancel',
            variant: 'danger',
            icon: Trash2,
            onConfirm: async () => {
                try {
                    await client.releasePc({ box, slot });
                    await client.saveAll();
                    setRefreshKey((prev) => prev + 1);
                    showToast(`${label} was released successfully.`, 'success');
                } catch {
                    showToast('Failed to release Pokémon.', 'error');
                }
            },
        });
    };

    const handleUpdateResources = async (amount, bpAmount) => {
        try {
            await Promise.all([client.updateMoney(amount), client.updateBp(bpAmount)]);
            const [mData, bpData] = await Promise.all([client.getMoney(), client.getBp()]);
            setMoney(Number(mData.money ?? amount));
            setBp(Number(bpData.bp ?? bpAmount));
            setShowResourcesModal(false);
            showToast('Resources updated successfully!', 'success');
        } catch (err) {
            console.error(err);
            showToast('Failed to update resources.', 'error');
        }
    };

    const handleDownload = async () => {
        setShowSaveReport(true);
        setSaveReport(null);
        setSaveReportError('');
        setSaveReportLoading(true);
        try {
            setSaveReport(await client.getSaveReport());
        } catch (err) {
            console.error(err);
            setSaveReportError('Could not inspect this save. Try again before downloading.');
        } finally {
            setSaveReportLoading(false);
        }
    };

    const confirmDownload = async () => {
        if (!saveReport) return;
        try {
            await client.downloadSave();
            setShowSaveReport(false);
        } catch (err) {
            console.error(err);
            setSaveReportError('Download failed. Your in-memory save is still loaded.');
        }
    };

    const handleExitApp = () => {
        showConfirm({
            title: 'Exit Save File',
            message: 'Exit current save file and return to the main menu?',
            subMessage: 'Any unsaved progress in this session will be discarded.',
            confirmText: 'Exit to Menu',
            cancelText: 'Stay in Editor',
            variant: 'danger',
            icon: LogOut,
            onConfirm: () => {
                setIsLoaded(false);
                setActiveTab('party');
                setSelectedPokemon(null);
                setPcInsertTarget(null);
                setSaveReport(null);
                setShowSaveReport(false);
                setShowResourcesModal(false);
                setIsMobileSidebarOpen(false);
                setBagHasUnsavedChanges(false);
            },
        });
    };

    return (
        <div className="min-h-screen bg-[#0f172a] text-slate-100 flex flex-col md:flex-row">
            {/* Sidebar Navigation */}
            {isLoaded && (
                <Sidebar
                    activeTab={activeTab}
                    onTabChange={handleTabChange}
                    money={money}
                    bp={bp}
                    saveExt={saveExt}
                    onOpenResources={() => setShowResourcesModal(true)}
                    onExit={handleExitApp}
                    onDownload={handleDownload}
                    isMobileOpen={isMobileSidebarOpen}
                    onCloseMobile={() => setIsMobileSidebarOpen(false)}
                />
            )}

            {/* Main Application Area */}
            <div className="flex-1 flex flex-col min-w-0 min-h-screen">
                <TopHeader
                    isLoaded={isLoaded}
                    activeTab={activeTab}
                    runtimeMode={runtimeMode}
                    onRuntimeModeChange={setRuntimeMode}
                    legitMode={legitMode}
                    onToggleLegit={() => setLegitMode((prev) => !prev)}
                    hackedMode={hackedMode}
                    onToggleHacked={() => setHackedMode((prev) => !prev)}
                    showLegitHelp={showLegitHelp}
                    onToggleLegitHelp={() => setShowLegitHelp((prev) => !prev)}
                    onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
                />

                <main className={`flex-1 w-full ${isLoaded ? 'p-4 md:p-6 lg:p-8 max-w-7xl' : 'px-4 py-6 md:px-8 md:py-8 max-w-7xl'} mx-auto`}>
                    {!isLoaded ? (
                        <LandingView
                            client={client}
                            onUploadSave={uploadSaveFile}
                            onLoadDefaultSave={handleLoadDefaultSave}
                            loadingDefault={loadingDefault}
                            showToast={showToast}
                        />
                    ) : (
                        <div className="animate-in fade-in duration-300">
                            <Suspense
                                fallback={
                                    <div className="py-24 text-center text-slate-400 animate-pulse space-y-3">
                                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                                        <p className="text-sm font-semibold">Loading editor section...</p>
                                    </div>
                                }
                            >
                                {activeTab === 'party' && (
                                    <PartyGrid
                                        key={`party-${refreshKey}`}
                                        client={client}
                                        onEditPokemon={(pk) => setSelectedPokemon(pk)}
                                    />
                                )}
                                {activeTab === 'coverage' && (
                                    <CoverageView
                                        key={`coverage-${refreshKey}`}
                                        client={client}
                                    />
                                )}
                                {activeTab === 'pc' && (
                                    <PCGrid
                                        key={`pc-${refreshKey}`}
                                        client={client}
                                        boxId={pcBoxId}
                                        onBoxChange={setPcBoxId}
                                        onEditPokemon={(pk) => setSelectedPokemon({ ...pk, isPC: true })}
                                        onAddPokemon={(target) => setPcInsertTarget(target)}
                                        onReleasePokemon={handleReleasePC}
                                    />
                                )}
                                {activeTab === 'all' && (
                                    <AllPokemonTable
                                        key={`all-${refreshKey}`}
                                        client={client}
                                    />
                                )}
                                {activeTab === 'bag' && (
                                    <BagView
                                        client={client}
                                        initialUnsaved={bagHasUnsavedChanges}
                                        onDirtyChange={setBagHasUnsavedChanges}
                                        showToast={showToast}
                                        showConfirm={showConfirm}
                                    />
                                )}
                                {activeTab === 'dex' && (
                                    <LivingDexPanel
                                        key={`dex-${refreshKey}`}
                                        client={client}
                                    />
                                )}
                            </Suspense>
                        </div>
                    )}
                </main>
            </div>

            {/* Modals & Dialogs */}
            {showResourcesModal && (
                <ResourcesModal
                    initialMoney={money}
                    initialBp={bp}
                    onClose={() => setShowResourcesModal(false)}
                    onApply={handleUpdateResources}
                />
            )}

            {showSaveReport && (
                <SaveReportModal
                    saveReport={saveReport}
                    saveReportLoading={saveReportLoading}
                    saveReportError={saveReportError}
                    saveExt={saveExt}
                    onClose={() => setShowSaveReport(false)}
                    onConfirmDownload={confirmDownload}
                />
            )}

            {selectedPokemon && (
                <Suspense fallback={null}>
                    <PokemonEditorModal
                        client={client}
                        pokemon={selectedPokemon}
                        legitMode={legitMode}
                        hackedMode={hackedMode}
                        onClose={() => setSelectedPokemon(null)}
                        onSave={selectedPokemon?.isPC ? handleSavePC : handleSavePokemon}
                        showToast={showToast}
                    />
                </Suspense>
            )}

            {pcInsertTarget && (
                <Suspense fallback={null}>
                    <AddPcPokemonModal
                        client={client}
                        target={pcInsertTarget}
                        legitMode={legitMode}
                        hackedMode={hackedMode}
                        onClose={() => setPcInsertTarget(null)}
                        onConfirm={handleInsertPcPokemon}
                    />
                </Suspense>
            )}

            {/* Confirmation Modal */}
            {confirmDialog && (
                <ConfirmModal
                    isOpen={Boolean(confirmDialog)}
                    title={confirmDialog.title}
                    message={confirmDialog.message}
                    subMessage={confirmDialog.subMessage}
                    confirmText={confirmDialog.confirmText}
                    cancelText={confirmDialog.cancelText}
                    variant={confirmDialog.variant}
                    icon={confirmDialog.icon}
                    onConfirm={confirmDialog.onConfirm}
                    onClose={confirmDialog.onClose}
                />
            )}

            {/* Notification Toasts */}
            <ToastContainer toasts={toasts} onDismiss={dismissToast} />
        </div>
    );
}
