// import {useMapContext} from '@/contexts/MapContext'; // TODO: Uncomment when implementing persistence
import {useMapContext, useMapSelection} from '@/contexts/MapContext';
import {AreaProps} from '@/stores/schemas';
import theme from '@/theme';
import {DndContext, DragEndEvent, DragOverlay} from '@dnd-kit/core';
import {restrictToFirstScrollableAncestor, restrictToVerticalAxis} from '@dnd-kit/modifiers';
import {arrayMove, SortableContext, verticalListSortingStrategy} from '@dnd-kit/sortable';
import {Card, CardContent, CardHeader, List} from '@mui/material';
import {Feature, Polygon} from 'geojson';
import SortableAreaItem from './SortableAreaItem';

export default function AreasList({areas}: {areas: Feature<Polygon, AreaProps>[]}) {
  const selectedIds = useMapSelection();
  const {setFeatures} = useMapContext();

  const handleDragEnd = (event: DragEndEvent) => {
    const {active, over} = event;
    if (over?.id !== undefined && active.id !== over.id) {
      setFeatures((draft) => {
        const oldIndex = draft.features.findIndex((item) => item.id === active.id);
        const newIndex = draft.features.findIndex((item) => item.id === over?.id);
        draft.features = arrayMove(draft.features, oldIndex, newIndex);
      });
    }
  };

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
      <CardContent sx={{flex: 1, p: 0, overflowY: 'auto', '&:last-child': {pb: 0}}}>
        <List sx={{minHeight: '100%', p: 0}}>
          <DndContext onDragEnd={handleDragEnd} modifiers={[restrictToVerticalAxis, restrictToFirstScrollableAncestor]}>
            <SortableContext items={areas.map((area) => area.id as string)} strategy={verticalListSortingStrategy}>
              {areas.map((area) => (
                <SortableAreaItem key={area.id} area={area} selected={selectedIds.includes(area.id as string)} />
              ))}
            </SortableContext>
            <DragOverlay style={{cursor: 'grabbing'}} />
          </DndContext>
        </List>
      </CardContent>
    </Card>
  );
}
