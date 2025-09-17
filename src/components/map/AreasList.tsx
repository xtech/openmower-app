import {formatAreaSize} from '@/app/map/page';
import {useMapSelection} from '@/contexts/MapContext';
import {AreaProps} from '@/stores/schemas';
import theme from '@/theme';
import {Box, Card, CardContent, CardHeader, List, ListItem, Typography} from '@mui/material';
import {area as turfArea} from '@turf/area';
import {Feature, Polygon} from 'geojson';

export default function AreasList({areas}: {areas: Feature<Polygon, AreaProps>[]}) {
  const selectedIds = useMapSelection();
  return (
    <Card sx={{height: '100%', display: 'flex', flexDirection: 'column', border: 0}}>
      <CardHeader
        title="Areas"
        sx={{
          py: 1,
          backgroundColor: theme.palette.primary.main,
          color: theme.palette.primary.contrastText,
          pointerEvents: 'none',
          userSelect: 'none',
        }}
      />
      <CardContent sx={{flex: 1, p: 0, overflow: 'auto'}}>
        <List sx={{height: '100%', p: 0}}>
          {areas.map((area) => (
            <ListItem
              key={area.id}
              sx={{
                px: 0,
                py: 0.5,
                cursor: 'pointer',
                borderBottom: '1px solid',
                borderColor: theme.palette.divider,
                backgroundColor: selectedIds.includes(area.id as string) ? theme.palette.secondary.dark : undefined,
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
          ))}
        </List>
      </CardContent>
    </Card>
  );
}
