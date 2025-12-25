import React, { useState, useMemo } from 'react';
import type { Match, Player, TournamentConfig } from '../types';
import MatchCard from './MatchCard';
import TournamentReport from './TournamentReport';
import EditTournamentModal from './EditTournamentModal';
import { generateReport } from '../tournamentUtils';
import './TournamentView.css';

interface TournamentViewProps {
  matches: Match[];
  players: Player[];
  config: TournamentConfig;
  warnings: string[];
  onEditSetup: () => void;
  onStartFresh: () => void;
  onUpdateMatch: (matchId: string, match: Match) => void;
  onUpdateTournament: (players: Player[], matches: Match[]) => void;
}

interface Round {
  time: string;
  matches: Match[];
}

const TournamentView: React.FC<TournamentViewProps> = ({
  matches,
  players,
  config,
  warnings,
  onEditSetup,
  onStartFresh,
  onUpdateMatch,
  onUpdateTournament,
}) => {
  const [showReport, setShowReport] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [filterCourt, setFilterCourt] = useState<string>('all');
  const [expandedRounds, setExpandedRounds] = useState<Set<string>>(new Set());
  const [showSetupOptions, setShowSetupOptions] = useState(false);

  const completedMatches = matches.filter(m => m.completed).length;
  const totalMatches = matches.length;

  // Group matches into rounds by time slot
  const rounds: Round[] = useMemo(() => {
    const filteredMatches = filterCourt === 'all' 
      ? matches 
      : matches.filter(m => m.court === filterCourt);

    // Group by time
    const timeGroups = new Map<string, Match[]>();
    filteredMatches.forEach(match => {
      const existing = timeGroups.get(match.time) || [];
      existing.push(match);
      timeGroups.set(match.time, existing);
    });

    // Convert to rounds array and sort by time
    const roundsArray = Array.from(timeGroups.entries()).map(([time, matches]) => ({
      time,
      matches: matches.sort((a, b) => a.court.localeCompare(b.court)),
    }));

    // Sort rounds by time
    roundsArray.sort((a, b) => a.time.localeCompare(b.time));

    return roundsArray;
  }, [matches, filterCourt]);

  // Auto-expand first incomplete round
  React.useEffect(() => {
    if (expandedRounds.size === 0 && rounds.length > 0) {
      const firstIncompleteRound = rounds.find(round => 
        round.matches.some(m => !m.completed)
      );
      if (firstIncompleteRound) {
        setExpandedRounds(new Set([firstIncompleteRound.time]));
      } else {
        // All complete, expand first round
        setExpandedRounds(new Set([rounds[0].time]));
      }
    }
  }, [rounds, expandedRounds.size]);

  const toggleRound = (time: string) => {
    const newExpanded = new Set(expandedRounds);
    if (newExpanded.has(time)) {
      newExpanded.delete(time);
    } else {
      newExpanded.add(time);
    }
    setExpandedRounds(newExpanded);
  };

  const expandAll = () => {
    setExpandedRounds(new Set(rounds.map(r => r.time)));
  };

  const collapseAll = () => {
    setExpandedRounds(new Set());
  };

  // Function to get players on the bench for a specific round
  const getPlayersOnBench = (round: Round): Player[] => {
    const playingPlayerIds = new Set<string>();
    round.matches.forEach(match => {
      match.team1.forEach(p => playingPlayerIds.add(p.id));
      match.team2.forEach(p => playingPlayerIds.add(p.id));
    });
    
    return players.filter(p => !playingPlayerIds.has(p.id));
  };

  const handleGenerateReport = () => {
    setShowReport(true);
  };

  const handleEditTournament = () => {
    setShowEditModal(true);
  };

  const handleSaveEdit = (updatedPlayers: Player[], updatedMatches: Match[]) => {
    onUpdateTournament(updatedPlayers, updatedMatches);
    setShowEditModal(false);
  };

  if (showReport) {
    const report = generateReport(matches, players, config.tournamentName);
    return (
      <TournamentReport 
        report={report} 
        onBack={() => setShowReport(false)} 
      />
    );
  }

  return (
    <div className="tournament-view">
      <div className="tournament-header">
        <button type="button" onClick={() => setShowSetupOptions(true)} className="btn-back">
          ← Setup
        </button>
        <div className="tournament-title">
          <h1>{config.tournamentName}</h1>
          <div className="tournament-info">
            <span className="game-type-badge">{config.gameType.toUpperCase()}</span>
            <span className="progress-badge">
              {completedMatches} / {totalMatches} Matches Completed
            </span>
          </div>
        </div>
        <div className="header-actions">
          <button type="button" onClick={handleEditTournament} className="btn-edit">
            ✏️ Edit Tournament
          </button>
          <button
            type="button"
            onClick={handleGenerateReport}
            className="btn-report"
            disabled={completedMatches === 0}
          >
            📊 View Report
          </button>
        </div>
      </div>

      {warnings.length > 0 && (
        <div className="warnings-section">
          <h3>⚠️ Warnings</h3>
          {warnings.map((warning, idx) => (
            <div key={idx} className="warning-message">
              {warning}
            </div>
          ))}
          {config.allowBypass && (
            <div className="bypass-info">
              ℹ️ Bypass mode is enabled. These constraints could not be fully satisfied.
            </div>
          )}
        </div>
      )}

      <div className="controls-section">
        <div className="filter-section">
          <label>Filter by Court:</label>
          <select value={filterCourt} onChange={(e) => setFilterCourt(e.target.value)}>
            <option value="all">All Courts</option>
            {config.courts.map(court => (
              <option key={court} value={court}>{court}</option>
            ))}
          </select>
        </div>

        <div className="round-controls">
          <button type="button" onClick={expandAll} className="btn-expand">Expand All</button>
          <button type="button" onClick={collapseAll} className="btn-collapse">Collapse All</button>
        </div>
      </div>

      {rounds.length === 0 ? (
        <div className="no-matches">
          No matches found for this filter.
        </div>
      ) : (
        <div className="rounds-container">
          {rounds.map((round, roundIndex) => {
            const roundCompleted = round.matches.every(m => m.completed);
            const roundInProgress = round.matches.some(m => m.completed) && !roundCompleted;
            const isExpanded = expandedRounds.has(round.time);
            const matchesId = `round-${roundIndex}-matches`;

            return (
              <div
                key={round.time}
                className={`round-section ${roundCompleted ? 'completed' : ''} ${roundInProgress ? 'in-progress' : ''}`}
              >
                <button
                  type="button"
                  className="round-header"
                  onClick={() => toggleRound(round.time)}
                  aria-expanded={isExpanded}
                  aria-controls={isExpanded ? matchesId : undefined}
                >
                  <div className="round-header-left">
                    <span className="round-toggle">
                      {isExpanded ? '▼' : '▶'}
                    </span>
                    <h3 className="round-title">
                      Round {roundIndex + 1}
                    </h3>
                    <span className="round-time">⏰ {round.time}</span>
                  </div>
                  <div className="round-header-right">
                    <span className="round-progress">
                      {round.matches.filter(m => m.completed).length} / {round.matches.length} Complete
                    </span>
                    {roundCompleted && <span className="round-badge completed-badge">✓ Done</span>}
                    {roundInProgress && <span className="round-badge progress-badge">In Progress</span>}
                    {!roundCompleted && !roundInProgress && (
                      <span className="round-badge pending-badge">Pending</span>
                    )}
                  </div>
                </button>

                {isExpanded && (
                  <div className="round-matches" id={matchesId}>
                    <div className="matches-grid">
                      {round.matches.map(match => (
                        <MatchCard
                          key={match.id}
                          match={match}
                          config={config}
                          onUpdateMatch={onUpdateMatch}
                        />
                      ))}
                    </div>
                    {getPlayersOnBench(round).length > 0 && (
                      <div className="bench-section">
                        <h4 className="bench-title">🪑 On the Bench:</h4>
                        <div className="bench-players">
                          {getPlayersOnBench(round).map(player => (
                            <span key={player.id} className="bench-player">
                              {player.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showEditModal && (
        <EditTournamentModal
          players={players}
          matches={matches}
          config={config}
          onClose={() => setShowEditModal(false)}
          onSave={handleSaveEdit}
        />
      )}

      {showSetupOptions && (
        <div className="setup-overlay">
          <div className="setup-modal">
            <h3>Return to setup</h3>
            <p>Would you like to adjust the current setup or start fresh?</p>
            <div className="setup-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setShowSetupOptions(false);
                  onEditSetup();
                }}
              >
                Edit current setup
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={() => {
                  setShowSetupOptions(false);
                  onStartFresh();
                }}
              >
                Start fresh
              </button>
              <button type="button" className="btn-tertiary" onClick={() => setShowSetupOptions(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TournamentView;
