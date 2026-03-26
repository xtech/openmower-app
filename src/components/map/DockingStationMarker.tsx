'use client';

import {type MapData} from '@/stores/schemas';
import MapMarker from './MapMarker';
import {MOWER_LENGTH_M, MowerArrow} from './MowerMarker';

const DOCK_PADDING_M = 0.45;
const DOCK_SIZE_M = MOWER_LENGTH_M + DOCK_PADDING_M;
const MIN_SIZE_PX = 20;

interface DockingStation {
  position: {x: number; y: number};
  heading: number;
}

interface DockingStationMarkerProps {
  station: DockingStation;
  datum: NonNullable<MapData['datum']>;
  isDocked?: boolean;
}

export default function DockingStationMarker({station, datum, isDocked = false}: DockingStationMarkerProps) {
  return (
    <MapMarker
      position={station.position}
      heading={station.heading}
      sizeM={DOCK_SIZE_M}
      minSizePx={MIN_SIZE_PX}
      datum={datum}
      className="docking-station-marker"
    >
      {(sizePx) => {
        const opacity = isDocked ? 0.6 : 0.3;
        return (
          <svg width={sizePx} height={sizePx} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M16 2 L30 14 L26 14 L26 29 L6 29 L6 14 L2 14 Z"
              fill="#F5A523"
              fillOpacity={opacity}
              stroke="#F5A523"
              strokeWidth={1.5}
              strokeOpacity={opacity}
              strokeLinejoin="round"
            />
            {isDocked && <MowerArrow scale={MOWER_LENGTH_M / DOCK_SIZE_M} fill="#4CAF50" />}
          </svg>
        );
      }}
    </MapMarker>
  );
}
