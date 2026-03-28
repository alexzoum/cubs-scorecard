import { AtBatEntry } from '../utils/scorecard';

interface Props {
  atBat?: AtBatEntry;
}

// Diamond corner coordinates within a 44x44 viewBox
const HOME = { x: 22, y: 40 };
const FIRST = { x: 40, y: 22 };
const SECOND = { x: 22, y: 4 };
const THIRD = { x: 4, y: 22 };

const ACTIVE_COLOR = '#0E3386';
const IDLE_COLOR = '#c8bfa8';

export default function AtBatCell({ atBat }: Props) {
  if (!atBat) {
    return (
      <svg viewBox="0 0 44 44" width="52" height="52" className="ab-cell ab-cell--empty">
        <line x1={HOME.x} y1={HOME.y} x2={FIRST.x} y2={FIRST.y} stroke={IDLE_COLOR} strokeWidth="1" />
        <line x1={FIRST.x} y1={FIRST.y} x2={SECOND.x} y2={SECOND.y} stroke={IDLE_COLOR} strokeWidth="1" />
        <line x1={SECOND.x} y1={SECOND.y} x2={THIRD.x} y2={THIRD.y} stroke={IDLE_COLOR} strokeWidth="1" />
        <line x1={THIRD.x} y1={THIRD.y} x2={HOME.x} y2={HOME.y} stroke={IDLE_COLOR} strokeWidth="1" />
      </svg>
    );
  }

  const { inning, eventCode, basesReached, scored, isOut } = atBat;

  // When scored, all 4 base paths are filled in (traditional scorecard convention)
  const isScorer = scored || basesReached === 4;
  const seg1 = basesReached >= 1 || isScorer; // H → 1B
  const seg2 = basesReached >= 2 || isScorer; // 1B → 2B
  const seg3 = basesReached >= 3 || isScorer; // 2B → 3B
  const seg4 = isScorer;                       // 3B → H

  const strokeFor = (active: boolean) => ({
    stroke: active ? ACTIVE_COLOR : IDLE_COLOR,
    strokeWidth: active ? 2 : 1,
  });

  return (
    <svg viewBox="0 0 44 44" width="52" height="52" className={`ab-cell${isOut ? ' ab-cell--out' : ''}${isScorer ? ' ab-cell--scored' : ''}`}>
      {/* Inning number */}
      <text x="3" y="9" fontSize="6" fill="#aaa" fontFamily="monospace">{inning}</text>

      {/* Filled background when scored */}
      {isScorer && (
        <polygon
          points={`${HOME.x},${HOME.y} ${FIRST.x},${FIRST.y} ${SECOND.x},${SECOND.y} ${THIRD.x},${THIRD.y}`}
          fill={ACTIVE_COLOR}
          fillOpacity="0.12"
        />
      )}

      {/* Base path segments */}
      <line x1={HOME.x} y1={HOME.y} x2={FIRST.x} y2={FIRST.y} {...strokeFor(seg1)} />
      <line x1={FIRST.x} y1={FIRST.y} x2={SECOND.x} y2={SECOND.y} {...strokeFor(seg2)} />
      <line x1={SECOND.x} y1={SECOND.y} x2={THIRD.x} y2={THIRD.y} {...strokeFor(seg3)} />
      <line x1={THIRD.x} y1={THIRD.y} x2={HOME.x} y2={HOME.y} {...strokeFor(seg4)} />

      {/* Event code — font shrinks for longer codes like 4-6-3 */}
      <text
        x="22"
        y="27"
        textAnchor="middle"
        fontSize={eventCode.length <= 2 ? 9 : eventCode.length <= 4 ? 7.5 : 6}
        fontWeight="bold"
        fill={isOut ? '#999' : ACTIVE_COLOR}
        fontFamily="monospace"
      >
        {eventCode}
      </text>
    </svg>
  );
}
