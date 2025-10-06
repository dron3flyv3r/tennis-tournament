import type { Player, TournamentConfig, Match } from './types';

interface TournamentState {
  config: TournamentConfig;
  players: Player[];
  matches: Match[];
  warnings: string[];
  tournamentStarted: boolean;
}

const COOKIE_NAME = 'tennis_tournament_state';
const COOKIE_EXPIRY_DAYS = 7;

/**
 * Save tournament state to cookies
 */
export function saveTournamentState(state: TournamentState): void {
  try {
    const jsonState = JSON.stringify(state);
    const encodedState = encodeURIComponent(jsonState);
    const expiryDate = new Date();
    expiryDate.setTime(expiryDate.getTime() + (COOKIE_EXPIRY_DAYS * 24 * 60 * 60 * 1000));
    const expires = `expires=${expiryDate.toUTCString()}`;
    document.cookie = `${COOKIE_NAME}=${encodedState};${expires};path=/;SameSite=Lax`;
  } catch (error) {
    console.error('Failed to save tournament state to cookies:', error);
  }
}

/**
 * Load tournament state from cookies
 */
export function loadTournamentState(): TournamentState | null {
  try {
    const nameEQ = `${COOKIE_NAME}=`;
    const cookies = document.cookie.split(';');
    
    for (let i = 0; i < cookies.length; i++) {
      let cookie = cookies[i];
      while (cookie.charAt(0) === ' ') {
        cookie = cookie.substring(1, cookie.length);
      }
      if (cookie.indexOf(nameEQ) === 0) {
        const encodedState = cookie.substring(nameEQ.length, cookie.length);
        const jsonState = decodeURIComponent(encodedState);
        return JSON.parse(jsonState) as TournamentState;
      }
    }
    return null;
  } catch (error) {
    console.error('Failed to load tournament state from cookies:', error);
    return null;
  }
}

/**
 * Clear tournament state from cookies
 */
export function clearTournamentState(): void {
  document.cookie = `${COOKIE_NAME}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
}

/**
 * Check if tournament state exists in cookies
 */
export function hasSavedTournamentState(): boolean {
  return loadTournamentState() !== null;
}
