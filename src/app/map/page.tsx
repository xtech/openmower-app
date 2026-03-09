'use client';

import {MowerMap} from '@/components/map/MowerMap';
import {HeaderStat, Page, PageContent, PageHeader} from '@/components/page';
import {useMapboxDraw, useMapContext} from '@/contexts/MapContext';
import {outerCardStyles} from '@/lib/cardStyles';
import {useSelectedMower} from '@/stores/mowersStore';
import {featuresToMap, mapToFeatures} from '@/utils/area-converter';
import {area as turfArea} from '@turf/area';

import {AreaProps} from '@/stores/schemas';
import {CheckCircle as CheckIcon, LocationOn as LocationIcon, PlayArrow as PlayIcon} from '@mui/icons-material';
import {Feature, Polygon} from 'geojson';
import {useCallback, useEffect, useMemo} from 'react';

export function formatAreaSize(squareMeters: number): string {
  return `${Math.round(squareMeters)}m²`;
}

export default function MapPage() {
  const draw = useMapboxDraw();
  const {features, setFeatures, editMode} = useMapContext();

  // In display mode, send the features directly to the map.
  // In edit mode, the draw controll will take care of updates.
  const mapData = useSelectedMower((s) => s?.map);
  const rpc = useSelectedMower((s) => s?.rpc);
  useEffect(() => {
    if (draw && mapData && !editMode) {
      const features = mapToFeatures(mapData);
      draw.set(features);
      setFeatures(features, false);
    }
  }, [draw, mapData, editMode, setFeatures]);

  const saveMapToMower = useCallback(async () => {
    try {
      await rpc?.map.replace(featuresToMap(mapData!, features));
      // TODO: Show success toast
    } catch (error) {
      console.error('Error saving map to mower:', error);
    }
  }, [rpc, mapData, features]);

  const areas = useMemo(
    () => features.features.filter((feature) => feature.geometry.type === 'Polygon') as Feature<Polygon, AreaProps>[],
    [features],
  );
  const workingAreas = useMemo(() => areas.filter((area) => area.properties.type === 'mow'), [areas]);
  const totalWorkingArea = useMemo(() => turfArea({type: 'FeatureCollection', features: workingAreas}), [workingAreas]);

  if (mapData === undefined) {
    return <div>No map data</div>;
  }

  return (
    <Page sx={{height: 'calc(100% - 16px)'}}>
      <PageHeader title="Map" subtitle="Real-time GPS tracking, area management, and intelligent path planning">
        <HeaderStat icon={<LocationIcon />} value={areas.length} label="Managed Areas" />
        <HeaderStat icon={<PlayIcon />} value={formatAreaSize(totalWorkingArea)} label="Total Mowing Area" />
        <HeaderStat icon={<CheckIcon />} value={workingAreas.length} label="Mowing Areas" />
      </PageHeader>
      <PageContent sx={{flex: 1, position: 'relative'}}>
        <MowerMap
          mapData={mapData}
          saveMapToMower={saveMapToMower}
          sx={{...outerCardStyles, backgroundColor: 'black', backdropFilter: 'unset', height: '100%'}}
        />
      </PageContent>
    </Page>
  );
}
