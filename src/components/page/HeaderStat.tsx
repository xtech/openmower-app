import {Avatar, Box, Typography} from '@mui/material';
import {ReactNode} from 'react';

interface HeaderStatProps {
  icon: ReactNode;
  value: string | number;
  label: string;
}

export default function HeaderStat({icon, value, label}: HeaderStatProps) {
  return (
    <Box sx={{display: 'flex', alignItems: 'center', gap: 2}}>
      <Avatar sx={{bgcolor: 'rgba(255,255,255,0.2)', width: 48, height: 48}}>{icon}</Avatar>
      <Box>
        <Typography variant="h4" fontWeight="bold">
          {value}
        </Typography>
        <Typography variant="body2" sx={{opacity: 0.8}}>
          {label}
        </Typography>
      </Box>
    </Box>
  );
}
