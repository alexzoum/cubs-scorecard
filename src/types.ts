export interface ScheduleGame {
  gamePk: number;
  gameDate: string;
  status: {
    abstractGameState: string;
    detailedState: string;
    statusCode: string;
  };
  teams: {
    away: { team: { id: number; name: string } };
    home: { team: { id: number; name: string } };
  };
  venue: { name: string };
}

export interface LinescoreInning {
  num: number;
  ordinalNum: string;
  home: { runs?: number; hits?: number; errors?: number };
  away: { runs?: number; hits?: number; errors?: number };
}

export interface Linescore {
  currentInning?: number;
  currentInningOrdinal?: string;
  inningState?: string;
  inningHalf?: string;
  isTopInning?: boolean;
  scheduledInnings: number;
  innings: LinescoreInning[];
  teams: {
    home: { runs: number; hits: number; errors: number };
    away: { runs: number; hits: number; errors: number };
  };
  balls?: number;
  strikes?: number;
  outs?: number;
}

export interface PlayerStats {
  batting: {
    atBats: number;
    runs: number;
    hits: number;
    rbi: number;
    baseOnBalls: number;
    strikeOuts: number;
    homeRuns: number;
    doubles: number;
    triples: number;
    plateAppearances: number;
    stolenBases: number;
    summary: string;
  };
  pitching: {
    inningsPitched: string;
    hits: number;
    runs: number;
    earnedRuns: number;
    baseOnBalls: number;
    strikeOuts: number;
    homeRuns: number;
    numberOfPitches: number;
    strikes: number;
    balls: number;
    wins: number;
    losses: number;
    saves: number;
    summary: string;
  };
}

export interface BoxscorePlayer {
  person: { id: number; fullName: string };
  jerseyNumber: string;
  position: { abbreviation: string };
  stats: PlayerStats;
  seasonStats: {
    batting: { avg: string; obp: string; slg: string; ops: string };
    pitching: { era: string; whip: string };
  };
  battingOrder?: string;
  gameStatus: {
    isCurrentBatter: boolean;
    isCurrentPitcher: boolean;
    isSubstitute: boolean;
  };
}

export interface BoxscoreTeam {
  battingOrder: number[];
  pitchers: number[];
  players: Record<string, BoxscorePlayer>;
  teamStats: {
    batting: {
      atBats: number;
      runs: number;
      hits: number;
      rbi: number;
      baseOnBalls: number;
      strikeOuts: number;
      homeRuns: number;
    };
    pitching: {
      inningsPitched: string;
      hits: number;
      runs: number;
      earnedRuns: number;
      baseOnBalls: number;
      strikeOuts: number;
    };
  };
}

export interface PlayResult {
  result: {
    type: string;
    event: string;
    eventType: string;
    description: string;
    rbi: number;
    awayScore: number;
    homeScore: number;
    isOut: boolean;
  };
  about: {
    atBatIndex: number;
    halfInning: string;
    isTopInning: boolean;
    inning: number;
    isComplete: boolean;
    isScoringPlay: boolean;
  };
  matchup: {
    batter: { id: number; fullName: string };
    pitcher: { id: number; fullName: string };
  };
  runners: Array<{
    movement: {
      originBase: string | null;
      start: string | null;
      end: string | null;
      isOut: boolean;
    };
    details: {
      event: string;
      runner: { id: number; fullName: string };
      isScoringEvent: boolean;
    };
  }>;
}

export interface LiveFeed {
  gamePk: number;
  gameData: {
    status: {
      abstractGameState: string;
      detailedState: string;
      statusCode: string;
    };
    teams: {
      away: { id: number; name: string; abbreviation: string };
      home: { id: number; name: string; abbreviation: string };
    };
    datetime: { dateTime: string; officialDate: string };
    venue: { name: string };
    weather?: { condition: string; temp: string; wind: string };
    probablePitchers?: {
      away?: { id: number; fullName: string };
      home?: { id: number; fullName: string };
    };
  };
  liveData: {
    linescore: Linescore;
    boxscore: {
      teams: {
        home: BoxscoreTeam;
        away: BoxscoreTeam;
      };
    };
    plays: {
      allPlays: PlayResult[];
      currentPlay?: PlayResult;
      playsByInning: Array<{
        top: number[];
        bottom: number[];
      }>;
    };
  };
}
