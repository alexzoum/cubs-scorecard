import { useState, useEffect, useCallback } from 'react';
import './App.css';
import { fetchCubsGames, fetchGameFeed, CUBS_TEAM_ID } from './api/mlb';
import { ScheduleGame, LiveFeed } from './types';
import Scorecard from './components/Scorecard';
import { buildScorecardData } from './utils/scorecard';

function todayLocal(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatGameTime(dateTime: string): string {
  return new Date(dateTime).toLocaleTimeString('en-US', {
    hour: 'numeric', minute: '2-digit', timeZoneName: 'short'
  });
}

function Linescore({ feed }: { feed: LiveFeed }) {
  const { linescore } = feed.liveData;
  const { teams } = feed.gameData;
  const innings = linescore.innings;
  const total = Math.max(linescore.scheduledInnings, innings.length);
  const innNums = Array.from({ length: total }, (_, i) => i + 1);

  return (
    <div className="linescore-wrapper">
      <table className="linescore-table">
        <thead>
          <tr>
            <th className="ls-team-col" />
            {innNums.map(n => (
              <th key={n} className={`ls-inn-col${linescore.currentInning === n ? ' ls-current' : ''}`}>
                {n}
              </th>
            ))}
            <th className="ls-total-col ls-r">R</th>
            <th className="ls-total-col">H</th>
            <th className="ls-total-col">E</th>
          </tr>
        </thead>
        <tbody>
          {(['away', 'home'] as const).map(side => {
            const teamInfo = teams[side];
            const isCubs = teamInfo.id === CUBS_TEAM_ID;
            return (
              <tr key={side} className={isCubs ? 'ls-row-cubs' : ''}>
                <td className="ls-team-col">
                  <span className="ls-abbr">{teamInfo.abbreviation}</span>
                </td>
                {innNums.map(n => {
                  const inn = innings[n - 1];
                  const val = inn?.[side]?.runs;
                  return (
                    <td key={n} className={`ls-inn-col${linescore.currentInning === n ? ' ls-current' : ''}`}>
                      {val ?? (inn ? '0' : '')}
                    </td>
                  );
                })}
                <td className="ls-total-col ls-r ls-bold">{linescore.teams[side].runs}</td>
                <td className="ls-total-col ls-bold">{linescore.teams[side].hits}</td>
                <td className="ls-total-col ls-bold">{linescore.teams[side].errors}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function GameHeader({ feed }: { feed: LiveFeed; game?: ScheduleGame }) {
  const { gameData } = feed;
  const { teams, status } = gameData;
  const isLive = status.abstractGameState === 'Live';
  const isFinal = status.abstractGameState === 'Final';
  const { linescore } = feed.liveData;

  return (
    <div className="game-header">
      <div className="game-matchup">
        <span className="game-team away-team">
          {teams.away.name}
          <span className="game-score">{feed.liveData.linescore.teams.away.runs}</span>
        </span>
        <span className="game-vs">@</span>
        <span className="game-team home-team">
          <span className="game-score">{feed.liveData.linescore.teams.home.runs}</span>
          {teams.home.name}
        </span>
      </div>

      <div className="game-meta-row">
        <span className="game-venue">{gameData.venue.name}</span>
        <span className="game-dot">·</span>
        <span className="game-date">
          {new Date(gameData.datetime.officialDate + 'T12:00:00').toLocaleDateString('en-US', {
            weekday: 'short', month: 'long', day: 'numeric', year: 'numeric'
          })}
        </span>
        <span className="game-dot">·</span>
        <span className="game-time">{formatGameTime(gameData.datetime.dateTime)}</span>
        {gameData.weather && (
          <>
            <span className="game-dot">·</span>
            <span className="game-weather">
              {gameData.weather.temp}°F · {gameData.weather.condition} · {gameData.weather.wind}
            </span>
          </>
        )}
      </div>

      <div className="game-status-row">
        {isLive && (
          <span className="status-badge status-live">
            ● LIVE — {linescore.inningState} {linescore.currentInningOrdinal}
            {' · '}{linescore.balls}-{linescore.strikes}, {linescore.outs} out{linescore.outs !== 1 ? 's' : ''}
          </span>
        )}
        {isFinal && (
          <span className="status-badge status-final">FINAL</span>
        )}
        {!isLive && !isFinal && (
          <span className="status-badge status-pre">{status.detailedState}</span>
        )}
      </div>
    </div>
  );
}

export default function App() {
  const [date, setDate] = useState(todayLocal);
  const [games, setGames] = useState<ScheduleGame[]>([]);
  const [selectedPk, setSelectedPk] = useState<number | null>(null);
  const [feed, setFeed] = useState<LiveFeed | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load game list when date changes
  useEffect(() => {
    setLoading(true);
    setError(null);
    setGames([]);
    setSelectedPk(null);
    setFeed(null);

    fetchCubsGames(date)
      .then(g => {
        setGames(g);
        if (g.length > 0) setSelectedPk(g[0].gamePk);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [date]);

  // Load live feed when game selected
  const loadFeed = useCallback((pk: number) => {
    setLoading(true);
    setError(null);
    fetchGameFeed(pk)
      .then(setFeed)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (selectedPk) loadFeed(selectedPk);
  }, [selectedPk, loadFeed]);

  // Auto-refresh for live games
  useEffect(() => {
    if (!feed || !selectedPk) return;
    if (feed.gameData.status.abstractGameState !== 'Live') return;
    const id = setInterval(() => {
      fetchGameFeed(selectedPk).then(setFeed).catch(() => {});
    }, 15_000);
    return () => clearInterval(id);
  }, [feed, selectedPk]);

  const cubsIsHome = feed?.gameData.teams.home.id === CUBS_TEAM_ID;
  const cubsSide = cubsIsHome ? 'home' : 'away';
  const oppSide = cubsIsHome ? 'away' : 'home';

  const cubsData = feed ? buildScorecardData(feed, cubsSide) : null;
  const oppData = feed ? buildScorecardData(feed, oppSide) : null;

  const selectedGame = games.find(g => g.gamePk === selectedPk);

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-title">
          <span className="app-logo">⚾</span>
          <span>Cubs Scorecard</span>
        </div>
        <div className="date-picker">
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
          />
        </div>
      </header>

      <main className="app-main">
        {loading && <div className="state-msg loading-msg">Loading…</div>}
        {error && <div className="state-msg error-msg">Error: {error}</div>}

        {!loading && !error && games.length === 0 && (
          <div className="state-msg off-msg">No Cubs games on {date}.</div>
        )}

        {games.length > 1 && (
          <div className="game-tabs">
            {games.map((g, i) => (
              <button
                key={g.gamePk}
                className={`game-tab${selectedPk === g.gamePk ? ' active' : ''}`}
                onClick={() => setSelectedPk(g.gamePk)}
              >
                Game {i + 1} — {g.status.detailedState}
              </button>
            ))}
          </div>
        )}

        {feed && selectedGame && (
          <div className="scorecard-page">
            <GameHeader feed={feed} game={selectedGame} />
            <Linescore feed={feed} />
            {oppData && <Scorecard data={oppData} feed={feed} side={oppSide} />}
            {cubsData && <Scorecard data={cubsData} feed={feed} side={cubsSide} />}
          </div>
        )}
      </main>
    </div>
  );
}
