'use client';

import {Box} from '@mui/material';
import {useState} from 'react';
import MobileBottomBar from './MobileBottomBar';
import Sidebar from './sidebar/Sidebar';

export default function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  return (
    <>
      <Sidebar open={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

      {/* Mobile Navigation - positioned outside flex flow */}
      <Box sx={{position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1000}}>
        <MobileBottomBar onMenuOpen={() => setMobileMenuOpen(true)} />
      </Box>
    </>
  );
}
