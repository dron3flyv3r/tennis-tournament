import type { Player, Match, TournamentConfig, PlayerStats, TournamentReport } from './types';

/**
 * Generates all possible matches for the tournament
 */
export function generateMatches(
  players: Player[],
  config: TournamentConfig
): { matches: Match[]; warnings: string[] } {
  const warnings: string[] = [];

  if (config.gameType === 'singles') {
    return generateSinglesMatches(players, config, warnings);
  } else {
    return generateDoublesMatches(players, config, warnings);
  }
}

function generateSinglesMatches(
  players: Player[],
  config: TournamentConfig,
  warnings: string[]
): { matches: Match[]; warnings: string[] } {
  const matches: Match[] = [];
  const playerMatchCount = new Map<string, number>();
  players.forEach(p => playerMatchCount.set(p.id, 0));

  // Generate all possible pairings
  const allPairings: [Player, Player][] = [];
  for (let i = 0; i < players.length; i++) {
    for (let j = i + 1; j < players.length; j++) {
      allPairings.push([players[i], players[j]]);
    }
  }

  // If fair matches is enforced, calculate target matches per player
  if (config.enforceFairMatches) {
    // For round-robin, each player plays every other player once
    
    if (config.enforceNonRepeatingMatches && allPairings.length > 0) {
      // Use all pairings for round-robin
      allPairings.forEach((pairing, idx) => {
        matches.push(createMatch(pairing[0], pairing[1], idx));
        playerMatchCount.set(pairing[0].id, (playerMatchCount.get(pairing[0].id) || 0) + 1);
        playerMatchCount.set(pairing[1].id, (playerMatchCount.get(pairing[1].id) || 0) + 1);
      });
    } else {
      allPairings.forEach((pairing, idx) => {
        matches.push(createMatch(pairing[0], pairing[1], idx));
        playerMatchCount.set(pairing[0].id, (playerMatchCount.get(pairing[0].id) || 0) + 1);
        playerMatchCount.set(pairing[1].id, (playerMatchCount.get(pairing[1].id) || 0) + 1);
      });
    }
  } else {
    // Generate matches without strict fairness
    allPairings.forEach((pairing, idx) => {
      matches.push(createMatch(pairing[0], pairing[1], idx));
    });
  }

  // Assign courts and times
  assignCourtsAndTimes(matches, config);

  // Check for warnings
  if (config.enforceFairMatches) {
    const matchCounts = Array.from(playerMatchCount.values());
    const minMatches = Math.min(...matchCounts);
    const maxMatches = Math.max(...matchCounts);
    if (maxMatches - minMatches > 0) {
      warnings.push(`Unable to create perfectly fair matches. Match count varies from ${minMatches} to ${maxMatches}.`);
    }
  }

  return { matches, warnings };
}

function generateDoublesMatches(
  players: Player[],
  config: TournamentConfig,
  warnings: string[]
): { matches: Match[]; warnings: string[] } {
  const matches: Match[] = [];

  if (players.length < 4) {
    warnings.push('Need at least 4 players for doubles matches.');
    return { matches, warnings };
  }

  if (config.doublesPartnerMode === 'fixed') {
    return generateFixedDoublesMatches(players, config, warnings);
  } else {
    return generateRandomDoublesMatches(players, config, warnings);
  }
}

function generateFixedDoublesMatches(
  players: Player[],
  config: TournamentConfig,
  warnings: string[]
): { matches: Match[]; warnings: string[] } {
  const matches: Match[] = [];

  if (players.length % 2 !== 0) {
    warnings.push('Odd number of players. One player will sit out each round.');
  }

  // Pair players sequentially (could be enhanced to use pre-defined pairs)
  const teams: [Player, Player][] = [];
  for (let i = 0; i < players.length - 1; i += 2) {
    teams.push([players[i], players[i + 1]]);
  }

  // Generate all team matchups
  let matchIdx = 0;
  for (let i = 0; i < teams.length; i++) {
    for (let j = i + 1; j < teams.length; j++) {
      matches.push(createDoublesMatch(teams[i], teams[j], matchIdx++));
    }
  }

  assignCourtsAndTimes(matches, config);

  return { matches, warnings };
}

