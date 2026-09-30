'use client';

import {useMapboxDraw, useMapContext, withDisplaySortKeys} from '@/contexts/MapContext';
import {
  Button,
  Checkbox,
  DialogActions,
  DialogContent,
  DialogTitle,
  List,
  ListItem,
  ListItemText,
  Typography,
} from '@mui/material';
import {featureCollection} from '@turf/helpers';
import {BadgeCheckIcon, WrenchIcon} from 'lucide-react';
import {useEffect, useState} from 'react';
import {AsyncDialogProps} from 'react-dialog-async';
import MapDialog from '../MapDialog';

export function IssuesDialog({isOpen, handleClose}: AsyncDialogProps<void, void>) {
  const {issues, setFeatures, features} = useMapContext();
  const draw = useMapboxDraw();
  const [selected, setSelected] = useState<Set<string>>(() => new Set(issues.map((i) => i.id)));

  useEffect(() => {
    setSelected(new Set(issues.map((i) => i.id)));
  }, [issues]);

  const toggleSelected = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const getFeatureName = (featureId: string): string => {
    const feature = features.features.find((f) => f.id === featureId);
    return (feature?.properties?.name as string | undefined) ?? featureId;
  };

  const handleFixSelected = () => {
    setFeatures((draft) => {
      for (const issue of issues.filter((i) => selected.has(i.id))) {
        const featureDraft = draft.features.find((f) => f.id === issue.featureId);
        if (!featureDraft) continue;
        issue.fix(featureDraft, draft);
      }
      draw?.set(withDisplaySortKeys(featureCollection(draft.features)));
    });
  };

  return (
    <MapDialog open={isOpen} onClose={() => handleClose()} maxWidth="xs" fullWidth>
      <DialogTitle>Map Issues</DialogTitle>
      <DialogContent sx={{pb: 0}}>
        <List disablePadding>
          {issues.map((issue) => (
            <ListItem
              key={issue.id}
              disablePadding
              onClick={() => toggleSelected(issue.id)}
              sx={{display: 'flex', alignItems: 'center', gap: 0.5, py: 0.5, cursor: 'pointer'}}
            >
              <Checkbox
                size="small"
                checked={selected.has(issue.id)}
                tabIndex={-1}
                disableRipple
                sx={{p: 0.5, flexShrink: 0}}
              />
              <ListItemText
                primary={getFeatureName(issue.featureId)}
                secondary={issue.message}
                slotProps={{
                  primary: {variant: 'body2', sx: {fontWeight: 500}},
                  secondary: {variant: 'caption'},
                }}
              />
            </ListItem>
          ))}
          {issues.length === 0 && (
            <Typography
              variant="body2"
              color="success.main"
              sx={{py: 1, display: 'flex', alignItems: 'center', gap: 1}}
            >
              <BadgeCheckIcon size={16} />
              No issues found.
            </Typography>
          )}
        </List>
      </DialogContent>
      <DialogActions>
        {issues.length > 0 && (
          <Button onClick={handleFixSelected} disabled={selected.size === 0} startIcon={<WrenchIcon size={16} />}>
            Fix {selected.size > 0 && selected.size < issues.length ? `${selected.size} Selected` : 'All'}
          </Button>
        )}
        <Button onClick={() => handleClose()}>Close</Button>
      </DialogActions>
    </MapDialog>
  );
}
