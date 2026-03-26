'use client';

import {useMapboxDraw, useMapContext} from '@/contexts/MapContext';
import {useSelectedMower} from '@/stores/mowersStore';
import {fallbackDatum, MapData, type AreaProps} from '@/stores/schemas';
import type {AreaFeature} from '@/types/geojson';
import {generateId, splitPolygonWithLine} from '@/utils/area-utils';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import StaticMode from '@mapbox/mapbox-gl-draw-static-mode';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import {Box, Dialog, useMediaQuery, useTheme, type SxProps} from '@mui/material';
import bbox from '@turf/bbox';
import {featureCollection} from '@turf/helpers';
import type {Feature, LineString, Polygon} from 'geojson';
import {FocusIcon, GlobeIcon, LayoutListIcon, PencilIcon} from 'lucide-react';
import type {Map} from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import {RFullscreenControl, RMap} from 'maplibre-react-components';
import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {DialogOutlet, useDialog} from 'react-dialog-async';
import {shallow} from 'zustand/vanilla/shallow';
import AreasList from './AreasList';
import ControlButton from './ControlButton';
import DockingStationMarker from './DockingStationMarker';
import {DrawControl} from './DrawControl';
import {drawStyles} from './drawStyles';
import {AreaSettingsDialog} from './edit/AreaSettingsDialog';
import EditControls from './edit/EditControls';
import {mapStyles} from './mapStyles';
import MowerMarker from './MowerMarker';
import TeleopControls from './teleop/TeleopControls';
import type {BBox} from './types';

interface MowerMapProps {
  mapData: MapData;
  saveMapToMower: () => Promise<void>;
  sx: SxProps;
}

export function MowerMap({mapData, saveMapToMower, sx}: MowerMapProps) {
  const datum = mapData.datum ?? fallbackDatum;
  const {id, editMode, setEditMode, features, setFeatures, drawWorkflow, setDrawWorkflow} = useMapContext();
  const mapRef = useRef<Map>(null);
  const draw = useMapboxDraw();
  const currentState = useSelectedMower((s) => s?.state.current_state);
  const isDocked = useSelectedMower((s) => s?.state.is_charging ?? false);
  const showTeleop = currentState === 'AREA_RECORDING' && !editMode;
  const areas = useMemo(
    () => features.features.filter((feature) => feature.geometry.type === 'Polygon') as Feature<Polygon, AreaProps>[],
    [features],
  );
  const bounds = useRef<BBox>(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [showAreaList, setShowAreaList] = useState(!isMobile);
  const [showSatelliteLayer, setShowSatelliteLayer] = useState(false);
  const areaSettingsDialog = useDialog(AreaSettingsDialog);

  const fitToBounds = useCallback(
    (immediate: boolean = false) => {
      if (!mapRef.current || !bounds.current) return;
      mapRef.current.fitBounds(bounds.current, {
        padding: {top: 10, bottom: 10, left: 60, right: showAreaList ? 390 : 60},
        duration: immediate ? 0 : 1000,
      });
    },
    [showAreaList],
  );

  useEffect(() => {
    if (!mapRef.current) return;
    const prevBounds = bounds.current;
    if (features.features.length > 0) {
      bounds.current = bbox(features) as BBox;
    } else {
      const {long, lat} = datum;
      bounds.current = [long, lat, long, lat] as BBox;
    }
    // If the bounds have changed, fit to bounds (except in edit mode).
    if (!prevBounds || (!editMode && !shallow(prevBounds, bounds.current))) {
      fitToBounds(true);
    }
  }, [features, mapData.datum, editMode, fitToBounds]);

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
        mapStyle={mapStyles[mapData.datum && showSatelliteLayer ? 'satellite' : 'white']}
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
        <ControlButton position="top-right" icon={FocusIcon} title="Fit to bounds" onClick={() => fitToBounds()} />
        {mapData.datum && (
          <ControlButton
            position="top-right"
            title="Toggle satellite layer"
            icon={GlobeIcon}
            active={showSatelliteLayer}
            onClick={() => setShowSatelliteLayer(!showSatelliteLayer)}
          />
        )}
        <ControlButton
          position="top-right"
          icon={LayoutListIcon}
          title="Show area list"
          active={showAreaList}
          onClick={() => setShowAreaList(!showAreaList)}
        />

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
            <AreasList areas={areas} />
          </Box>
        )}
        {isMobile && (
          <Dialog
            open={showAreaList}
            onClose={() => setShowAreaList(false)}
            disablePortal
            slotProps={{
              paper: {
                sx: {
                  margin: 0,
                  width: 'calc(100% - 3rem)',
                  height: 'calc(100% - 3rem)',
                  maxWidth: 'none',
                  maxHeight: 'none',
                },
              },
            }}
          >
            <AreasList areas={areas} />
          </Dialog>
        )}
        {mapData.docking_stations.map((station) => (
          <DockingStationMarker key={station.id} station={station} datum={datum} isDocked={isDocked} />
        ))}
        <MowerMarker datum={datum} isDocked={isDocked} />
        <DialogOutlet />
      </RMap>
      {showTeleop && <TeleopControls />}
    </Box>
  );
}
