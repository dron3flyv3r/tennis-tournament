import React, { useMemo, useState } from 'react';
import type { Player, Match, TournamentConfig } from '../types';
import { useI18n } from '../i18n';
import './EditTournamentModal.css';

interface EditTournamentModalProps {
  players: Player[];
  matches: Match[];
  config: TournamentConfig;
  onClose: () => void;
  onSave: (players: Player[], matches: Match[]) => void;
}

type BannerState =
  | null
  | {
      type: 'error' | 'warning' | 'success';
      message: string;
      actionLabel?: string;
      onAction?: () => void;
    };

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
  const [banner, setBanner] = useState<BannerState>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const { t } = useI18n();

  const duplicateNames = useMemo(() => {
    const seen = new Map<string, number>();
    editedPlayers.forEach(p => {
      const key = p.name.trim().toLowerCase();
      if (!key) return;
      seen.set(key, (seen.get(key) || 0) + 1);
    });
    return new Set(
      Array.from(seen.entries())
        .filter(([, count]) => count > 1)
        .map(([name]) => name)
    );
  }, [editedPlayers]);

  const resetBanner = () => setBanner(null);

  const purgePlayerFromMatches = (playerId: string) => {
    setEditedMatches(prev =>
      prev.map(match => ({
        ...match,
        team1: match.team1.filter(p => p.id !== playerId),
        team2: match.team2.filter(p => p.id !== playerId),
      }))
    );
    setFieldErrors(current => {
      const { [`player-${playerId}`]: _, ...rest } = current;
      return rest;
    });
    setBanner({
      type: 'success',
      message: t('edit.banner.removedFromMatches'),
    });
  };

  const handleAddPlayer = () => {
    resetBanner();
    if (!newPlayerName.trim()) {
      setFieldErrors(prev => ({ ...prev, newPlayer: t('errors.newPlayerNameRequired') }));
      setBanner({ type: 'error', message: t('edit.banner.playerNameRequired') });
      return;
    }
    const key = newPlayerName.trim().toLowerCase();
    if (duplicateNames.has(key)) {
      setFieldErrors(prev => ({ ...prev, newPlayer: t('errors.playerNameDuplicate') }));
      setBanner({ type: 'error', message: t('edit.banner.duplicateName') });
      return;
    }

    const newPlayer: Player = {
      id: Date.now().toString(),
      name: newPlayerName.trim(),
      skillLevel: newPlayerSkill,
    };
    setEditedPlayers(prev => [...prev, newPlayer]);
    setNewPlayerName('');
    setNewPlayerSkill(5);
  };

  const handleRemovePlayer = (playerId: string) => {
    resetBanner();
    const playerInMatches = editedMatches.some(
      match => match.team1.some(p => p.id === playerId) || match.team2.some(p => p.id === playerId)
    );

    if (playerInMatches) {
      setFieldErrors(prev => ({ ...prev, [`player-${playerId}`]: t('errors.playerRemoveFromMatches') }));
      setBanner({
        type: 'warning',
        message: t('edit.banner.playerAssigned'),
        actionLabel: t('edit.removeFromMatches'),
        onAction: () => purgePlayerFromMatches(playerId),
      });
      return;
    }

    setEditedPlayers(prev => prev.filter(p => p.id !== playerId));
    setFieldErrors(prev => {
      const { [`player-${playerId}`]: _, ...rest } = prev;
      return rest;
    });
  };

  const handleUpdatePlayer = (playerId: string, field: keyof Player, value: string | number) => {
    resetBanner();
    setEditedPlayers(prev =>
      prev.map(p => (p.id === playerId ? { ...p, [field]: value } : p))
    );
  };

  const handleDeleteMatch = (matchId: string) => {
    resetBanner();
    setEditedMatches(prev => prev.filter(m => m.id !== matchId));
    setBanner({ type: 'success', message: t('edit.banner.matchRemoved') });
  };

  const handleAddMatch = () => {
    resetBanner();
    const newMatch: Match = {
      id: `match-${Date.now()}`,
      court: config.courts[0] || 'Court 1',
      time: '00:00',
      team1: [],
      team2: [],
      completed: false,
    };
    setEditedMatches(prev => [...prev, newMatch]);
  };

  const handleUpdateMatchPlayer = (
    matchId: string,
    team: 'team1' | 'team2',
    index: number,
    playerId: string
  ) => {
    const player = editedPlayers.find(p => p.id === playerId);
    if (!player) return;

    setEditedMatches(prev =>
      prev.map(match => {
        if (match.id !== matchId) return match;
        const updatedTeam = [...match[team]];
        if (index < updatedTeam.length) {
          updatedTeam[index] = player;
        } else {
          updatedTeam.push(player);
        }
        return { ...match, [team]: updatedTeam };
      })
    );
  };

  const handleRemovePlayerFromMatch = (matchId: string, team: 'team1' | 'team2', index: number) => {
    setEditedMatches(prev =>
      prev.map(match => {
        if (match.id !== matchId) return match;
        return { ...match, [team]: match[team].filter((_, i) => i !== index) };
      })
    );
  };

  const handleUpdateMatchDetails = (matchId: string, field: 'court' | 'time', value: string) => {
    setEditedMatches(prev =>
      prev.map(match => (match.id === matchId ? { ...match, [field]: value } : match))
    );
  };

  const validate = () => {
    const errors: string[] = [];
    const fieldMap: Record<string, string> = {};

    if (editedPlayers.length < 2) {
      errors.push(t('errors.needPlayersForTournament'));
    }

    editedPlayers.forEach(player => {
      const key = player.name.trim().toLowerCase();
      if (!player.name.trim()) {
        fieldMap[`player-${player.id}`] = t('errors.playerNameRequiredShort');
        errors.push(t('errors.playerMissingName'));
      } else if (duplicateNames.has(key)) {
        fieldMap[`player-${player.id}`] = t('errors.playerNameDuplicate');
        const duplicateMessage = t('errors.duplicatePlayerNames');
        if (!errors.includes(duplicateMessage)) {
          errors.push(duplicateMessage);
        }
      }
    });

    const minPlayersPerTeam = config.gameType === 'singles' ? 1 : 2;
    const invalidMatches = editedMatches.filter(
      match => match.team1.length < minPlayersPerTeam || match.team2.length < minPlayersPerTeam
    );

    if (invalidMatches.length > 0) {
      errors.push(t('errors.matchesNeedTeams', { count: invalidMatches.length }));
      invalidMatches.forEach(match => {
        fieldMap[`match-${match.id}`] = t('errors.matchNeedsPlayers');
      });
    }

    setFieldErrors(fieldMap);
    if (errors.length > 0) {
      setBanner({ type: 'error', message: errors[0] });
      return false;
    }

    setBanner(null);
    return true;
  };

  const handleSave = () => {
    if (!validate()) return;
    onSave(editedPlayers, editedMatches);
  };

  const maxPlayersPerTeam = config.gameType === 'singles' ? 1 : 2;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{t('edit.title')}</h2>
          <button className="modal-close" onClick={onClose} aria-label={t('common.close')}>
            ✕
          </button>
        </div>

        <div className="modal-tabs">
          <button
            className={`tab-button ${activeTab === 'players' ? 'active' : ''}`}
            onClick={() => {
              resetBanner();
              setActiveTab('players');
            }}
          >
            {t('edit.tab.players', { count: editedPlayers.length })}
          </button>
          <button
            className={`tab-button ${activeTab === 'matches' ? 'active' : ''}`}
            onClick={() => {
              resetBanner();
              setActiveTab('matches');
            }}
          >
            {t('edit.tab.matches', { count: editedMatches.length })}
          </button>
        </div>

        <div className="modal-body">
          {banner && (
            <div className={`inline-banner ${banner.type}`}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                <span>{banner.message}</span>
                {banner.actionLabel && banner.onAction && (
                  <button className="btn-secondary" onClick={banner.onAction}>
                    {banner.actionLabel}
                  </button>
                )}
              </div>
            </div>
          )}

          {activeTab === 'players' && (
            <div className="edit-section">
              <h3>{t('edit.managePlayers')}</h3>
              <div className="players-list-edit">
                {editedPlayers.map(player => (
                  <div
                    key={player.id}
                    className={`player-edit-item ${fieldErrors[`player-${player.id}`] ? 'has-error' : ''}`}
                  >
                    <input
                      type="text"
                      value={player.name}
                      onChange={e => handleUpdatePlayer(player.id, 'name', e.target.value)}
                      className="player-name-input"
                      aria-invalid={Boolean(fieldErrors[`player-${player.id}`])}
                    />
                    <div className="skill-level">
                      <label>{t('config.players.skill')}:</label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={player.skillLevel || 5}
                        onChange={e =>
                          handleUpdatePlayer(player.id, 'skillLevel', parseInt(e.target.value) || 5)
                        }
                        className="skill-input"
                      />
                    </div>
                    <button onClick={() => handleRemovePlayer(player.id)} className="btn-remove-small">
                      {t('edit.remove')}
                    </button>
                    {fieldErrors[`player-${player.id}`] && (
                      <p className="field-error">{fieldErrors[`player-${player.id}`]}</p>
                    )}
                  </div>
                ))}
              </div>
              <div className="add-player-section">
                <input
                  type="text"
                  placeholder={t('edit.newPlayerPlaceholder')}
                  value={newPlayerName}
                  onChange={e => setNewPlayerName(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && handleAddPlayer()}
                  aria-invalid={Boolean(fieldErrors.newPlayer)}
                />
                <input
                  type="number"
                  min="1"
                  max="10"
                  placeholder={t('config.players.skill')}
                  value={newPlayerSkill}
                  onChange={e => setNewPlayerSkill(parseInt(e.target.value) || 5)}
                  className="skill-input"
                />
                <button onClick={handleAddPlayer} className="btn-add-small">
                  {t('edit.addPlayer')}
                </button>
              </div>
              {fieldErrors.newPlayer && <p className="field-error">{fieldErrors.newPlayer}</p>}
            </div>
          )}

          {activeTab === 'matches' && (
            <div className="edit-section">
              <div className="section-header">
                <h3>{t('edit.manageMatches')}</h3>
                <button onClick={handleAddMatch} className="btn-add-match">
                  + {t('edit.addMatch')}
                </button>
              </div>
              <div className="matches-list-edit">
                {editedMatches.map(match => (
                  <div
                    key={match.id}
                    className={`match-edit-item ${fieldErrors[`match-${match.id}`] ? 'has-error' : ''}`}
                  >
                    <div className="match-edit-header">
                      <div className="match-edit-details">
                        <select
                          value={match.court}
                          onChange={e => handleUpdateMatchDetails(match.id, 'court', e.target.value)}
                        >
                          {config.courts.map(court => (
                            <option key={court} value={court}>
                              {court}
                            </option>
                          ))}
                        </select>
                        <input
                          type="time"
                          value={match.time}
                          onChange={e => handleUpdateMatchDetails(match.id, 'time', e.target.value)}
                        />
                      </div>
                      <button onClick={() => handleDeleteMatch(match.id)} className="btn-delete-match">
                        {t('edit.delete')}
                      </button>
                    </div>

                    <div className="match-teams-edit">
                      <div className="team-edit">
                        <label>{t('edit.team1')}:</label>
                        {Array.from({ length: maxPlayersPerTeam }).map((_, idx) => (
                          <div key={idx} className="player-select-row">
                            <select
                              value={match.team1[idx]?.id || ''}
                              onChange={e => handleUpdateMatchPlayer(match.id, 'team1', idx, e.target.value)}
                            >
                              <option value="">{t('edit.selectPlayer')}</option>
                              {editedPlayers.map(player => (
                                <option key={player.id} value={player.id}>
                                  {player.name}
                                </option>
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

                      <div className="vs-edit">{t('match.vs')}</div>

                      <div className="team-edit">
                        <label>{t('edit.team2')}:</label>
                        {Array.from({ length: maxPlayersPerTeam }).map((_, idx) => (
                          <div key={idx} className="player-select-row">
                            <select
                              value={match.team2[idx]?.id || ''}
                              onChange={e => handleUpdateMatchPlayer(match.id, 'team2', idx, e.target.value)}
                            >
                              <option value="">{t('edit.selectPlayer')}</option>
                              {editedPlayers.map(player => (
                                <option key={player.id} value={player.id}>
                                  {player.name}
                                </option>
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
                      <div className="match-completed-badge">✓ {t('edit.completed')}</div>
                    )}
                    {fieldErrors[`match-${match.id}`] && (
                      <p className="field-error">{fieldErrors[`match-${match.id}`]}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="btn-cancel-modal">
            {t('edit.cancel')}
          </button>
          <button onClick={handleSave} className="btn-save-modal">
            {t('edit.saveChanges')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditTournamentModal;
