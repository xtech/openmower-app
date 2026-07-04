'use client';

import {useFitToBounds, useMapboxDraw, useMapContext, useMapHover} from '@/contexts/MapContext';
import {useJobPlannedPath} from '@/hooks/useJobPlannedPath';
import {useJobTrack} from '@/hooks/useJobTrack';
import {useMapDisplayStore} from '@/stores/mapDisplayStore';
import {useSelectedMower} from '@/stores/mowersStore';
import {MapData, type AreaProps} from '@/stores/schemas';
import type {AreaFeature} from '@/types/geojson';
import {generateId, splitPolygonWithLine} from '@/utils/area-utils';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import StaticMode from '@mapbox/mapbox-gl-draw-static-mode';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import {Box, useMediaQuery, useTheme, type SxProps} from '@mui/material';
import {featureCollection} from '@turf/helpers';
import type {Feature, LineString, Polygon} from 'geojson';
import {FocusIcon, LayoutListIcon, PencilIcon} from 'lucide-react';
import type {Map} from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import {RFullscreenControl, RMap} from 'maplibre-react-components';
import {useCallback, useEffect, useEffectEvent, useMemo, useRef} from 'react';
import {DialogOutlet, useDialog} from 'react-dialog-async';
import AreasList from './AreasList';
import ControlButton from './ControlButton';
import DockingStationMarker from './DockingStationMarker';
import {DrawControl} from './DrawControl';
import {drawStyles} from './drawStyles';
import {AreaSettingsDialog} from './edit/AreaSettingsDialog';
import {DownloadButton} from './edit/DownloadButton';
import EditControls from './edit/EditControls';
import {IssuesButton} from './edit/IssuesButton';
import {UploadButton} from './edit/UploadButton';
import LayersButton from './LayersButton';
import MapDialog from './MapDialog';
import {mapStyles} from './mapStyles';
import MowerMarker from './MowerMarker';
import PlannedPathLayer from './PlannedPathLayer';
import TeleopControls from './teleop/TeleopControls';
import TrackLayer from './TrackLayer';

interface MowerMapProps {
  mapData: MapData;
  saveMapToMower: () => Promise<void>;
  sx: SxProps;
}

