import {formatAreaSize} from '@/app/map/page';
import {AreaProps} from '@/stores/schemas';
import theme from '@/theme';
import {Box, ListItem, Typography} from '@mui/material';
import {area as turfArea} from '@turf/area';
import {Feature, Polygon} from 'geojson';

interface AreaItemProps {
  area: Feature<Polygon, AreaProps>;
  selected: boolean;
}

export default function AreaItem({area, selected}: AreaItemProps) {
  return (
    <ListItem
      key={area.id}
      sx={{
        px: 0,
        py: 0.5,
        cursor: 'pointer',
        borderBottom: '1px solid',
        borderColor: theme.palette.divider,
        backgroundColor: selected ? theme.palette.secondary.dark : undefined,
        '&:last-child': {
          borderBottom: 'none',
        },
        '&:hover': {
          backgroundColor: theme.palette.secondary.main,
          color: theme.palette.secondary.contrastText,
        },
      }}
    >
      <Box sx={{flex: 1, py: 0.5, px: 2, mr: 1}}>
        <Typography variant="h6" fontWeight="600">
          {area.properties.name ?? 'Unnamed area'}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {formatAreaSize(turfArea(area.geometry))}
          {area.properties.type === 'mow' ? ' • Last mowed: Never' : ''}
        </Typography>
      </Box>
    </ListItem>
  );
}
