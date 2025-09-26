'use client';

import {useMapboxDraw, useMapContext, useMapSelection} from '@/contexts/MapContext';
import {MapData, type AreaProps} from '@/stores/schemas';
import {removeMiniCoords} from '@/utils/area-utils';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import StaticMode from '@mapbox/mapbox-gl-draw-static-mode';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import {Box, Dialog, useMediaQuery, useTheme, type SxProps} from '@mui/material';
import bbox from '@turf/bbox';
import difference from '@turf/difference';
import {featureCollection} from '@turf/helpers';
import union from '@turf/union';
import type {Feature, Geometry, Polygon} from 'geojson';
import {
  CircleXIcon,
  FocusIcon,
  GlobeIcon,
  LayoutListIcon,
  PencilIcon,
  PencilLineIcon,
  SaveIcon,
  ScissorsLineDashedIcon,
  Settings2Icon,
  SquaresSubtractIcon,
  SquaresUniteIcon,
  Trash2Icon,
} from 'lucide-react';
import type {Map} from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import {RFullscreenControl, RMap} from 'maplibre-react-components';
import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {DialogOutlet, useDialog} from 'react-dialog-async';
import {shallow} from 'zustand/vanilla/shallow';
import {AreaSettingsDialog} from './AreaSettingsDialog';
import AreasList from './AreasList';
import ControlButton from './ControlButton';
import {DrawControl} from './DrawControl';
import {drawStyles} from './drawStyles';
import {mapStyles} from './mapStyles';
import MergeDialog from './MergeDialog';
import SubtractDialog from './SubtractDialog';
import type {BBox} from './types';

interface MowerMapProps {
  mapData: MapData;
  sx: SxProps;
}

