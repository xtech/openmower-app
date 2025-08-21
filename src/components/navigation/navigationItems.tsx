import {type NavigationItem} from '@/components/types';
import {
  Dashboard as DashboardIcon,
  Map as MapIcon,
  Sensors as SensorIcon,
  Assignment as TaskIcon,
} from '@mui/icons-material';

export function createNavigationItems(): NavigationItem[] {
  return [
    {label: 'Dashboard', icon: <DashboardIcon />, path: '/', isGlobal: true},
    {label: 'Map', icon: <MapIcon />, path: '/map', isGlobal: false},
    {label: 'Tasks', icon: <TaskIcon />, path: '/tasks', isGlobal: false},
    {label: 'Sensors', icon: <SensorIcon />, path: '/sensors', isGlobal: false},
  ];
}
