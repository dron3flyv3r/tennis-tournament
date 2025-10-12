import React, { useState } from 'react';
import type { Match, TournamentConfig, SetScore } from '../types';
import './MatchCard.css';

interface MatchCardProps {
  match: Match;
  config: TournamentConfig;
  onUpdateMatch: (matchId: string, match: Match) => void;
}

const MatchCard: React.FC<MatchCardProps> = ({ match, config, onUpdateMatch }) => {
  const [isEditing, setIsEditing] = useState(false);
  
  // For sets mode
  const [sets, setSets] = useState<SetScore[]>([{ team1Games: 0, team2Games: 0 }]);
  
  // For simple mode - use strings to allow empty values
  const [simpleScore1, setSimpleScore1] = useState('');
  const [simpleScore2, setSimpleScore2] = useState('');

  const handleStartEditing = () => {
    if (match.score) {
      if (config.scoringMode === 'sets' && match.score.sets) {
        setSets(match.score.sets);
      } else {
        setSimpleScore1(match.score.team1Score.toString());
        setSimpleScore2(match.score.team2Score.toString());
      }
    } else {
      // Reset to defaults
      if (config.scoringMode === 'sets') {
        setSets([{ team1Games: 0, team2Games: 0 }]);
      } else {
        setSimpleScore1('');
        setSimpleScore2('');
      }
    }
    setIsEditing(true);
  };

  const handleAddSet = () => {
    setSets([...sets, { team1Games: 0, team2Games: 0 }]);
  };

  const handleRemoveSet = (index: number) => {
    if (sets.length > 1) {
      setSets(sets.filter((_, i) => i !== index));
    }
  };

  const handleSetGameChange = (setIndex: number, team: 'team1' | 'team2', value: string) => {
    const newSets = [...sets];
    const numValue = value === '' ? 0 : Math.max(0, parseInt(value) || 0);
    
    if (team === 'team1') {
      newSets[setIndex].team1Games = numValue;
    } else {
      newSets[setIndex].team2Games = numValue;
    }
    setSets(newSets);
  };

  const handleSave = () => {
    let updatedMatch: Match;

    if (config.scoringMode === 'sets') {
      if (sets.length === 0) {
        alert('Please add at least one set.');
        return;
      }

      const team1SetsWon = sets.filter(s => s.team1Games > s.team2Games).length;
      const team2SetsWon = sets.filter(s => s.team2Games > s.team1Games).length;

      updatedMatch = {
        ...match,
        score: {
          team1Score: team1SetsWon,
          team2Score: team2SetsWon,
          sets,
        },
        completed: true,
      };
    } else {
      // Simple mode
      const score1 = parseInt(simpleScore1) || 0;
      const score2 = parseInt(simpleScore2) || 0;

      if (score1 === 0 && score2 === 0) {
        alert('Please enter a valid score.');
        return;
      }

      updatedMatch = {
        ...match,
        score: {
          team1Score: score1,
          team2Score: score2,
        },
        completed: true,
      };
    }

    onUpdateMatch(match.id, updatedMatch);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  };

  const team1Names = match.team1.map(p => p.name).join(' & ');
  const team2Names = match.team2.map(p => p.name).join(' & ');

  return (
    <div className={`match-card ${match.completed ? 'completed' : 'pending'}`}>
      <div className="match-header">
        <div className="match-time-court">
          <span className="match-time">🕐 {match.time}</span>
          <span className="match-court">🎾 {match.court}</span>
        </div>
        {match.completed && match.score && (
          <div className="match-winner">
            {match.score.team1Score > match.score.team2Score ? '👑 ' + team1Names : '👑 ' + team2Names}
          </div>
        )}
      </div>

      <div className="match-teams">
        <div className={`team ${match.completed && match.score && match.score.team1Score > match.score.team2Score ? 'winner' : ''}`}>
          <span className="team-name">{team1Names}</span>
          {match.score && <span className="team-sets">{match.score.team1Score}</span>}
        </div>
        <div className="vs">VS</div>
        <div className={`team ${match.completed && match.score && match.score.team2Score > match.score.team1Score ? 'winner' : ''}`}>
          <span className="team-name">{team2Names}</span>
          {match.score && <span className="team-sets">{match.score.team2Score}</span>}
        </div>
      </div>

      {match.score && !isEditing && config.scoringMode === 'sets' && match.score.sets && (
        <div className="match-score-details">
          <div className="sets-display">
            {match.score.sets.map((set, idx) => (
              <div key={idx} className="set-score">
                Set {idx + 1}: {set.team1Games}-{set.team2Games}
              </div>
            ))}
          </div>
        </div>
      )}

      {isEditing && (
        <div className="match-score-editor" onKeyDown={handleKeyDown}>
          <h4>Enter Score</h4>
          
          {config.scoringMode === 'sets' ? (
            <>
              {sets.map((set, idx) => (
                <div key={idx} className="set-input">
                  <span className="set-label">Set {idx + 1}:</span>
                  <input
                    type="number"
                    min="0"
                    max="7"
                    value={set.team1Games || ''}
                    onChange={(e) => handleSetGameChange(idx, 'team1', e.target.value)}
                    placeholder="0"
                    inputMode="numeric"
                    aria-label={`${team1Names} games in set ${idx + 1}`}
                  />
                  <span>-</span>
                  <input
                    type="number"
                    min="0"
                    max="7"
                    value={set.team2Games || ''}
                    onChange={(e) => handleSetGameChange(idx, 'team2', e.target.value)}
                    placeholder="0"
                    inputMode="numeric"
                    aria-label={`${team2Names} games in set ${idx + 1}`}
                  />
                  {sets.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveSet(idx)}
                      className="btn-remove-set"
                      aria-label={`Remove set ${idx + 1}`}
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
              <div className="score-editor-actions">
                <button type="button" onClick={handleAddSet} className="btn-add-set">
                  + Add Set
                </button>
                <div className="score-save-cancel">
                  <button type="button" onClick={handleSave} className="btn-save">
                    Save Score
                  </button>
                  <button type="button" onClick={handleCancel} className="btn-cancel">
                    Cancel
                  </button>
                </div>
              </div>
              <p className="keyboard-hint">💡 Tip: Press Enter to save, ESC to cancel</p>
            </>
          ) : (
            <>
              <div className="simple-score-input">
                <div className="team-score-row">
                  <span className="team-label">{team1Names}:</span>
                  <input
                    type="number"
                    min="0"
                    value={simpleScore1}
                    onChange={(e) => setSimpleScore1(e.target.value)}
                    placeholder="0"
                    inputMode="numeric"
                    aria-label={`Score for ${team1Names}`}
                    autoFocus
                  />
                </div>
                <div className="team-score-row">
                  <span className="team-label">{team2Names}:</span>
                  <input
                    type="number"
                    min="0"
                    value={simpleScore2}
                    onChange={(e) => setSimpleScore2(e.target.value)}
                    placeholder="0"
                    inputMode="numeric"
                    aria-label={`Score for ${team2Names}`}
                  />
                </div>
              </div>
              <div className="score-editor-actions">
                <div className="score-save-cancel">
                  <button type="button" onClick={handleSave} className="btn-save">
                    Save Score
                  </button>
                  <button type="button" onClick={handleCancel} className="btn-cancel">
                    Cancel
                  </button>
                </div>
              </div>
              <p className="keyboard-hint">💡 Tip: Press Enter to save, ESC to cancel</p>
            </>
          )}
        </div>
      )}

      {!isEditing && (
        <div className="match-actions">
          <button type="button" onClick={handleStartEditing} className="btn-enter-score">
            {match.completed ? 'Edit Score' : 'Enter Score'}
          </button>
        </div>
      )}
    </div>
  );
};

export default MatchCard;
