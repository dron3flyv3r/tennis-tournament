import React, { useState } from 'react';
import type { Player, TournamentConfig } from '../types';
import './ConfigPanel.css';

interface ConfigPanelProps {
  onStartTournament: (config: TournamentConfig, players: Player[]) => void;
}

const ConfigPanel: React.FC<ConfigPanelProps> = ({ onStartTournament }) => {
  const [config, setConfig] = useState<TournamentConfig>({
    tournamentName: 'Tennis Tournament',
    gameType: 'singles',
    doublesPartnerMode: 'fixed',
    courts: ['Court 1', 'Court 2'],
    startTime: '09:00',
    matchDuration: 60,
    enforceNonRepeatingMatches: true,
    enforceFairMatches: true,
    allowBypass: true,
  });

  const [players, setPlayers] = useState<Player[]>([
    { id: '1', name: 'Player 1', skillLevel: 5 },
    { id: '2', name: 'Player 2', skillLevel: 5 },
  ]);

  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerSkill, setNewPlayerSkill] = useState(5);
  const [courtInput, setCourtInput] = useState('');

  const handleAddPlayer = () => {
    if (newPlayerName.trim()) {
      const newPlayer: Player = {
        id: Date.now().toString(),
        name: newPlayerName.trim(),
        skillLevel: newPlayerSkill,
      };
      setPlayers([...players, newPlayer]);
      setNewPlayerName('');
      setNewPlayerSkill(5);
    }
  };

  const handleRemovePlayer = (id: string) => {
    setPlayers(players.filter(p => p.id !== id));
  };

  const handleUpdatePlayer = (id: string, field: keyof Player, value: string | number) => {
    setPlayers(players.map(p => 
      p.id === id ? { ...p, [field]: value } : p
    ));
  };

  const handleAddCourt = () => {
    if (courtInput.trim()) {
      setConfig({
        ...config,
        courts: [...config.courts, courtInput.trim()],
      });
      setCourtInput('');
    }
  };

  const handleRemoveCourt = (index: number) => {
    setConfig({
      ...config,
      courts: config.courts.filter((_, i) => i !== index),
    });
  };

  const handleStartTournament = () => {
    if (players.length < 2) {
      alert('Please add at least 2 players.');
      return;
    }
    if (config.courts.length === 0) {
      alert('Please add at least one court.');
      return;
    }
    if (config.gameType === 'doubles' && players.length < 4) {
      alert('Please add at least 4 players for doubles.');
      return;
    }

    onStartTournament(config, players);
  };

  const handleLoadSampleData = () => {
    const samplePlayers: Player[] = [
      { id: 'p1', name: 'Roger Federer', skillLevel: 10 },
      { id: 'p2', name: 'Rafael Nadal', skillLevel: 10 },
      { id: 'p3', name: 'Novak Djokovic', skillLevel: 10 },
      { id: 'p4', name: 'Andy Murray', skillLevel: 9 },
      { id: 'p5', name: 'Stan Wawrinka', skillLevel: 8 },
      { id: 'p6', name: 'Dominic Thiem', skillLevel: 8 },
      { id: 'p7', name: 'Alexander Zverev', skillLevel: 7 },
      { id: 'p8', name: 'Stefanos Tsitsipas', skillLevel: 7 },
    ];

    setPlayers(samplePlayers);
    setConfig({
      ...config,
      tournamentName: 'Summer Championship 2024',
      courts: ['Center Court', 'Court 1', 'Court 2'],
    });
  };

  return (
    <div className="config-panel">
      <h1>🎾 Tennis Tournament Generator</h1>

      <div className="quick-start">
        <button type="button" onClick={handleLoadSampleData} className="btn-sample-data">
          🎯 Load Sample Data (Try it out!)
        </button>
      </div>

      <div className="config-section">
        <h2>Tournament Settings</h2>
        
        <div className="form-group">
          <label>Tournament Name:</label>
          <input
            type="text"
            value={config.tournamentName}
            onChange={(e) => setConfig({ ...config, tournamentName: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label>Game Type:</label>
          <select
            value={config.gameType}
            onChange={(e) => setConfig({ ...config, gameType: e.target.value as 'singles' | 'doubles' })}
          >
            <option value="singles">Singles</option>
            <option value="doubles">Doubles</option>
          </select>
        </div>

        {config.gameType === 'doubles' && (
          <div className="form-group">
            <label>Doubles Partner Mode:</label>
            <select
              value={config.doublesPartnerMode}
              onChange={(e) => setConfig({ ...config, doublesPartnerMode: e.target.value as 'fixed' | 'random-non-repeating' })}
            >
              <option value="fixed">Fixed Partners</option>
              <option value="random-non-repeating">Random Non-Repeating Partners</option>
            </select>
          </div>
        )}

        <div className="form-group">
          <label>Start Time:</label>
          <input
            type="time"
            value={config.startTime}
            onChange={(e) => setConfig({ ...config, startTime: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label>Match Duration (minutes):</label>
          <input
            type="number"
            min="15"
            max="180"
            value={config.matchDuration}
            onChange={(e) => setConfig({ ...config, matchDuration: parseInt(e.target.value) || 60 })}
            inputMode="numeric"
            pattern="[0-9]*"
            enterKeyHint="next"
          />
        </div>

        <div className="form-group checkbox-group">
          <label>
            <input
              type="checkbox"
              checked={config.enforceNonRepeatingMatches}
              onChange={(e) => setConfig({ ...config, enforceNonRepeatingMatches: e.target.checked })}
            />
            Enforce Non-Repeating Matches
          </label>
        </div>

        <div className="form-group checkbox-group">
          <label>
            <input
              type="checkbox"
              checked={config.enforceFairMatches}
              onChange={(e) => setConfig({ ...config, enforceFairMatches: e.target.checked })}
            />
            Enforce Fair Matches (everyone plays same number)
          </label>
        </div>

        <div className="form-group checkbox-group">
          <label>
            <input
              type="checkbox"
              checked={config.allowBypass}
              onChange={(e) => setConfig({ ...config, allowBypass: e.target.checked })}
            />
            Allow Bypass if Constraints Cannot Be Met
          </label>
        </div>
      </div>

      <div className="config-section">
        <h2>Courts</h2>
        <div className="court-list">
          {config.courts.map((court, idx) => (
            <div key={idx} className="court-item">
              <span>{court}</span>
              <button type="button" onClick={() => handleRemoveCourt(idx)} className="btn-remove">
                Remove
              </button>
            </div>
          ))}
        </div>
        <div className="add-court">
          <input
            type="text"
            placeholder="Court name"
            value={courtInput}
            onChange={(e) => setCourtInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleAddCourt();
              }
            }}
            enterKeyHint="done"
          />
          <button type="button" onClick={handleAddCourt} className="btn-add">Add Court</button>
        </div>
      </div>

      <div className="config-section">
        <h2>Players</h2>
        <div className="players-list">
          {players.map((player) => (
            <div key={player.id} className="player-item">
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
                  inputMode="numeric"
                  pattern="[0-9]*"
                />
              </div>
              <button type="button" onClick={() => handleRemovePlayer(player.id)} className="btn-remove">
                Remove
              </button>
            </div>
          ))}
        </div>
        <div className="add-player">
          <input
            type="text"
            placeholder="Player name"
            value={newPlayerName}
            onChange={(e) => setNewPlayerName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleAddPlayer();
              }
            }}
            enterKeyHint="next"
          />
          <input
            type="number"
            min="1"
            max="10"
            placeholder="Skill"
            value={newPlayerSkill}
            onChange={(e) => setNewPlayerSkill(parseInt(e.target.value) || 5)}
            className="skill-input"
            inputMode="numeric"
            pattern="[0-9]*"
          />
          <button type="button" onClick={handleAddPlayer} className="btn-add">Add Player</button>
        </div>
      </div>

      <div className="start-button-container">
        <button type="button" onClick={handleStartTournament} className="btn-start">
          Generate Tournament
        </button>
      </div>
    </div>
  );
};

export default ConfigPanel;
