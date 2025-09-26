import {formatAreaSize} from '@/app/map/page';
import {AreaProps} from '@/stores/schemas';
import theme from '@/theme';
import type {DraggableSyntheticListeners} from '@dnd-kit/core';
import {Box, ListItem, Typography} from '@mui/material';
import {area as turfArea} from '@turf/area';
import {Feature, Polygon} from 'geojson';
import {MenuIcon} from 'lucide-react';

export interface AreaItemProps {
  area: Feature<Polygon, AreaProps>;
  selected?: boolean;
  showDragHandle?: boolean;
}

interface SortableItemProps {
  ref?: React.Ref<HTMLLIElement>;
  style?: React.CSSProperties;
  listeners?: DraggableSyntheticListeners;
  dragging?: boolean;
}

export default function AreaItem({
  area,
  selected = false,
  showDragHandle = false,
  ref,
  style,
  listeners,
  dragging = false,
  ...props
}: AreaItemProps & SortableItemProps) {
  return (
    <ListItem
      style={style}
      {...props}
      sx={{
        p: 0,
        cursor: 'pointer',
        borderBottom: '1px solid',
        borderColor: theme.palette.divider,
        backgroundColor: dragging ? theme.palette.secondary.main : selected ? theme.palette.secondary.dark : undefined,
        color: dragging ? theme.palette.secondary.contrastText : undefined,
        touchAction: 'none',
        '&:last-child': {
          borderBottom: 'none',
        },
        '&:hover': {
          backgroundColor: theme.palette.secondary.main,
          color: theme.palette.secondary.contrastText,
        },
      }}
    >
      <Box sx={{width: '100%', display: 'flex'}}>
        <Box sx={{flex: 1, px: 2, py: 1, opacity: dragging ? 0.4 : 1.0}}>
          <Typography variant="h6" fontWeight="600">
            {area.properties.name ?? 'Unnamed area'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {formatAreaSize(turfArea(area.geometry))}
            {area.properties.type === 'mow' ? ' • Last mowed: Never' : ''}
          </Typography>
        </Box>
        {showDragHandle && (
          <Box
            ref={ref}
            {...listeners}
            sx={{
              cursor: 'grab',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 48,
              color: dragging ? theme.palette.secondary.contrastText : '#AAAAAA',
            }}
          >
            <MenuIcon size={16} />
          </Box>
        )}
      </Box>
    </ListItem>
  );
}
