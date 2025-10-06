import { useState, useEffect } from 'react';
import ConfigPanel from './components/ConfigPanel';
import TournamentView from './components/TournamentView';
import type { Player, TournamentConfig, Match } from './types';
import { generateMatches } from './tournamentUtils';
import { saveTournamentState, loadTournamentState, clearTournamentState, hasSavedTournamentState } from './cookieUtils';
import './App.css';

function App() {
  const [tournamentStarted, setTournamentStarted] = useState(false);
  const [matches, setMatches] = useState<Match[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [config, setConfig] = useState<TournamentConfig | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [showLoadPrompt, setShowLoadPrompt] = useState(false);

  // Load saved tournament on mount
  useEffect(() => {
    if (hasSavedTournamentState()) {
      setShowLoadPrompt(true);
    }
  }, []);

  // Save tournament state whenever it changes
  useEffect(() => {
    if (tournamentStarted && config) {
      saveTournamentState({
        config,
        players,
        matches,
        warnings,
        tournamentStarted,
      });
    }
  }, [tournamentStarted, config, players, matches, warnings]);

  const handleLoadSavedTournament = () => {
    const savedState = loadTournamentState();
    if (savedState) {
      setConfig(savedState.config);
      setPlayers(savedState.players);
      setMatches(savedState.matches);
      setWarnings(savedState.warnings);
      setTournamentStarted(savedState.tournamentStarted);
    }
    setShowLoadPrompt(false);
  };

  const handleStartFresh = () => {
    clearTournamentState();
    setShowLoadPrompt(false);
  };

  const handleStartTournament = (newConfig: TournamentConfig, newPlayers: Player[]) => {
    const result = generateMatches(newPlayers, newConfig);
    
    // Show warnings if any and allow bypass
    if (result.warnings.length > 0 && newConfig.allowBypass) {
      const proceed = window.confirm(
        `Warning: ${result.warnings.join('\n')}\n\nDo you want to proceed with the tournament generation?`
      );
      if (!proceed) {
        return;
      }
    } else if (result.warnings.length > 0 && !newConfig.allowBypass) {
      alert(`Cannot generate tournament:\n${result.warnings.join('\n')}`);
      return;
    }

    setMatches(result.matches);
    setPlayers(newPlayers);
    setConfig(newConfig);
    setWarnings(result.warnings);
    setTournamentStarted(true);
  };

  const handleUpdateMatch = (matchId: string, updatedMatch: Match) => {
    setMatches(matches.map(m => m.id === matchId ? updatedMatch : m));
  };

  const handleUpdateTournament = (updatedPlayers: Player[], updatedMatches: Match[]) => {
    setPlayers(updatedPlayers);
    setMatches(updatedMatches);
  };

  const handleBack = () => {
    const confirm = window.confirm(
      'Going back will keep your tournament saved. Do you want to start a new tournament?\n\nClick OK to clear and start fresh, or Cancel to keep the current tournament.'
    );
    
    if (confirm) {
      clearTournamentState();
      setTournamentStarted(false);
      setMatches([]);
      setPlayers([]);
      setConfig(null);
      setWarnings([]);
    } else {
      // Just go back to view, keeping state
      setTournamentStarted(false);
    }
  };

  if (showLoadPrompt) {
    return (
      <div className="app">
        <div className="load-prompt-overlay">
          <div className="load-prompt-modal">
            <h2>🎾 Welcome Back!</h2>
            <p>We found a saved tournament. Would you like to continue where you left off?</p>
            <div className="load-prompt-actions">
              <button onClick={handleStartFresh} className="btn-start-fresh">
                Start Fresh
              </button>
              <button onClick={handleLoadSavedTournament} className="btn-load-saved">
                Continue Tournament
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      {!tournamentStarted ? (
        <ConfigPanel onStartTournament={handleStartTournament} />
      ) : (
        <TournamentView
          matches={matches}
          players={players}
          config={config!}
          warnings={warnings}
          onBack={handleBack}
          onUpdateMatch={handleUpdateMatch}
          onUpdateTournament={handleUpdateTournament}
        />
      )}
    </div>
  );
}

export default App;
