import {Box, Typography} from '@mui/material';

interface MowerSelectorHeaderProps {
  title?: string;
  subtitle?: string;
}

export default function MowerSelectorHeader({
  title = 'Select Mower',
  subtitle = 'Choose which mower to control',
}: MowerSelectorHeaderProps) {
  return (
    <Box sx={{p: 2, borderBottom: '1px solid rgba(0,0,0,0.08)', userSelect: 'none'}}>
      <Typography variant="subtitle2" fontWeight="600" color="text.primary">
        {title}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        {subtitle}
      </Typography>
    </Box>
  );
}
