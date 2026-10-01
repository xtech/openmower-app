'use client';

import { useState } from 'react';
import MobileBottomBar from './MobileBottomBar';
import Sidebar from './sidebar/Sidebar';

export default function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  return (
    <>
      <Sidebar open={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

      {/* Mobile Navigation - positioned outside flex flow */}
      <MobileBottomBar onMenuOpen={() => setMobileMenuOpen(true)} />
    </>
  );
}
