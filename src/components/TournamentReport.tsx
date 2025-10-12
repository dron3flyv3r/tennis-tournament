import React from 'react';
import type { TournamentReport as TournamentReportType } from '../types';
import './TournamentReport.css';

interface TournamentReportProps {
  report: TournamentReportType;
  onBack: () => void;
}

const TournamentReport: React.FC<TournamentReportProps> = ({ report, onBack }) => {
  const progressPercentage = (report.completedMatches / report.totalMatches) * 100;

  return (
    <div className="tournament-report">
      <div className="report-header">
        <button onClick={onBack} className="btn-back">
          ← Back to Matches
        </button>
        <h1>📊 Tournament Report</h1>
      </div>

      <div className="report-section">
        <h2>{report.tournamentName}</h2>
        <div className="report-summary">
          <div className="summary-item">
            <span className="summary-label">Total Matches:</span>
            <span className="summary-value">{report.totalMatches}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Completed Matches:</span>
            <span className="summary-value">{report.completedMatches}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Completion:</span>
            <span className="summary-value">{progressPercentage.toFixed(1)}%</span>
          </div>
        </div>
      </div>

      {report.playerStats.length > 0 && (
        <div className="report-section">
          <h2>Player Statistics</h2>
          <div className="stats-table-container">
            <table className="stats-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Player</th>
                  <th>Skill</th>
                  <th>Matches</th>
                  <th>Won</th>
                  <th>Lost</th>
                  <th>Win Rate</th>
                  <th>Sets W/L</th>
                  <th>Games W/L</th>
                </tr>
              </thead>
              <tbody>
                {report.playerStats.map((stats, idx) => (
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
                    <td>{stats.setsWon} / {stats.setsLost}</td>
                    <td>{stats.gamesWon} / {stats.gamesLost}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="report-section">
        <h2>🎉 Fun Stats & Highlights</h2>
        <div className="fun-stats-grid">
          {report.funStats.mostWins && report.funStats.mostWins.matchesWon > 0 && (
            <div className="fun-stat-card">
              <div className="fun-stat-icon">🏆</div>
              <div className="fun-stat-title">Most Wins</div>
              <div className="fun-stat-value">{report.funStats.mostWins.player.name}</div>
              <div className="fun-stat-detail">{report.funStats.mostWins.matchesWon} victories</div>
            </div>
          )}

          {report.funStats.highestWinRate && report.funStats.highestWinRate.matchesPlayed > 0 && (
            <div className="fun-stat-card">
              <div className="fun-stat-icon">⭐</div>
              <div className="fun-stat-title">Highest Win Rate</div>
              <div className="fun-stat-value">{report.funStats.highestWinRate.player.name}</div>
              <div className="fun-stat-detail">{report.funStats.highestWinRate.winRate.toFixed(1)}% wins</div>
            </div>
          )}

          {report.funStats.mostGamesPlayed && report.funStats.mostGamesPlayed.matchesPlayed > 0 && (
            <div className="fun-stat-card">
              <div className="fun-stat-icon">🎾</div>
              <div className="fun-stat-title">Most Active</div>
              <div className="fun-stat-value">{report.funStats.mostGamesPlayed.player.name}</div>
              <div className="fun-stat-detail">{report.funStats.mostGamesPlayed.matchesPlayed} matches played</div>
            </div>
          )}

          {report.funStats.biggestWin && (
            <div className="fun-stat-card">
              <div className="fun-stat-icon">💥</div>
              <div className="fun-stat-title">Biggest Win</div>
              <div className="fun-stat-value">
                {report.funStats.biggestWin.team1.map(p => p.name).join(' & ')} vs{' '}
                {report.funStats.biggestWin.team2.map(p => p.name).join(' & ')}
              </div>
              <div className="fun-stat-detail">
                Score: {report.funStats.biggestWin.score?.team1Score} - {report.funStats.biggestWin.score?.team2Score}
              </div>
            </div>
          )}
        </div>
      </div>

      {report.completedMatches < report.totalMatches && (
        <div className="incomplete-notice">
          ℹ️ This report is based on {report.completedMatches} completed matches out of {report.totalMatches} total matches.
        </div>
      )}
    </div>
  );
};

export default TournamentReport;
