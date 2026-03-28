import { LiveFeed, PlayResult } from '../types';

export interface AtBatEntry {
  inning: number;
  eventCode: string;
  basesReached: number; // 0=out, 1=1B, 2=2B, 3=3B, 4=HR
  scored: boolean;
  rbi: number;
  isOut: boolean;
}

export interface BatterRow {
  batterId: number;
  fullName: string;
  position: string;
  jerseyNumber: string;
  atBats: AtBatEntry[];
  totals: {
    ab: number;
    r: number;
    h: number;
    rbi: number;
    bb: number;
    k: number;
  };
}

export interface PitcherEntry {
  pitcherId: number;
  fullName: string;
  inningsPitched: string;
  hits: number;
  runs: number;
  earnedRuns: number;
  walks: number;
  strikeouts: number;
  pitches: number;
  strikes: number;
  isWinner: boolean;
  isLoser: boolean;
  isSave: boolean;
}

export interface ScorecardData {
  teamName: string;
  teamAbbreviation: string;
  isHome: boolean;
  batters: BatterRow[];
  maxAtBats: number;
  pitchers: PitcherEntry[];
}

// Ordered so longer names match before shorter substrings (e.g. "first baseman" before "baseman")
const POSITION_MAP: Array<[string, number]> = [
  ['first baseman', 3],
  ['second baseman', 4],
  ['third baseman', 5],
  ['shortstop', 6],
  ['left fielder', 7],
  ['center fielder', 8],
  ['right fielder', 9],
  ['pitcher', 1],
  ['catcher', 2],
];

function positionsInOrder(description: string): number[] {
  const lower = description.toLowerCase();
  return POSITION_MAP
    .map(([name, pos]) => ({ pos, idx: lower.indexOf(name) }))
    .filter(({ idx }) => idx !== -1)
    .sort((a, b) => a.idx - b.idx)
    .map(({ pos }) => pos);
}

function getEventCode(event: string, description: string): string {
  const pos = positionsInOrder(description);

  switch (event) {
    case 'Strikeout':
      return description.toLowerCase().includes('called out on strikes') ? 'ꓘ' : 'K';
    case 'Flyout':
      return pos.length > 0 ? `F${pos[0]}` : 'F';
    case 'Sac Fly':
      return pos.length > 0 ? `SF${pos[0]}` : 'SF';
    case 'Pop Out':
    case 'Bunt Pop Out':
      return pos.length > 0 ? `P${pos[0]}` : 'P';
    case 'Lineout':
      return pos.length > 0 ? `L${pos[0]}` : 'L';
    case 'Groundout':
    case 'Bunt Groundout':
      if (pos.length >= 2) return `${pos[0]}-${pos[1]}`;
      return pos.length === 1 ? `${pos[0]}` : 'G';
    case 'Forceout':
    case "Fielder's Choice Out":
      if (pos.length >= 2) return `${pos[0]}-${pos[1]}`;
      return 'FC';
    case 'Grounded Into DP':
    case 'Double Play':
      if (pos.length >= 3) return `${pos[0]}-${pos[1]}-${pos[2]}`;
      if (pos.length === 2) return `${pos[0]}-${pos[1]}`;
      return 'GDP';
    case 'Triple Play':
      if (pos.length >= 3) return `${pos[0]}-${pos[1]}-${pos[2]}`;
      return 'TP';
    case 'Single':           return '1B';
    case 'Double':           return '2B';
    case 'Triple':           return '3B';
    case 'Home Run':         return 'HR';
    case 'Walk':             return 'BB';
    case 'Intent Walk':      return 'IBB';
    case 'Hit By Pitch':     return 'HBP';
    case "Fielder's Choice": return 'FC';
    case 'Field Error':      return 'E';
    case 'Sac Bunt':         return 'SH';
    case 'Catcher Interference': return 'CI';
    default:
      return event.substring(0, 3).toUpperCase();
  }
}

