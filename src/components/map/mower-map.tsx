'use client';

import type {MapData, State} from '@/stores/schemas';
import {getMapBounds, utmPolygonToLatLng, utmToLatLng, type Point} from '@/utils/coordinates';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import {
  CenterFocusStrong as FitBoundsIcon,
  Home as HomeIcon,
  Layers as LayersIcon,
  LocationOn as LocationIcon,
} from '@mui/icons-material';
import {Box, Fab, useTheme} from '@mui/material';
import type {LngLatBoundsLike} from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import type {ViewState} from 'react-map-gl/maplibre';
import Map, {
  AttributionControl,
  FullscreenControl,
  Layer,
  Marker,
  ScaleControl,
  Source,
  type MapRef,
} from 'react-map-gl/maplibre';
import DrawControl from './DrawControl';

import SplitPolygonMode, {drawStyles as splitPolygonDrawStyles} from 'mapbox-gl-draw-split-polygon-mode';

import SelectFeatureMode, {drawStyles as selectFeatureDrawStyles} from 'mapbox-gl-draw-select-mode';

interface MowerMapProps {
  mapData: MapData;
  mowerState: State;
  width?: string | number;
  height?: string | number;
}

const DEFAULT_DATUM = {
  lat: 40.7128, // Default to NYC coordinates if no datum provided
  long: -74.006,
  height: 0,
};

