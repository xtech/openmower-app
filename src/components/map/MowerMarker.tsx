'use client';

import { useSmoothedPosition } from '@/hooks/useSmoothedPosition';
import { useSelectedMower } from '@/stores/mowersStore';
import type { Datum, Position } from '@/stores/schemas';
import MapMarker from './MapMarker';

export const MOWER_LENGTH_M = 0.55;

interface MowerArrowProps {
  /** Scale factor relative to full size (default 1) */
  scale?: number;
  fill: string;
}

/**
 * Mower arrow shape centered at (16, 16) in a 32×32 viewBox, pointing up (forward at 0° heading).
 * Half-width=10, half-height=13.
 */
export function MowerArrow({ scale = 1, fill }: MowerArrowProps) {
  const cx = 16;
  const cy = 16;
  const hw = 10 * scale;
  const hh = 13 * scale;
  const notch = 6 * scale;
  return (
    <path
      d={`M${cx} ${cy - hh} L${cx + hw} ${cy + hh} L${cx} ${cy + hh - notch} L${cx - hw} ${cy + hh} Z`}
      fill={fill}
      stroke="#fff"
      strokeWidth={2 * scale}
      strokeLinejoin="round"
    />
  );
}

interface MowerMarkerProps {
  position: Position;
  datum: Datum;
}

export default function MowerMarker({ position, datum }: MowerMarkerProps) {
  const smoothedPosition = useSmoothedPosition(position);
  const accuracy = useSelectedMower((s) => s?.state.pose?.pos_accuracy);

  const markerColor = accuracy === 0 ? '#F44336' : '#4CAF50';

  return (
    <MapMarker
      position={smoothedPosition}
      heading={smoothedPosition?.heading ?? 0}
      sizeM={MOWER_LENGTH_M}
      datum={datum}
      className="mower-marker"
    >
      {(sizePx) => (
        <svg width={sizePx} height={sizePx} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <MowerArrow fill={markerColor} />
        </svg>
      )}
    </MapMarker>
  );
}
