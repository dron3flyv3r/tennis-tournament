import React, { useState } from 'react';
import type { Player, Match, TournamentConfig } from '../types';
import './EditTournamentModal.css';

interface EditTournamentModalProps {
  players: Player[];
  matches: Match[];
  config: TournamentConfig;
  onClose: () => void;
  onSave: (players: Player[], matches: Match[]) => void;
}

const EditTournamentModal: React.FC<EditTournamentModalProps> = ({
  players,
  matches,
  config,
  onClose,
  onSave,
}) => {
  const [editedPlayers, setEditedPlayers] = useState<Player[]>([...players]);
  const [editedMatches, setEditedMatches] = useState<Match[]>([...matches]);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerSkill, setNewPlayerSkill] = useState(5);
  const [activeTab, setActiveTab] = useState<'players' | 'matches'>('players');

  const handleAddPlayer = () => {
    if (newPlayerName.trim()) {
      const newPlayer: Player = {
        id: Date.now().toString(),
        name: newPlayerName.trim(),
        skillLevel: newPlayerSkill,
      };
      setEditedPlayers([...editedPlayers, newPlayer]);
      setNewPlayerName('');
      setNewPlayerSkill(5);
    }
  };

  const handleRemovePlayer = (playerId: string) => {
    // Check if player is in any match
    const playerInMatches = editedMatches.some(
      match => 
        match.team1.some(p => p.id === playerId) || 
        match.team2.some(p => p.id === playerId)
    );

    if (playerInMatches) {
      alert('Cannot remove player who is assigned to matches. Please remove them from matches first.');
      return;
    }

    setEditedPlayers(editedPlayers.filter(p => p.id !== playerId));
  };

  const handleUpdatePlayer = (playerId: string, field: keyof Player, value: string | number) => {
    setEditedPlayers(editedPlayers.map(p => 
      p.id === playerId ? { ...p, [field]: value } : p
    ));

    // Update player info in all matches
    setEditedMatches(editedMatches.map(match => ({
      ...match,
      team1: match.team1.map(p => 
        p.id === playerId ? { ...p, [field]: value } : p
      ),
      team2: match.team2.map(p => 
        p.id === playerId ? { ...p, [field]: value } : p
      ),
    })));
  };

  const handleDeleteMatch = (matchId: string) => {
    if (window.confirm('Are you sure you want to delete this match?')) {
      setEditedMatches(editedMatches.filter(m => m.id !== matchId));
    }
  };

  const handleAddMatch = () => {
    const newMatch: Match = {
      id: `match-${Date.now()}`,
      court: config.courts[0] || 'Court 1',
      time: '00:00',
      team1: [],
      team2: [],
      completed: false,
    };
    setEditedMatches([...editedMatches, newMatch]);
  };

  const handleUpdateMatchPlayer = (
    matchId: string, 
    team: 'team1' | 'team2', 
    index: number, 
    playerId: string
  ) => {
    const player = editedPlayers.find(p => p.id === playerId);
    if (!player) return;

    setEditedMatches(editedMatches.map(match => {
      if (match.id !== matchId) return match;

      const newMatch = { ...match };
      const teamArray = [...newMatch[team]];
      
      if (index < teamArray.length) {
        teamArray[index] = player;
      } else {
        teamArray.push(player);
      }
      
      newMatch[team] = teamArray;
      return newMatch;
    }));
  };

  const handleRemovePlayerFromMatch = (
    matchId: string,
    team: 'team1' | 'team2',
    index: number
  ) => {
    setEditedMatches(editedMatches.map(match => {
      if (match.id !== matchId) return match;

      const newMatch = { ...match };
      newMatch[team] = newMatch[team].filter((_, i) => i !== index);
      return newMatch;
    }));
  };

  const handleUpdateMatchDetails = (
    matchId: string,
    field: 'court' | 'time',
    value: string
  ) => {
    setEditedMatches(editedMatches.map(match =>
      match.id === matchId ? { ...match, [field]: value } : match
    ));
  };

  const handleSave = () => {
    // Validation
    if (editedPlayers.length < 2) {
      alert('Tournament must have at least 2 players.');
      return;
    }

    // Check if all matches have valid players
    const invalidMatches = editedMatches.filter(match => {
      const minPlayers = config.gameType === 'singles' ? 1 : 2;
      return match.team1.length < minPlayers || match.team2.length < minPlayers;
    });

    if (invalidMatches.length > 0) {
      alert(`${invalidMatches.length} match(es) have incomplete teams. Please fix or delete them.`);
      return;
    }

    onSave(editedPlayers, editedMatches);
  };

  const maxPlayersPerTeam = config.gameType === 'singles' ? 1 : 2;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>✏️ Edit Tournament</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-tabs">
          <button
            className={`tab-button ${activeTab === 'players' ? 'active' : ''}`}
            onClick={() => setActiveTab('players')}
          >
            👥 Players ({editedPlayers.length})
          </button>
          <button
            className={`tab-button ${activeTab === 'matches' ? 'active' : ''}`}
            onClick={() => setActiveTab('matches')}
          >
            🎾 Matches ({editedMatches.length})
          </button>
        </div>

        <div className="modal-body">
          {activeTab === 'players' && (
            <div className="edit-section">
              <h3>Manage Players</h3>
              <div className="players-list-edit">
                {editedPlayers.map((player) => (
                  <div key={player.id} className="player-edit-item">
                    <input
                      type="text"
                      value={player.name}
                      onChange={(e) => handleUpdatePlayer(player.id, 'name', e.target.value)}
                      className="player-name-input"
                    />
                    <div className="skill-level">
                      <label>Skill:</label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={player.skillLevel || 5}
                        onChange={(e) => handleUpdatePlayer(player.id, 'skillLevel', parseInt(e.target.value) || 5)}
                        className="skill-input"
                      />
                    </div>
                    <button onClick={() => handleRemovePlayer(player.id)} className="btn-remove-small">
                      Remove
                    </button>
                  </div>
                ))}
              </div>
              <div className="add-player-section">
                <input
                  type="text"
                  placeholder="New player name"
                  value={newPlayerName}
                  onChange={(e) => setNewPlayerName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddPlayer()}
                />
                <input
                  type="number"
                  min="1"
                  max="10"
                  placeholder="Skill"
                  value={newPlayerSkill}
                  onChange={(e) => setNewPlayerSkill(parseInt(e.target.value) || 5)}
                  className="skill-input"
                />
                <button onClick={handleAddPlayer} className="btn-add-small">Add Player</button>
              </div>
            </div>
          )}

          {activeTab === 'matches' && (
            <div className="edit-section">
              <div className="section-header">
                <h3>Manage Matches</h3>
                <button onClick={handleAddMatch} className="btn-add-match">+ Add Match</button>
              </div>
              <div className="matches-list-edit">
                {editedMatches.map((match) => (
                  <div key={match.id} className="match-edit-item">
                    <div className="match-edit-header">
                      <div className="match-edit-details">
                        <select
                          value={match.court}
                          onChange={(e) => handleUpdateMatchDetails(match.id, 'court', e.target.value)}
                        >
                          {config.courts.map(court => (
                            <option key={court} value={court}>{court}</option>
                          ))}
                        </select>
                        <input
                          type="time"
                          value={match.time}
                          onChange={(e) => handleUpdateMatchDetails(match.id, 'time', e.target.value)}
                        />
                      </div>
                      <button onClick={() => handleDeleteMatch(match.id)} className="btn-delete-match">
                        Delete
                      </button>
                    </div>
                    
                    <div className="match-teams-edit">
                      <div className="team-edit">
                        <label>Team 1:</label>
                        {Array.from({ length: maxPlayersPerTeam }).map((_, idx) => (
                          <div key={idx} className="player-select-row">
                            <select
                              value={match.team1[idx]?.id || ''}
                              onChange={(e) => handleUpdateMatchPlayer(match.id, 'team1', idx, e.target.value)}
                            >
                              <option value="">Select player...</option>
                              {editedPlayers.map(player => (
                                <option key={player.id} value={player.id}>{player.name}</option>
                              ))}
                            </select>
                            {match.team1[idx] && (
                              <button
                                onClick={() => handleRemovePlayerFromMatch(match.id, 'team1', idx)}
                                className="btn-remove-player"
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                      
                      <div className="vs-edit">VS</div>
                      
                      <div className="team-edit">
                        <label>Team 2:</label>
                        {Array.from({ length: maxPlayersPerTeam }).map((_, idx) => (
                          <div key={idx} className="player-select-row">
                            <select
                              value={match.team2[idx]?.id || ''}
                              onChange={(e) => handleUpdateMatchPlayer(match.id, 'team2', idx, e.target.value)}
                            >
                              <option value="">Select player...</option>
                              {editedPlayers.map(player => (
                                <option key={player.id} value={player.id}>{player.name}</option>
                              ))}
                            </select>
                            {match.team2[idx] && (
                              <button
                                onClick={() => handleRemovePlayerFromMatch(match.id, 'team2', idx)}
                                className="btn-remove-player"
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {match.completed && (
                      <div className="match-completed-badge">✓ Completed</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="btn-cancel-modal">Cancel</button>
          <button onClick={handleSave} className="btn-save-modal">Save Changes</button>
        </div>
      </div>
    </div>
  );
};

export default EditTournamentModal;