function getBasesReached(play: PlayResult): number {
  const event = play.result.event;
  if (event === 'Home Run') return 4;
  if (event === 'Triple') return 3;
  if (event === 'Double') return 2;
  if (['Single', 'Walk', 'Intent Walk', 'Hit By Pitch', 'Field Error',
    "Fielder's Choice", 'Catcher Interference', 'Fan interference'].includes(event)) return 1;
  // Check runners array for batter movement (originBase null = batter)
  const batterRunner = play.runners.find(
    r => r.movement.originBase === null && !r.movement.isOut
  );
  if (batterRunner?.movement.end === '1B') return 1;
  if (batterRunner?.movement.end === '2B') return 2;
  if (batterRunner?.movement.end === '3B') return 3;
  if (batterRunner?.movement.end === 'score') return 4;
  return 0;
}

export function buildScorecardData(
  feed: LiveFeed,
  side: 'home' | 'away'
): ScorecardData {
  const { boxscore, plays } = feed.liveData;
  const teamData = feed.gameData.teams[side];
  const boxTeam = boxscore.teams[side];
  const halfInning = side === 'away' ? 'top' : 'bottom';

  // Build scoring registry: `${halfInning}-${inning}` -> Set<playerId>
  const scorers = new Map<string, Set<number>>();
  for (const play of plays.allPlays) {
    for (const runner of play.runners) {
      if (runner.details.isScoringEvent) {
        const key = `${play.about.halfInning}-${play.about.inning}`;
        if (!scorers.has(key)) scorers.set(key, new Set());
        scorers.get(key)!.add(runner.details.runner.id);
      }
    }
  }

  // Collect at-bats per batter (in order)
  const batterAtBats = new Map<number, AtBatEntry[]>();
  for (const play of plays.allPlays) {
    if (play.about.halfInning !== halfInning || !play.about.isComplete) continue;
    const batterId = play.matchup.batter.id;
    if (!batterAtBats.has(batterId)) batterAtBats.set(batterId, []);

    const event = play.result.event;
    const eventCode = getEventCode(event, play.result.description);
    const basesReached = getBasesReached(play);
    const scorerKey = `${halfInning}-${play.about.inning}`;
    const scored = basesReached === 4 || (scorers.get(scorerKey)?.has(batterId) ?? false);

    batterAtBats.get(batterId)!.push({
      inning: play.about.inning,
      eventCode,
      basesReached,
      scored,
      rbi: play.result.rbi,
      isOut: play.result.isOut,
    });
  }

  // Build batter rows from batting order
  const batters: BatterRow[] = boxTeam.battingOrder
    .map(playerId => {
      const player = boxTeam.players[`ID${playerId}`];
      if (!player) return null;
      const stats = player.stats.batting;
      return {
        batterId: playerId,
        fullName: player.person.fullName,
        position: player.position.abbreviation,
        jerseyNumber: player.jerseyNumber,
        atBats: batterAtBats.get(playerId) ?? [],
        totals: {
          ab: stats.atBats,
          r: stats.runs,
          h: stats.hits,
          rbi: stats.rbi,
          bb: stats.baseOnBalls,
          k: stats.strikeOuts,
        },
      };
    })
    .filter((b): b is BatterRow => b !== null);

  const maxAtBats = Math.max(5, ...batters.map(b => b.atBats.length));

  // Build pitcher entries
  const pitchers: PitcherEntry[] = boxTeam.pitchers
    .map(pitcherId => {
      const player = boxTeam.players[`ID${pitcherId}`];
      if (!player) return null;
      const stats = player.stats.pitching;
      return {
        pitcherId,
        fullName: player.person.fullName,
        inningsPitched: stats.inningsPitched,
        hits: stats.hits,
        runs: stats.runs,
        earnedRuns: stats.earnedRuns,
        walks: stats.baseOnBalls,
        strikeouts: stats.strikeOuts,
        pitches: stats.numberOfPitches,
        strikes: stats.strikes,
        isWinner: stats.wins > 0,
        isLoser: stats.losses > 0,
        isSave: stats.saves > 0,
      };
    })
    .filter((p): p is PitcherEntry => p !== null);

  return {
    teamName: teamData.name,
    teamAbbreviation: teamData.abbreviation,
    isHome: side === 'home',
    batters,
    maxAtBats,
    pitchers,
  };
}
