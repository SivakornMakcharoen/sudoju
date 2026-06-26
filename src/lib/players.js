import { db } from './supabase.js';

export function blankStats() {
  return {
    beginner:     { played: 0, best: null },
    intermediate: { played: 0, best: null },
    advance:      { played: 0, best: null },
  };
}

/**
 * Load a player by email. Returns null if not found.
 * @returns {Promise<Player|null>}
 */
export async function loadPlayer(email) {
  const { data, error } = await db
    .from('players')
    .select('*')
    .eq('email', email)
    .maybeSingle();

  if (error || !data) return null;
  return {
    name:      data.name,
    email:     data.email,
    level:     data.stats.level ?? null,
    stats:     data.stats.scores ?? blankStats(),
    createdAt: data.created_at,
  };
}

/**
 * Upsert a player record.
 * @param {{ name: string, email: string, level: string|null, stats: object }} player
 */
export async function savePlayer(player) {
  const payload = {
    email:      player.email,
    name:       player.name,
    stats:      { level: player.level, scores: player.stats },
    updated_at: new Date().toISOString(),
  };
  const { error } = await db
    .from('players')
    .upsert(payload, { onConflict: 'email' });
  if (error) console.error('savePlayer error', error);
}

/**
 * Fetch all players (for leaderboard).
 */
export async function fetchAllPlayers() {
  const { data, error } = await db.from('players').select('email, name, stats');
  if (error || !data) return [];
  return data.map(row => ({
    email: row.email,
    name:  row.name,
    stats: row.stats.scores ?? blankStats(),
  }));
}

/**
 * Get top-N players for a given level, sorted by best time.
 */
export function topForLevel(players, level, n = 3) {
  return players
    .filter(u => {
      const st = u?.stats?.[level];
      return st && typeof st.best === 'number' && isFinite(st.best) && st.best >= 0 && st.best < 86400
        && typeof u.name === 'string' && typeof u.email === 'string';
    })
    .map(u => ({ name: u.name, email: u.email, best: u.stats[level].best }))
    .sort((a, b) => a.best - b.best)
    .slice(0, n);
}

const STORAGE_KEY = 'sudoju_current_player';

export function saveSession(player) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(player));
}

export function loadSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearSession() {
  localStorage.removeItem(STORAGE_KEY);
}
