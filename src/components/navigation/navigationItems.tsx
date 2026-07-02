import {type Capabilities, type NavigationItem} from '@/components/types';
import {
  BugReport as BugReportIcon,
  Dashboard as DashboardIcon,
  EventNote as EventIcon,
  Map as MapIcon,
  ScienceOutlined as SimulationIcon,
  Sensors as SensorIcon,
  Settings as SettingsIcon,
  Assignment as TaskIcon,
} from '@mui/icons-material';

export function createNavigationItems(capabilities: Capabilities = {}, simAvailable = false): NavigationItem[] {
  const isDev = process.env.NEXT_PUBLIC_IS_DEV === 'true';
  const hasCapability = (name: string, minLevel?: number) => {
    const level = capabilities[name];
    return level !== undefined && (minLevel === undefined || level >= minLevel);
  };

  return [
    isDev && {label: 'Dashboard', icon: <DashboardIcon />, path: '/', isGlobal: true},
    {label: 'Map', icon: <MapIcon />, path: '/map', isGlobal: false},
    hasCapability('events') && {label: 'Events', icon: <EventIcon />, path: '/events', isGlobal: false},
    simAvailable && {label: 'Simulation', icon: <SimulationIcon />, path: '/simulation', isGlobal: false},
    isDev && {label: 'Tasks', icon: <TaskIcon />, path: '/tasks', isGlobal: false},
    isDev && {label: 'Sensors', icon: <SensorIcon />, path: '/sensors', isGlobal: false},
    isDev && {label: 'Settings', icon: <SettingsIcon />, path: '/settings', isGlobal: true},
    {label: 'Debug', icon: <BugReportIcon />, path: '/debug', isGlobal: true},
  ].filter((item): item is NavigationItem => !!item);
}
