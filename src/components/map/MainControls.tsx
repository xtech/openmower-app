import {
  PencilLineIcon,
  ScissorsLineDashedIcon,
  Settings2Icon,
  SquaresIntersectIcon,
  SquaresSubtractIcon,
  SquaresUniteIcon,
  Trash2Icon,
} from 'lucide-react';
import type {ControlPosition} from 'maplibre-gl';
import {useRControl} from 'maplibre-react-components';
import {createPortal} from 'react-dom';

const ControlButton = ({
  position,
  icon: Icon,
  title,
  onClick,
  spaced = false,
}: {
  position: ControlPosition;
  icon: React.ElementType;
  title: string;
  onClick: () => void;
  spaced?: boolean;
}) => {
  const {container} = useRControl({
    position,
    className: spaced ? 'maplibregl-ctrl maplibregl-ctrl-group maplibregl-ctrl-spaced' : undefined,
  });
  return createPortal(
    <button type="button" onClick={onClick} title={title}>
      <Icon />
    </button>,
    container,
  );
};

export function MainControls({position = 'top-left'}: {position?: ControlPosition}) {
  return (
    <>
      <ControlButton position={position} icon={Settings2Icon} title="Settings" onClick={() => {}} />
      <ControlButton position={position} icon={Trash2Icon} title="Delete" onClick={() => {}} />
      <ControlButton position={position} icon={PencilLineIcon} title="Draw new area" onClick={() => {}} />
      <ControlButton spaced={true} position={position} icon={SquaresUniteIcon} title="Merge" onClick={() => {}} />
      <ControlButton position={position} icon={SquaresSubtractIcon} title="Call Split" onClick={() => {}} />
      <ControlButton
        position={position}
        icon={SquaresIntersectIcon}
        title="Remove overlapping areas"
        onClick={() => {}}
      />
      <ControlButton position={position} icon={ScissorsLineDashedIcon} title="Split area" onClick={() => {}} />
    </>
  );
}