// Map style configurations
const mapStyles = {
  white: {
    version: 8 as const,
    name: 'White',
    sources: {},
    layers: [
      {
        id: 'background',
        type: 'background' as const,
        paint: {
          'background-color': '#ffffff',
        },
      },
    ],
  },
  satellite: {
    version: 8 as const,
    name: 'Satellite',
    sources: {
      'esri-satellite': {
        type: 'raster' as const,
        tiles: ['https://server.arcgisonline.com/arcgis/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
        tileSize: 256,
        attribution: 'Powered by Esri',
        maxzoom: 19,
      },
    },
    layers: [
      {
        id: 'satellite-tiles',
        type: 'raster' as const,
        source: 'esri-satellite',
        paint: {
          'raster-fade-duration': 0,
        },
      },
    ],
  },
};

export function MowerMap({mapData, mowerState, width = '100%', height = '400px'}: MowerMapProps) {
  const theme = useTheme();
  const datum = mapData.datum || DEFAULT_DATUM;
  const mapRef = useRef<MapRef>(null);
  const drawRef = useRef<MapboxDraw | null>(null);

  useEffect(() => {
    const map = mapRef.current?.getMap();
    if (!map) return;

    // init draw only once
    if (!drawRef.current) {
      const draw = new MapboxDraw({
        displayControlsDefault: true,
        controls: {
          polygon: true,
          trash: true,
        },
      });
      drawRef.current = draw;
      alert('hello');
      map.addControl(draw);

      // Example: listen for events
      map.on('draw.create', (e) => {
        console.log('Polygon created:', e.features);
      });
      map.on('draw.update', (e) => {
        console.log('Polygon updated:', e.features);
      });
    }
  }, []);

  // Create a stable key for view-reset-triggering data (exclude frequently changing mower position)
  const boundsResetKey = useMemo(() => {
    const key = JSON.stringify({
      datum: mapData.datum,
      dockingPose: mapData.docking_pose,
      workingAreas: mapData.working_areas?.map((area) => ({
        outline: area.outline,
        obstacles: area.obstacles,
      })),
      navigationAreas: mapData.navigation_areas?.map((area) => ({
        outline: area.outline,
        obstacles: area.obstacles,
      })),
    });
    return key;
  }, [mapData.datum, mapData.docking_pose, mapData.working_areas, mapData.navigation_areas]);

  // Calculate bounds for fitBounds
  const calculateBounds = useCallback((): LngLatBoundsLike | null => {
    // If no datum, we can't convert coordinates
    if (!datum.lat || !datum.long) {
      console.warn('No datum available for coordinate conversion');
      return null;
    }

    const allPoints: Point[] = [];

    // Always include docking station and mower position
    allPoints.push(mapData.docking_pose);
    allPoints.push(mowerState.pose);

    mapData.working_areas?.forEach((area) => {
      allPoints.push(...area.outline);
      area.obstacles?.forEach((obstacle) => {
        allPoints.push(...obstacle);
      });
    });

    mapData.navigation_areas?.forEach((area) => {
      allPoints.push(...area.outline);
      area.obstacles?.forEach((obstacle) => {
        allPoints.push(...obstacle);
      });
    });

    if (allPoints.length === 0) {
      console.warn('No points available for bounds calculation');
      return null;
    }

    const bounds = getMapBounds(allPoints, datum);
    console.log('Calculated bounds:', bounds);

    return [
      [bounds.southwest.lng, bounds.southwest.lat], // southwest
      [bounds.northeast.lng, bounds.northeast.lat], // northeast
    ];
  }, [mapData.docking_pose, mowerState.pose, mapData.working_areas, mapData.navigation_areas, datum]);

  const [mapStyle, setMapStyle] = useState('white');
  const [viewState, setViewState] = useState<ViewState>({
    latitude: datum.lat,
    longitude: datum.long,
    zoom: 18,
    bearing: 0,
    pitch: 0,
    padding: {top: 10, left: 10, right: 10, bottom: 10},
  });

  // Helper method to fit bounds with consistent options
  const fitToBounds = useCallback((bounds: LngLatBoundsLike | null, duration: number = 1000) => {
    if (bounds && mapRef.current) {
      mapRef.current.fitBounds(bounds, {
        padding: {top: 10, left: 10, right: 10, bottom: 10},
        duration,
      });
    }
  }, []);

  // Reset view using fitBounds when major bounds-affecting data changes
  useEffect(() => {
    const bounds = calculateBounds();
    fitToBounds(bounds, 1000);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boundsResetKey]);

  const onMove = useCallback((evt: {viewState: ViewState}) => {
    setViewState(evt.viewState);
  }, []);

  const onLoad = useCallback(() => {
    const bounds = calculateBounds();
    fitToBounds(bounds, 0); // No animation on initial load
  }, [calculateBounds, fitToBounds]);

  // Convert working areas to GeoJSON
  const workingAreasGeoJSON = useMemo(() => {
    if (!mapData.working_areas) return null;

    const features = mapData.working_areas.map((area, index) => {
      const coordinates = utmPolygonToLatLng(area.outline, datum);
      return {
        type: 'Feature' as const,
        properties: {
          name: area.name,
          type: 'working_area',
          id: `working_area_${index}`,
        },
        geometry: {
          type: 'Polygon' as const,
          coordinates: [coordinates.map((coord) => [coord.lng, coord.lat])],
        },
      };
    });

    return {
      type: 'FeatureCollection' as const,
      features,
    };
  }, [mapData.working_areas, datum]);

  // Convert navigation areas to GeoJSON
  const navigationAreasGeoJSON = useMemo(() => {
    if (!mapData.navigation_areas) return null;

    const features = mapData.navigation_areas.map((area, index) => {
      const coordinates = utmPolygonToLatLng(area.outline, datum);
      return {
        type: 'Feature' as const,
        properties: {
          name: area.name,
          type: 'navigation_area',
          id: `navigation_area_${index}`,
        },
        geometry: {
          type: 'Polygon' as const,
          coordinates: [coordinates.map((coord) => [coord.lng, coord.lat])],
        },
      };
    });

    return {
      type: 'FeatureCollection' as const,
      features,
    };
  }, [mapData.navigation_areas, datum]);

  const getCurrentMapStyle = () => {
    return mapStyle === 'white' ? mapStyles.white : mapStyles[mapStyle as keyof typeof mapStyles];
  };

  const toggleMapStyle = () => {
    setMapStyle((prev) => {
      switch (prev) {
        case 'white':
          return 'satellite';
        case 'satellite':
          return 'white';
        default:
          return 'white';
      }
    });
  };

  const handleFitToBounds = () => {
    const bounds = calculateBounds();
    fitToBounds(bounds, 1000);
  };

  // Convert heading from robot coordinate system to CSS rotation
  const convertHeadingForDisplay = (heading: number): number => {
    // Check if heading is in radians (typically -π to π or 0 to 2π, i.e., ≤ 6.28)
    let headingDegrees = heading;
    if (Math.abs(heading) <= Math.PI * 2) {
      // Likely in radians, convert to degrees
      headingDegrees = (heading * 180) / Math.PI;
    }

    // Common robot coordinate systems and their conversions to CSS (0° = North, clockwise):

    // OPTION 1: Compass heading (0° = North, clockwise) - most common for robots/mowers
    // This matches CSS rotation directly
    return headingDegrees;

    // OPTION 2: Mathematical heading (0° = East, counter-clockwise)
    // Uncomment below if coordinates are mathematical:
    // return 90 - headingDegrees;

    // OPTION 3: Mathematical heading (0° = East, clockwise)
    // Uncomment below if needed:
    // return headingDegrees - 90;

    // OPTION 4: If headings seem 180° off, uncomment:
    // return headingDegrees + 180;
  };

  // Convert positions to lat/lng
  const dockingPosition = utmToLatLng(mapData.docking_pose, datum);
  const mowerPosition = utmToLatLng(mowerState.pose, datum);

  // Convert headings for display
  const dockingHeading = convertHeadingForDisplay(mapData.docking_pose.heading);
  const mowerHeading = convertHeadingForDisplay(mowerState.pose.heading);

  const [features, setFeatures] = useState({});

  const onUpdate = useCallback((e) => {
    setFeatures((currFeatures) => {
      const newFeatures = {...currFeatures};
      for (const f of e.features) {
        newFeatures[f.id] = f;
      }
      return newFeatures;
    });
  }, []);

  const onDelete = useCallback((e) => {
    setFeatures((currFeatures) => {
      const newFeatures = {...currFeatures};
      for (const f of e.features) {
        delete newFeatures[f.id];
      }
      return newFeatures;
    });
  }, []);

  return (
    <Box sx={{width, height, borderRadius: 3, overflow: 'hidden', position: 'relative'}}>
      <Map
        ref={mapRef}
        {...viewState}
        onMove={onMove}
        onLoad={onLoad}
        style={{width: '100%', height: '100%'}}
        mapStyle={getCurrentMapStyle()}
        attributionControl={false}
        maxZoom={24}
      >
        <FullscreenControl />

        {/* Navigation Controls */}
        {/* <NavigationControl position="top-right" showCompass={false} /> */}
        {/* <DrawControl
          position="top-left"
          displayControlsDefault={true}
          controls={{
            polygon: true,
            trash: true,
            uncombine_features: true,
            combine_features: true,
          }}
          modes={{
            ...SelectFeatureMode(MapboxDraw.modes),
            ...SplitPolygonMode(MapboxDraw.modes),
          }}
          styles={[...splitPolygonDrawStyles(MapboxDraw.lib.theme), ...selectFeatureDrawStyles(MapboxDraw.lib.theme)]}
          defaultMode="simple_select"
          onCreate={onUpdate}
          onUpdate={onUpdate}
          onDelete={onDelete}
          userProperties={true}
          selectHighlightColor="red"
        /> */}
        {/* Working Areas */}
        {workingAreasGeoJSON && (
          <Source id="working-areas" type="geojson" data={workingAreasGeoJSON}>
            <Layer
              id="working-areas-fill"
              type="fill"
              paint={{
                'fill-color': theme.palette.success.main,
                'fill-opacity': 0.3,
              }}
            />
            <Layer
              id="working-areas-stroke"
              type="line"
              paint={{
                'line-color': theme.palette.success.main,
                'line-width': 2,
              }}
            />
          </Source>
        )}
        {/* Navigation Areas */}
        {navigationAreasGeoJSON && (
          <Source id="navigation-areas" type="geojson" data={navigationAreasGeoJSON}>
            <Layer
              id="navigation-areas-fill"
              type="fill"
              paint={{
                'fill-color': theme.palette.info.main,
                'fill-opacity': 0.2,
              }}
            />
            <Layer
              id="navigation-areas-stroke"
              type="line"
              paint={{
                'line-color': theme.palette.info.main,
                'line-width': 1,
                'line-dasharray': [2, 2],
              }}
            />
          </Source>
        )}
        {/* Test Marker - Very Simple */}
        <Marker latitude={dockingPosition.lat} longitude={dockingPosition.lng} anchor="center">
          <div
            style={{
              width: '20px',
              height: '20px',
              backgroundColor: 'red',
              borderRadius: '50%',
              border: '2px solid white',
            }}
            onClick={() => console.log('Simple test marker clicked!', dockingPosition)}
          />
        </Marker>
        {/* Docking Station Marker */}
        <Marker latitude={dockingPosition.lat} longitude={dockingPosition.lng} anchor="center" offset={[25, 0]}>
          <div
            style={{
              width: '40px',
              height: '40px',
              backgroundColor: theme.palette.primary.main,
              borderRadius: '50%',
              border: `3px solid ${theme.palette.primary.dark}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
              cursor: 'pointer',
            }}
            onClick={() => console.log('Docking station clicked!', dockingPosition)}
          >
            <HomeIcon fontSize="small" />
            {/* Simple heading indicator */}
            <div
              style={{
                position: 'absolute',
                top: '-8px',
                width: '0',
                height: '0',
                borderLeft: '6px solid transparent',
                borderRight: '6px solid transparent',
                borderBottom: `12px solid ${theme.palette.primary.main}`,
                transform: `rotate(${dockingHeading}deg)`,
                transformOrigin: '50% 20px',
              }}
            />
          </div>
        </Marker>
        {/* Mower Position Marker */}
        <Marker latitude={mowerPosition.lat} longitude={mowerPosition.lng} anchor="center" offset={[0, 25]}>
          <div
            style={{
              width: '32px',
              height: '32px',
              backgroundColor: theme.palette.warning.main,
              borderRadius: '50%',
              border: `3px solid ${theme.palette.warning.dark}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
              cursor: 'pointer',
            }}
            onClick={() => console.log('Mower clicked!', mowerPosition)}
          >
            <LocationIcon fontSize="small" />
            {/* Simple heading indicator */}
            <div
              style={{
                position: 'absolute',
                top: '-6px',
                width: '0',
                height: '0',
                borderLeft: '5px solid transparent',
                borderRight: '5px solid transparent',
                borderBottom: `10px solid ${theme.palette.warning.main}`,
                transform: `rotate(${mowerHeading}deg)`,
                transformOrigin: '50% 16px',
              }}
            />
            {/* Heading accuracy indicator */}
            {mowerState.pose.heading_valid && (
              <div
                style={{
                  position: 'absolute',
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  border: `1px dashed ${theme.palette.warning.main}`,
                  opacity: 0.5,
                  top: '-4px',
                  left: '-4px',
                  pointerEvents: 'none',
                }}
              />
            )}
          </div>
        </Marker>
      </Map>

      {/* Fit to Bounds Button */}
      <Fab
        size="small"
        sx={{
          position: 'absolute',
          bottom: 16,
          left: 16,
          backgroundColor: 'white',
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
          },
        }}
        onClick={handleFitToBounds}
      >
        <FitBoundsIcon />
      </Fab>

      {/* Map Style Toggle */}
      <Fab
        size="small"
        sx={{
          position: 'absolute',
          bottom: 16,
          right: 16,
          backgroundColor: 'white',
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
          },
        }}
        onClick={toggleMapStyle}
      >
        <LayersIcon />
      </Fab>
    </Box>
  );
}
