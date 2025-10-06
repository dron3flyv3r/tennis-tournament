export interface Player {
  id: string;
  name: string;
  skillLevel?: number; // Optional skill rating (1-10)
}

export interface Match {
  id: string;
  court: string;
  time: string;
  team1: Player[];
  team2: Player[];
  score?: MatchScore;
  completed: boolean;
}

export interface MatchScore {
  team1Sets: number;
  team2Sets: number;
  sets: SetScore[];
}

export interface SetScore {
  team1Games: number;
  team2Games: number;
  tiebreak?: {
    team1Points: number;
    team2Points: number;
  };
}

export interface ScheduledBreak {
  id: string;
  time: string; // HH:MM format
  duration: number; // in minutes
}

export interface TournamentConfig {
  tournamentName: string;
  gameType: 'singles' | 'doubles';
  doublesPartnerMode: 'fixed' | 'random-non-repeating';
  courts: string[];
  startTime: string;
  matchDuration: number; // in minutes
  breakDuration: number; // default break between matches in minutes
  scheduledBreaks: ScheduledBreak[]; // optional scheduled breaks
  enforceNonRepeatingMatches: boolean;
  enforceFairMatches: boolean; // everyone plays same number of games
  allowBypass: boolean; // show popup if impossible to meet constraints
}

export interface PlayerStats {
  player: Player;
  matchesPlayed: number;
  matchesWon: number;
  matchesLost: number;
  setsWon: number;
  setsLost: number;
  gamesWon: number;
  gamesLost: number;
  winRate: number;
}

export interface TournamentReport {
  tournamentName: string;
  totalMatches: number;
  completedMatches: number;
  playerStats: PlayerStats[];
  funStats: {
    mostWins: PlayerStats | null;
    highestWinRate: PlayerStats | null;
    mostGamesPlayed: PlayerStats | null;
    biggestWin: Match | null;
  };
}
