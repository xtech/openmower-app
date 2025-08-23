import {type MowerConfig} from '@/components/types';
import {Box, MenuItem, Typography, useTheme} from '@mui/material';

interface MowerSelectorItemProps {
  mower: MowerConfig;
  onClick: (mower: MowerConfig) => void;
}

export default function MowerSelectorItem({mower, onClick}: MowerSelectorItemProps) {
  const theme = useTheme();
  return (
    <MenuItem
      onClick={() => onClick(mower)}
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 2,
        p: 2,
        '&:hover': {
          backgroundColor: theme.palette.primary.light + '10',
        },
      }}
    >
      <Box sx={{display: 'flex', alignItems: 'center', gap: 2}}>
        <Box>
          <Typography variant="body2" fontWeight="500">
            {mower.name}
          </Typography>
        </Box>
      </Box>
    </MenuItem>
  );
}
