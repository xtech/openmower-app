'use client';

import {useSelectedMower} from '@/stores/mowersStore';
import type {MapData} from '@/stores/schemas';
import {useMemo} from 'react';
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
export function MowerArrow({scale = 1, fill}: MowerArrowProps) {
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
  datum: NonNullable<MapData['datum']>;
  isDocked: boolean;
}

export default function MowerMarker({datum, isDocked}: MowerMarkerProps) {
  const pose = useSelectedMower((s) => s?.state.pose);

  const position = useMemo(() => {
    if (!pose) return null;
    return {x: pose.x, y: pose.y};
  }, [pose]);

  if (!position || !pose || isDocked) return null;

  const markerColor = pose.pos_accuracy === 0 ? '#F44336' : '#4CAF50';

  return (
    <MapMarker
      position={position}
      heading={pose.heading}
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
