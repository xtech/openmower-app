'use client';

import {RMapContextProvider} from 'maplibre-react-components';

export default function MapLayout({children}: {children: React.ReactNode}) {
  return <RMapContextProvider>{children}</RMapContextProvider>;
}
