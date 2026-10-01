import { Box, type SxProps } from '@mui/material';
import { PropsWithChildren } from 'react';

interface PageProps {
  sx?: SxProps;
}

export default function Page({ children, sx }: PropsWithChildren<PageProps>) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        mx: { xs: 1, md: 2 },
        my: 1,
        ...sx,
      }}
    >
      {children}
    </Box>
  );
}
