'use client';

import {useSelectedMower} from '@/stores/mowersStore';
import {fallbackDatum, type MapData} from '@/stores/schemas';
import {datumToRelative, pointToAbsolute} from '@/utils/coordinates';
import {Box} from '@mui/material';
import {RMarker} from 'maplibre-react-components';
import {useMemo} from 'react';

interface MowerMarkerProps {
  datum: MapData['datum'];
}

export default function MowerMarker({datum}: MowerMarkerProps) {
  const pose = useSelectedMower((s) => s?.state.pose);

  const position = useMemo(() => {
    if (!pose) return null;
    const {long, lat} = datum ?? fallbackDatum;
    const utmDatum = datumToRelative([long, lat]);
    return pointToAbsolute({x: pose.x, y: pose.y}, utmDatum);
  }, [datum, pose]);

  if (!position || !pose) return null;

  const headingDeg = 90 - (pose.heading * 180) / Math.PI;
  const markerColor = pose.pos_accuracy === 0 ? '#F44336' : '#4CAF50';

  return (
    <RMarker longitude={position[0]} latitude={position[1]}>
      <Box
        sx={{
          width: 32,
          height: 32,
          transform: `rotate(${headingDeg}deg)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Arrow pointing up (0deg = north/forward) */}
          <path
            d="M16 2 L26 28 L16 22 L6 28 Z"
            fill={markerColor}
            stroke="#fff"
            strokeWidth="2"
            strokeLinejoin="round"
          />
        </svg>
      </Box>
    </RMarker>
  );
}
