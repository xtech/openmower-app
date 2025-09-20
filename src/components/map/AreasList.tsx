import {useMapSelection} from '@/contexts/MapContext';
import {AreaProps} from '@/stores/schemas';
import theme from '@/theme';
import {Card, CardContent, CardHeader, List} from '@mui/material';
import {Feature, Polygon} from 'geojson';
import AreaItem from './AreaItem';

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
            <AreaItem key={area.id} area={area} selected={selectedIds.includes(area.id as string)} />
          ))}
        </List>
      </CardContent>
    </Card>
  );
}
