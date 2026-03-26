'use client';

import {type MapData} from '@/stores/schemas';
import MapMarker from './MapMarker';

const DOCK_SIZE_M = 0.7;
const MIN_SIZE_PX = 20;

interface DockingStation {
  position: {x: number; y: number};
  heading: number;
}

interface DockingStationMarkerProps {
  station: DockingStation;
  datum: NonNullable<MapData['datum']>;
}

export default function DockingStationMarker({station, datum}: DockingStationMarkerProps) {
  return (
    <MapMarker
      position={station.position}
      heading={station.heading}
      sizeM={DOCK_SIZE_M}
      minSizePx={MIN_SIZE_PX}
      datum={datum}
      className="docking-station-marker"
    >
      {(sizePx) => (
        <svg width={sizePx} height={sizePx} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/*
            House with entry (open bottom) at the bottom — mower drives in from below.
            At heading=0 this points up (north), consistent with the mower arrow convention.
          */}
          {/* Roof */}
          <polygon points="16,2 30,14 2,14" fill="#FFA726" stroke="#fff" strokeWidth="1.5" strokeLinejoin="round" />
          {/* Walls */}
          <rect
            x="4"
            y="14"
            width="24"
            height="14"
            fill="#FFA726"
            stroke="#fff"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          {/* Doorway opening (entry from bottom) */}
          <rect x="11" y="20" width="10" height="8" fill="none" stroke="#fff" strokeWidth="1.5" />
        </svg>
      )}
    </MapMarker>
  );
}
