import { Box, type SxProps } from '@mui/material';
import { PropsWithChildren } from 'react';

interface PageContentProps {
  sx?: SxProps;
}

export default function PageContent({ children, sx }: PropsWithChildren<PageContentProps>) {
  return (
    <Box
      sx={{
        mx: { xs: 0, md: 2 },
        mt: { xs: 1, md: -4 },
        position: 'relative',
        zIndex: 2,
        ...sx,
      }}
    >
      {children}
    </Box>
  );
}
