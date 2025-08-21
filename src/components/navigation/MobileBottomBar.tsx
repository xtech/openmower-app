'use client';

import {Menu as MenuIcon} from '@mui/icons-material';
import {BottomNavigation, BottomNavigationAction, Paper, useTheme} from '@mui/material';
import {usePathname, useRouter} from 'next/navigation';
import {createNavigationItems} from './navigationItems';

interface MobileBottomBarProps {
  onMenuOpen: () => void;
}

export default function MobileBottomBar({onMenuOpen}: MobileBottomBarProps) {
  const theme = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const navigationItems = createNavigationItems();

  const handleNavigation = (path: string) => {
    router.push(path);
  };

  const handleMenuClick = () => {
    onMenuOpen();
  };

  return (
    <>
      {/* Bottom Navigation for Mobile */}
      <Paper
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: theme.zIndex.appBar + 1,
          borderRadius: '16px 16px 0 0',
          boxShadow: '0 -4px 20px rgba(0,0,0,0.1)',
          border: '1px solid rgba(0,0,0,0.08)',
          borderBottom: 'none',
          display: {xs: 'block', md: 'none'},
        }}
      >
        <BottomNavigation
          value={navigationItems.findIndex((item) => item.path === pathname)}
          onChange={(_, newValue) => {
            if (newValue === 'menu') {
              handleMenuClick();
            } else {
              handleNavigation(navigationItems[newValue].path);
            }
          }}
          sx={{
            bgcolor: 'transparent',
            '& .MuiBottomNavigationAction-root': {
              color: theme.palette.text.secondary,
              '&.Mui-selected': {
                color: theme.palette.primary.main,
              },
            },
          }}
        >
          <BottomNavigationAction
            label="Menu"
            icon={<MenuIcon />}
            value="menu"
            sx={{
              '&.Mui-selected': {
                color: theme.palette.secondary.main,
              },
            }}
          />
          {navigationItems.map((item) => (
            <BottomNavigationAction key={item.path} label={item.label} icon={item.icon} />
          ))}
        </BottomNavigation>
      </Paper>
    </>
  );
}
