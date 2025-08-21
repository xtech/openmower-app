import {Box} from '@mui/material';
import {PropsWithChildren} from 'react';

export default function PageContent({children}: PropsWithChildren) {
  return (
    <Box
      sx={{
        mx: {xs: 1, md: 2},
        mt: -4,
        position: 'relative',
        zIndex: 2,
      }}
    >
      {children}
    </Box>
  );
}
