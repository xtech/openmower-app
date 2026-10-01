import { type NavigationItem } from '@/components/types';
import { useSelectedMowerActiveEmergency } from '@/hooks/useMowerEvents';
import { Badge, ListItem, ListItemButton, ListItemIcon, ListItemText, useTheme } from '@mui/material';

interface SidebarItemProps {
  item: NavigationItem;
  isActive: boolean;
  onClick: (path: string) => void;
}

export default function SidebarItem({ item, isActive, onClick }: SidebarItemProps) {
  const theme = useTheme();
  const activeEmergency = useSelectedMowerActiveEmergency();
  const showAlert = item.path === '/events' && activeEmergency;

  return (
    <ListItem disablePadding>
      <ListItemButton
        onClick={() => onClick(item.path)}
        sx={{
          mx: 1,
          borderRadius: 2,
          '&.Mui-selected': {
            backgroundColor: theme.palette.primary.main + '20',
            color: theme.palette.primary.main,
            '&:hover': {
              backgroundColor: theme.palette.primary.main + '30',
            },
          },
          '&:hover': {
            backgroundColor: 'rgba(0, 0, 0, 0.04)',
          },
        }}
        selected={isActive}
      >
        <ListItemIcon
          sx={{
            color: isActive ? theme.palette.primary.main : 'inherit',
            minWidth: 40,
          }}
        >
          <Badge variant="dot" color="error" invisible={!showAlert}>
            {item.icon}
          </Badge>
        </ListItemIcon>
        <ListItemText
          primary={item.label}
          slotProps={{
            primary: {
              sx: {
                fontWeight: isActive ? 600 : 500,
              },
            },
          }}
        />
      </ListItemButton>
    </ListItem>
  );
}
