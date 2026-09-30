'use client';

import {getEventIcon} from '@/components/events/eventIcons';
import {formatEventAttributeChip, getEventLabel, getOrderedEventExtraAttributeEntries} from '@/stores/mowerEvents';
import type {MowerEvent} from '@/stores/schemas';
import {Box, Chip, ListItem, Typography} from '@mui/material';

interface EventRowProps {
  event: MowerEvent;
  dense?: boolean;
}

function formatEventTime(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export default function EventRow({event, dense = false}: EventRowProps) {
  const icon = getEventIcon(event);
  const extraEntries = getOrderedEventExtraAttributeEntries(event);

  return (
    <ListItem
      alignItems="center"
      disableGutters
      dense={dense}
      sx={{px: dense ? 0.75 : 1.5, py: dense ? 0.25 : 0.375, gap: 1}}
    >
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{flexShrink: 0, fontVariantNumeric: 'tabular-nums', minWidth: '3.25rem'}}
      >
        {formatEventTime(event.t)}
      </Typography>
      <Box sx={{display: 'flex', flexShrink: 0, alignItems: 'center'}}>{icon}</Box>
      <Box
        sx={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 0.75,
          rowGap: 0.25,
        }}
      >
        <Typography variant="body2" sx={{fontWeight: 600, minWidth: 0}}>
          {getEventLabel(event)}
        </Typography>
        {extraEntries.map(([key, value]) => (
          <Chip
            key={key}
            size="small"
            variant="outlined"
            label={formatEventAttributeChip(key, value)}
            sx={{height: 20, fontSize: '0.7rem'}}
          />
        ))}
      </Box>
    </ListItem>
  );
}
