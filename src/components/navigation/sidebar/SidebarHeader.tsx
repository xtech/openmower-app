import {Box, useTheme} from '@mui/material';
import Image from 'next/image';

export default function SidebarHeader() {
  const theme = useTheme();
  return (
    <Box
      sx={{
        background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
        textAlign: 'center',
        pr: 2,
        pointerEvents: 'none',
      }}
    >
      <Image src="/logo.svg" width={230} height={70} alt={''} />
    </Box>
  );
}
