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
const STORAGE_KEY = 'tennis_tournament_state_v2';

const hasWindow = typeof window !== 'undefined';

const getLocalStorage = () => {
  if (!hasWindow) {
    return null;
  }

  try {
    return window.localStorage;
  } catch (error) {
    console.warn('Local storage unavailable, falling back to cookies.', error);
    return null;
  }
};

const storage = getLocalStorage();

function readFromLocalStorage(): TournamentState | null {
  if (!storage) {
    return null;
  }

  const raw = storage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as TournamentState;
  } catch (error) {
    console.error('Failed to parse tournament state from local storage:', error);
    storage.removeItem(STORAGE_KEY);
    return null;
  }
}

function writeToLocalStorage(state: TournamentState): boolean {
  if (!storage) {
    return false;
  }

  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch (error) {
    console.warn('Failed to save tournament state to local storage, attempting cookie fallback.', error);
    return false;
  }
}

/**
 * Save tournament state to cookies
 */
export function saveTournamentState(state: TournamentState): void {
  const stored = writeToLocalStorage(state);
  if (stored) {
    return;
  }

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
  const localState = readFromLocalStorage();
  if (localState) {
    return localState;
  }

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
  const parsed = JSON.parse(jsonState) as TournamentState;
  // Attempt to migrate cookie-based saves into local storage for future reliability.
  writeToLocalStorage(parsed);
  return parsed;
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
  if (storage) {
    storage.removeItem(STORAGE_KEY);
  }
  document.cookie = `${COOKIE_NAME}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
}

/**
 * Check if tournament state exists in cookies
 */
export function hasSavedTournamentState(): boolean {
  if (readFromLocalStorage()) {
    return true;
  }

  return loadTournamentState() !== null;
}
