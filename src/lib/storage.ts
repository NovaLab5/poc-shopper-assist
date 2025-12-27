import { AppState, Session, SelectedAnswer, AIInterpretation } from './types';

const STORAGE_KEY = 'sweetdill-shopping-assistant';

export function loadState(): AppState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to load state from localStorage:', e);
  }
  return { sessions: [] };
}

export function saveState(state: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save state to localStorage:', e);
  }
}

export function createSession(): Session {
  return {
    id: `session-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    startedAt: Date.now(),
    answers: [],
  };
}

export function addAnswerToSession(
  session: Session,
  answer: SelectedAnswer
): Session {
  return {
    ...session,
    answers: [...session.answers, answer],
  };
}

export function completeSession(
  session: Session,
  interpretation: AIInterpretation,
  recommendedProductIds: string[]
): Session {
  return {
    ...session,
    completedAt: Date.now(),
    interpretation,
    recommendedProductIds,
  };
}

export function addSession(state: AppState, session: Session): AppState {
  return {
    ...state,
    sessions: [...state.sessions, session],
  };
}

export function updateSession(state: AppState, session: Session): AppState {
  const index = state.sessions.findIndex(s => s.id === session.id);
  if (index === -1) {
    return addSession(state, session);
  }
  const sessions = [...state.sessions];
  sessions[index] = session;
  return { ...state, sessions };
}

export function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
