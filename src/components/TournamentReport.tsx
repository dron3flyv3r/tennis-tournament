import React from 'react';
import type { TournamentReport as TournamentReportType } from '../types';
import { useI18n } from '../i18n';
import './TournamentReport.css';

interface TournamentReportProps {
  report: TournamentReportType;
  onBack: () => void;
}

const TournamentReport: React.FC<TournamentReportProps> = ({ report, onBack }) => {
  const { t } = useI18n();
  const progressPercentage = (report.completedMatches / report.totalMatches) * 100;
  const isPointsMode = report.scoring.mode === 'points';
  const pointsFromGames = report.scoring.pointsSource === 'games';

  return (
    <div className="tournament-report">
      <div className="report-header">
        <button onClick={onBack} className="btn-back">
          {t('report.back')}
        </button>
        <h1>{t('report.title')}</h1>
      </div>

      <div className="report-section">
        <h2>{report.tournamentName}</h2>
        <div className="report-summary">
          <div className="summary-item">
            <span className="summary-label">{t('report.totalMatches')}</span>
            <span className="summary-value">{report.totalMatches}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">{t('report.completedMatches')}</span>
            <span className="summary-value">{report.completedMatches}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">{t('report.completion')}</span>
            <span className="summary-value">{progressPercentage.toFixed(1)}%</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">{t('report.scoring')}</span>
            <span className="summary-value">
              {isPointsMode ? t('report.scoringPoints') : t('report.scoringSets')}
            </span>
          </div>
        </div>
      </div>

      {report.playerStats.length > 0 && (
        <div className="report-section">
          <h2>{t('report.playerStats')}</h2>
          <div className="stats-table-container">
            <table className="stats-table">
              <thead>
                <tr>
                  <th>{t('report.rank')}</th>
                  <th>{t('report.player')}</th>
                  <th>{t('report.skill')}</th>
                  <th>{t('report.matches')}</th>
                  <th>{t('report.won')}</th>
                  <th>{t('report.lost')}</th>
                  <th>{t('report.winRate')}</th>
                  <th>{isPointsMode ? t('report.pointsWL') : t('report.setsWL')}</th>
                  {!isPointsMode && <th>{t('report.gamesWL')}</th>}
                </tr>
              </thead>
              <tbody>
                {report.playerStats.map((stats, idx) => {
                  const pointsWon = pointsFromGames ? stats.gamesWon : stats.setsWon;
                  const pointsLost = pointsFromGames ? stats.gamesLost : stats.setsLost;

                  return (
                    <tr key={stats.player.id}>
                      <td className="rank-cell">
                        {idx === 0 && stats.matchesWon > 0 ? '🥇' : idx === 1 && stats.matchesWon > 0 ? '🥈' : idx === 2 && stats.matchesWon > 0 ? '🥉' : idx + 1}
                      </td>
                      <td className="player-cell">{stats.player.name}</td>
                      <td className="skill-cell">{stats.player.skillLevel || '-'}</td>
                      <td>{stats.matchesPlayed}</td>
                      <td className="win-cell">{stats.matchesWon}</td>
                      <td className="loss-cell">{stats.matchesLost}</td>
                      <td className="winrate-cell">
                        {stats.matchesPlayed > 0 ? `${stats.winRate.toFixed(1)}%` : '-'}
                      </td>
                      <td>{pointsWon} / {pointsLost}</td>
                      {!isPointsMode && (
                        <td>{stats.gamesWon} / {stats.gamesLost}</td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="report-section">
        <h2>{t('report.funStatsTitle')}</h2>
        <div className="fun-stats-grid">
          {report.funStats.mostWins && report.funStats.mostWins.matchesWon > 0 && (
            <div className="fun-stat-card">
              <div className="fun-stat-icon">🏆</div>
              <div className="fun-stat-title">{t('report.mostWins')}</div>
              <div className="fun-stat-value">{report.funStats.mostWins.player.name}</div>
              <div className="fun-stat-detail">
                {t('report.victories', { count: report.funStats.mostWins.matchesWon })}
              </div>
            </div>
          )}

          {report.funStats.highestWinRate && report.funStats.highestWinRate.matchesPlayed > 0 && (
            <div className="fun-stat-card">
              <div className="fun-stat-icon">⭐</div>
              <div className="fun-stat-title">{t('report.highestWinRate')}</div>
              <div className="fun-stat-value">{report.funStats.highestWinRate.player.name}</div>
              <div className="fun-stat-detail">
                {t('report.winRateValue', { value: report.funStats.highestWinRate.winRate.toFixed(1) })}
              </div>
            </div>
          )}

          {report.funStats.mostGamesPlayed && report.funStats.mostGamesPlayed.matchesPlayed > 0 && (
            <div className="fun-stat-card">
              <div className="fun-stat-icon">🎾</div>
              <div className="fun-stat-title">{t('report.mostActive')}</div>
              <div className="fun-stat-value">{report.funStats.mostGamesPlayed.player.name}</div>
              <div className="fun-stat-detail">
                {t('report.matchesPlayed', { count: report.funStats.mostGamesPlayed.matchesPlayed })}
              </div>
            </div>
          )}

          {report.funStats.biggestWin && (
            <div className="fun-stat-card">
              <div className="fun-stat-icon">💥</div>
              <div className="fun-stat-title">{t('report.biggestWin')}</div>
              <div className="fun-stat-value">
                {report.funStats.biggestWin.team1.map(p => p.name).join(' & ')} vs{' '}
                {report.funStats.biggestWin.team2.map(p => p.name).join(' & ')}
              </div>
              <div className="fun-stat-detail">
                {t('report.score')}: {report.funStats.biggestWin.score?.team1Score} - {report.funStats.biggestWin.score?.team2Score}
              </div>
            </div>
          )}
        </div>
      </div>

      {report.completedMatches < report.totalMatches && (
        <div className="incomplete-notice">
          {t('report.incompleteNotice', {
            completed: report.completedMatches,
            total: report.totalMatches,
          })}
        </div>
      )}
    </div>
  );
};

export default TournamentReport;
