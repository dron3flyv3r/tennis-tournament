import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { Player, ScheduledBreak, TournamentConfig } from '../types';
import { useToast } from './ToastContext';
import { useI18n } from '../i18n';
import LanguageToggle from './LanguageToggle';
import SetupSummary from './SetupSummary';
import './ConfigPanel.css';

type StepId = 'basics' | 'courts' | 'players' | 'review';

interface Step {
  id: StepId;
  label: string;
  description: string;
}

interface ConfigPanelProps {
  initialConfig: TournamentConfig;
  initialPlayers: Player[];
  mode?: 'new' | 'edit';
  onStartTournament: (config: TournamentConfig, players: Player[]) => void;
  onSaveConfigOnly?: (config: TournamentConfig, players: Player[]) => void;
  onCancelEdit?: () => void;
}

const ConfigPanel: React.FC<ConfigPanelProps> = ({
  initialConfig,
  initialPlayers,
  mode = 'new',
  onStartTournament,
  onSaveConfigOnly,
  onCancelEdit,
}) => {
  const { showToast } = useToast();
  const { t } = useI18n();
  const [config, setConfig] = useState<TournamentConfig>(initialConfig);
  const [players, setPlayers] = useState<Player[]>(initialPlayers);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerSkill, setNewPlayerSkill] = useState(5);
  const [courtInput, setCourtInput] = useState('');
  const [breakTime, setBreakTime] = useState('12:00');
  const [breakDuration, setBreakDuration] = useState(30);
  const [currentStep, setCurrentStep] = useState(0);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [bannerErrors, setBannerErrors] = useState<string[]>([]);
  const playerInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    setConfig(initialConfig);
    setPlayers(initialPlayers);
  }, [initialConfig, initialPlayers]);

  const steps: Step[] = useMemo(
    () => [
      { id: 'basics', label: t('steps.basics.label'), description: t('steps.basics.description') },
      { id: 'courts', label: t('steps.courts.label'), description: t('steps.courts.description') },
      { id: 'players', label: t('steps.players.label'), description: t('steps.players.description') },
      { id: 'review', label: t('steps.review.label'), description: t('steps.review.description') },
    ],
    [t]
  );

  const duplicateNames = useMemo(() => {
    const seen = new Map<string, number>();
    players.forEach(player => {
      const key = player.name.trim().toLowerCase();
      if (!key) return;
      seen.set(key, (seen.get(key) || 0) + 1);
    });
    return new Set(
      Array.from(seen.entries())
        .filter(([, count]) => count > 1)
        .map(([name]) => name)
    );
  }, [players]);

  const updateErrors = (errors: Record<string, string>) => {
    setFieldErrors(prev => ({ ...prev, ...errors }));
    setBannerErrors(Object.values(errors));
  };

  const clearStepErrors = (stepId: StepId) => {
    const keysByStep: Record<StepId, string[]> = {
      basics: ['tournamentName', 'matchDuration', 'breakDuration'],
      courts: ['courts'],
      players: ['players', 'player-new'],
      review: [],
    };

    setFieldErrors(prev => {
      const copy = { ...prev };
      keysByStep[stepId].forEach(key => delete copy[key]);
      if (stepId === 'players') {
        Object.keys(copy).forEach(key => {
          if (key.startsWith('player-')) {
            delete copy[key];
          }
        });
      }
      return copy;
    });
  };

  const focusPlayerField = (playerId: string) => {
    const input = playerInputRefs.current[playerId];
    if (input) {
      input.focus();
      input.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const validateBasics = () => {
    const errors: Record<string, string> = {};
    if (!config.tournamentName.trim()) {
      errors.tournamentName = t('errors.tournamentName');
    }
    if (config.matchDuration < 15) {
      errors.matchDuration = t('errors.matchDurationMin');
    }
    if (config.breakDuration < 0) {
      errors.breakDuration = t('errors.breakDurationMin');
    }
    return errors;
  };

  const validateCourts = () => {
    const errors: Record<string, string> = {};
    if (config.courts.length === 0) {
      errors.courts = t('errors.courtsRequired');
    }
    return errors;
  };

  const validatePlayers = () => {
    const errors: Record<string, string> = {};
    if (players.length < 2) {
      errors.players = t('errors.playersMin');
    }
    if (config.gameType === 'doubles' && players.length < 4) {
      errors.players = t('errors.playersMinDoubles');
    }
    players.forEach(player => {
      const key = player.name.trim().toLowerCase();
      if (!player.name.trim()) {
        errors[`player-${player.id}`] = t('errors.playerNameRequired');
      } else if (duplicateNames.has(key)) {
        errors[`player-${player.id}`] = t('errors.playerNameDuplicate');
      }
    });
    return errors;
  };

  const validateStep = (stepId: StepId) => {
    switch (stepId) {
      case 'basics':
        return validateBasics();
      case 'courts':
        return validateCourts();
      case 'players':
        return validatePlayers();
      default:
        return {};
    }
  };

  const runStepValidation = (stepId: StepId) => {
    const errors = validateStep(stepId);
    if (Object.keys(errors).length > 0) {
      updateErrors(errors);
      showToast(t('config.toast.fixItems'), 'warning');
      return false;
    }
    clearStepErrors(stepId);
    setBannerErrors([]);
    return true;
  };

  const handleNext = () => {
    const stepId = steps[currentStep].id;
    if (!runStepValidation(stepId)) return;
    setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
  };

  const handleBack = () => {
    setBannerErrors([]);
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const handleGenerateTournament = () => {
    const errors = steps.reduce<Record<string, string>>((acc, step) => {
      return { ...acc, ...validateStep(step.id) };
    }, {});

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setBannerErrors(Object.values(errors));
      const firstErroredStep = steps.findIndex(step =>
        Object.keys(validateStep(step.id)).length > 0
      );
      if (firstErroredStep >= 0) {
        setCurrentStep(firstErroredStep);
      }
      return;
    }

    setFieldErrors({});
    setBannerErrors([]);
    onStartTournament(config, players);
  };

  const handleSaveWithoutRegenerate = () => {
    if (!onSaveConfigOnly) return;
    const errors = steps.reduce<Record<string, string>>((acc, step) => {
      return { ...acc, ...validateStep(step.id) };
    }, {});

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setBannerErrors(Object.values(errors));
      const firstErroredStep = steps.findIndex(step =>
        Object.keys(validateStep(step.id)).length > 0
      );
      if (firstErroredStep >= 0) {
        setCurrentStep(firstErroredStep);
      }
      return;
    }

    onSaveConfigOnly(config, players);
  };

  const handleAddCourt = () => {
    if (!courtInput.trim()) {
      updateErrors({ courts: t('errors.courtNameRequired') });
      return;
    }
    setConfig(prev => ({ ...prev, courts: [...prev.courts, courtInput.trim()] }));
    setCourtInput('');
    setBannerErrors([]);
  };

  const handleRemoveCourt = (index: number) => {
    setConfig(prev => ({ ...prev, courts: prev.courts.filter((_, i) => i !== index) }));
  };

  const handleAddScheduledBreak = () => {
    const newBreak: ScheduledBreak = {
      id: Date.now().toString(),
      time: breakTime,
      duration: breakDuration,
    };
    setConfig(prev => ({
      ...prev,
      scheduledBreaks: [...prev.scheduledBreaks, newBreak].sort((a, b) =>
        a.time.localeCompare(b.time)
      ),
    }));
  };

  const handleRemoveScheduledBreak = (id: string) => {
    setConfig(prev => ({
      ...prev,
      scheduledBreaks: prev.scheduledBreaks.filter(b => b.id !== id),
    }));
  };

  const handleAddPlayer = () => {
    if (!newPlayerName.trim()) {
      updateErrors({ 'player-new': t('errors.newPlayerNameRequired') });
      return;
    }
    const key = newPlayerName.trim().toLowerCase();
    if (duplicateNames.has(key)) {
      const message = t('errors.playerAlreadyExists', { name: newPlayerName.trim() });
      updateErrors({ 'player-new': message });
      const existing = players.find(
        p => p.name.trim().toLowerCase() === key
      );
      if (existing) {
        focusPlayerField(existing.id);
      }
      return;
    }
    const newPlayer: Player = {
      id: Date.now().toString(),
      name: newPlayerName.trim(),
      skillLevel: newPlayerSkill,
    };
    setPlayers(prev => [...prev, newPlayer]);
    setNewPlayerName('');
    setNewPlayerSkill(5);
    setBannerErrors([]);
  };

  const handleRemovePlayer = (id: string) => {
    setPlayers(prev => prev.filter(p => p.id !== id));
  };

  const handleUpdatePlayer = (id: string, field: keyof Player, value: string | number) => {
    if (field === 'name' && typeof value === 'string') {
      const trimmed = value.trim();
      const key = trimmed.toLowerCase();
      if (duplicateNames.has(key) && players.some(p => p.id !== id && p.name.trim().toLowerCase() === key)) {
        updateErrors({ [`player-${id}`]: t('errors.playerNameDuplicate') });
      }
    }

    setPlayers(prev =>
      prev.map(p => (p.id === id ? { ...p, [field]: value } : p))
    );
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
    setConfig(prev => ({
      ...prev,
      tournamentName: 'Summer Championship 2024',
      courts: ['Center Court', 'Court 1', 'Court 2'],
    }));
    showToast(t('toast.sampleLoaded'), 'success');
  };

  const renderStepContent = () => {
    const stepId = steps[currentStep].id;

    if (stepId === 'basics') {
      return (
        <>
          <div className="form-group">
            <label>{t('config.basics.tournamentName')}</label>
            <input
              type="text"
              value={config.tournamentName}
              onChange={e => setConfig({ ...config, tournamentName: e.target.value })}
              aria-invalid={Boolean(fieldErrors.tournamentName)}
            />
            {fieldErrors.tournamentName && (
              <p className="field-error">{fieldErrors.tournamentName}</p>
            )}
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label>{t('config.basics.gameType')}</label>
              <select
                value={config.gameType}
                onChange={e =>
                  setConfig({ ...config, gameType: e.target.value as 'singles' | 'doubles' })
                }
              >
                <option value="singles">{t('config.basics.singles')}</option>
                <option value="doubles">{t('config.basics.doubles')}</option>
              </select>
            </div>

            {config.gameType === 'doubles' && (
              <div className="form-group">
                <label>{t('config.basics.doublesPartnerMode')}</label>
                <select
                  value={config.doublesPartnerMode}
                  onChange={e =>
                    setConfig({
                      ...config,
                      doublesPartnerMode: e.target.value as 'fixed' | 'random-non-repeating',
                    })
                  }
                >
                  <option value="fixed">{t('config.basics.doublesFixed')}</option>
                  <option value="random-non-repeating">{t('config.basics.doublesRandom')}</option>
                </select>
              </div>
            )}
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label>{t('config.basics.scoringMode')}</label>
              <select
                value={config.scoringMode}
                onChange={e =>
                  setConfig({ ...config, scoringMode: e.target.value as 'sets' | 'simple' })
                }
              >
                <option value="sets">{t('config.basics.scoringSets')}</option>
                <option value="simple">{t('config.basics.scoringSimple')}</option>
              </select>
              <p className="field-description">
                {config.scoringMode === 'sets'
                  ? t('config.basics.scoringSetsDesc')
                  : t('config.basics.scoringSimpleDesc')}
              </p>
            </div>

            <div className="form-group">
              <label>{t('config.basics.startTime')}</label>
              <input
                type="time"
                value={config.startTime}
                onChange={e => setConfig({ ...config, startTime: e.target.value })}
              />
            </div>
          </div>

          <div className="grid-3">
            <div className="form-group">
              <label>{t('config.basics.matchDuration')}</label>
              <input
                type="number"
                min="15"
                max="180"
                value={config.matchDuration}
                onChange={e =>
                  setConfig({ ...config, matchDuration: parseInt(e.target.value) || 60 })
                }
                inputMode="numeric"
                pattern="[0-9]*"
              />
              {fieldErrors.matchDuration && (
                <p className="field-error">{fieldErrors.matchDuration}</p>
              )}
            </div>

            <div className="form-group">
              <label>{t('config.basics.breakDuration')}</label>
              <input
                type="number"
                min="0"
                max="60"
                value={config.breakDuration}
                onChange={e =>
                  setConfig({ ...config, breakDuration: parseInt(e.target.value) || 0 })
                }
                inputMode="numeric"
                pattern="[0-9]*"
              />
              {fieldErrors.breakDuration && (
                <p className="field-error">{fieldErrors.breakDuration}</p>
              )}
            </div>

            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  checked={config.allowBypass}
                  onChange={e => setConfig({ ...config, allowBypass: e.target.checked })}
                />
                {t('config.basics.allowBypass')}
              </label>
              <p className="field-description">
                {t('config.basics.allowBypassDesc')}
              </p>
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  checked={config.enforceNonRepeatingMatches}
                  onChange={e =>
                    setConfig({ ...config, enforceNonRepeatingMatches: e.target.checked })
                  }
                />
                {t('config.basics.enforceNonRepeating')}
              </label>
            </div>
            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  checked={config.enforceFairMatches}
                  onChange={e => setConfig({ ...config, enforceFairMatches: e.target.checked })}
                />
                {t('config.basics.enforceFairMatches')}
              </label>
            </div>
          </div>
        </>
      );
    }

    if (stepId === 'courts') {
      return (
        <>
          <div className="form-group">
            <label>{t('config.courts.title')}</label>
            <div className="pill-list">
              {config.courts.map((court, idx) => (
                <div key={court + idx} className="pill">
                  <span>{court}</span>
                  <button
                    type="button"
                    className="pill-remove"
                    onClick={() => handleRemoveCourt(idx)}
                    aria-label={`Remove ${court}`}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            {fieldErrors.courts && <p className="field-error">{fieldErrors.courts}</p>}
            <div className="inline-form">
              <input
                type="text"
                placeholder={t('config.courts.placeholder')}
                value={courtInput}
                onChange={e => setCourtInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCourt();
                  }
                }}
              />
              <button type="button" className="btn-secondary" onClick={handleAddCourt}>
                {t('config.courts.addCourt')}
              </button>
            </div>
          </div>

          <div className="form-group">
            <div className="label-row">
              <label>{t('config.courts.breaksTitle')}</label>
              <span className="label-hint">{t('config.courts.breaksHint')}</span>
            </div>
            <div className="breaks-list">
              {config.scheduledBreaks.map(scheduledBreak => (
                <div key={scheduledBreak.id} className="break-item">
                  <span>
                    {scheduledBreak.time} — {scheduledBreak.duration} {t('common.minutesShort')}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveScheduledBreak(scheduledBreak.id)}
                    className="btn-remove"
                  >
                    {t('common.remove')}
                  </button>
                </div>
              ))}
              {config.scheduledBreaks.length === 0 && (
                <div className="empty-note">{t('config.courts.noBreaks')}</div>
              )}
            </div>
            <div className="inline-form stack-on-mobile">
              <input type="time" value={breakTime} onChange={e => setBreakTime(e.target.value)} />
              <input
                type="number"
                min="15"
                max="120"
                placeholder={t('config.courts.breakDurationPlaceholder')}
                value={breakDuration}
                onChange={e => setBreakDuration(parseInt(e.target.value) || 30)}
                className="break-duration-input"
              />
              <button type="button" onClick={handleAddScheduledBreak} className="btn-secondary">
                {t('config.courts.addBreak')}
              </button>
            </div>
          </div>
        </>
      );
    }

    if (stepId === 'players') {
      const isFixedDoubles = config.gameType === 'doubles' && config.doublesPartnerMode === 'fixed';
      return (
        <>
          <div className="label-row">
            <h3 className="section-subtitle">{t('config.players.title')}</h3>
            <span className="label-hint">{t('config.players.tapToEdit')}</span>
          </div>
          {isFixedDoubles && (
            <div className="info-banner">
              {t('config.players.fixedHint')}
            </div>
          )}
          {fieldErrors.players && <div className="inline-banner error">{fieldErrors.players}</div>}

          <div className="players-list">
            {isFixedDoubles ? (
              <>
                {Array.from({ length: Math.ceil(players.length / 2) }, (_, pairIndex) => {
                  const player1 = players[pairIndex * 2];
                  const player2 = players[pairIndex * 2 + 1];

                  return (
                    <div key={`pair-${pairIndex}`} className="doubles-pair-container">
                      <div className="pair-label">
                        {t('config.players.teamLabel', { number: pairIndex + 1 })}
                      </div>
                      <div className="pair-players">
                        {[player1, player2].filter(Boolean).map(player => (
                          <div key={player!.id} className="player-item-in-pair">
                            <input
                              ref={el => { playerInputRefs.current[player!.id] = el; }}
                              type="text"
                              value={player!.name}
                              onChange={e => handleUpdatePlayer(player!.id, 'name', e.target.value)}
                              className={`player-name-input ${
                                fieldErrors[`player-${player!.id}`] ? 'input-error' : ''
                              }`}
                              placeholder={t('config.players.playerNamePlaceholder')}
                            />
                            {fieldErrors[`player-${player!.id}`] && (
                              <p className="field-error">{fieldErrors[`player-${player!.id}`]}</p>
                            )}
                            <div className="skill-level">
                              <label>{t('config.players.skill')}:</label>
                              <input
                                type="number"
                                min="1"
                                max="10"
                                value={player!.skillLevel || 5}
                                onChange={e =>
                                  handleUpdatePlayer(
                                    player!.id,
                                    'skillLevel',
                                    parseInt(e.target.value) || 5
                                  )
                                }
                                className="skill-input"
                                inputMode="numeric"
                                pattern="[0-9]*"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemovePlayer(player!.id)}
                              className="btn-remove"
                            >
                              {t('common.remove')}
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </>
            ) : (
              players.map(player => (
                <div
                  key={player.id}
                  className={`player-item ${fieldErrors[`player-${player.id}`] ? 'has-error' : ''}`}
                >
                  <input
                    ref={el => { playerInputRefs.current[player.id] = el; }}
                    type="text"
                    value={player.name}
                    onChange={e => handleUpdatePlayer(player.id, 'name', e.target.value)}
                    className="player-name-input"
                    placeholder={t('config.players.playerNamePlaceholder')}
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
                      inputMode="numeric"
                      pattern="[0-9]*"
                    />
                  </div>
                  <button type="button" onClick={() => handleRemovePlayer(player.id)} className="btn-remove">
                    {t('common.remove')}
                  </button>
                  {fieldErrors[`player-${player.id}`] && (
                    <p className="field-error">{fieldErrors[`player-${player.id}`]}</p>
                  )}
                </div>
              ))
            )}
          </div>
          <div className="add-player">
            <input
              type="text"
              placeholder={t('config.players.playerNamePlaceholder')}
              value={newPlayerName}
              onChange={e => setNewPlayerName(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddPlayer();
                }
              }}
              aria-invalid={Boolean(fieldErrors['player-new'])}
            />
            <input
              type="number"
              min="1"
              max="10"
              placeholder={t('config.players.skill')}
              value={newPlayerSkill}
              onChange={e => setNewPlayerSkill(parseInt(e.target.value) || 5)}
              className="skill-input"
              inputMode="numeric"
              pattern="[0-9]*"
            />
            <button type="button" onClick={handleAddPlayer} className="btn-secondary">
              {t('config.players.addPlayer')}
            </button>
          </div>
          {fieldErrors['player-new'] && <p className="field-error">{fieldErrors['player-new']}</p>}
        </>
      );
    }

    return (
      <div className="review-grid">
        <div className="review-card">
          <h3>{t('config.review.basics')}</h3>
          <ul>
            <li>
              <strong>{t('config.review.name')}:</strong> {config.tournamentName}
            </li>
            <li>
              <strong>{t('config.review.game')}:</strong>{' '}
              {config.gameType === 'doubles' ? t('config.basics.doubles') : t('config.basics.singles')}
              {config.gameType === 'doubles'
                ? ` (${config.doublesPartnerMode === 'fixed'
                  ? t('config.basics.doublesFixed')
                  : t('config.basics.doublesRandom')})`
                : ''}
            </li>
            <li>
              <strong>{t('config.review.scoring')}:</strong>{' '}
              {config.scoringMode === 'sets'
                ? t('config.basics.scoringSets')
                : t('config.basics.scoringSimple')}
            </li>
            <li>
              <strong>{t('config.review.startTime')}:</strong> {config.startTime}
            </li>
            <li>
              <strong>{t('config.review.matchDuration')}:</strong>{' '}
              {t('common.minutes', { count: config.matchDuration })}
            </li>
            <li>
              <strong>{t('config.review.breakDuration')}:</strong>{' '}
              {t('common.minutes', { count: config.breakDuration })}
            </li>
          </ul>
        </div>

        <div className="review-card">
          <h3>{t('config.review.courts')}</h3>
          <ul>
            <li>
              <strong>{t('config.review.courtsLabel')}:</strong> {config.courts.join(', ')}
            </li>
            <li>
              <strong>{t('config.review.scheduledBreaks')}:</strong>{' '}
              {config.scheduledBreaks.length === 0
                ? t('config.review.none')
                : config.scheduledBreaks
                    .map(b => `${b.time} (${b.duration}${t('common.minutesShort')})`)
                    .join(', ')}
            </li>
          </ul>
        </div>

        <div className="review-card">
          <h3>
            {t('config.review.players')} ({players.length})
          </h3>
          <div className="review-players">
            {players.map(player => (
              <span key={player.id} className="chip">
                {player.name} · {player.skillLevel}/10
              </span>
            ))}
          </div>
          {config.gameType === 'doubles' && config.doublesPartnerMode === 'fixed' && (
            <p className="field-description">
              {t('config.review.fixedPartnersNote')}
            </p>
          )}
        </div>
      </div>
    );
  };

  const renderProgress = (placement: 'top' | 'bottom') => (
    <div className={`wizard-progress ${placement}`}>
      <div className="wizard-progress-meta">
        <span className="wizard-progress-step">
          {t('config.progress.step', { current: currentStep + 1, total: steps.length })}
        </span>
        <span className="wizard-progress-label">
          {steps[currentStep].label}
        </span>
      </div>
      <div className="wizard-steps">
        {steps.map((step, index) => {
          const active = index === currentStep;
          const completed = index < currentStep;
          return (
            <div
              key={step.id}
              className={`wizard-step ${active ? 'active' : ''} ${completed ? 'completed' : ''}`}
            >
              <div className="wizard-step-index">{index + 1}</div>
              <div className="wizard-step-label">
                <span>{step.label}</span>
                <small>{step.description}</small>
              </div>
            </div>
          );
        })}
      </div>
      <div
        className="wizard-progress-bar"
        style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
        aria-label={t('config.progress.step', { current: currentStep + 1, total: steps.length })}
      />
    </div>
  );

  const renderNavigation = () => (
    <div className="wizard-nav">
      <button
        type="button"
        className="btn-tertiary"
        onClick={handleBack}
        disabled={currentStep === 0}
      >
        {t('common.back')}
      </button>
      <div className="wizard-nav-actions">
        {currentStep < steps.length - 1 && (
          <button type="button" className="btn-primary" onClick={handleNext}>
            {t('common.next')}
          </button>
        )}
        {currentStep === steps.length - 1 && (
          <>
            {onSaveConfigOnly && (
              <button type="button" className="btn-secondary" onClick={handleSaveWithoutRegenerate}>
                {t('config.nav.saveWithout')}
              </button>
            )}
            <button type="button" className="btn-primary" onClick={handleGenerateTournament}>
              {t('config.nav.generate')}
            </button>
          </>
        )}
      </div>
    </div>
  );

  return (
    <div className="config-panel">
      <div className="config-panel-header">
        <h1>{mode === 'edit' ? t('config.title.edit') : t('config.title.new')}</h1>
        <div className="header-actions">
          <LanguageToggle />
          <button type="button" onClick={handleLoadSampleData} className="btn-sample-data">
            {t('config.sampleData')}
          </button>
          {mode === 'edit' && onCancelEdit && (
            <button type="button" className="btn-tertiary" onClick={onCancelEdit}>
              {t('config.returnToTournament')}
            </button>
          )}
        </div>
      </div>

      {renderProgress('top')}

      {bannerErrors.length > 0 && (
        <div className="inline-banner error">
          <strong>{t('config.errors.resolve')}</strong>
          <ul>
            {bannerErrors.map((error, idx) => (
              <li key={idx}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="config-body">
        <div className="config-section">
          <div className="section-header">
            <div>
              <h2>{steps[currentStep].label}</h2>
              <p className="section-description">{steps[currentStep].description}</p>
            </div>
            <div className="section-step-chip">
              {t('config.progress.step', { current: currentStep + 1, total: steps.length })}
            </div>
          </div>

          <div className="step-content">{renderStepContent()}</div>
        </div>

        <SetupSummary config={config} players={players} defaultOpen={false} />
      </div>

      {renderNavigation()}
      {renderProgress('bottom')}
    </div>
  );
};

export default ConfigPanel;
