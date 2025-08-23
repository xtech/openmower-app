'use client';

import type {MowerConfig} from '@/components/types';
import {useConfig} from '@/contexts/ConfigContext';
import {Box, Drawer, List, SxProps, Theme, useTheme} from '@mui/material';
import {usePathname, useRouter} from 'next/navigation';
import {useState} from 'react';
import MowerSelector from '../mower-selector/MowerSelector';
import {createNavigationItems} from '../navigationItems';
import SelectedMower from './SelectedMower';
import SidebarHeader from './SidebarHeader';
import SidebarItem from './SidebarItem';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({open, onClose}: SidebarProps) {
  const theme = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const [mowerMenuAnchor, setMowerMenuAnchor] = useState<null | HTMLElement>(null);
  const {mowers} = useConfig();
  const [selectedMower, setSelectedMower] = useState<MowerConfig | undefined>(mowers[0]);
  const navigationItems = createNavigationItems();

  const handleMowerMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMowerMenuAnchor(event.currentTarget);
  };

  const handleMowerMenuClose = () => {
    setMowerMenuAnchor(null);
  };

  const handleMowerSelect = (mower: MowerConfig) => {
    setSelectedMower(mower);
    handleMowerMenuClose();
  };

  const handleNavigation = (path: string) => {
    router.push(path);
    onClose();
  };

  const drawerWidth = 280;
  const drawerStyle: SxProps<Theme> = {
    width: drawerWidth,
    boxShadow: '0 0 8px 4px rgba(0, 0, 0, 0.25)',
    border: 'none',
    borderRadius: '0 20px 20px 0',
  };

  return (
    <>
      {/* Mobile Temporary Drawer */}
      <Drawer
        variant="temporary"
        open={open}
        onClose={onClose}
        ModalProps={{
          keepMounted: true, // Better mobile performance
        }}
        sx={{
          display: {xs: 'block', md: 'none'},
          '& .MuiDrawer-paper': drawerStyle,
        }}
      >
        <SidebarContent />
      </Drawer>

      {/* Desktop Permanent Drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: {xs: 'none', md: 'block'},
          '& .MuiDrawer-paper': {
            ...drawerStyle,
            position: 'fixed',
            height: 'calc(100vh - 16px)',
            zIndex: theme.zIndex.drawer,
            my: 1,
          },
        }}
        open
      >
        <SidebarContent />
      </Drawer>

      {/* Desktop Spacer - only show on desktop */}
      <Box sx={{display: {xs: 'none', md: 'block'}, width: drawerWidth, flexShrink: 0}} />

      {/* Mower Selector Menu */}
      <MowerSelector onMowerSelect={handleMowerSelect} anchorEl={mowerMenuAnchor} onClose={handleMowerMenuClose} />
    </>
  );

  function SidebarContent() {
    return (
      <Box
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          userSelect: 'none',
        }}
      >
        <SidebarHeader />
        <Box sx={{flex: 1, overflow: 'auto'}}>
          <List sx={{py: 1}}>
            {navigationItems.map((item) => (
              <SidebarItem key={item.path} item={item} isActive={pathname === item.path} onClick={handleNavigation} />
            ))}
          </List>
        </Box>
        {mowers.length > 1 && <SelectedMower selectedMower={selectedMower!} onMowerMenuOpen={handleMowerMenuOpen} />}
      </Box>
    );
  }
}
