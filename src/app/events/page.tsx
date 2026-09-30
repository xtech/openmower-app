'use client';

import EventDatePicker from '@/components/events/EventDatePicker';
import EventRow from '@/components/events/EventRow';
import { getEventTypeIcon } from '@/components/events/eventIcons';
import { HeaderStat, Page, PageContent, PageHeader } from '@/components/page';
import {
    useSelectedMowerAvailableDates,
    useSelectedMowerEventsForDate,
    useSelectedMowerIsDateLoaded,
} from '@/hooks/useMowerEvents';
import { outerCardStyles } from '@/lib/cardStyles';
import { formatEventDateLabel, getEventTypeLabel, getTodayDateKey, sortEventTypes } from '@/stores/mowerEvents';
import { useMowersStore, useSelectedMower } from '@/stores/mowersStore';
import {
    EventNote as EventIcon,
    FilterList as FilterIcon,
    ChevronRight as NextIcon,
    ChevronLeft as PrevIcon,
} from '@mui/icons-material';
import {
    Box,
    Card,
    CardContent,
    Chip,
    IconButton,
    List,
    Stack,
    Typography,
    useTheme,
} from '@mui/material';
import { useEffect, useMemo, useRef, useState } from 'react';

export default function EventsPage() {
  const theme = useTheme();
  const today = getTodayDateKey();
  const mowerId = useSelectedMower((m) => m?.id);
  const availableDates = useSelectedMowerAvailableDates();
  const fetchEventsForDate = useMowersStore((state) => state.fetchEventsForDate);
  const [selectedDate, setSelectedDate] = useState(today);
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const isSelectedDateLoaded = useSelectedMowerIsDateLoaded(selectedDate);
  const listEndRef = useRef<HTMLDivElement>(null);

  const navigableDates = useMemo(() => {
    const dates = new Set([today, ...availableDates]);
    return [...dates].sort().reverse();
  }, [today, availableDates]);

  const selectedDateIndex = navigableDates.indexOf(selectedDate);
  const eventsForDate = useSelectedMowerEventsForDate(selectedDate);

  useEffect(() => {
    if (!mowerId || isSelectedDateLoaded) {
      return;
    }
    void fetchEventsForDate(mowerId, selectedDate);
  }, [mowerId, isSelectedDateLoaded, selectedDate, fetchEventsForDate]);

  const displayedEvents = useMemo(() => {
    const filtered = eventsForDate.filter((event) => !typeFilter || event.type === typeFilter);
    return [...filtered].sort((a, b) => a.t - b.t);
  }, [eventsForDate, typeFilter]);

  useEffect(() => {
    if (selectedDate === today && listEndRef.current) {
      listEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [selectedDate, today, displayedEvents]);

  const eventTypes = useMemo(() => {
    const types = new Set(eventsForDate.map((event) => event.type));
    return sortEventTypes([...types]);
  }, [eventsForDate]);

  const canGoPrev = selectedDateIndex >= 0 && selectedDateIndex < navigableDates.length - 1;
  const canGoNext = selectedDateIndex > 0;


  return (
    <Page>
      <PageHeader title="Event History" subtitle="Review mower activity and system events">
        <HeaderStat icon={<EventIcon />} value={displayedEvents.length} label="Events shown" />
        <HeaderStat icon={<FilterIcon />} value={eventTypes.length} label="Event types" />
      </PageHeader>

      <PageContent>
        <Card sx={outerCardStyles(theme)}>
          <CardContent>
            <Stack spacing={2}>
              <Box sx={{display: 'flex', alignItems: 'center', gap: 2}}>
                <Box sx={{display: 'flex', alignItems: 'center', flexShrink: 0}}>
                  <IconButton
                    aria-label="Previous day"
                    size="small"
                    disabled={!canGoPrev}
                    onClick={() => setSelectedDate(navigableDates[selectedDateIndex + 1])}
                  >
                    <PrevIcon />
                  </IconButton>
                  <IconButton
                    aria-label="Next day"
                    size="small"
                    disabled={!canGoNext}
                    onClick={() => setSelectedDate(navigableDates[selectedDateIndex - 1])}
                  >
                    <NextIcon />
                  </IconButton>
                  <EventDatePicker
                    selectedDate={selectedDate}
                    availableDates={availableDates}
                    onSelect={setSelectedDate}
                  />
                </Box>
                <Box sx={{display: 'flex', alignItems: 'center', gap: 1, minWidth: 0}}>
                  <Typography variant="h6" sx={{fontWeight: 600}}>
                    {formatEventDateLabel(selectedDate)}
                  </Typography>
                  {selectedDate === today && (
                    <Chip label="Today" size="small" color="primary" sx={{ml: 0.5, opacity: 0.8}} />
                  )}
                </Box>
              </Box>

              {eventTypes.length > 0 && (
                <Box sx={{display: 'flex', flexWrap: 'wrap', gap: 1}}>
                  <Chip
                    label="All types"
                    clickable
                    color={typeFilter === null ? 'primary' : 'default'}
                    onClick={() => setTypeFilter(null)}
                  />
                  {eventTypes.map((type) => (
                    <Chip
                      key={type}
                      icon={getEventTypeIcon(type)}
                      label={getEventTypeLabel(type)}
                      clickable
                      color={typeFilter === type ? 'primary' : 'default'}
                      onClick={() => setTypeFilter(typeFilter === type ? null : type)}
                    />
                  ))}
                </Box>
              )}

              {displayedEvents.length === 0 ? (
                <Box sx={{py: 6, textAlign: 'center'}}>
                  <EventIcon sx={{fontSize: 48, color: theme.palette.grey[400], mb: 1}} />
                  <Typography variant="body1" color="text.secondary">
                    No events for this date.
                  </Typography>
                </Box>
              ) : (
                <List disablePadding>
                  {displayedEvents.map((event) => (
                    <EventRow key={event.id} event={event} />
                  ))}
                  <div ref={listEndRef} />
                </List>
              )}
            </Stack>
          </CardContent>
        </Card>
      </PageContent>
    </Page>
  );
}
