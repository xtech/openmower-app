'use client';

import {ScienceOutlined as SimulatorIcon} from '@mui/icons-material';
import {FormControlLabel, Popover, Switch, Typography} from '@mui/material';
import {useRControl} from 'maplibre-react-components';
import {useRef, useState} from 'react';
import {createPortal} from 'react-dom';

interface SimulatorButtonProps {
  manualDrive: boolean;
  onManualDriveChange: (enabled: boolean) => void;
}

export default function SimulatorButton({manualDrive, onManualDriveChange}: SimulatorButtonProps) {
  const {container} = useRControl({position: 'bottom-right'});
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);

  const content = (
    <>
      <button
        ref={buttonRef}
        type="button"
        title="Simulator"
        onClick={() => setOpen((o) => !o)}
        style={{padding: 0, position: 'relative'}}
      >
        <SimulatorIcon />
        {manualDrive && (
          <span
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: '#0ea5e9',
            }}
          />
        )}
      </button>

      <Popover
        open={open}
        anchorEl={buttonRef.current}
        onClose={() => setOpen(false)}
        anchorOrigin={{vertical: 'bottom', horizontal: 'left'}}
        transformOrigin={{vertical: 'bottom', horizontal: 'right'}}
        slotProps={{paper: {sx: {minWidth: 220, p: 1}}}}
      >
        <Typography variant="overline" sx={{px: 1, display: 'block', lineHeight: 2}}>
          Simulator
        </Typography>

        <FormControlLabel
          sx={{mx: 0, px: 1, py: 0.5, width: '100%'}}
          control={
            <Switch checked={manualDrive} onChange={(e) => onManualDriveChange(e.target.checked)} />
          }
          label="Manual drive"
        />
      </Popover>
    </>
  );

  return createPortal(content, container);
}
