import {useSortable} from '@dnd-kit/sortable';
import {CSS} from '@dnd-kit/utilities';
import AreaItem, {AreaItemProps} from './AreaItem';

export default function SortableAreaItem(props: AreaItemProps) {
  const {attributes, listeners, setNodeRef, transform, transition, isDragging} = useSortable({
    id: props.area.id as string,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <AreaItem {...props} ref={setNodeRef} style={style} {...attributes} listeners={listeners} dragging={isDragging} />
  );
}
