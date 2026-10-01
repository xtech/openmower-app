'use client';

import { MowerMap } from '@/components/map/MowerMap';
import { HeaderStat, Page, PageContent, PageHeader } from '@/components/page';
import { useMapboxDraw, useMapContext, withDisplaySortKeys } from '@/contexts/MapContext';
import { outerCardStyles } from '@/lib/cardStyles';
import { useSelectedMower } from '@/stores/mowersStore';
import { AreaProps } from '@/stores/schemas';
import { featuresToMap, mapToFeatures } from '@/utils/area-converter';
import { CheckCircle as CheckIcon, LocationOn as LocationIcon, PlayArrow as PlayIcon } from '@mui/icons-material';
import { useTheme } from '@mui/material';
import { area as turfArea } from '@turf/area';
import { featureCollection } from '@turf/helpers';
import { Feature, Polygon } from 'geojson';
import { useCallback, useEffect, useMemo } from 'react';

export function formatAreaSize(squareMeters: number): string {
  return `${Math.round(squareMeters)}m²`;
}

export default function MapPage() {
  const theme = useTheme();
  const mapData = useSelectedMower((s) => s?.map);
  const rpc = useSelectedMower((s) => s?.rpc);
  const { features, setFeatures, setDatum, editMode } = useMapContext();
  const draw = useMapboxDraw();

  useEffect(() => {
    setDatum(mapData?.datum ?? null);
  }, [mapData?.datum, setDatum]);

  // In display mode, send the features directly to the map.
  // In edit mode, the draw control will take care of updates.
  useEffect(() => {
    if (draw && mapData && !editMode) {
      const features = mapToFeatures(mapData);
      draw.set(withDisplaySortKeys(features));
      setFeatures(features, false);
    }
  }, [draw, mapData, editMode, setFeatures]);

  const saveMapToMower = useCallback(async () => {
    await rpc!.map.replace(featuresToMap(mapData!, features));
  }, [rpc, mapData, features]);

  const areas = useMemo(
    () => features.features.filter((feature) => feature.geometry.type === 'Polygon') as Feature<Polygon, AreaProps>[],
    [features],
  );
  const workingAreas = useMemo(() => areas.filter((area) => area.properties.type === 'mow'), [areas]);
  const totalWorkingArea = useMemo(() => turfArea(featureCollection(workingAreas)), [workingAreas]);

  if (mapData === undefined) {
    return <div>No map data</div>;
  }

  return (
    <Page sx={{ height: 'calc(100% - 16px)' }}>
      <PageHeader title="Map" subtitle="Real-time GPS tracking, area management, and intelligent path planning">
        <HeaderStat icon={<LocationIcon />} value={areas.length} label="Managed Areas" />
        <HeaderStat icon={<PlayIcon />} value={formatAreaSize(totalWorkingArea)} label="Total Mowing Area" />
        <HeaderStat icon={<CheckIcon />} value={workingAreas.length} label="Mowing Areas" />
      </PageHeader>
      <PageContent sx={{ flex: 1, position: 'relative' }}>
        <MowerMap
          mapData={mapData}
          saveMapToMower={saveMapToMower}
          sx={{
            ...outerCardStyles(theme),
            backgroundColor: 'black',
            backdropFilter: 'unset',
            height: '100%',
            outline: theme.palette.mode === 'dark' ? '1px solid rgba(255,255,255,0.3)' : undefined,
          }}
        />
      </PageContent>
    </Page>
  );
}
