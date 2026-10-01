'use client';

import type { MowerEvent } from '@/stores/schemas';
import {
  Layers as AreaIcon,
  ContentCut as BladesIcon,
  PowerSettingsNew as BootIcon,
  CheckCircle as CheckIcon,
  Home as DockingIcon,
  NotificationsActive as EmergencyActiveIcon,
  GpsFixed as GpsAvailableIcon,
  GpsOff as GpsUnavailableIcon,
  Sync as StateIcon,
  HelpOutlined as UnknownEventIcon,
} from '@mui/icons-material';
import type { ReactElement } from 'react';

export function getEventTypeIcon(type: string): ReactElement {
  switch (type) {
    case 'EMERGENCY':
      return <EmergencyActiveIcon color="error" fontSize="small" />;
    case 'BOOTED':
      return <BootIcon color="primary" fontSize="small" />;
    case 'GPS':
      return <GpsAvailableIcon color="action" fontSize="small" />;
    case 'STATE':
      return <StateIcon color="action" fontSize="small" />;
    case 'BLADES':
      return <BladesIcon color="action" fontSize="small" />;
    case 'DOCKING':
      return <DockingIcon color="action" fontSize="small" />;
    case 'AREA':
      return <AreaIcon color="action" fontSize="small" />;
    default:
      return <UnknownEventIcon color="disabled" fontSize="small" />;
  }
}

export function getEventIcon(event: MowerEvent): ReactElement {
  if (event.type === 'EMERGENCY') {
    return 'active' in event && event.active ? (
      <EmergencyActiveIcon color="error" fontSize="small" />
    ) : (
      <CheckIcon color="success" fontSize="small" />
    );
  }
  if (event.type === 'GPS') {
    return event.available ? (
      <GpsAvailableIcon color="success" fontSize="small" />
    ) : (
      <GpsUnavailableIcon color="disabled" fontSize="small" />
    );
  }
  if (event.type === 'BLADES') {
    return <BladesIcon color={event.enabled ? 'primary' : 'disabled'} fontSize="small" />;
  }
  return getEventTypeIcon(event.type);
}
