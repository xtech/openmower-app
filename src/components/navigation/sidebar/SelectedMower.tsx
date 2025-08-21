import {type Mower} from '@/components/types';
import {KeyboardArrowDown, SmartToy as MowerIcon} from '@mui/icons-material';
import {Avatar, Box, Typography, useTheme} from '@mui/material';

interface SelectedMowerProps {
  selectedMower: Mower;
  onMowerMenuOpen: (event: React.MouseEvent<HTMLElement>) => void;
}

export default function SelectedMower({selectedMower, onMowerMenuOpen}: SelectedMowerProps) {
  const theme = useTheme();

  return (
    <Box sx={{p: 3, borderTop: '1px solid rgba(0, 0, 0, 0.08)'}}>
      <Typography
        variant="overline"
        color="text.secondary"
        sx={{
          fontWeight: 600,
          letterSpacing: 0.5,
          mb: 1,
          display: 'block',
        }}
      >
        Active Mower
      </Typography>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          cursor: 'pointer',
          '&:hover': {
            opacity: 0.8,
          },
        }}
        onClick={onMowerMenuOpen}
      >
        <Avatar
          sx={{
            bgcolor: theme.palette.primary.main,
            width: 40,
            height: 40,
          }}
        >
          <MowerIcon fontSize="small" />
        </Avatar>
        <Box sx={{flex: 1, minWidth: 0}}>
          <Typography variant="body2" fontWeight="600" color="text.primary" noWrap>
            {selectedMower.name}
          </Typography>
        </Box>
        <KeyboardArrowDown sx={{color: theme.palette.primary.main}} />
      </Box>
    </Box>
  );
}
