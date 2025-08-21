import {Box} from '@mui/material';
import {PropsWithChildren, ReactNode} from 'react';

interface PageProps {
  children: ReactNode;
}

export default function Page({children}: PropsWithChildren<PageProps>) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        mx: {xs: 1, md: 2},
        my: 1,
      }}
    >
      {children}
    </Box>
  );
}
