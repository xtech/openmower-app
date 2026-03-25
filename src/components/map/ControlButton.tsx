import type {ButtonProps} from '@mui/material/Button';
import {useTheme} from '@mui/material/styles';
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
  style,
  ...props
}: ControlButtonProps) {
  const theme = useTheme();
  const className =
    'maplibregl-ctrl maplibregl-ctrl-group' +
    (active ? ' maplibregl-ctrl-active' : '') +
    (spaced ? ' maplibregl-ctrl-spaced' : '');
  const {container} = useRControl({
    position,
    className: className,
  });

  const disabledStyle =
    props.disabled && theme.palette.mode === 'dark'
      ? {color: 'rgba(255,255,255,0.3)'}
      : undefined;

  return createPortal(
    <button {...props} type="button" style={{...disabledStyle, ...style}}>
      <Icon />
    </button>,
    container,
  );
}
