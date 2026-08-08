import { Platform } from 'react-native';

// L'API Node+Supabase tourne sur le port 3000.
// - Web (Expo web) : même hôte que le navigateur.
// - Natif (device/emulateur) : remplace par l'IP LAN de ta machine, ex http://192.168.1.10:3000
const WEB_HOST =
  Platform.OS === 'web' && typeof window !== 'undefined' ? window.location.hostname : 'localhost';
export const API_BASE = `http://${WEB_HOST}:3000`;

export type User = {
  id: string;
  name: string;
  age: number;
  city: string;
  gender: string;
  bio: string;
  interests: string[];
  grad: [string, string];
  emoji: string;
  online: boolean;
};

export type Match = {
  id: string;
  user: User;
  lastMessage: string | null;
  count: number;
};

export type AppState = {
  me: User;
  deck: User[];
  matches: Match[];
  premium: boolean;
  likesLeft: number | null;
  likedYouCount: number;
  likedYou: User[];
  icebreakers: string[];
};

export type ChatMsg = { from: 'me' | 'them'; text: string };

async function req(path: string, opts?: RequestInit) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
  });
  return res.json();
}

export const api = {
  state: (): Promise<AppState> => req('/api/state'),
  swipe: (targetId: string, action: 'like' | 'pass' | 'crush') =>
    req('/api/swipe', { method: 'POST', body: JSON.stringify({ targetId, action }) }),
  messages: (matchId: string): Promise<{ user: User; messages: ChatMsg[] }> =>
    req(`/api/messages?matchId=${matchId}`),
  send: (matchId: string, text: string): Promise<{ messages: ChatMsg[] }> =>
    req('/api/messages', { method: 'POST', body: JSON.stringify({ matchId, text }) }),
  premium: () => req('/api/premium', { method: 'POST', body: '{}' }),
  saveProfile: (p: Partial<User>) =>
    req('/api/profile', { method: 'POST', body: JSON.stringify(p) }),
  reset: () => req('/api/reset', { method: 'POST', body: '{}' }),
};

// Helpers d'affichage (données non fournies par l'API démo)
export function kmAway(id: string) {
  const n = parseInt(id.replace(/\D/g, ''), 10) || 1;
  return (((n * 1.7) % 8) + 1).toFixed(0);
}
export function commonInterests(u: User) {
  return Math.max(1, Math.min(6, (u.interests?.length || 1) + (u.online ? 1 : 0)));
}
