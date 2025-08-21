import {type NavigationItem} from '@/components/types';
import {ListItem, ListItemButton, ListItemIcon, ListItemText, useTheme} from '@mui/material';

interface SidebarItemProps {
  item: NavigationItem;
  isActive: boolean;
  onClick: (path: string) => void;
}

export default function SidebarItem({item, isActive, onClick}: SidebarItemProps) {
  const theme = useTheme();

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
          {item.icon}
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
