'use client';

import {MapContextProvider} from '@/contexts/MapContext';
import {RMapContextProvider} from 'maplibre-react-components';

export default function MapLayout({children}: {children: React.ReactNode}) {
  return (
    <RMapContextProvider>
      <MapContextProvider id="map">{children}</MapContextProvider>
    </RMapContextProvider>
  );
}
