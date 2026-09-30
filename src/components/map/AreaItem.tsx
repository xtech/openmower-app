import {formatAreaSize} from '@/app/map/page';
import {AreaProps} from '@/stores/schemas';
import type {DraggableSyntheticListeners} from '@dnd-kit/core';
import {Box, ListItem, Typography, useTheme} from '@mui/material';
import {area as turfArea} from '@turf/area';
import {Feature, Polygon} from 'geojson';
import {CircleSlashIcon, MenuIcon, RouteIcon, ScissorsIcon, SquareDashedIcon, type LucideIcon} from 'lucide-react';

const TYPE_CONFIG: Record<AreaProps['type'], {icon: LucideIcon; color: string; strokeWidth: number}> = {
  mow: {icon: ScissorsIcon, color: '#4caf50', strokeWidth: 3},
  nav: {icon: RouteIcon, color: '#42a5f5', strokeWidth: 2},
  obstacle: {icon: CircleSlashIcon, color: '#78909c', strokeWidth: 1.5},
  draft: {icon: SquareDashedIcon, color: '#9e9e9e', strokeWidth: 2},
};

export interface AreaItemProps {
  area: Feature<Polygon, AreaProps>;
  selected?: boolean;
  hovered?: boolean;
  showDragHandle?: boolean;
  onSelect?: (id: string, e: React.MouseEvent) => void;
  onMouseEnter?: React.MouseEventHandler;
  onMouseLeave?: React.MouseEventHandler;
  dragCount?: number;
}

interface SortableItemProps {
  ref?: React.Ref<HTMLLIElement>;
  handleRef?: React.Ref<HTMLDivElement>;
  style?: React.CSSProperties;
  listeners?: DraggableSyntheticListeners;
  dragging?: boolean;
}

export default function AreaItem({
  area,
  selected = false,
  hovered = false,
  showDragHandle = false,
  onSelect,
  onMouseEnter,
  onMouseLeave,
  dragCount,
  ref,
  handleRef,
  style,
  listeners,
  dragging = false,
  ...props
}: AreaItemProps & SortableItemProps) {
  const theme = useTheme();
  const inactive = area.properties.active === false;
  const {icon: Icon, color, strokeWidth} = TYPE_CONFIG[area.properties.type ?? 'draft'];
  const isGroupDragPlaceholder = !!dragCount && dragCount > 0;
  return (
    <ListItem
      ref={ref}
      style={style}
      {...props}
      onClick={onSelect ? (e) => onSelect(area.id as string, e) : undefined}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      sx={{
        p: 0,
        cursor: onSelect ? 'pointer' : 'default',
        borderBottom: '1px solid',
        borderColor: theme.palette.divider,
        backgroundColor: dragging
          ? theme.palette.secondary.main
          : selected
            ? theme.palette.mode === 'dark'
              ? theme.palette.secondary.main
              : theme.palette.secondary.dark
            : hovered
              ? theme.palette.secondary.main
              : undefined,
        color: dragging || selected ? theme.palette.secondary.contrastText : undefined,
        opacity: dragCount === 0 ? 0.25 : inactive ? 0.5 : 1,
        touchAction: 'pan-y',
        '&:last-child': {
          borderBottom: 'none',
        },
        ...(onSelect && {
          '&:hover': {
            backgroundColor: theme.palette.secondary.main,
            color: theme.palette.secondary.contrastText,
          },
        }),
      }}
    >
      <Box sx={{width: '100%', display: 'flex'}}>
        <Box sx={{display: 'flex', alignItems: 'center', justifyContent: 'center', pl: 2, color: isGroupDragPlaceholder ? undefined : color}}>
          {!isGroupDragPlaceholder && <Icon size={18} strokeWidth={strokeWidth} />}
        </Box>
        <Box sx={{flex: 1, px: 1.5, py: 1, opacity: dragging ? 0.4 : 1.0}}>
          <Typography variant="h6" sx={{fontWeight: '600'}}>
            {isGroupDragPlaceholder ? `${dragCount} areas` : (area.properties.name ?? 'Unnamed area')}
          </Typography>
          {!isGroupDragPlaceholder && (
            <Typography variant="caption" color="text.secondary">
              {formatAreaSize(turfArea(area.geometry))}
              {area.properties.type === 'mow' ? ' • Last mowed: Never' : ''}
            </Typography>
          )}
        </Box>
        {showDragHandle && (
          <Box
            ref={handleRef}
            {...listeners}
            onClick={(e) => e.stopPropagation()}
            sx={{
              cursor: 'grab',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 48,
              touchAction: 'none',
              color: dragging ? theme.palette.secondary.contrastText : theme.palette.text.secondary,
            }}
          >
            <MenuIcon size={16} style={{pointerEvents: 'none'}} />
          </Box>
        )}
      </Box>
    </ListItem>
  );
}
