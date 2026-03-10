import {type NavigationItem} from '@/components/types';
import {
  BugReport as BugReportIcon,
  Dashboard as DashboardIcon,
  Map as MapIcon,
  Sensors as SensorIcon,
  Assignment as TaskIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';

export function createNavigationItems(): NavigationItem[] {
  return [
    {label: 'Dashboard', icon: <DashboardIcon />, path: '/', isGlobal: true},
    {label: 'Map', icon: <MapIcon />, path: '/map', isGlobal: false},
    {label: 'Tasks', icon: <TaskIcon />, path: '/tasks', isGlobal: false},
    {label: 'Sensors', icon: <SensorIcon />, path: '/sensors', isGlobal: false},
    {label: 'Settings', icon: <SettingsIcon />, path: '/settings', isGlobal: true},
    {label: 'Debug', icon: <BugReportIcon />, path: '/debug', isGlobal: true},
  ];
}