function generateRandomDoublesMatches(
  players: Player[],
  config: TournamentConfig,
  warnings: string[]
): { matches: Match[]; warnings: string[] } {
  const matches: Match[] = [];
  const partnerPairs = new Set<string>();
  const opponentPairs = new Set<string>();
  const playerMatchCount = new Map<string, number>();
  players.forEach(p => playerMatchCount.set(p.id, 0));

  // Helper to create pair key
  const getPairKey = (p1: Player, p2: Player) => {
    return [p1.id, p2.id].sort().join('-');
  };

  // Generate matches with non-repeating partners
  let attempts = 0;
  const maxAttempts = 1000;
  let matchIdx = 0;

  while (attempts < maxAttempts) {
    attempts++;

    // Shuffle players
    const shuffled = [...players].sort(() => Math.random() - 0.5);
    
    if (shuffled.length < 4) break;

    // Try to form two teams
    const team1 = [shuffled[0], shuffled[1]];
    const team2 = [shuffled[2], shuffled[3]];

    const partner1Key = getPairKey(team1[0], team1[1]);
    const partner2Key = getPairKey(team2[0], team2[1]);

    // Check if these partners have played together before
    if (config.enforceNonRepeatingMatches) {
      if (partnerPairs.has(partner1Key) || partnerPairs.has(partner2Key)) {
        continue;
      }

      // Check if these opponents have faced each other
      const opponentKeys = [
        getPairKey(team1[0], team2[0]),
        getPairKey(team1[0], team2[1]),
        getPairKey(team1[1], team2[0]),
        getPairKey(team1[1], team2[1]),
      ];

      if (opponentKeys.some(key => opponentPairs.has(key))) {
        continue;
      }

      // Valid match found
      partnerPairs.add(partner1Key);
      partnerPairs.add(partner2Key);
      opponentKeys.forEach(key => opponentPairs.add(key));
    }

    matches.push(createDoublesMatch(
      [team1[0], team1[1]],
      [team2[0], team2[1]],
      matchIdx++
    ));

    team1.forEach(p => playerMatchCount.set(p.id, (playerMatchCount.get(p.id) || 0) + 1));
    team2.forEach(p => playerMatchCount.set(p.id, (playerMatchCount.get(p.id) || 0) + 1));

    // Check if we've reached fair distribution
    if (config.enforceFairMatches) {
      const matchCounts = Array.from(playerMatchCount.values());
      const minMatches = Math.min(...matchCounts);
      const maxMatches = Math.max(...matchCounts);
      
      // Continue until everyone has played a reasonable number of matches
      if (minMatches >= Math.floor(players.length / 2) && maxMatches - minMatches <= 1) {
        break;
      }
    }
  }

  assignCourtsAndTimes(matches, config);

  if (config.enforceFairMatches) {
    const matchCounts = Array.from(playerMatchCount.values());
    const minMatches = Math.min(...matchCounts);
    const maxMatches = Math.max(...matchCounts);
    if (maxMatches - minMatches > 1) {
      warnings.push(`Unable to create perfectly fair matches. Match count varies from ${minMatches} to ${maxMatches}.`);
    }
  }

  return { matches, warnings };
}

function createMatch(player1: Player, player2: Player, index: number): Match {
  return {
    id: `match-${index}`,
    court: '',
    time: '',
    team1: [player1],
    team2: [player2],
    completed: false,
  };
}

function createDoublesMatch(
  team1: [Player, Player],
  team2: [Player, Player],
  index: number
): Match {
  return {
    id: `match-${index}`,
    court: '',
    time: '',
    team1: [team1[0], team1[1]],
    team2: [team2[0], team2[1]],
    completed: false,
  };
}

function assignCourtsAndTimes(matches: Match[], config: TournamentConfig) {
  if (!matches.length) {
    return;
  }

  const courts = config.courts.filter(court => court.trim().length > 0);
  const matchDuration = Math.max(1, config.matchDuration);
  const slotGap = Math.max(0, config.breakDuration);
  const startTime = parseTime(config.startTime);

  if (!courts.length) {
    // No courts configured; assign sequential times so downstream UI stays usable.
    matches.forEach((match, index) => {
      match.court = '';
      match.time = formatTime(startTime + index * (matchDuration + slotGap));
    });
    return;
  }

  const remainingMatches = [...matches];
  const playerNextAvailable = new Map<string, number>();
  const scheduledBreaks = [...config.scheduledBreaks]
    .map(b => ({
      start: parseTime(b.time),
      end: parseTime(b.time) + Math.max(0, b.duration),
    }))
    .filter(b => b.end > b.start)
    .sort((a, b) => a.start - b.start);

  const skipBreaks = (time: number): number => {
    let adjustedTime = time;
    while (true) {
      const activeBreak = scheduledBreaks.find(b => adjustedTime >= b.start && adjustedTime < b.end);
      if (!activeBreak) {
        return adjustedTime;
      }
      adjustedTime = activeBreak.end;
    }
  };

  let currentTime = skipBreaks(startTime);

  while (remainingMatches.length > 0) {
    const slotPlayers = new Set<string>();
    let courtsUsed = 0;
    let assignedThisSlot = false;

    for (let idx = 0; idx < remainingMatches.length && courtsUsed < courts.length; ) {
      const match = remainingMatches[idx];
      const matchPlayerIds = [
        ...match.team1.map(p => p.id),
        ...match.team2.map(p => p.id),
      ];

      const conflict = matchPlayerIds.some(playerId => {
        const nextAvailable = playerNextAvailable.get(playerId) ?? startTime;
        return nextAvailable > currentTime || slotPlayers.has(playerId);
      });

      if (conflict) {
        idx++;
        continue;
      }

      match.court = courts[courtsUsed];
      match.time = formatTime(currentTime);
      matchPlayerIds.forEach(playerId => {
        slotPlayers.add(playerId);
        playerNextAvailable.set(playerId, currentTime + matchDuration + slotGap);
      });

      remainingMatches.splice(idx, 1);
      courtsUsed++;
      assignedThisSlot = true;
    }

    const nextTimeCandidates: number[] = [];

    if (assignedThisSlot) {
      nextTimeCandidates.push(currentTime + matchDuration + slotGap);
    } else {
      // No matches could be scheduled because everyone in the queue is still busy.
      const availabilityTimes = [...playerNextAvailable.values()].filter(t => t > currentTime);
      if (availabilityTimes.length) {
        nextTimeCandidates.push(Math.min(...availabilityTimes));
      }
      nextTimeCandidates.push(currentTime + matchDuration + slotGap);
    }

    currentTime = skipBreaks(Math.min(...nextTimeCandidates));
  }
}

