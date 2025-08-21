import {type Mower, getMowerStatusColor, getMowerStatusLabel} from '@/components/types';
import {SmartToy as MowerIcon} from '@mui/icons-material';
import {Avatar, Box, Chip, MenuItem, Typography, useTheme} from '@mui/material';

interface ItemProps {
  mower: Mower;
  onClick: (mower: Mower) => void;
}

export default function MowerSelectorItem({mower, onClick}: ItemProps) {
  const theme = useTheme();

  const getAvatarColor = (status: Mower['status']) => {
    switch (status) {
      case 'active':
        return theme.palette.success.main;
      case 'docked':
        return theme.palette.info.main;
      case 'error':
        return theme.palette.error.main;
      default:
        return theme.palette.grey[500];
    }
  };

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
        <Avatar
          sx={{
            bgcolor: getAvatarColor(mower.status),
            width: 32,
            height: 32,
          }}
        >
          <MowerIcon fontSize="small" />
        </Avatar>
        <Box>
          <Typography variant="body2" fontWeight="500">
            {mower.name}
          </Typography>
          <Chip
            label={getMowerStatusLabel(mower.status)}
            color={getMowerStatusColor(mower.status) as 'success' | 'info' | 'error' | 'default'}
            size="small"
            sx={{mt: 0.5, height: 20}}
          />
        </Box>
      </Box>
      <Typography variant="caption" color="text.secondary" sx={{fontWeight: 500}}>
        {mower.battery}%
      </Typography>
    </MenuItem>
  );
}
