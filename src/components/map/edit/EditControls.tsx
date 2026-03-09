import {useMapboxDraw, useMapContext, useMapSelection} from '@/contexts/MapContext';
import {CancelConfirmDialog} from './CancelConfirmDialog';
import theme from '@/theme';
import type {AreaFeature} from '@/types/geojson';
import {removeMiniCoords} from '@/utils/area-utils';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import {difference} from '@turf/difference';
import {featureCollection} from '@turf/helpers';
import {union} from '@turf/union';
import type {Geometry} from 'geojson';
import {
  CircleXIcon,
  PencilLineIcon,
  SaveIcon,
  ScissorsLineDashedIcon,
  Settings2Icon,
  SquaresSubtractIcon,
  SquaresUniteIcon,
  Trash2Icon,
} from 'lucide-react';
import {useCallback} from 'react';
import {useDialog} from 'react-dialog-async';
import ControlButton from '../ControlButton';
import {AreaSettingsDialog} from './AreaSettingsDialog';
import MergeDialog from './MergeDialog';
import SubtractDialog from './SubtractDialog';

export default function EditControls({
  areas,
  saveMapToMower,
}: {
  areas: AreaFeature[];
  saveMapToMower: () => Promise<void>;
}) {
  const {setEditMode, trashEnabled, setFeatures, drawMode, setDrawWorkflow, hasUnsavedChanges} = useMapContext();
  const draw = useMapboxDraw();
  const selectedIds = useMapSelection();
  const selectedAreas = areas.filter((area) => selectedIds.includes(area.id as string));
  const isDrawing = drawMode === MapboxDraw.constants.modes.DRAW_POLYGON;
  const areaSettingsDialog = useDialog(AreaSettingsDialog);
  const mergeDialog = useDialog(MergeDialog);
  const subtractDialog = useDialog(SubtractDialog);
  const cancelConfirmDialog = useDialog(CancelConfirmDialog);

  const handleSave = useCallback(async () => {
    await saveMapToMower();
    setEditMode(false);
  }, [saveMapToMower, setEditMode]);

  const handleCancel = useCallback(async () => {
    if (hasUnsavedChanges) {
      const confirmed = await cancelConfirmDialog.open();
      if (!confirmed) return;
    }
    setEditMode(false);
  }, [hasUnsavedChanges, cancelConfirmDialog, setEditMode]);

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

  const handleSplit = useCallback(async () => {
    setDrawWorkflow({type: 'split_polygon', areaId: selectedIds[0]});
    draw?.changeMode(MapboxDraw.constants.modes.DRAW_LINE_STRING);
  }, [setDrawWorkflow, selectedIds, draw]);

  return (
    <>
      <ControlButton
        position="top-left"
        icon={SaveIcon}
        title="Save"
        style={{color: theme.palette.success.main}}
        onClick={handleSave}
      />
      <ControlButton
        position="top-left"
        icon={CircleXIcon}
        title="Cancel"
        style={{color: theme.palette.error.main}}
        onClick={handleCancel}
      />
      <ControlButton
        position="top-left"
        icon={Settings2Icon}
        title="Settings"
        //active={areaSettingsDialog.isOpen}
        disabled={selectedIds.length != 1}
        onClick={() => areaSettingsDialog.open()}
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
      <ControlButton
        position="top-left"
        icon={ScissorsLineDashedIcon}
        title="Split area"
        disabled={selectedIds.length !== 1}
        onClick={handleSplit}
      />
    </>
  );
}
