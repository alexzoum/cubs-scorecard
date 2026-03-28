import React from 'react';
import { LiveFeed } from '../types';
import { ScorecardData } from '../utils/scorecard';
import AtBatCell from './AtBatCell';
import './Scorecard.css';

interface Props {
  data: ScorecardData;
  feed: LiveFeed;
  side: 'home' | 'away';
}

export default function Scorecard({ data, feed, side }: Props) {
  const { linescore, boxscore } = feed.liveData;
  const teamStats = boxscore.teams[side].teamStats;
  const abCols = Array.from({ length: data.maxAtBats }, (_, i) => i);

  return (
    <div className="scorecard">
      <div className="scorecard-team-header">
        <span className="scorecard-team-name">{data.teamName}</span>
        <span className="scorecard-side-badge">{data.isHome ? 'HOME' : 'AWAY'}</span>
      </div>

      <div className="scorecard-table-wrapper">
        <table className="scorecard-table">
          <thead>
            <tr>
              <th className="sc-col-player sc-sticky-1">PLAYER</th>
              {abCols.map(i => (
                <th key={i} className="sc-col-ab">{i + 1}</th>
              ))}
              <th className="sc-col-stat sc-stat-border">AB</th>
              <th className="sc-col-stat">R</th>
              <th className="sc-col-stat">H</th>
              <th className="sc-col-stat">RBI</th>
              <th className="sc-col-stat">BB</th>
              <th className="sc-col-stat">K</th>
            </tr>
          </thead>
          <tbody>
            {data.batters.map((batter, idx) => (
              <tr key={batter.batterId} className={batter.totals.ab === 0 && idx > 0 ? 'sc-row-sub' : ''}>
                <td className="sc-col-player sc-sticky-1">
                  <span className="sc-player-name">
                    {batter.fullName}
                    {batter.isCurrentBatter && (
                      <img src="/bat.svg" className="sc-bat-icon" alt="Current batter" />
                    )}
                  </span>
                  <span className="sc-player-pos">{batter.position}</span>
                </td>
                {abCols.map(i => (
                  <td key={i} className="sc-col-ab">
                    <AtBatCell atBat={batter.atBats[i]} />
                  </td>
                ))}
                <td className="sc-col-stat sc-stat-border">{batter.totals.ab || ''}</td>
                <td className="sc-col-stat">{batter.totals.r || ''}</td>
                <td className="sc-col-stat">{batter.totals.h || ''}</td>
                <td className="sc-col-stat">{batter.totals.rbi || ''}</td>
                <td className="sc-col-stat">{batter.totals.bb || ''}</td>
                <td className="sc-col-stat">{batter.totals.k || ''}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="sc-totals-row">
              <td colSpan={1} className="sc-totals-label">TOTALS</td>
              {abCols.map(i => (
                <td key={i} className="sc-col-ab" />
              ))}
              <td className="sc-col-stat sc-stat-border sc-total-val">{teamStats.batting.atBats}</td>
              <td className="sc-col-stat sc-total-val">{linescore.teams[side].runs}</td>
              <td className="sc-col-stat sc-total-val">{linescore.teams[side].hits}</td>
              <td className="sc-col-stat sc-total-val">{teamStats.batting.rbi}</td>
              <td className="sc-col-stat sc-total-val">{teamStats.batting.baseOnBalls}</td>
              <td className="sc-col-stat sc-total-val">{teamStats.batting.strikeOuts}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {data.pitchers.length > 0 && (
        <div className="pitching-section">
          <div className="pitching-header">PITCHING</div>
          <div className="pitching-table-wrapper">
            <table className="pitching-table">
              <thead>
                <tr>
                  <th className="pt-col-name">PITCHER</th>
                  <th>IP</th>
                  <th>H</th>
                  <th>R</th>
                  <th>ER</th>
                  <th>BB</th>
                  <th>K</th>
                  <th>NP</th>
                  <th>S</th>
                  <th className="pt-col-dec">DEC</th>
                </tr>
              </thead>
              <tbody>
                {data.pitchers.map(p => (
                  <tr
                    key={p.pitcherId}
                    className={p.isWinner ? 'pt-row-win' : p.isLoser ? 'pt-row-loss' : ''}
                  >
                    <td className="pt-col-name">{p.fullName}</td>
                    <td>{p.inningsPitched}</td>
                    <td>{p.hits}</td>
                    <td>{p.runs}</td>
                    <td>{p.earnedRuns}</td>
                    <td>{p.walks}</td>
                    <td>{p.strikeouts}</td>
                    <td>{p.pitches || ''}</td>
                    <td>{p.strikes || ''}</td>
                    <td className="pt-col-dec">
                      {p.isWinner ? 'W' : p.isLoser ? 'L' : p.isSave ? 'S' : ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
