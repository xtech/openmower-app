import {Dialog, type DialogProps} from '@mui/material';

export default function MapDialog(props: DialogProps) {
  return (
    <Dialog
      {...props}
      disablePortal
      slotProps={{
        root: {
          sx: {
            position: 'absolute',
          },
        },
        backdrop: {
          sx: {
            position: 'absolute',
          },
        },
      }}
    >
      {props.children}
    </Dialog>
  );
}
