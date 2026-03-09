import {Button, DialogActions, DialogContent, DialogContentText, DialogTitle} from '@mui/material';
import {AsyncDialogProps} from 'react-dialog-async';
import MapDialog from '../MapDialog';

export function CancelConfirmDialog({isOpen, handleClose}: AsyncDialogProps<void, boolean>) {
  return (
    <MapDialog open={isOpen} onClose={() => handleClose(false)} maxWidth="xs" fullWidth>
      <DialogTitle>Discard changes?</DialogTitle>
      <DialogContent>
        <DialogContentText>You have unsaved changes. Are you sure you want to cancel editing?</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => handleClose(false)}>Keep editing</Button>
        <Button onClick={() => handleClose(true)} variant="contained" color="error">
          Discard changes
        </Button>
      </DialogActions>
    </MapDialog>
  );
}
