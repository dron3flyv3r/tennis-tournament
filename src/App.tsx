import { useCallback, useEffect, useMemo, useState } from 'react';
import ConfigPanel from './components/ConfigPanel';
import TournamentView from './components/TournamentView';
import { ToastProvider, useToast } from './components/ToastContext';
import type { Player, TournamentConfig, Match, WarningMessage } from './types';
import { generateMatches } from './tournamentUtils';
import {
  saveTournamentState,
  loadTournamentState,
  clearTournamentState,
  hasSavedTournamentState,
} from './cookieUtils';
import { I18nProvider, useI18n } from './i18n';
import './App.css';

interface WarningDialogState {
  warnings: WarningMessage[];
  matches: Match[];
  config: TournamentConfig;
  players: Player[];
  allowProceed: boolean;
}

function AppContent() {
  const { showToast } = useToast();
  const { t } = useI18n();
  const createDefaultConfig = useCallback(
    (): TournamentConfig => ({
      tournamentName: t('defaults.tournamentName'),
      gameType: 'singles',
      doublesPartnerMode: 'fixed',
      scoringMode: 'sets',
      courts: [t('defaults.court', { number: 1 }), t('defaults.court', { number: 2 })],
      startTime: '09:00',
      matchDuration: 60,
      breakDuration: 0,
      scheduledBreaks: [],
      enforceNonRepeatingMatches: true,
      enforceFairMatches: true,
      allowBypass: true,
    }),
    [t]
  );
  const createDefaultPlayers = useCallback(
    (): Player[] => [
      { id: '1', name: t('defaults.player', { number: 1 }), skillLevel: 5 },
      { id: '2', name: t('defaults.player', { number: 2 }), skillLevel: 5 },
    ],
    [t]
  );
  const [tournamentStarted, setTournamentStarted] = useState(false);
  const [editingSetup, setEditingSetup] = useState(false);
  const [matches, setMatches] = useState<Match[]>([]);
  const [players, setPlayers] = useState<Player[]>(() => createDefaultPlayers());
  const [config, setConfig] = useState<TournamentConfig>(() => createDefaultConfig());
  const [warnings, setWarnings] = useState<WarningMessage[]>([]);
  const [showLoadPrompt, setShowLoadPrompt] = useState(false);
  const [pendingWarning, setPendingWarning] = useState<WarningDialogState | null>(null);

  const hasExistingTournament = useMemo(
    () => matches.length > 0 || warnings.length > 0,
    [matches.length, warnings.length]
  );

  useEffect(() => {
    if (hasSavedTournamentState()) {
      setShowLoadPrompt(true);
    }
  }, []);

  useEffect(() => {
    if (tournamentStarted && config) {
      saveTournamentState({
        config,
        players,
        matches,
        warnings,
        tournamentStarted,
      });
      showToast(t('app.toast.saved'), 'success', 1500);
    }
  }, [tournamentStarted, config, players, matches, warnings, showToast, t]);

  const handleLoadSavedTournament = () => {
    const savedState = loadTournamentState();
    if (savedState) {
      setConfig(savedState.config);
      setPlayers(savedState.players);
      setMatches(savedState.matches);
      setWarnings(savedState.warnings);
      setTournamentStarted(savedState.tournamentStarted);
    }
    setEditingSetup(false);
    setShowLoadPrompt(false);
  };

  const resetToDefaults = () => {
    setConfig(createDefaultConfig());
    setPlayers(createDefaultPlayers());
    setMatches([]);
    setWarnings([]);
  };

  const handleStartFresh = () => {
    clearTournamentState();
    resetToDefaults();
    setTournamentStarted(false);
    setEditingSetup(false);
    setShowLoadPrompt(false);
  };

  const syncMatchesWithPlayers = (existingMatches: Match[], updatedPlayers: Player[]) =>
    existingMatches.map(match => ({
      ...match,
      team1: match.team1
        .map(player => updatedPlayers.find(p => p.id === player.id))
        .filter(Boolean) as Player[],
      team2: match.team2
        .map(player => updatedPlayers.find(p => p.id === player.id))
        .filter(Boolean) as Player[],
    }));

  const finalizeTournament = (
    newConfig: TournamentConfig,
    newPlayers: Player[],
    newMatches: Match[],
    newWarnings: WarningMessage[]
  ) => {
    setMatches(newMatches);
    setPlayers(newPlayers);
    setConfig(newConfig);
    setWarnings(newWarnings);
    setPendingWarning(null);
    setTournamentStarted(true);
    setEditingSetup(false);
  };

  const handleStartTournament = (newConfig: TournamentConfig, newPlayers: Player[]) => {
    const result = generateMatches(newPlayers, newConfig);

    if (result.warnings.length > 0) {
      setPendingWarning({
        warnings: result.warnings,
        matches: result.matches,
        config: newConfig,
        players: newPlayers,
        allowProceed: newConfig.allowBypass,
      });
      return;
    }

    finalizeTournament(newConfig, newPlayers, result.matches, result.warnings);
  };

  const handleConfirmWarning = () => {
    if (!pendingWarning || !pendingWarning.allowProceed) {
      setPendingWarning(null);
      return;
    }

    finalizeTournament(
      pendingWarning.config,
      pendingWarning.players,
      pendingWarning.matches,
      pendingWarning.warnings
    );
  };

  const handleUpdateMatch = (matchId: string, updatedMatch: Match) => {
    setMatches(prev => prev.map(m => (m.id === matchId ? updatedMatch : m)));
  };

  const handleUpdateTournament = (updatedPlayers: Player[], updatedMatches: Match[]) => {
    setPlayers(updatedPlayers);
    setMatches(updatedMatches);
  };

  const handleEditSetup = () => {
    setEditingSetup(true);
    setTournamentStarted(false);
  };

  const handleSaveSetupOnly = (updatedConfig: TournamentConfig, updatedPlayers: Player[]) => {
    setConfig(updatedConfig);
    setPlayers(updatedPlayers);
    setMatches(syncMatchesWithPlayers(matches, updatedPlayers));
    setEditingSetup(false);
    setTournamentStarted(true);
    showToast(t('app.toast.setupUpdated'), 'success');
  };

  const handleCancelEdit = () => {
    setEditingSetup(false);
    setTournamentStarted(true);
  };

  const handleCloseWarning = () => {
    setPendingWarning(null);
  };

  const shouldShowConfig = !tournamentStarted || editingSetup;

  if (showLoadPrompt) {
    return (
      <div className="app">
        <div className="load-prompt-overlay">
          <div className="load-prompt-modal">
            <h2>{t('app.loadPrompt.title')}</h2>
            <p>{t('app.loadPrompt.message')}</p>
            <div className="load-prompt-actions">
              <button onClick={handleStartFresh} className="btn-start-fresh">
                {t('app.loadPrompt.startFresh')}
              </button>
              <button onClick={handleLoadSavedTournament} className="btn-load-saved">
                {t('app.loadPrompt.continue')}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      {shouldShowConfig ? (
        <ConfigPanel
          key={editingSetup ? 'edit-config' : 'new-config'}
          mode={editingSetup ? 'edit' : 'new'}
          initialConfig={config}
          initialPlayers={players}
          onStartTournament={handleStartTournament}
          onSaveConfigOnly={hasExistingTournament ? handleSaveSetupOnly : undefined}
          onCancelEdit={hasExistingTournament ? handleCancelEdit : undefined}
        />
      ) : (
        <TournamentView
          matches={matches}
          players={players}
          config={config}
          warnings={warnings}
          onEditSetup={handleEditSetup}
          onStartFresh={handleStartFresh}
          onUpdateMatch={handleUpdateMatch}
          onUpdateTournament={handleUpdateTournament}
        />
      )}

      {pendingWarning && (
        <div className="warning-overlay">
          <div className="warning-modal">
            <h3>{t('app.warning.title')}</h3>
            <ul className="warning-list">
              {pendingWarning.warnings.map((warning, idx) => (
                <li key={idx}>
                  {warning.id === 'legacy'
                    ? warning.message ?? ''
                    : t(`warnings.${warning.id}`, warning.values)}
                </li>
              ))}
            </ul>
            <div className="warning-actions">
              <button className="btn-secondary" onClick={handleCloseWarning}>
                {t('app.warning.adjust')}
              </button>
              {pendingWarning.allowProceed && (
                <button className="btn-primary" onClick={handleConfirmWarning}>
                  {t('app.warning.regenerate')}
                </button>
              )}
            </div>
            {!pendingWarning.allowProceed && (
              <p className="warning-note">
                {t('app.warning.bypassDisabled')}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function App() {
  return (
    <I18nProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </I18nProvider>
  );
}

export default App;
