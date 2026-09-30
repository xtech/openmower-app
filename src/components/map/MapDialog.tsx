import {Dialog, type DialogProps} from '@mui/material';
import merge from 'lodash.merge';
import {useMemo} from 'react';

export default function MapDialog(props: DialogProps) {
  const slotProps = useMemo(
    () =>
      merge(
        {
          root: {sx: {position: 'absolute'}},
          backdrop: {sx: {position: 'absolute'}},
        },
        props.slotProps,
      ),
    [props.slotProps],
  );
  return (
    <Dialog {...props} disablePortal slotProps={slotProps}>
      {props.children}
    </Dialog>
  );
}
