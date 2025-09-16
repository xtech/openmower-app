import type {ButtonProps} from '@mui/material/Button';
import type {ControlPosition} from 'maplibre-gl';
import {useRControl} from 'maplibre-react-components';
import {createPortal} from 'react-dom';

interface ControlButtonProps extends ButtonProps {
  position: ControlPosition;
  icon: React.ElementType;
  active?: boolean;
  spaced?: boolean;
}

export default function ControlButton({
  position,
  icon: Icon,
  active = false,
  spaced = false,
  ...props
}: ControlButtonProps) {
  const className =
    'maplibregl-ctrl maplibregl-ctrl-group' +
    (active ? ' maplibregl-ctrl-active' : '') +
    (spaced ? ' maplibregl-ctrl-spaced' : '');
  const {container} = useRControl({
    position,
    className: className,
  });
  return createPortal(
    <button {...props} type="button">
      <Icon />
    </button>,
    container,
  );
}
