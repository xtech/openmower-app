import {formatAreaSize} from '@/app/map/page';
import {useMapSelection} from '@/contexts/MapContext';
import {AreaProps} from '@/stores/schemas';
import theme from '@/theme';
import {Delete as DeleteIcon} from '@mui/icons-material';
import {Avatar, Box, Card, CardContent, IconButton, List, ListItem, Typography} from '@mui/material';
import {area as turfArea} from '@turf/area';
import {Feature, Polygon} from 'geojson';

export default function AreasList({areas}: {areas: Feature<Polygon, AreaProps>[]}) {
  const selectedIds = useMapSelection();
  return (
    <Card sx={{height: '100%'}}>
      <CardContent sx={{height: '100%', display: 'flex', flexDirection: 'column'}}>
        <Box sx={{display: 'flex', alignItems: 'center', gap: 2, mb: 2}}>
          <Avatar sx={{bgcolor: theme.palette.primary.main, width: 40, height: 40}}>{/* TerrainIcon */}</Avatar>
          <Typography variant="h5" component="h3" fontWeight="600">
            Areas
          </Typography>
        </Box>

        <List sx={{p: 0, overflow: 'auto'}}>
          {areas.map((area) => (
            <ListItem
              key={area.id}
              sx={{
                px: 0,
                py: 0.5,
                cursor: 'pointer',
                borderBottom: '1px solid',
                borderColor: theme.palette.divider,
                backgroundColor: selectedIds.includes(area.id as string) ? theme.palette.primary.dark : undefined,
                '&:last-child': {
                  borderBottom: 'none',
                },
                '&:hover': {
                  backgroundColor: theme.palette.primary.main,
                  color: theme.palette.primary.contrastText,
                },
              }}
            >
              <Box sx={{flex: 1, py: 0.5, px: 2, mr: 1}}>
                <Typography variant="h6" fontWeight="600">
                  {area.properties.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {formatAreaSize(turfArea(area.geometry))}
                  {area.properties.type === 'mow' ? ' • Last mowed: Never' : ''}
                </Typography>
              </Box>
              <Box sx={{display: 'flex', gap: 1, mr: 2}}>
                <IconButton
                  size="small"
                  color="error"
                  className="delete-button"
                  sx={{bgcolor: theme.palette.error.light + '20'}}
                  onClick={(e) => {
                    e.stopPropagation();
                    // handleAreaAction('delete', area.properties.name || '');
                  }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>
            </ListItem>
          ))}
        </List>
      </CardContent>
    </Card>
  );
}
