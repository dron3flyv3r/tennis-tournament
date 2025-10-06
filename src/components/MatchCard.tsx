import React, { useState } from 'react';
import type { Match, SetScore } from '../types';
import './MatchCard.css';

interface MatchCardProps {
  match: Match;
  onUpdateMatch: (matchId: string, match: Match) => void;
}

const MatchCard: React.FC<MatchCardProps> = ({ match, onUpdateMatch }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [sets, setSets] = useState<SetScore[]>([
    { team1Games: 0, team2Games: 0 },
  ]);

  const handleStartEditing = () => {
    if (match.score) {
      setSets(match.score.sets);
    }
    setIsEditing(true);
  };

  const handleAddSet = () => {
    setSets([...sets, { team1Games: 0, team2Games: 0 }]);
  };

  const handleRemoveSet = (index: number) => {
    setSets(sets.filter((_, i) => i !== index));
  };

  const handleSetChange = (index: number, team: 'team1' | 'team2', value: number) => {
    const newSets = [...sets];
    if (team === 'team1') {
      newSets[index].team1Games = value;
    } else {
      newSets[index].team2Games = value;
    }
    setSets(newSets);
  };

  const handleSave = () => {
    if (sets.length === 0) {
      alert('Please add at least one set.');
      return;
    }

    const team1Sets = sets.filter(s => s.team1Games > s.team2Games).length;
    const team2Sets = sets.filter(s => s.team2Games > s.team1Games).length;

    const updatedMatch: Match = {
      ...match,
      score: {
        team1Sets,
        team2Sets,
        sets,
      },
      completed: true,
    };

    onUpdateMatch(match.id, updatedMatch);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (match.score) {
      setSets(match.score.sets);
    } else {
      setSets([{ team1Games: 0, team2Games: 0 }]);
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
            {match.score.team1Sets > match.score.team2Sets ? '👑 ' + team1Names : '👑 ' + team2Names}
          </div>
        )}
      </div>

      <div className="match-teams">
        <div className={`team ${match.completed && match.score && match.score.team1Sets > match.score.team2Sets ? 'winner' : ''}`}>
          <span className="team-name">{team1Names}</span>
          {match.score && <span className="team-sets">{match.score.team1Sets}</span>}
        </div>
        <div className="vs">VS</div>
        <div className={`team ${match.completed && match.score && match.score.team2Sets > match.score.team1Sets ? 'winner' : ''}`}>
          <span className="team-name">{team2Names}</span>
          {match.score && <span className="team-sets">{match.score.team2Sets}</span>}
        </div>
      </div>

      {match.score && !isEditing && (
        <div className="match-score-details">
          <div className="sets-display">
            {match.score.sets.map((set, idx) => (
              <div key={idx} className="set-score">
                Set {idx + 1}: {set.team1Games} - {set.team2Games}
              </div>
            ))}
          </div>
        </div>
      )}

      {isEditing && (
        <div className="match-score-editor">
          <h4>Enter Score</h4>
          {sets.map((set, idx) => (
            <div key={idx} className="set-input">
              <span className="set-label">Set {idx + 1}:</span>
              <input
                type="number"
                min="0"
                max="7"
                value={set.team1Games}
                onChange={(e) => handleSetChange(idx, 'team1', parseInt(e.target.value) || 0)}
              />
              <span>-</span>
              <input
                type="number"
                min="0"
                max="7"
                value={set.team2Games}
                onChange={(e) => handleSetChange(idx, 'team2', parseInt(e.target.value) || 0)}
              />
              {sets.length > 1 && (
                <button onClick={() => handleRemoveSet(idx)} className="btn-remove-set">
                  ✕
                </button>
              )}
            </div>
          ))}
          <div className="score-editor-actions">
            <button onClick={handleAddSet} className="btn-add-set">
              + Add Set
            </button>
            <div className="score-save-cancel">
              <button onClick={handleSave} className="btn-save">
                Save Score
              </button>
              <button onClick={handleCancel} className="btn-cancel">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {!isEditing && (
        <div className="match-actions">
          <button onClick={handleStartEditing} className="btn-enter-score">
            {match.completed ? 'Edit Score' : 'Enter Score'}
          </button>
        </div>
      )}
    </div>
  );
};

export default MatchCard;