export function MowerMap({mapData, saveMapToMower, sx}: MowerMapProps) {
  const {
    id,
    datum,
    datumOrFallback,
    editMode,
    setEditMode,
    features,
    setFeatures,
    drawWorkflow,
    setDrawWorkflow,
    bounds,
  } = useMapContext();
  const mapRef = useRef<Map>(null);
  const draw = useMapboxDraw();
  const [hoveredId, setHoveredId] = useMapHover();
  const currentState = useSelectedMower((s) => s?.state.current_state);
  const isDocked = useSelectedMower((s) => s?.state.is_charging ?? false);
  const mowerPosition = useSelectedMower((s) => s?.position ?? s?.state.pose);
  const showTeleop = currentState === 'AREA_RECORDING' && !editMode;
  const areas = useMemo(
    () => features.features.filter((feature) => feature.geometry.type === 'Polygon') as Feature<Polygon, AreaProps>[],
    [features],
  );
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const {showSatelliteLayer, showTrackLayer, showPlannedPath, showAreaList, selectedJobId, setShowAreaList} =
    useMapDisplayStore();
  const {pastTrack, loading: trackLoading} = useJobTrack(selectedJobId);
  const {plannedPath} = useJobPlannedPath(selectedJobId);
  const areaSettingsDialog = useDialog(AreaSettingsDialog);
  const padding = useMemo(() => ({top: 10, bottom: 10, left: 60, right: showAreaList ? 390 : 60}), [showAreaList]);
  const fitToBounds = useFitToBounds();

  const onBoundsChanged = useEffectEvent(() => {
    if (!editMode) fitToBounds(true, padding);
  });

  useEffect(() => {
    onBoundsChanged();
  }, [bounds]);

  // Mirror source for hover hit-testing. Uses promoteId so layer-scoped mouse
  // events return a usable string id.
  const hoverSourceReady = useRef(false);

  const getPolygonData = useCallback(
    () =>
      featureCollection(
        features.features
          .filter((f) => f.geometry.type === 'Polygon')
          .map((f) => ({...f, id: f.id, properties: {...f.properties, id: f.id}})),
      ),
    [features],
  );

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !draw) return;

    const onMouseMove = (e: {features?: {id?: string | number}[]}) => {
      const fid = e.features?.[0]?.id != null ? String(e.features[0].id) : null;
      setHoveredId(fid);
    };
    const onMouseLeave = () => {
      setHoveredId(null);
    };

    const setup = () => {
      const data = getPolygonData();
      if (map.getSource('areas-hover')) {
        return;
      }
      map.addSource('areas-hover', {type: 'geojson', data, promoteId: 'id'} as Parameters<typeof map.addSource>[1]);
      map.addLayer({
        id: 'areas-hover-fill',
        type: 'fill',
        source: 'areas-hover',
        paint: {'fill-color': 'transparent', 'fill-opacity': 0},
      });
      hoverSourceReady.current = true;
      map.on('mousemove', 'areas-hover-fill', onMouseMove);
      map.on('mouseleave', 'areas-hover-fill', onMouseLeave);
    };

    if (map.isStyleLoaded()) {
      setup();
    } else {
      map.once('style.load', setup);
    }

    return () => {
      map.off('style.load', setup);
      map.off('mousemove', 'areas-hover-fill', onMouseMove);
      map.off('mouseleave', 'areas-hover-fill', onMouseLeave);
      setHoveredId(null);
      try {
        if (map.getLayer('areas-hover-fill')) map.removeLayer('areas-hover-fill');
        if (map.getSource('areas-hover')) map.removeSource('areas-hover');
      } catch {
        /* map may be destroyed */
      }
      hoverSourceReady.current = false;
    };
  }, [draw]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keep mirror source in sync with features.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !hoverSourceReady.current) return;
    const src = map.getSource('areas-hover') as {setData?: (d: GeoJSON.FeatureCollection) => void} | undefined;
    src?.setData?.(getPolygonData());
  }, [features, getPolygonData]);

  // Stamp user_hovered on Draw features so drawStyles can react to it.
  const prevHoveredIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (!draw) return;
    const prev = prevHoveredIdRef.current;
    prevHoveredIdRef.current = hoveredId;

    if (prev && prev !== hoveredId) {
      const prevFeature = draw.get(prev);
      if (prevFeature) {
        draw.setFeatureProperty(prev, 'hovered', false);
        draw.add(draw.get(prev)!);
      }
    }
    if (hoveredId) {
      const feature = draw.get(hoveredId);
      if (feature) {
        draw.setFeatureProperty(hoveredId, 'hovered', true);
        draw.add(draw.get(hoveredId)!);
      }
    }
  }, [hoveredId, draw]);

  const handleFeaturesCreated = useCallback(
    (createdFeatures: Feature[]) => {
      if (drawWorkflow?.type === 'split_polygon') {
        draw?.delete(createdFeatures.map((feature) => feature.id as string));
        const areaIdx = features.features.findIndex((feature) => feature.id === drawWorkflow.areaId);
        const area = features.features[areaIdx] as AreaFeature;
        const newAreas = splitPolygonWithLine(area, createdFeatures[0] as Feature<LineString>);
        if (newAreas.length >= 2) {
          for (const [index, newArea] of newAreas.entries()) {
            newArea.id = generateId();
            newArea.properties = JSON.parse(JSON.stringify(area.properties)) as AreaProps;
            newArea.properties.name += ` (${index + 1})`;
          }
          draw?.delete(drawWorkflow.areaId).add(featureCollection(newAreas));
          setFeatures((draft) => {
            draft.features.splice(areaIdx, 1, ...newAreas);
          });
        }
        setDrawWorkflow(null);
      } else {
        areaSettingsDialog.open();
      }
    },
    [areaSettingsDialog, draw, drawWorkflow, setDrawWorkflow, features, setFeatures],
  );

  return (
    <Box sx={{...sx, overflow: 'hidden', position: 'relative'}}>
      <RMap
        key={id}
        // key={id + JSON.stringify(drawStyles)}
        id={id}
        ref={mapRef}
        style={{width: '100%', height: '100%'}}
        mapStyle={mapStyles[datum && showSatelliteLayer ? 'satellite' : 'white']}
        initialAttributionControl={false}
        maxZoom={25}
        initialPitchWithRotate={false}
        dragRotate={false}
        onLoad={(e) => e.target.touchZoomRotate.disableRotation()}
      >
        <DrawControl
          displayControlsDefault={false}
          controls={{trash: true}}
          styles={drawStyles}
          modes={{
            ...MapboxDraw.modes,
            static: StaticMode,
          }}
          defaultMode={editMode ? 'simple_select' : 'static'}
          userProperties={true}
          onFeaturesCreated={handleFeaturesCreated}
        />
        {/* Left controls */}
        {editMode ? (
          <EditControls areas={areas} saveMapToMower={saveMapToMower} />
        ) : (
          <ControlButton position="top-left" icon={PencilIcon} title="Edit mode" onClick={() => setEditMode(true)} />
        )}

        {/* Right controls */}
        <RFullscreenControl />
        <ControlButton
          position="top-right"
          icon={FocusIcon}
          title="Fit to bounds"
          onClick={() => fitToBounds(false, padding)}
        />
        <LayersButton datum={datum} trackLoading={trackLoading} editMode={editMode} />
        <ControlButton
          position="top-right"
          icon={LayoutListIcon}
          title="Show area list"
          active={showAreaList}
          onClick={() => setShowAreaList(!showAreaList)}
        />
        <DownloadButton />
        <UploadButton />
        <IssuesButton />

        {/* Overlays */}
        {!isMobile && showAreaList && (
          <Box
            sx={{
              position: 'absolute',
              top: 10,
              right: 60,
              bottom: 10,
              width: '320px',
            }}
          >
            <AreasList areas={areas} onClose={() => setShowAreaList(false)} />
          </Box>
        )}
        {isMobile && (
          <MapDialog
            open={showAreaList}
            onClose={() => setShowAreaList(false)}
            slotProps={{
              paper: {
                sx: {
                  margin: 0,
                  width: 'calc(100% - 2rem)',
                  height: 'calc(100% - 2rem)',
                  maxWidth: 'none',
                  maxHeight: 'none',
                },
              },
            }}
          >
            <AreasList areas={areas} onClose={() => setShowAreaList(false)} />
          </MapDialog>
        )}
        {mapData.docking_stations.map((station) => (
          <DockingStationMarker key={station.id} station={station} datum={datumOrFallback} isDocked={isDocked} />
        ))}
        {mowerPosition && !isDocked && <MowerMarker position={mowerPosition} datum={datumOrFallback} />}
        <PlannedPathLayer visible={showPlannedPath && !editMode} datum={datumOrFallback} plannedPath={plannedPath} />
        <TrackLayer visible={showTrackLayer && !editMode} pastTrack={pastTrack} loading={trackLoading} />
        {showTeleop && <TeleopControls />}
        <DialogOutlet />
      </RMap>
    </Box>
  );
}
