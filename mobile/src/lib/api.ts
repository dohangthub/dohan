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
  verified?: boolean;
  dmPolicy?: 'everyone' | 'verified' | 'requests';
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

export type Post = {
  id: string;
  kind: 'photo' | 'text';
  body: string;
  photo: string | null;
  likes: number;
  author: User;
  createdAt: string;
};

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
  feed: (): Promise<{ posts: Post[] }> => req('/api/feed'),
  createPost: (body: string, photo?: string | null) =>
    req('/api/post', { method: 'POST', body: JSON.stringify({ kind: photo ? 'photo' : 'text', body, photo }) }),
  likePost: (postId: string) =>
    req('/api/feed/like', { method: 'POST', body: JSON.stringify({ postId }) }),
  dm: (authorId: string): Promise<{ ok: boolean; status: 'open' | 'pending' | 'verified_only'; matchId?: string }> =>
    req('/api/dm', { method: 'POST', body: JSON.stringify({ authorId }) }),
  verify: () => req('/api/verify', { method: 'POST', body: '{}' }),
  saveProfile: (p: Partial<User>) =>
    req('/api/profile', { method: 'POST', body: JSON.stringify(p) }),
  reset: () => req('/api/reset', { method: 'POST', body: '{}' }),
};

// Photos réelles (Unsplash) — mappées par profil, genre respecté.
// Repli sur dégradé+emoji si absent/échec (géré dans les composants).
const PHOTOS: Record<string, string> = {
  // Femmes
  u1: '1494790108377-be9c29b29330',
  u2: '1534528741775-53994a69daeb',
  u3: '1544005313-94ddf0286df2',
  u4: '1517841905240-472988babdf9',
  u5: '1531123897727-8f129e1688ce',
  u6: '1524250502761-1ac6f2e30d43',
  u7: '1489424731084-a5d8b219a5bb',
  u8: '1508214751196-bcfd4ca60f91',
  // Hommes
  u9: '1507003211169-0a1dd7228f2d',
  u10: '1506794778202-cad84cf45f1d',
  u11: '1519085360753-af0119f7cbe7',
  u12: '1508341591423-4347099e1f19',
};

export function photoUrl(u: User, w = 600, h = 800): string | null {
  const id = u && PHOTOS[u.id];
  if (!id) return null;
  return `https://images.unsplash.com/photo-${id}?w=${w}&h=${h}&fit=crop&crop=faces&q=80`;
}

// Helpers d'affichage (données non fournies par l'API démo)
export function kmAway(id: string) {
  const n = parseInt(id.replace(/\D/g, ''), 10) || 1;
  return (((n * 1.7) % 8) + 1).toFixed(0);
}
export function commonInterests(u: User) {
  return Math.max(1, Math.min(6, (u.interests?.length || 1) + (u.online ? 1 : 0)));
}
