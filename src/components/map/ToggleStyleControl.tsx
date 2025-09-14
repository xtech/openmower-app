import {Layers} from 'lucide-react';
import type {ControlPosition} from 'maplibre-gl';
import {useRControl} from 'maplibre-react-components';
import {createPortal} from 'react-dom';

export function ToggleStyleControl({
  position = 'top-right',
  onClick,
}: {
  position?: ControlPosition;
  onClick: () => void;
}) {
  const {container} = useRControl({position});
  return createPortal(
    <button type="button" aria-hidden="true" onClick={onClick}>
      <Layers />
    </button>,
    container,
  );
}