function parseTime(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

function formatTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

/**
 * Calculate statistics for all players
 */
export function calculatePlayerStats(matches: Match[], players: Player[]): PlayerStats[] {
  const statsMap = new Map<string, PlayerStats>();

  // Initialize stats for all players
  players.forEach(player => {
    statsMap.set(player.id, {
      player,
      matchesPlayed: 0,
      matchesWon: 0,
      matchesLost: 0,
      setsWon: 0,
      setsLost: 0,
      gamesWon: 0,
      gamesLost: 0,
      winRate: 0,
    });
  });

  // Calculate stats from completed matches
  matches.filter(m => m.completed && m.score).forEach(match => {
    const score = match.score!;
    const team1Won = score.team1Score > score.team2Score;

    // Update stats for team 1
    match.team1.forEach(player => {
      const stats = statsMap.get(player.id)!;
      stats.matchesPlayed++;
      if (team1Won) {
        stats.matchesWon++;
      } else {
        stats.matchesLost++;
      }
      stats.setsWon += score.team1Score;
      stats.setsLost += score.team2Score;

      if (score.sets) {
        score.sets.forEach(set => {
          stats.gamesWon += set.team1Games;
          stats.gamesLost += set.team2Games;
        });
      }
    });

    // Update stats for team 2
    match.team2.forEach(player => {
      const stats = statsMap.get(player.id)!;
      stats.matchesPlayed++;
      if (!team1Won) {
        stats.matchesWon++;
      } else {
        stats.matchesLost++;
      }
      stats.setsWon += score.team2Score;
      stats.setsLost += score.team1Score;

      if (score.sets) {
        score.sets.forEach(set => {
          stats.gamesWon += set.team2Games;
          stats.gamesLost += set.team1Games;
        });
      }
    });
  });

  // Calculate win rates
  statsMap.forEach(stats => {
    if (stats.matchesPlayed > 0) {
      stats.winRate = (stats.matchesWon / stats.matchesPlayed) * 100;
    }
  });

  return Array.from(statsMap.values());
}

/**
 * Generate tournament report
 */
export function generateReport(
  matches: Match[],
  players: Player[],
  tournamentName: string
): TournamentReport {
  const playerStats = calculatePlayerStats(matches, players);
  const completedMatches = matches.filter(m => m.completed);

  // Find fun stats
  const mostWins = playerStats.reduce((max, stats) => 
    !max || stats.matchesWon > max.matchesWon ? stats : max
  , null as PlayerStats | null);

  const highestWinRate = playerStats
    .filter(s => s.matchesPlayed > 0)
    .reduce((max, stats) => 
      !max || stats.winRate > max.winRate ? stats : max
    , null as PlayerStats | null);

  const mostGamesPlayed = playerStats.reduce((max, stats) => 
    !max || stats.matchesPlayed > max.matchesPlayed ? stats : max
  , null as PlayerStats | null);

  const biggestWin = completedMatches
    .filter(m => m.score)
    .reduce((biggest, match) => {
      const score = match.score!;
      const scoreDiff = Math.abs(score.team1Score - score.team2Score);
      const gameDiff = score.sets ? score.sets.reduce((sum, set) => 
        sum + Math.abs(set.team1Games - set.team2Games), 0
      ) : 0;
      
      if (!biggest || scoreDiff > 0) {
        const biggestScore = biggest?.score;
        const biggestScoreDiff = biggestScore ? Math.abs(biggestScore.team1Score - biggestScore.team2Score) : 0;
        const biggestGameDiff = biggestScore?.sets ? biggestScore.sets.reduce((sum, set) => 
          sum + Math.abs(set.team1Games - set.team2Games), 0
        ) : 0;

        if (scoreDiff > biggestScoreDiff || (scoreDiff === biggestScoreDiff && gameDiff > biggestGameDiff)) {
          return match;
        }
      }
      return biggest;
    }, null as Match | null);

  return {
    tournamentName,
    totalMatches: matches.length,
    completedMatches: completedMatches.length,
    playerStats: playerStats.sort((a, b) => b.matchesWon - a.matchesWon),
    funStats: {
      mostWins,
      highestWinRate,
      mostGamesPlayed,
      biggestWin,
    },
  };
}
