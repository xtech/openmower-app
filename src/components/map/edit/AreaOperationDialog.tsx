import {AreaProps} from '@/stores/schemas';
import {Box, Button, DialogActions, DialogContent, List, useTheme} from '@mui/material';
import {Feature, Polygon} from 'geojson';
import AreaItem from '../AreaItem';
import MapDialog from '../MapDialog';

export function AreaOperationDialog<Response = undefined>({
  open,
  handleClose,
  children,
  confirmText,
  response,
}: {
  open: boolean;
  handleClose: (data?: Response) => void;
  children: React.ReactNode;
  confirmText: string;
  response?: Response;
}) {
  return (
    <MapDialog open={open} onClose={() => handleClose()} fullWidth maxWidth="xs">
      <DialogContent sx={{display: 'flex', flexDirection: 'column', gap: 1, pb: 0}}>{children}</DialogContent>
      <DialogActions sx={{mt: 2}}>
        <Button onClick={() => handleClose()}>Cancel</Button>
        <Button onClick={() => handleClose(response)} variant="contained" color="primary">
          {confirmText}
        </Button>
      </DialogActions>
    </MapDialog>
  );
}

export function AreaSelection({
  areas,
  selectedAreaId,
  setSelectedAreaId,
}: {
  areas: Feature<Polygon, AreaProps>[];
  selectedAreaId: string;
  setSelectedAreaId: (id: string) => void;
}) {
  const theme = useTheme();
  return (
    <Box sx={{border: 1, borderColor: theme.palette.divider, borderRadius: 1, overflowY: 'auto'}}>
      <List sx={{p: 0}}>
        {areas.map((area) => (
          <Box key={area.id} onClick={() => setSelectedAreaId(area.id as string)}>
            <AreaItem area={area} selected={selectedAreaId === area.id} />
          </Box>
        ))}
      </List>
    </Box>
  );
}
