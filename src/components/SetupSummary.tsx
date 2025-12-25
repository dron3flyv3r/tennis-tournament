import React from 'react';
import type { Player, TournamentConfig } from '../types';
import { useI18n } from '../i18n';
import './SetupSummary.css';

interface SetupSummaryProps {
  config: TournamentConfig;
  players: Player[];
  title?: string;
  defaultOpen?: boolean;
  maxPlayersShown?: number;
}

const SetupSummary: React.FC<SetupSummaryProps> = ({
  config,
  players,
  title,
  defaultOpen = false,
  maxPlayersShown = 6,
}) => {
  const { t } = useI18n();

  const gameTypeLabel =
    config.gameType === 'singles' ? t('summary.singles') : t('summary.doubles');
  const partnerLabel =
    config.gameType === 'doubles'
      ? config.doublesPartnerMode === 'fixed'
        ? t('summary.partnerModeFixed')
        : t('summary.partnerModeRandom')
      : '';
  const scoringLabel =
    config.scoringMode === 'sets' ? t('summary.scoringSets') : t('summary.scoringSimple');

  const gameTypeDisplay = partnerLabel ? `${gameTypeLabel} · ${partnerLabel}` : gameTypeLabel;
  const scheduledBreaks =
    config.scheduledBreaks.length === 0
      ? t('common.none')
      : config.scheduledBreaks
          .map(b => `${b.time} (${b.duration} ${t('common.minutesShort')})`)
          .join(', ');

  const shownPlayers = players.slice(0, maxPlayersShown);
  const remainingPlayers = players.length - shownPlayers.length;

  return (
    <details className="setup-summary" open={defaultOpen}>
      <summary className="setup-summary-header">
        <div>
          <span className="setup-summary-title">{title ?? t('summary.title')}</span>
          <span className="setup-summary-subtitle">{t('summary.subtitle')}</span>
        </div>
        <span className="setup-summary-chevron" aria-hidden>
          &gt;
        </span>
      </summary>
      <div className="setup-summary-body">
        <div className="summary-section">
          <h4>{t('summary.basics')}</h4>
          <div className="summary-row">
            <span>{t('summary.gameType')}</span>
            <strong>{gameTypeDisplay}</strong>
          </div>
          <div className="summary-row">
            <span>{t('summary.scoring')}</span>
            <strong>{scoringLabel}</strong>
          </div>
          <div className="summary-row">
            <span>{t('summary.startTime')}</span>
            <strong>{config.startTime}</strong>
          </div>
        </div>

        <div className="summary-section">
          <h4>{t('summary.schedule')}</h4>
          <div className="summary-row">
            <span>{t('summary.matchDuration')}</span>
            <strong>{t('common.minutes', { count: config.matchDuration })}</strong>
          </div>
          <div className="summary-row">
            <span>{t('summary.breakDuration')}</span>
            <strong>{t('common.minutes', { count: config.breakDuration })}</strong>
          </div>
          <div className="summary-row">
            <span>{t('summary.scheduledBreaks')}</span>
            <strong>{scheduledBreaks}</strong>
          </div>
        </div>

        <div className="summary-section">
          <h4>{t('summary.courts')}</h4>
          <div className="summary-row">
            <span>{t('summary.courtCount')}</span>
            <strong>{config.courts.length}</strong>
          </div>
          <div className="summary-chips">
            {config.courts.map(court => (
              <span key={court} className="summary-chip">
                {court}
              </span>
            ))}
          </div>
        </div>

        <div className="summary-section">
          <h4>{t('summary.players')}</h4>
          <div className="summary-row">
            <span>{t('summary.playersCount')}</span>
            <strong>{players.length}</strong>
          </div>
          <div className="summary-chips">
            {shownPlayers.map(player => (
              <span key={player.id} className="summary-chip">
                {player.name}
              </span>
            ))}
            {remainingPlayers > 0 && (
              <span className="summary-chip muted">
                {t('summary.playersMore', { count: remainingPlayers })}
              </span>
            )}
          </div>
        </div>

        <div className="summary-section">
          <h4>{t('summary.rules')}</h4>
          <div className="summary-row">
            <span>{t('summary.enforceNonRepeating')}</span>
            <strong>{config.enforceNonRepeatingMatches ? t('common.yes') : t('common.no')}</strong>
          </div>
          <div className="summary-row">
            <span>{t('summary.enforceFairMatches')}</span>
            <strong>{config.enforceFairMatches ? t('common.yes') : t('common.no')}</strong>
          </div>
          <div className="summary-row">
            <span>{t('summary.allowBypass')}</span>
            <strong>{config.allowBypass ? t('common.yes') : t('common.no')}</strong>
          </div>
        </div>
      </div>
    </details>
  );
};

export default SetupSummary;
