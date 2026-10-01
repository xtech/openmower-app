'use client';

import ControlButton from '@/components/map/ControlButton';
import { useMapContext } from '@/contexts/MapContext';
import { useTheme } from '@mui/material';
import { BadgeAlertIcon, BadgeCheckIcon } from 'lucide-react';
import { useDialogLazy } from 'react-dialog-async';

export function IssuesButton() {
  const { issues } = useMapContext();
  const issuesDialog = useDialogLazy(() => import('./IssuesDialog').then((m) => m.IssuesDialog));
  const theme = useTheme();

  const hasIssues = issues.length > 0;

  return (
    <ControlButton
      position="bottom-right"
      icon={hasIssues ? BadgeAlertIcon : BadgeCheckIcon}
      title={hasIssues ? `${issues.length} map issue${issues.length !== 1 ? 's' : ''}` : 'No map issues'}
      style={hasIssues ? { color: theme.palette.error.main } : undefined}
      spaced
      onClick={() => issuesDialog.open()}
    />
  );
}