export function MowerMap({mapData, sx}: MowerMapProps) {
  const {id, editMode, setEditMode, features, setFeatures, drawMode, trashEnabled} = useMapContext();
  const mapRef = useRef<Map>(null);
  const draw = useMapboxDraw();
  const selectedIds = useMapSelection();
  const isDrawing = drawMode === MapboxDraw.constants.modes.DRAW_POLYGON;
  const areas = useMemo(
    () => features.features.filter((feature) => feature.geometry.type === 'Polygon') as Feature<Polygon, AreaProps>[],
    [features],
  );
  const selectedAreas = areas.filter((area) => selectedIds.includes(area.id as string));
  const bounds = useRef<BBox>(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [showAreaList, setShowAreaList] = useState(!isMobile);
  const [showSettings, setShowSettings] = useState(false);
  const [showSatelliteLayer, setShowSatelliteLayer] = useState(false);
  const mergeDialog = useDialog(MergeDialog);
  const subtractDialog = useDialog(SubtractDialog);

  const updateAreaGeometry = useCallback(
    (targetId: string, geometry: Geometry | undefined, removeOtherAreas: boolean = false) => {
      if (geometry?.type !== 'Polygon') {
        console.error('New area would not be contiguous');
        return;
      }
      setFeatures((draft) => {
        draft.features.find((f) => f.id === targetId)!.geometry = geometry;
        if (removeOtherAreas) {
          draft.features = draft.features.filter((f) => !selectedIds.includes(f.id as string) || f.id === targetId);
        }
        draw?.set(featureCollection(draft.features));
      });
    },
    [setFeatures, selectedIds, draw],
  );

  const handleMerge = useCallback(async () => {
    const targetId = await mergeDialog.open({selectedAreas});
    if (targetId === undefined) return;
    const result = removeMiniCoords(union(featureCollection(selectedAreas)));
    updateAreaGeometry(targetId, result?.geometry, true);
  }, [mergeDialog, selectedAreas, updateAreaGeometry]);

  const handleSubtract = useCallback(async () => {
    const [targetId, keepAllAreas] = (await subtractDialog.open({selectedAreas})) ?? [undefined, false];
    if (targetId === undefined) return;
    const targetArea = selectedAreas.find((area) => area.id === targetId)!;
    const otherAreas = selectedAreas.filter((area) => area.id !== targetId);
    const result = removeMiniCoords(difference(featureCollection([targetArea, ...otherAreas])));
    updateAreaGeometry(targetId, result?.geometry, !keepAllAreas);
  }, [subtractDialog, selectedAreas, updateAreaGeometry]);

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
      const {long, lat} = mapData.datum ?? {lat: 48.0, long: 11.0};
      bounds.current = [long, lat, long, lat] as BBox;
    }
    // If the bounds have changed, fit to bounds (except in edit mode).
    if (!prevBounds || (!editMode && !shallow(prevBounds, bounds.current))) {
      fitToBounds(true);
    }
  }, [features, mapData.datum, editMode, fitToBounds]);

  return (
    <Box sx={{...sx, overflow: 'hidden', position: 'relative'}}>
      <RMap
        key={id}
        // key={id + JSON.stringify(drawStyles)}
        id={id}
        ref={mapRef}
        style={{width: '100%', height: '100%'}}
        mapStyle={mapStyles[showSatelliteLayer ? 'satellite' : 'white']}
        initialAttributionControl={false}
        maxZoom={24}
      >
        <DrawControl
          displayControlsDefault={false}
          styles={drawStyles}
          modes={{
            ...MapboxDraw.modes,
            static: StaticMode,
          }}
          // styles={[...splitPolygonDrawStyles(MapboxDraw.lib.theme)]}
          defaultMode={editMode ? 'simple_select' : 'static'}
          userProperties={true}
          onFeaturesCreated={() => setShowSettings(true)}
        />
        {/* Left controls */}
        {editMode ? (
          <>
            <ControlButton
              position="top-left"
              icon={SaveIcon}
              title="Save"
              style={{color: theme.palette.success.main}}
              onClick={() => setEditMode(false)}
            />
            <ControlButton
              position="top-left"
              icon={CircleXIcon}
              title="Cancel"
              style={{color: theme.palette.error.main}}
              onClick={() => setEditMode(false)}
            />
            <ControlButton
              position="top-left"
              icon={Settings2Icon}
              title="Settings"
              active={showSettings}
              disabled={selectedIds.length != 1}
              onClick={() => setShowSettings(true)}
              spaced={true}
            />
            <ControlButton
              position="top-left"
              icon={Trash2Icon}
              title="Delete"
              disabled={!trashEnabled || isDrawing}
              onClick={() => {
                draw?.trash();
              }}
            />
            <ControlButton
              position="top-left"
              icon={PencilLineIcon}
              title="Draw new area"
              active={isDrawing}
              onClick={() => {
                if (isDrawing) {
                  draw?.trash();
                } else {
                  draw?.changeMode(MapboxDraw.constants.modes.DRAW_POLYGON);
                }
              }}
            />
            <ControlButton
              spaced={true}
              position="top-left"
              icon={SquaresUniteIcon}
              title="Merge"
              disabled={selectedIds.length < 2}
              onClick={handleMerge}
            />
            <ControlButton
              position="top-left"
              icon={SquaresSubtractIcon}
              title="Subtract"
              disabled={selectedIds.length < 2}
              onClick={handleSubtract}
            />
            <ControlButton position="top-left" icon={ScissorsLineDashedIcon} title="Split area" onClick={() => {}} />{' '}
          </>
        ) : (
          <>
            <ControlButton position="top-left" icon={PencilIcon} title="Edit mode" onClick={() => setEditMode(true)} />
          </>
        )}

        {/* Right controls */}
        <RFullscreenControl />
        <ControlButton position="top-right" icon={FocusIcon} title="Fit to bounds" onClick={() => fitToBounds()} />
        <ControlButton
          position="top-right"
          title="Toggle satellite layer"
          icon={GlobeIcon}
          active={showSatelliteLayer}
          onClick={() => setShowSatelliteLayer(!showSatelliteLayer)}
        />
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
        <AreaSettingsDialog open={showSettings} onClose={() => setShowSettings(false)} />
        <DialogOutlet />
      </RMap>
    </Box>
  );
}
