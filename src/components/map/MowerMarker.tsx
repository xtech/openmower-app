'use client';

import {useSelectedMower} from '@/stores/mowersStore';
import {type MapData} from '@/stores/schemas';
import {useMemo} from 'react';
import MapMarker from './MapMarker';

const MOWER_LENGTH_M = 0.55;
const MIN_SIZE_PX = 16;

interface MowerMarkerProps {
  datum: NonNullable<MapData['datum']>;
}

export default function MowerMarker({datum}: MowerMarkerProps) {
  const pose = useSelectedMower((s) => s?.state.pose);

  const position = useMemo(() => {
    if (!pose) return null;
    return {x: pose.x, y: pose.y};
  }, [pose]);

  if (!position || !pose) return null;

  const markerColor = pose.pos_accuracy === 0 ? '#F44336' : '#4CAF50';

  return (
    <MapMarker
      position={position}
      heading={pose.heading}
      sizeM={MOWER_LENGTH_M}
      minSizePx={MIN_SIZE_PX}
      datum={datum}
      className="mower-marker"
    >
      {(sizePx) => (
        <svg width={sizePx} height={sizePx} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Arrow pointing up = forward at 0° heading */}
          <path
            d="M16 2 L26 28 L16 22 L6 28 Z"
            fill={markerColor}
            stroke="#fff"
            strokeWidth="2"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </MapMarker>
  );
}
