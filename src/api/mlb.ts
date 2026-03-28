import { LiveFeed, ScheduleGame } from '../types';

const MLB_BASE = 'https://statsapi.mlb.com/api/v1';
export const CUBS_TEAM_ID = 112;

export async function fetchCubsGames(date: string): Promise<ScheduleGame[]> {
  const res = await fetch(
    `${MLB_BASE}/schedule?sportId=1&teamId=${CUBS_TEAM_ID}&date=${date}&hydrate=linescore`
  );
  if (!res.ok) throw new Error(`Schedule fetch failed: ${res.status}`);
  const data = await res.json();
  return data.dates?.[0]?.games ?? [];
}

export async function fetchGameFeed(gamePk: number): Promise<LiveFeed> {
  const res = await fetch(
    `https://statsapi.mlb.com/api/v1.1/game/${gamePk}/feed/live`
  );
  if (!res.ok) throw new Error(`Game feed fetch failed: ${res.status}`);
  return res.json();
}
